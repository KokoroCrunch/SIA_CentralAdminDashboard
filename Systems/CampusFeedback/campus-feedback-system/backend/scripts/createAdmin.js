const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    const dbName = process.env.DB_NAME || 'complaint';
    await mongoose.connect(process.env.MONGO_URI, { dbName });
    console.log('✅ MongoDB Connected');

    // Admin credentials
    const adminEmail = 'admin@complaint-system.com';
    const adminPassword = 'AdminPass123!'; // Change this to a secure password
    const adminName = 'Admin User';

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      console.log('⚠️  Admin account already exists with email:', adminEmail);
      process.exit(0);
    }

    // Create new admin
    admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
