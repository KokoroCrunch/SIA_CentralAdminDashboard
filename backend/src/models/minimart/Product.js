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

  _model = conn.model('MinimartProduct', productSchema);

  // SKU auto-generation — finds the highest existing SKU number and increments it.
  // Using max SKU instead of countDocuments() avoids duplicates when products
  // are deleted (count drops but SKUs already issued remain in the DB).
  productSchema.pre('save', async function (next) {
    if (this.sku) return next();

    // Find the product with the highest SKU number
    const last = await _model
      .findOne({ sku: /^SKU-\d+$/ })
      .sort({ sku: -1 })
      .select('sku')
      .lean();

    let nextNum = 1;
    if (last?.sku) {
      const parsed = parseInt(last.sku.replace('SKU-', ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }

    this.sku = 'SKU-' + String(nextNum).padStart(5, '0');
    next();
  });

  return _model;
}

module.exports = { getModel };
