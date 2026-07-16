'use strict';

/**
 * TransactionLog Model
 *
 * Persistent audit log for every create / update / delete operation
 * across all sub-systems. Stored on the main MongoDB connection so it
 * is accessible from any route regardless of sub-system DB.
 *
 * Shape:
 *   system      — which sub-system generated this entry
 *   action      — verb: 'created' | 'updated' | 'deleted' | 'login' | 'logout' | 'payment'
 *   entity      — noun:  'User' | 'Order' | 'Room' | 'Reservation' | 'Product' | etc.
 *   entityId    — stringified _id of the affected document
 *   description — human-readable one-line summary
 *   amount      — optional monetary value
 *   status      — optional status string from the document
 *   actor       — { id, role } from req.user (null for unauthenticated routes)
 *   meta        — free-form extra context
 *   timestamp   — when the action occurred (indexed)
 */

const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema(
  {
    system: {
      type: String,
      enum: ['auth', 'users', 'minimart', 'laundry', 'dormitory', 'water', 'complaint'],
      required: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'login', 'logout', 'payment', 'status_change'],
      required: true,
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    actor: {
      id: { type: String, default: null },
      role: { type: String, default: null },
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    collection: 'transaction_logs',
  },
);

// Index timestamp descending for fast "newest first" queries
transactionLogSchema.index({ createdAt: -1 });
transactionLogSchema.index({ system: 1, createdAt: -1 });

module.exports = mongoose.model('TransactionLog', transactionLogSchema);
