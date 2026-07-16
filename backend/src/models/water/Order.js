'use strict';
const mongoose = require('mongoose');
const { getConnection } = require('../../config/connections');

const waterOrderItemSchema = new mongoose.Schema(
  {
    product_id: { type: Number, required: true },
    product_name: { type: String, default: '' },
    unit_price: { type: Number, default: 0 },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false },
);

const waterOrderSchema = new mongoose.Schema(
  {
    _id: { type: Number, required: true },
    customer_id: { type: Number, required: true },
    customer_name: { type: String, default: '' },
    items: { type: [waterOrderItemSchema], default: [] },
    total_amount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Out for Delivery', 'Delivered'],
      default: 'Pending',
      required: true,
    },
    notes: { type: String, default: '' },
    order_date: { type: Date, default: Date.now },
    delivery_date: { type: Date, default: null },
  },
  { collection: 'orders', versionKey: false },
);

let _model = null;

async function getModel() {
  if (_model) return _model;
  const conn = await getConnection('water_refilling');
  // Clear any previously cached model under old collection name
  delete conn.models['WaterOrder'];
  _model = conn.model('WaterOrder', waterOrderSchema);
  return _model;
}

module.exports = { getModel };
