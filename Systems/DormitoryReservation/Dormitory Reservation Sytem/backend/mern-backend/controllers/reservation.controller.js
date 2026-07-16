const Reservation = require('../models/reservation.model');
const Room = require('../models/room.model');
const asyncHandler = require('../middleware/asyncHandler');

// @desc  Create a reservation (student)
// @route POST /api/reservations
const createReservation = asyncHandler(async (req, res) => {
  const { roomId, checkInDate, checkOutDate, notes } = req.body;

  if (!roomId || !checkInDate || !checkOutDate) {
    return res.status(400).json({ message: 'Room, check-in, and check-out dates are required' });
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkIn >= checkOut) {
    return res.status(400).json({ message: 'Check-out must be after check-in' });
  }

  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.status !== 'available') {
    return res.status(400).json({ message: 'Room is not available' });
  }

  // Block student from having more than one active reservation
  const activeReservation = await Reservation.findOne({
    user: req.user._id,
    status: { $in: ['pending', 'approved'] },
  });
  if (activeReservation) {
    return res.status(409).json({
      message: 'You already have an active reservation. Cancel it before reserving another room.',
    });
  }

  // Check for overlapping reservations on the same room
  const overlap = await Reservation.findOne({
    room: roomId,
    status: { $in: ['pending', 'approved'] },
    $or: [{ checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }],
  });

  if (overlap) {
    return res.status(409).json({ message: 'Room is already reserved for those dates' });
  }

  const reservation = await Reservation.create({
    user: req.user._id,
    room: roomId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    notes: notes || '',
  });

  await reservation.populate('room user', '-password');
  res.status(201).json(reservation);
});

// @desc  Get logged-in student's reservations
// @route GET /api/reservations/my
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .populate('room')
    .sort({ createdAt: -1 });
  res.json(reservations);
});

// @desc  Get all reservations (admin)
// @route GET /api/reservations
const getAllReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find()
    .populate('room')
    .populate('user', '-password')
    .sort({ createdAt: -1 });
  res.json(reservations);
});

// @desc  Update reservation status (admin)
// @route PUT /api/reservations/:id/status
const updateReservationStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const allowed = ['approved', 'rejected', 'completed'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const reservation = await Reservation.findById(req.params.id).populate('room');
  if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

  reservation.status = status;
  if (adminNotes) reservation.adminNotes = adminNotes;

  // Mark room as occupied when approved, available when rejected/completed
  if (status === 'approved') {
    await Room.findByIdAndUpdate(reservation.room._id, { status: 'occupied' });
  } else if (status === 'rejected' || status === 'completed') {
    await Room.findByIdAndUpdate(reservation.room._id, { status: 'available' });
  }

  await reservation.save();
  await reservation.populate('user', '-password');
  res.json(reservation);
});

// @desc  Cancel a reservation (student)
// @route PUT /api/reservations/:id/cancel
const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

  if (!['pending', 'approved'].includes(reservation.status)) {
    return res.status(400).json({ message: 'Cannot cancel this reservation' });
  }

  reservation.status = 'cancelled';
  await reservation.save();

  // Free up the room
  await Room.findByIdAndUpdate(reservation.room, { status: 'available' });

  res.json({ message: 'Reservation cancelled', reservation });
});

// @desc  Get dashboard stats (admin)
// @route GET /api/reservations/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalRooms, availableRooms, pendingReservations, totalReservations, revenueResult] =
    await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Reservation.countDocuments({ status: 'pending' }),
      Reservation.countDocuments(),
      Reservation.aggregate([
        { $match: { status: { $in: ['approved', 'completed'] }, totalPrice: { $exists: true } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

  res.json({
    totalRooms,
    availableRooms,
    occupiedRooms: totalRooms - availableRooms,
    pendingReservations,
    totalReservations,
    totalRevenue: revenueResult[0]?.total || 0,
  });
});

// @desc  Get analytics data (admin)
// @route GET /api/reservations/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const [
    monthlyReservations,
    monthlyRevenue,
    statusBreakdown,
    roomTypeBreakdown,
    topRooms,
    avgStayResult,
  ] = await Promise.all([
    // Monthly reservation counts for the last 12 months
    Reservation.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Monthly revenue for the last 12 months
    Reservation.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'completed'] },
          totalPrice: { $exists: true },
          createdAt: {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Reservation status breakdown
    Reservation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

    // Reservations by room type
    Reservation.aggregate([
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomData',
        },
      },
      { $unwind: '$roomData' },
      { $group: { _id: '$roomData.type', count: { $sum: 1 } } },
    ]),

    // Top 5 most reserved rooms
    Reservation.aggregate([
      { $group: { _id: '$room', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'roomData',
        },
      },
      { $unwind: '$roomData' },
      {
        $project: {
          roomNumber: '$roomData.roomNumber',
          type: '$roomData.type',
          count: 1,
        },
      },
    ]),

    // Average length of stay in days
    Reservation.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      {
        $project: {
          days: {
            $divide: [{ $subtract: ['$checkOutDate', '$checkInDate'] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      { $group: { _id: null, avgDays: { $avg: '$days' } } },
    ]),
  ]);

  // Format months as "Jan 2025" labels
  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const formatMonthly = (arr, valueKey) =>
    arr.map((d) => ({
      month: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
      [valueKey]: d[valueKey],
    }));

  res.json({
    monthlyReservations: formatMonthly(monthlyReservations, 'count'),
    monthlyRevenue: formatMonthly(monthlyRevenue, 'revenue'),
    statusBreakdown: statusBreakdown.map((d) => ({ name: d._id, value: d.count })),
    roomTypeBreakdown: roomTypeBreakdown.map((d) => ({ name: d._id, value: d.count })),
    topRooms: topRooms.map((d) => ({
      name: `Room ${d.roomNumber}`,
      type: d.type,
      reservations: d.count,
    })),
    avgStayDays: Math.round(avgStayResult[0]?.avgDays || 0),
  });
});

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation,
  getDashboardStats,
  getAnalytics,
};
