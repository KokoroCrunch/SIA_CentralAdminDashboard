'use strict';

/**
 * Dormitory Controller
 *
 * Reads/writes to the 'dormitory' database on AdminHub cluster.
 * Schema matches the original standalone Dormitory Reservation system:
 *   Room:        roomNumber, type, floor, capacity, pricePerMonth, amenities, status, description, image
 *   Reservation: user, room, checkInDate, checkOutDate, status, totalPrice, notes, adminNotes
 */

const { getRoomModel } = require('../models/dormitory/Room');
const { getReservationModel, getDormUserModel } = require('../models/dormitory/Reservation');
const auditLog = require('../utils/auditLog');

// ── helper: populate user from dormitory's own users collection ───────────────
async function populateDormUsers(reservations) {
  if (!reservations.length) return reservations;
  const DormUser = await getDormUserModel();
  const ids = [...new Set(reservations.map((r) => String(r.user)))];
  const users = await DormUser.find({ _id: { $in: ids } })
    .select('name email studentId role')
    .lean();
  const map = {};
  users.forEach((u) => {
    map[String(u._id)] = u;
  });
  return reservations.map((r) => ({
    ...r,
    user: map[String(r.user)] || r.user,
  }));
}

// ── helper: populate room ─────────────────────────────────────────────────────
async function populateRooms(reservations) {
  if (!reservations.length) return reservations;
  const Room = await getRoomModel();
  const ids = [...new Set(reservations.map((r) => String(r.room)))];
  const rooms = await Room.find({ _id: { $in: ids } }).lean();
  const map = {};
  rooms.forEach((rm) => {
    map[String(rm._id)] = rm;
  });
  return reservations.map((r) => ({
    ...r,
    room: map[String(r.room)] || r.room,
  }));
}

// ==================== ROOM ENDPOINTS ====================

