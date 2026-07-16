'use strict';

/**
 * Complaint (CampusFeedback) Controller
 *
 * Reads/writes to the 'complaint' database on AdminHub Atlas cluster.
 * Full schema: user_id, complaint_type, message, anonymous,
 *              referenceNumber, status, assignedTo, attachments,
 *              action_taken, notes
 */

const { getFeedbackModel, populateUsers } = require('../models/complaint/Feedback');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');

// ─── Create ───────────────────────────────────────────────────────────────────

exports.createComplaint = async (req, res, next) => {
  try {
    const { complaint_type, message, anonymous } = req.body;

    if (!complaint_type || !message) {
      return next(new AppError('complaint_type and message are required', 400));
    }

    // Generate a reference number
    const ref = `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const Feedback = await getFeedbackModel();
    const complaint = await Feedback.create({
      user_id: req.user.id,
      complaint_type,
      message,
      anonymous: anonymous === true || anonymous === 'true',
      referenceNumber: ref,
      status: 'open',
    });

    auditLog(req, {
      system: 'complaint',
      action: 'created',
      entity: 'Complaint',
      entityId: complaint._id,
      description: `Complaint submitted — ${complaint_type} (${anonymous ? 'anonymous' : 'identified'})`,
      status: 'open',
      meta: { complaint_type, referenceNumber: ref, anonymous },
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

exports.getComplaints = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    const Feedback = await getFeedbackModel();

    let complaints;
    if (role === 'admin' || role === 'staff') {
      complaints = await Feedback.find().sort({ createdAt: -1 }).lean();
      complaints = await populateUsers(complaints);
    } else {
      complaints = await Feedback.find({ user_id: id }).sort({ createdAt: -1 }).lean();
      // Strip binary data but keep metadata for student's own complaints
      complaints = complaints.map((c) => ({
        ...c,
        attachments: (c.attachments || []).map(({ data, ...rest }) => rest),
      }));
    }

    res.json({ success: true, data: complaints });
  } catch (err) {
    next(err);
  }
};

exports.getComplaintById = async (req, res, next) => {
  try {
    const Feedback = await getFeedbackModel();
    const raw = await Feedback.findById(req.params.id).lean();

    if (!raw) {
      return next(new AppError('Complaint not found', 404));
    }

    const { role, id } = req.user;
    if (role !== 'admin' && role !== 'staff' && String(raw.user_id) !== id) {
      return next(new AppError('Access denied', 403));
    }

    const [complaint] = await populateUsers([raw]);
    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

exports.updateComplaint = async (req, res, next) => {
  try {
    const { role } = req.user;

    if (role !== 'admin' && role !== 'staff') {
      return next(new AppError('Only admins and staff can update complaints', 403));
    }

    // Allow updating action_taken and status
    const updates = {};
    if (req.body.action_taken !== undefined) updates.action_taken = req.body.action_taken;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const Feedback = await getFeedbackModel();
    const updated = await Feedback.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return next(new AppError('Complaint not found', 404));
    }

    auditLog(req, {
      system: 'complaint',
      action: Object.keys(updates).includes('status') ? 'status_change' : 'updated',
      entity: 'Complaint',
      entityId: req.params.id,
      description: `Complaint ${req.params.id} updated — ${Object.entries(updates)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')}`,
      status: updated.status,
      meta: updates,
    });

    const [complaint] = await populateUsers([updated]);
    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

exports.deleteComplaint = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(new AppError('Only admins can delete complaints', 403));
    }

    const Feedback = await getFeedbackModel();
    const complaint = await Feedback.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return next(new AppError('Complaint not found', 404));
    }

    auditLog(req, {
      system: 'complaint',
      action: 'deleted',
      entity: 'Complaint',
      entityId: req.params.id,
      description: `Admin deleted complaint ${req.params.id} (${complaint.complaint_type})`,
      meta: {
        complaint_type: complaint.complaint_type,
        referenceNumber: complaint.referenceNumber,
      },
    });

    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Serve attachment ─────────────────────────────────────────────────────────

exports.getAttachment = async (req, res, next) => {
  try {
    const { id, attId } = req.params;
    const Feedback = await getFeedbackModel();

    // Fetch only the attachments array to avoid loading the whole document twice
    const doc = await Feedback.findById(id).select('attachments user_id').lean();

    if (!doc) return next(new AppError('Complaint not found', 404));

    // Ownership check for students
    const { role, id: userId } = req.user;
    if (role !== 'admin' && role !== 'staff' && String(doc.user_id) !== userId) {
      return next(new AppError('Access denied', 403));
    }

    const att = (doc.attachments || []).find((a) => String(a._id) === attId);
    if (!att) return next(new AppError('Attachment not found', 404));

    // att.data is a BSON Binary — convert to Buffer
    const buffer = att.data?.buffer
      ? Buffer.from(att.data.buffer)
      : Buffer.isBuffer(att.data)
        ? att.data
        : Buffer.from(att.data);

    const mime = att.mimetype || 'application/octet-stream';
    const name = att.originalName || att.filename || 'attachment';

    res.set('Content-Type', mime);
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
    res.set('Content-Length', buffer.length);
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'staff') {
      return next(new AppError('Access denied', 403));
    }

    const Feedback = await getFeedbackModel();

    const [total, byStatus, byType] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Feedback.aggregate([
        { $group: { _id: '$complaint_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Map status counts for easy consumption
    const statusMap = {};
    byStatus.forEach(({ _id, count }) => {
      statusMap[_id] = count;
    });

    res.json({
      success: true,
      data: {
        total,
        open: statusMap['open'] || 0,
        in_progress: statusMap['in_progress'] || 0,
        resolved: statusMap['resolved'] || 0,
        closed: statusMap['closed'] || 0,
        // Legacy alias — "resolved" + "closed" treated as done
        resolved_total: (statusMap['resolved'] || 0) + (statusMap['closed'] || 0),
        pending: (statusMap['open'] || 0) + (statusMap['in_progress'] || 0),
        byStatus,
        byType,
      },
    });
  } catch (err) {
    next(err);
  }
};
