const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user.model');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const existing = await User.findOne({ email: 'admin@dorm.com' });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@dorm.com',
      password: 'admin123',
      studentId: 'ADMIN-0001',
      phone: '09000000000',
      role: 'admin',
    });

    console.log('Admin account created:');
    console.log('  Email:    ', admin.email);
    console.log('  Password: ', 'admin123');
    console.log('  Role:     ', admin.role);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seedAdmin();
