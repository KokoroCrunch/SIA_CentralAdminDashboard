'use strict';

/**
 * auditLog — fire-and-forget helper that writes a TransactionLog entry.
 *
 * Usage:
 *   const auditLog = require('../utils/auditLog');
 *   auditLog(req, { system:'laundry', action:'created', entity:'Order',
 *                   entityId: order._id, description: '...', amount: 120 });
 *
 * Errors are silently swallowed so a logging failure never breaks a request.
 */

const TransactionLog = require('../models/TransactionLog');

/**
 * @param {import('express').Request|null} req   — Express request (for actor info). Pass null if not in a request context.
 * @param {object} opts
 * @param {string} opts.system       — sub-system name
 * @param {string} opts.action       — 'created' | 'updated' | 'deleted' | 'login' | 'logout' | 'payment' | 'status_change'
 * @param {string} opts.entity       — model/resource name, e.g. 'Order', 'Room', 'User'
 * @param {*}      [opts.entityId]   — _id of the affected document
 * @param {string} opts.description  — human-readable summary
 * @param {number} [opts.amount]     — monetary amount if applicable
 * @param {string} [opts.status]     — status string from the document
 * @param {object} [opts.meta]       — extra context
 */
function auditLog(req, opts) {
  const actor = req?.user
    ? { id: String(req.user.id), role: req.user.role }
    : { id: null, role: null };

  TransactionLog.create({
    system: opts.system,
    action: opts.action,
    entity: opts.entity,
    entityId: opts.entityId != null ? String(opts.entityId) : '',
    description: opts.description,
    amount: opts.amount ?? null,
    status: opts.status ?? null,
    actor,
    meta: opts.meta || {},
  }).catch((err) => {
    // Never crash a request because of a logging failure
    console.error('[auditLog] Failed to write transaction log:', err.message);
  });
}

module.exports = auditLog;
