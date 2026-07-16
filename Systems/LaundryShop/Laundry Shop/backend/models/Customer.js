const mongoose = require('mongoose');
const CustomerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    contact: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Customer', CustomerSchema);
