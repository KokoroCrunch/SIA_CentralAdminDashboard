'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const waterProductSchema = new mongoose.Schema(
  {
    _id: { type: Number, required: true },
    product_name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    container_type: {
      type: String,
      enum: ['Slim', 'Round', 'Mineral', 'Purified', 'Alkaline', 'Other'],
      default: 'Purified',
    },
    volume_liters: { type: Number, default: 0 },
    price: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    image: { type: String, default: '' }, // Base64 data URL
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'products', versionKey: false },
);

let _model = null;

async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('water_refilling');
  delete conn.models['WaterProduct'];
  _model = conn.model('WaterProduct', waterProductSchema);
  return _model;
}

module.exports = { getModel };
