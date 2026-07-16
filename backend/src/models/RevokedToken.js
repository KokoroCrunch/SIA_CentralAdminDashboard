'use strict';

const mongoose = require('mongoose');

/**
 * RevokedToken Schema
 *
 * Tracks tokens (access tokens by raw JWT string, refresh tokens by JTI) that
 * have been explicitly revoked before their natural expiry — typically as a
 * result of logout or token rotation.
 *
 * The TTL index on `expiresAt` instructs MongoDB's background thread to
 * automatically delete each document once the corresponding token would have
 * expired anyway, keeping the revocation store bounded in size without any
 * application-level cleanup job.
 *
 * Requirements: 4.1, 4.2
 */
const revokedTokenSchema = new mongoose.Schema(
  {
    /**
     * The raw JWT string (for access tokens) or the JTI UUID (for refresh
     * tokens). Indexed with a unique constraint so duplicate revocations are
     * idempotent at the DB level.
     */
    token: {
      type: String,
      required: true,
      unique: true,
    },

    /**
     * Indicates whether this is a revoked access token or a revoked refresh
     * token, allowing selective queries if needed.
     */
    tokenType: {
      type: String,
      enum: ['access', 'refresh'],
      required: true,
    },

    /**
     * The UTC datetime at which the underlying token expires. MongoDB's TTL
     * reaper checks this field and removes the document once this moment passes,
     * so the revocation store never grows unboundedly.
     */
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  },
);

// ─── TTL Index ────────────────────────────────────────────────────────────────
// expireAfterSeconds: 0 means MongoDB removes the document exactly when
// `expiresAt` is reached (no additional delay beyond the 60-second reaper cycle).
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);
