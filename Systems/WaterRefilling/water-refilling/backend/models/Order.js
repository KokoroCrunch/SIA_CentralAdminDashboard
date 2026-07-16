const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product_id: { type: Number, required: true },
    product_name: { type: String, default: '' },
    unit_price: { type: Number, default: 0 },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    _id: { type: Number, required: true },
    customer_id: { type: Number, required: true },
    customer_name: { type: String, default: '' },
    items: { type: [orderItemSchema], default: [] },
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

module.exports = mongoose.model('Order', orderSchema);