exports.getRooms = async (req, res) => {
  try {
    const Room = await getRoomModel();
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 }).lean();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const Room = await getRoomModel();
    const room = await Room.create(req.body);

    auditLog(req, {
      system: 'dormitory',
      action: 'created',
      entity: 'Room',
      entityId: room._id,
      description: `Admin created room "${room.roomNumber}" (${room.type}, floor ${room.floor})`,
      meta: {
        roomNumber: room.roomNumber,
        type: room.type,
        floor: room.floor,
        pricePerMonth: room.pricePerMonth,
      },
    });

    res.status(201).json(room);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Room number already exists' });
    res.status(400).json({ message: err.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const Room = await getRoomModel();
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!room) return res.status(404).json({ message: 'Room not found' });

    auditLog(req, {
      system: 'dormitory',
      action: 'updated',
      entity: 'Room',
      entityId: room._id,
      description: `Admin updated room "${room.roomNumber}"`,
      status: room.status,
      meta: req.body,
    });

    res.json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const Room = await getRoomModel();
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    auditLog(req, {
      system: 'dormitory',
      action: 'deleted',
      entity: 'Room',
      entityId: req.params.id,
      description: `Admin deleted room "${room.roomNumber}"`,
      meta: { roomNumber: room.roomNumber, type: room.type },
    });

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== RESERVATION ENDPOINTS ====================

exports.getReservations = async (req, res) => {
  try {
    const Reservation = await getReservationModel();
    const filter = {};

    // Students see only their own — match by central-dashboard userId
    // The dormitory DB's user._id won't match central user._id directly,
    // but we scope by the ID stored in the reservation's `user` field.
    if (req.user.role === 'student') {
      filter.user = req.user.id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.room_id) filter.room = req.query.room_id;

    const raw = await Reservation.find(filter).sort({ createdAt: -1 }).lean();

    // Cross-connection populate
    let populated = await populateDormUsers(raw);
    populated = await populateRooms(populated);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { room_id, checkInDate, checkOutDate, notes } = req.body;
    const Room = await getRoomModel();
    const Reservation = await getReservationModel();

    const room = await Room.findById(room_id).lean();
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status !== 'available')
      return res.status(400).json({ message: 'Room is not available' });

    // Date conflict check
    const conflict = await Reservation.findOne({
      room: room_id,
      status: { $in: ['pending', 'approved'] },
      $or: [{ checkInDate: { $lte: checkOutDate }, checkOutDate: { $gte: checkInDate } }],
    });
    if (conflict) return res.status(400).json({ message: 'Room already reserved for those dates' });

    // Calculate total price
    const msPerMonth = 1000 * 60 * 60 * 24 * 30;
    const months = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / msPerMonth);
    const totalPrice = Math.ceil(months * (room.pricePerMonth || 0));

    const reservation = await Reservation.create({
      user: req.user.id,
      room: room_id,
      checkInDate,
      checkOutDate,
      notes: notes || '',
      totalPrice,
    });

    auditLog(req, {
      system: 'dormitory',
      action: 'created',
      entity: 'Reservation',
      entityId: reservation._id,
      description: `Reservation created for room "${room.roomNumber}" — check-in ${new Date(checkInDate).toLocaleDateString()}`,
      amount: totalPrice,
      status: 'pending',
      meta: { room: room.roomNumber, checkInDate, checkOutDate, totalPrice },
    });

    let populated = await populateDormUsers([reservation.toObject()]);
    populated = await populateRooms(populated);
    res.status(201).json(populated[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Admin or staff access required' });
    }
    const Reservation = await getReservationModel();
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const { status, adminNotes, notes } = req.body;
    if (status) reservation.status = status;
    if (adminNotes !== undefined) reservation.adminNotes = adminNotes;
    if (notes !== undefined) reservation.notes = notes;

    await reservation.save();

    auditLog(req, {
      system: 'dormitory',
      action: status ? 'status_change' : 'updated',
      entity: 'Reservation',
      entityId: req.params.id,
      description: `Reservation ${req.params.id} updated${status ? ` — status changed to "${status}"` : ''}`,
      status: reservation.status,
      meta: { status, adminNotes, notes },
    });

    let populated = await populateDormUsers([reservation.toObject()]);
    populated = await populateRooms(populated);
    res.json(populated[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const Reservation = await getReservationModel();
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (req.user.role === 'student') {
      if (String(reservation.user) !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      if (reservation.status !== 'pending') {
        return res.status(400).json({ message: 'Can only cancel pending reservations' });
      }
    }

    await Reservation.findByIdAndDelete(req.params.id);

    auditLog(req, {
      system: 'dormitory',
      action: 'deleted',
      entity: 'Reservation',
      entityId: req.params.id,
      description: `Reservation ${req.params.id} deleted/cancelled (was "${reservation.status}")`,
      status: reservation.status,
      meta: { previousStatus: reservation.status },
    });

    res.json({ message: 'Reservation deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Admin or staff access required' });
    }
    const Room = await getRoomModel();
    const Reservation = await getReservationModel();

    const [
      totalRooms,
      availableRooms,
      totalReservations,
      pendingReservations,
      approvedReservations,
    ] = await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: 'pending' }),
      Reservation.countDocuments({ status: 'approved' }),
    ]);

    res.json({
      totalRooms,
      availableRooms,
      totalReservations,
      pendingReservations,
      approvedReservations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== USER ENDPOINTS (admin/staff only) ====================

exports.createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bcrypt = require('bcryptjs');
    const { name, email, password, studentId, phone, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email, and password are required' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const VALID = ['student', 'admin', 'staff'];
    if (role && !VALID.includes(role))
      return res.status(400).json({ message: `role must be one of: ${VALID.join(', ')}` });

    const DormUser = await getDormUserModel();

    const existing = await DormUser.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await DormUser.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      studentId: studentId?.trim() || '',
      phone: phone?.trim() || '',
      role: role || 'student',
    });

    auditLog(req, {
      system: 'dormitory',
      action: 'created',
      entity: 'DormUser',
      entityId: user._id,
      description: `Admin created dormitory user "${name}" (${email}) with role "${role || 'student'}"`,
      meta: { name, email, role: role || 'student', studentId },
    });

    const obj = user.toObject();
    delete obj.password;
    res.status(201).json({ message: 'User created', user: obj });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Admin or staff access required' });
    }
    const DormUser = await getDormUserModel();
    const users = await DormUser.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { role } = req.body;
    const VALID = ['student', 'admin', 'staff'];
    if (!role || !VALID.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${VALID.join(', ')}` });
    }
    const DormUser = await getDormUserModel();
    const user = await DormUser.findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select('-password')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    auditLog(req, {
      system: 'dormitory',
      action: 'updated',
      entity: 'DormUser',
      entityId: req.params.id,
      description: `Admin changed dormitory user ${req.params.id} role to "${role}"`,
      meta: { newRole: role },
    });

    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const DormUser = await getDormUserModel();
    const user = await DormUser.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    auditLog(req, {
      system: 'dormitory',
      action: 'deleted',
      entity: 'DormUser',
      entityId: req.params.id,
      description: `Admin deleted dormitory user "${user.name}" (${user.email})`,
      meta: { name: user.name, email: user.email },
    });

    res.json({ message: 'User removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
