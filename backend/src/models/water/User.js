'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const waterUserSchema = new mongoose.Schema(
  {
    _id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    password: { type: String, default: '', select: false },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'users', versionKey: false },
);

let _model = null;

async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('water_refilling');
  delete conn.models['WaterUser'];
  _model = conn.model('WaterUser', waterUserSchema);
  return _model;
}

module.exports = getModel;
module.exports.getModel = getModel;
