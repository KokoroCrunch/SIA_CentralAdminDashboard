'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const LaundryPaymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundryOrder', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'gcash', 'card'], default: 'cash' },
  },
  { timestamps: true, collection: 'payments' },
);

let _model = null;
async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('laundrypro');
  _model = conn.models['LaundryPayment'] || conn.model('LaundryPayment', LaundryPaymentSchema);
  return _model;
}
module.exports = { getModel };
