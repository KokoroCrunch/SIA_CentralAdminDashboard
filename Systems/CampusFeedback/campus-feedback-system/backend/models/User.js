const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  const storedPassword = this.password || '';
  const isHash =
    typeof storedPassword === 'string' &&
    (storedPassword.startsWith('$2a$') ||
      storedPassword.startsWith('$2b$') ||
      storedPassword.startsWith('$2y$')) &&
    storedPassword.length >= 60;

  if (isHash) {
    return await bcrypt.compare(enteredPassword, storedPassword);
  }

  // Legacy plaintext password fallback: compare directly and migrate to hashed password
  const match = enteredPassword === storedPassword;
  if (match) {
    this.password = await bcrypt.hash(enteredPassword, 10);
    await this.save();
  }
  return match;
};

module.exports = mongoose.model('User', userSchema);
