// Admin Setup Script Generator
const fs = require('fs');
const path = require('path');
const BE = path.join(__dirname, 'backend');

const adminScript = `require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:  { type: String },
  password:  { type: String },
  role:      { type: String },
  full_name: { type: String, default: '' },
  contact:   { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME     = 'Administrator';

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/laundrypro');
    console.log('Connected to MongoDB...');

    const existing = await User.findOne({ role: 'admin' });

    if (existing) {
      console.log('');
      console.log('========================================');
      console.log('  Admin account already exists!');
      console.log('========================================');
      console.log('  Username : ' + existing.username);
      console.log('  Full Name: ' + existing.full_name);
      console.log('  Role     : ' + existing.role);
      console.log('----------------------------------------');
      console.log('  Password was set at account creation.');
      console.log('  Run with RESET=1 to reset to Admin@1234');
      console.log('========================================');

      if (process.env.RESET === '1') {
        existing.password = ADMIN_PASSWORD;
        await existing.save();
        console.log('');
        console.log('Password has been RESET!');
        console.log('  New Password: ' + ADMIN_PASSWORD);
      }
    } else {
      await User.create({
        username:  ADMIN_USERNAME,
        password:  ADMIN_PASSWORD,
        full_name: ADMIN_NAME,
        role:      'admin',
        contact:   '09000000000',
      });
      console.log('');
      console.log('========================================');
      console.log('  Admin account CREATED successfully!');
      console.log('========================================');
      console.log('  Username : admin');
      console.log('  Password : Admin@1234');
      console.log('  Role     : admin');
      console.log('========================================');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
`;

fs.writeFileSync(path.join(BE, 'createAdmin.js'), adminScript, 'utf8');
console.log('createAdmin.js written to backend folder.');
