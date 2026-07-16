'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const productSchema = new mongoose.Schema(
  {
    name: String,
    sku: { type: String, unique: true },
    price: Number,
    quantity: Number,
    category: String,
    image: String, // Base64 data URL
  },
  { collection: 'products' },
);

let _model = null;

async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('minimart');
  if (conn.models['MinimartProduct']) {
    _model = conn.models['MinimartProduct'];
    return _model;
  }
  // Attach SKU auto-generation pre-save hook
  productSchema.pre('save', async function (next) {
    if (this.sku) return next();
    const count = await _model.countDocuments();
    this.sku = 'SKU-' + String(count + 1).padStart(5, '0');
    next();
  });
  _model = conn.model('MinimartProduct', productSchema);
  return _model;
}

module.exports = { getModel };
