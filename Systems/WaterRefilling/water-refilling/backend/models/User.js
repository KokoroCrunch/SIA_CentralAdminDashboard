const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    _id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer', required: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'users', versionKey: false },
);

module.exports = mongoose.model('User', userSchema);
