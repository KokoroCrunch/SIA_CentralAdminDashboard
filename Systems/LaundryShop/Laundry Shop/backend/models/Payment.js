const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'gcash', 'card'], default: 'cash' },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Payment', PaymentSchema);
