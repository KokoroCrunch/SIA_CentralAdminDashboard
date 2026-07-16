/**
 * seed-dormitory.js
 *
 * Seeds the central-admin-dashboard database with:
 *   - 3 user accounts (admin, staff, student)
 *   - 18 dormitory rooms across 4 buildings
 *
 * Usage (from the backend/ folder):
 *   node seed-dormitory.js
 *
 * Requirements:
 *   - A .env file at the monorepo root with MONGO_URI set
 *   - npm packages: mongoose, bcryptjs, dotenv
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI not found in .env');
  process.exit(1);
}

// ── Swap database name in the URI ─────────────────────────────────────────────
function buildUri(base, dbName) {
  const [path, qs] = base.split('?');
  const withoutDb = path.replace(/\/[^/]*$/, '');
  return `${withoutDb}/${dbName}${qs ? '?' + qs : ''}`;
}

const DB_URI = buildUri(MONGO_URI, 'central-admin-dashboard');

// ── Schemas ───────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'student'], required: true },
  },
  { timestamps: true },
);
userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const roomSchema = new mongoose.Schema(
  {
    room_number: { type: String, required: true, unique: true, trim: true },
    building: { type: String, required: true, trim: true },
    floor: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1 },
    current_occupancy: { type: Number, default: 0, min: 0 },
    room_type: {
      type: String,
      enum: ['single', 'double', 'triple', 'quad', 'suite'],
      required: true,
    },
    price_per_semester: { type: Number, required: true, min: 0 },
    price_per_month: { type: Number, min: 0 },
    amenities: [{ type: String }],
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    status: {
      type: String,
      enum: ['available', 'full', 'occupied', 'maintenance'],
      default: 'available',
    },
  },
  { timestamps: true },
);

const reservationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    payment_status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    total_price: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    rejection_reason: { type: String, default: '' },
    admin_notes: { type: String, default: '' },
  },
  { timestamps: true },
);

// ── Seed data ─────────────────────────────────────────────────────────────────

const USERS = [
  { name: 'Admin User', email: 'admin@dashboard.com', password: 'Admin123!', role: 'admin' },
  { name: 'Staff Member', email: 'staff@dashboard.com', password: 'Staff123!', role: 'staff' },
  {
    name: 'Juan Student',
    email: 'student@dashboard.com',
    password: 'Student123!',
    role: 'student',
  },
];

const ROOMS = [
  // ── Building A — Singles ────────────────────────────────────────────────────
  {
    room_number: 'A101',
    building: 'Building A',
    floor: 1,
    capacity: 1,
    room_type: 'single',
    price_per_semester: 15000,
    price_per_month: 3000,
    amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning'],
    description: 'Cozy single room on ground floor.',
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
    description: 'Private single room.',
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
    description: 'Premium single room with mini fridge.',
    status: 'available',
  },
  {
    room_number: 'A103',
    building: 'Building A',
    floor: 1,
    capacity: 1,
    room_type: 'single',
    price_per_semester: 15000,
    price_per_month: 3000,
    amenities: ['Wi-Fi', 'Study Desk'],
    description: 'Under renovation.',
    status: 'maintenance',
  },

  // ── Building B — Doubles ────────────────────────────────────────────────────
  {
    room_number: 'B101',
    building: 'Building B',
    floor: 1,
    capacity: 2,
    room_type: 'double',
    price_per_semester: 12000,
    price_per_month: 2400,
    amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
    description: 'Comfortable double occupancy room.',
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
    description: 'Budget-friendly double room.',
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
    description: 'Standard double room.',
    status: 'available',
  },
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
    description: 'Currently fully occupied.',
    status: 'full',
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
    description: 'Air-conditioned double room.',
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
    description: 'Modern double room with AC.',
    status: 'available',
  },

  // ── Building C — Triples & Quads ────────────────────────────────────────────
  {
    room_number: 'C101',
    building: 'Building C',
    floor: 1,
    capacity: 3,
    room_type: 'triple',
    price_per_semester: 10000,
    price_per_month: 2000,
    amenities: ['Wi-Fi', 'Study Desk', 'Shared Bathroom'],
    description: 'Spacious triple occupancy room.',
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
    description: 'Affordable triple room.',
    status: 'available',
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
    description: 'Partially occupied triple room.',
    status: 'occupied',
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
    description: 'Economic quad room.',
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
    description: 'Quad room with AC.',
    status: 'available',
  },

  // ── Building D — Suites ─────────────────────────────────────────────────────
  {
    room_number: 'D101',
    building: 'Building D',
    floor: 1,
    capacity: 2,
    room_type: 'suite',
    price_per_semester: 20000,
    price_per_month: 4000,
    amenities: ['Wi-Fi', 'Study Desk', 'Air Conditioning', 'Private Bathroom', 'Kitchen'],
    description: 'Luxury suite with private facilities.',
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
    description: 'Premium suite with kitchenette.',
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
    description: 'Penthouse suite with balcony view.',
    status: 'available',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌  Connecting to central-admin-dashboard...');
  const conn = await mongoose.createConnection(DB_URI).asPromise();
  console.log('✅  Connected\n');

  const User = conn.model('User', userSchema);
  const Room = conn.model('Room', roomSchema);
  const Reservation = conn.model('Reservation', reservationSchema);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤  Seeding users...');
  const insertedUsers = {};
  for (const u of USERS) {
    const existing = await User.findOne({ email: u.email }).collation({
      locale: 'en',
      strength: 2,
    });
    if (existing) {
      console.log(`   ℹ️  ${u.email} already exists — skipped`);
      insertedUsers[u.role] = existing;
    } else {
      const passwordHash = await bcrypt.hash(u.password, 12);
      const created = await User.create({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
      });
      console.log(`   ✅  Created ${u.role}: ${u.email}  (password: ${u.password})`);
      insertedUsers[u.role] = created;
    }
  }

  // ── Rooms ───────────────────────────────────────────────────────────────────
  console.log('\n🏠  Seeding dormitory rooms...');
  const roomDocs = {};
  let roomsCreated = 0;
  let roomsSkipped = 0;
  for (const r of ROOMS) {
    const existing = await Room.findOne({ room_number: r.room_number });
    if (existing) {
      roomsSkipped++;
      roomDocs[r.room_number] = existing;
    } else {
      const created = await Room.create(r);
      roomDocs[r.room_number] = created;
      roomsCreated++;
    }
  }
  console.log(`   ✅  Created ${roomsCreated} rooms  |  ℹ️  Skipped ${roomsSkipped} existing`);

  // ── Sample reservations ─────────────────────────────────────────────────────
  console.log('\n📋  Seeding sample reservations...');
  const resCount = await Reservation.countDocuments();
  if (resCount > 0) {
    console.log(`   ℹ️  ${resCount} reservations already exist — skipped`);
  } else {
    const studentUser = insertedUsers['student'];
    const adminUser = insertedUsers['admin'];

    const now = new Date();
    const plus3m = new Date(now);
    plus3m.setMonth(plus3m.getMonth() + 3);
    const plus6m = new Date(now);
    plus6m.setMonth(plus6m.getMonth() + 6);
    const plus5m = new Date(now);
    plus5m.setMonth(plus5m.getMonth() + 5);

    const sampleReservations = [
      {
        user_id: studentUser._id,
        room_id: roomDocs['A101']._id,
        start_date: now,
        end_date: plus3m,
        status: 'approved',
        payment_status: 'paid',
        total_price: 9000,
        notes: 'First semester accommodation.',
        admin_notes: 'Approved by admin.',
      },
      {
        user_id: studentUser._id,
        room_id: roomDocs['B201']._id,
        start_date: now,
        end_date: plus6m,
        status: 'pending',
        payment_status: 'pending',
        total_price: 15600,
        notes: 'Requesting room with AC.',
      },
      {
        user_id: adminUser._id,
        room_id: roomDocs['D101']._id,
        start_date: now,
        end_date: plus5m,
        status: 'approved',
        payment_status: 'paid',
        total_price: 20000,
        notes: 'Faculty accommodation.',
        admin_notes: 'Self-approved.',
      },
    ];

    await Reservation.insertMany(sampleReservations);
    console.log(`   ✅  Created ${sampleReservations.length} sample reservations`);
  }

  await conn.close();

  console.log('\n' + '─'.repeat(52));
  console.log('🎉  Dormitory seed complete!');
  console.log('─'.repeat(52));
  console.log('\nLogin credentials:');
  console.log('  Admin:   admin@dashboard.com   / Admin123!');
  console.log('  Staff:   staff@dashboard.com   / Staff123!');
  console.log('  Student: student@dashboard.com / Student123!');
  console.log('\nDatabase:  central-admin-dashboard  (AdminHub cluster)');
  console.log('Collections: users, rooms, reservations');
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
