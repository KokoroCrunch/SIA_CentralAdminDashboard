'use strict';

/**
 * Feedback (Complaint) Model
 *
 * Reads/writes to the 'complaint' database on the AdminHub Atlas cluster,
 * using the dedicated connection managed by config/connections.js.
 *
 * Full schema matches the actual documents in the feedbacks collection:
 *   user_id, complaint_type, message, anonymous, referenceNumber,
 *   status, assignedTo, attachments, action_taken, notes
 */

const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String },
    originalName: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    data: { type: Buffer }, // stored as Binary in Atlas
  },
  // _id kept ON (default) so each attachment has a unique id for the serve endpoint
);

const noteSchema = new mongoose.Schema(
  {
    text: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const feedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    complaint_type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    referenceNumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    action_taken: {
      type: String,
      default: '',
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
  },
  { timestamps: true },
);

// Minimal User schema for the complaint DB's own users collection
const complaintUserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    role: { type: String },
    password: { type: String, select: false },
  },
  { timestamps: true },
);

/**
 * Returns the Feedback model bound to the 'complaint' database connection.
 * @returns {Promise<mongoose.Model>}
 */
async function getFeedbackModel() {
  const conn = await getConnection('complaint');
  return conn.models['Feedback'] || conn.model('Feedback', feedbackSchema);
}

/**
 * Returns the User model bound to the 'complaint' database connection.
 * @returns {Promise<mongoose.Model>}
 */
async function getComplaintUserModel() {
  const conn = await getConnection('complaint');
  return conn.models['User'] || conn.model('User', complaintUserSchema);
}

/**
 * Manually populates user_id on an array of lean complaint objects
 * using the complaint DB's own users collection.
 *
 * @param {Array} complaints - lean complaint objects
 * @returns {Promise<Array>}
 */
async function populateUsers(complaints) {
  if (!complaints || complaints.length === 0) return complaints;

  const User = await getComplaintUserModel();
  const userIds = [...new Set(complaints.map((c) => String(c.user_id)))];
  const users = await User.find({ _id: { $in: userIds } })
    .select('name email role')
    .lean();

  const userMap = {};
  users.forEach((u) => {
    userMap[String(u._id)] = u;
  });

  return complaints.map((c) => ({
    ...c,
    // Strip attachment binary data from list responses to keep payloads small
    // but keep _id, filename, originalName, mimetype, size so the frontend
    // can build a download URL
    attachments: (c.attachments || []).map(({ data, ...rest }) => rest),
    user_id: userMap[String(c.user_id)] || c.user_id,
  }));
}

module.exports = { getFeedbackModel, getComplaintUserModel, populateUsers };
