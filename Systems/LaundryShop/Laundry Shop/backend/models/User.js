const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    full_name: { type: String, default: '' },
    contact: { type: String, default: '' },
  },
  { timestamps: true },
);
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
UserSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};
module.exports = mongoose.model('User', UserSchema);
