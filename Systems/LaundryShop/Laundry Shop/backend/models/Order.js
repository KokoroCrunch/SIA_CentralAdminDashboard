const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    service_type: {
      type: String,
      enum: ['wash_dry', 'wash_dry_iron', 'dry_cleaning'],
      default: 'wash_dry',
    },
    status: {
      type: String,
      enum: ['Pending', 'Washing', 'Drying', 'Ready for Pickup', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    payment_status: {
      type: String,
      enum: ['unpaid', 'pending_verification', 'paid'],
      default: 'unpaid',
    },
    payment_method: { type: String, enum: ['cash', 'gcash', null], default: null },
    gcash_ref: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Order', OrderSchema);
