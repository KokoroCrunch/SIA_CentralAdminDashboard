/**
 * seed.js — populate admin users and sample data for the central dashboard.
 *
 * Usage:  node seed.js   (or: npm run seed from backend/)
 *
 * Databases seeded:
 *   1. central-admin-dashboard  →  users, rooms   (central dashboard admin & dormitory rooms)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Build per-database URIs ──────────────────────────────────────────────────
// MONGO_URI format expected:
//   mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&…
function buildUri(baseMongoUri, dbName) {
  const [beforeQuery, queryString] = baseMongoUri.split('?');
  // strip any existing db path segment after the host
  const withoutDb = beforeQuery.replace(/\/[^/]*$/, '');
  const qs = queryString ? `?${queryString}` : '';
  return `${withoutDb}/${dbName}${qs}`;
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set in .env');
  process.exit(1);
}

const uri1 = buildUri(MONGO_URI, 'central-admin-dashboard');

// ── Schema definitions (inline so each connection registers its own model) ───

// Central dashboard user schema
const centralUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'student'], required: true },
  },
  { timestamps: true },
);
centralUserSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Room schema for dormitory
const roomSchema = new mongoose.Schema(
  {
    room_number: { type: String, required: true, unique: true, trim: true },
    building: { type: String, required: true, trim: true },
    floor: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1 },
    current_occupancy: { type: Number, default: 0, min: 0 },
    room_type: { type: String, enum: ['single', 'double', 'quad', 'suite'], required: true },
    price_per_semester: { type: Number, required: true, min: 0 },
    amenities: [{ type: String }],
    status: { type: String, enum: ['available', 'full', 'maintenance'], default: 'available' },
  },
  { timestamps: true },
);

// ── Main seeding logic ────────────────────────────────────────────────────────
async function seed() {
  // Open connection
  const conn1 = await mongoose.createConnection(uri1).asPromise();

  // Bind models to connection
  const CentralUser = conn1.model('User', centralUserSchema);
  const Room = conn1.model('Room', roomSchema);

  // ── Central Dashboard admin ─────────────────────────────────────────────
  const centralEmail = 'admin@dashboard.com';
  const existing1 = await CentralUser.findOne({ email: centralEmail }).collation({
    locale: 'en',
    strength: 2,
  });

  if (existing1) {
    console.log('ℹ️  Central Dashboard admin already exists — skipping');
  } else {
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    await CentralUser.create({
      name: 'Admin',
      email: centralEmail,
      passwordHash,
      role: 'admin',
    });
    console.log('✅  Central Dashboard admin seeded');
  }

  // ── Dormitory Rooms ─────────────────────────────────────────────────────
  const roomCount = await Room.countDocuments();
  if (roomCount > 0) {
    console.log(`ℹ️  Found ${roomCount} dormitory rooms — skipping room seed`);
  } else {
    const sampleRooms = [
      // Building A - Single Rooms
      {
        room_number: 'A101',
        building: 'Building A',
        floor: 1,
        capacity: 1,
        room_type: 'single',
        price_per_semester: 15000,
        price_per_month: 3000,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning'],
        description: 'Cozy single room with modern amenities',
        status: 'available',
      },
      {
        room_number: 'A102',
        building: 'Building A',
        floor: 1,
        capacity: 1,
        room_type: 'single',
        price_per_semester: 15000,
        price_per_month: 3000,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning'],
        description: 'Private single room',
        status: 'available',
      },
      {
        room_number: 'A201',
        building: 'Building A',
        floor: 2,
        capacity: 1,
        room_type: 'single',
        price_per_semester: 16000,
        price_per_month: 3200,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning', 'Mini Fridge'],
        description: 'Premium single room with mini fridge',
        status: 'available',
      },

      // Building B - Double Rooms
      {
        room_number: 'B101',
        building: 'Building B',
        floor: 1,
        capacity: 2,
        room_type: 'double',
        price_per_semester: 12000,
        price_per_month: 2400,
        amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
        description: 'Comfortable double occupancy room',
        status: 'available',
      },
      {
        room_number: 'B102',
        building: 'Building B',
        floor: 1,
        capacity: 2,
        room_type: 'double',
        price_per_semester: 12000,
        price_per_month: 2400,
        amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
        description: 'Budget-friendly double room',
        status: 'available',
      },
      {
        room_number: 'B103',
        building: 'Building B',
        floor: 1,
        capacity: 2,
        room_type: 'double',
        price_per_semester: 12000,
        price_per_month: 2400,
        amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
        description: 'Standard double room',
        status: 'available',
      },
      {
        room_number: 'B201',
        building: 'Building B',
        floor: 2,
        capacity: 2,
        room_type: 'double',
        price_per_semester: 13000,
        price_per_month: 2600,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning', 'Shared Bathroom'],
        description: 'Air-conditioned double room',
        status: 'available',
      },
      {
        room_number: 'B202',
        building: 'Building B',
        floor: 2,
        capacity: 2,
        room_type: 'double',
        price_per_semester: 13000,
        price_per_month: 2600,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning', 'Shared Bathroom'],
        description: 'Modern double room with AC',
        status: 'available',
      },

      // Building C - Triple and Quad Rooms
      {
        room_number: 'C101',
        building: 'Building C',
        floor: 1,
        capacity: 3,
        room_type: 'triple',
        price_per_semester: 10000,
        price_per_month: 2000,
        amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
        description: 'Spacious triple occupancy room',
        status: 'available',
      },
      {
        room_number: 'C102',
        building: 'Building C',
        floor: 1,
        capacity: 3,
        room_type: 'triple',
        price_per_semester: 10000,
        price_per_month: 2000,
        amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
        description: 'Affordable triple room',
        status: 'available',
      },
      {
        room_number: 'C201',
        building: 'Building C',
        floor: 2,
        capacity: 4,
        room_type: 'quad',
        price_per_semester: 9000,
        price_per_month: 1800,
        amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
        description: 'Economic quad room',
        status: 'available',
      },
      {
        room_number: 'C202',
        building: 'Building C',
        floor: 2,
        capacity: 4,
        room_type: 'quad',
        price_per_semester: 10000,
        price_per_month: 2000,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning', 'Shared Bathroom'],
        description: 'Quad room with AC',
        status: 'available',
      },

      // Building D - Suites
      {
        room_number: 'D101',
        building: 'Building D',
        floor: 1,
        capacity: 2,
        room_type: 'suite',
        price_per_semester: 20000,
        price_per_month: 4000,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning', 'Private Bathroom', 'Kitchen'],
        description: 'Luxury suite with private facilities',
        status: 'available',
      },
      {
        room_number: 'D102',
        building: 'Building D',
        floor: 1,
        capacity: 2,
        room_type: 'suite',
        price_per_semester: 20000,
        price_per_month: 4000,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning', 'Private Bathroom', 'Kitchen'],
        description: 'Premium suite with kitchenette',
        status: 'available',
      },
      {
        room_number: 'D201',
        building: 'Building D',
        floor: 2,
        capacity: 2,
        room_type: 'suite',
        price_per_semester: 22000,
        price_per_month: 4400,
        amenities: [
          'Wi-Fi',
          'Study Desk',
          'Air Conditioning',
          'Private Bathroom',
          'Kitchen',
          'Balcony',
        ],
        description: 'Penthouse suite with balcony',
        status: 'available',
      },

      // Some rooms with different statuses
      {
        room_number: 'B104',
        building: 'Building B',
        floor: 1,
        capacity: 2,
        current_occupancy: 2,
        room_type: 'double',
        price_per_semester: 12000,
        price_per_month: 2400,
        amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
        description: 'Currently occupied',
        status: 'full',
      },
      {
        room_number: 'A103',
        building: 'Building A',
        floor: 1,
        capacity: 1,
        room_type: 'single',
        price_per_semester: 15000,
        price_per_month: 3000,
        amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning'],
        description: 'Under maintenance',
        status: 'maintenance',
      },
      {
        room_number: 'C103',
        building: 'Building C',
        floor: 1,
        capacity: 3,
        current_occupancy: 2,
        room_type: 'triple',
        price_per_semester: 10000,
        price_per_month: 2000,
        amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
        description: 'Partially occupied triple room',
        status: 'occupied',
      },
    ];

    await Room.insertMany(sampleRooms);
    console.log(`✅  Seeded ${sampleRooms.length} dormitory rooms`);
  }

  // ── Disconnect connection ─────────────────────────────────────────────
  await conn1.close();

  console.log('\nAll done! You can now log in with:');
  console.log('  Dashboard: admin@dashboard.com / Admin123!');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
