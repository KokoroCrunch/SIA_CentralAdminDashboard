const mongoose = require('mongoose');
const NotifSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    type: { type: String, enum: ['payment', 'order', 'general'], default: 'general' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Notification', NotifSchema);
