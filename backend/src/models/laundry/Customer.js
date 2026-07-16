'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const LaundryCustomerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundryUser', default: null },
    name: { type: String, required: true },
    contact: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true, collection: 'customers' },
);

let _model = null;
async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('laundrypro');
  _model = conn.models['LaundryCustomer'] || conn.model('LaundryCustomer', LaundryCustomerSchema);
  return _model;
}
module.exports = { getModel };
