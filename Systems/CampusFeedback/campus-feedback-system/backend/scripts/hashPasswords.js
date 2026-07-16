require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run() {
  const dbName = process.env.DB_NAME || 'test';
  await mongoose.connect(process.env.MONGO_URI, { dbName });
  console.log('Connected to MongoDB', dbName);

  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    const pw = user.password || '';
    const isHash =
      typeof pw === 'string' &&
      (pw.startsWith('$2a$') || pw.startsWith('$2b$') || pw.startsWith('$2y$')) &&
      pw.length >= 60;
    if (!isHash) {
      const hash = await bcrypt.hash(pw, 10);
      await User.updateOne({ _id: user._id }, { $set: { password: hash } });
      updated++;
      console.log(`Hashed password for ${user.email}`);
    }
  }

  console.log(`Done. Updated ${updated} user(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error hashing passwords:', err);
  process.exit(1);
});
