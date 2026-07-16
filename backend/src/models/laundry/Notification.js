'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const LaundryNotifSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundryUser', required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    type: { type: String, enum: ['payment', 'order', 'general'], default: 'general' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundryOrder', default: null },
  },
  { timestamps: true, collection: 'notifications' },
);

let _model = null;
async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('laundrypro');
  _model =
    conn.models['LaundryNotification'] || conn.model('LaundryNotification', LaundryNotifSchema);
  return _model;
}
module.exports = { getModel };
