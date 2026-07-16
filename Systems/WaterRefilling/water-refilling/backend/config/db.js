const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/water_refilling';
  try {
    await mongoose.connect(uri);
    console.log(`[mongo] connected -> ${uri}`);
  } catch (err) {
    console.error('[mongo] connection failed:', err.message);
    console.error(
      '[mongo] Is MongoDB running? Open MongoDB Compass or run: mongod --dbpath <path>',
    );
    process.exit(1);
  }
}

module.exports = connectDB;
