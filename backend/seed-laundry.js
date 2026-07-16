/**
 * seed-laundry.js — seeds sample laundry data into the Atlas laundrypro database.
 *
 * Usage:  node seed-laundry.js   (from backend/)
 *
 * Populates: LaundryCustomer, LaundryStudent, LaundryOrder, LaundryPayment
 *
 * Run this ONCE to get data showing in the Laundry dashboard.
 * Safe to re-run — skips if data already exists.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

const LAUNDRY_URI = process.env.LAUNDRY_MONGO_URI || process.env.MONGO_URI;
if (!LAUNDRY_URI) {
  console.error('❌  LAUNDRY_MONGO_URI or MONGO_URI not set in .env');
  process.exit(1);
}

// Swap DB name to laundrypro
function buildUri(baseUri, dbName) {
  const [path, qs] = baseUri.split('?');
  const withoutDb = path.replace(/\/[^/]*$/, '');
  return `${withoutDb}/${dbName}${qs ? '?' + qs : ''}`;
}
const uri = buildUri(LAUNDRY_URI, 'laundrypro');

// ── Schemas ──────────────────────────────────────────────────────────────────

const CustomerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true },
    contact: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true },
);

const StudentSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true, unique: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    middlename: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    birthdate: { type: Date },
  },
  { timestamps: true },
);

const OrderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, required: true },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    service_type: {
      type: String,
      enum: ['wash_dry', 'wash_dry_iron', 'dry_cleaning'],
      default: 'wash_dry',
    },
    status: {
      type: String,
      enum: ['Pending', 'Washing', 'Drying', 'Ready for Pickup', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    payment_status: {
      type: String,
      enum: ['unpaid', 'pending_verification', 'paid'],
      default: 'unpaid',
    },
    payment_method: { type: String, default: null },
    gcash_ref: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

const PaymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'gcash'], default: 'cash' },
  },
  { timestamps: true },
);

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to laundrypro database on Atlas...');
  const conn = await mongoose.createConnection(uri).asPromise();
  console.log('✅  Connected:', uri.replace(/\/\/.*@/, '//<credentials>@'));

  const Customer = conn.model('LaundryCustomer', CustomerSchema);
  const Student = conn.model('LaundryStudent', StudentSchema);
  const Order = conn.model('LaundryOrder', OrderSchema);
  const Payment = conn.model('LaundryPayment', PaymentSchema);

  // ── Customers ──────────────────────────────────────────────────────────────
  const custCount = await Customer.countDocuments();
  let customers = [];
  if (custCount > 0) {
    console.log(`ℹ️  Found ${custCount} customers — skipping customer seed`);
    customers = await Customer.find().lean();
  } else {
    customers = await Customer.insertMany([
      { name: 'Maria Santos', contact: '09171234567', address: 'Dorm A Room 101' },
      { name: 'Juan dela Cruz', contact: '09281234567', address: 'Dorm B Room 203' },
      { name: 'Ana Reyes', contact: '09391234567', address: 'Dorm C Room 305' },
      { name: 'Carlo Mendoza', contact: '09501234567', address: 'Off-campus' },
      { name: 'Sofia Villanueva', contact: '09611234567', address: 'Dorm A Room 210' },
    ]);
    console.log(`✅  Seeded ${customers.length} customers`);
  }

  // ── Students ───────────────────────────────────────────────────────────────
  const studCount = await Student.countDocuments();
  if (studCount > 0) {
    console.log(`ℹ️  Found ${studCount} students — skipping student seed`);
  } else {
    await Student.insertMany([
      {
        student_id: '2021-00001',
        firstname: 'Maria',
        lastname: 'Santos',
        gender: 'Female',
        birthdate: '2002-03-15',
      },
      {
        student_id: '2021-00002',
        firstname: 'Juan',
        lastname: 'dela Cruz',
        gender: 'Male',
        birthdate: '2001-07-22',
      },
      {
        student_id: '2022-00001',
        firstname: 'Ana',
        lastname: 'Reyes',
        gender: 'Female',
        birthdate: '2003-01-08',
      },
      {
        student_id: '2022-00002',
        firstname: 'Carlo',
        lastname: 'Mendoza',
        gender: 'Male',
        birthdate: '2002-11-30',
      },
      {
        student_id: '2023-00001',
        firstname: 'Sofia',
        lastname: 'Villanueva',
        gender: 'Female',
        birthdate: '2004-05-17',
      },
    ]);
    console.log('✅  Seeded 5 students');
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  const orderCount = await Order.countDocuments();
  if (orderCount > 0) {
    console.log(`ℹ️  Found ${orderCount} orders — skipping order seed`);
  } else {
    const RATES = { wash_dry: 35, wash_dry_iron: 50, dry_cleaning: 80 };
    const orderData = [
      {
        customer: customers[0]._id,
        weight: 4.5,
        service_type: 'wash_dry',
        status: 'Completed',
        payment_status: 'paid',
        payment_method: 'cash',
      },
      {
        customer: customers[1]._id,
        weight: 3.0,
        service_type: 'wash_dry_iron',
        status: 'Completed',
        payment_status: 'paid',
        payment_method: 'gcash',
        gcash_ref: 'GC202410001',
      },
      {
        customer: customers[2]._id,
        weight: 6.0,
        service_type: 'wash_dry',
        status: 'Ready for Pickup',
        payment_status: 'pending_verification',
        payment_method: 'cash',
      },
      {
        customer: customers[0]._id,
        weight: 2.5,
        service_type: 'dry_cleaning',
        status: 'Washing',
        payment_status: 'unpaid',
      },
      {
        customer: customers[3]._id,
        weight: 5.0,
        service_type: 'wash_dry_iron',
        status: 'Pending',
        payment_status: 'unpaid',
      },
      {
        customer: customers[4]._id,
        weight: 3.5,
        service_type: 'wash_dry',
        status: 'Completed',
        payment_status: 'paid',
        payment_method: 'cash',
      },
      {
        customer: customers[1]._id,
        weight: 4.0,
        service_type: 'wash_dry',
        status: 'Drying',
        payment_status: 'unpaid',
      },
      {
        customer: customers[2]._id,
        weight: 2.0,
        service_type: 'dry_cleaning',
        status: 'Completed',
        payment_status: 'paid',
        payment_method: 'gcash',
        gcash_ref: 'GC202410002',
      },
    ];

    const orders = await Order.insertMany(
      orderData.map((o) => ({ ...o, price: o.weight * RATES[o.service_type] })),
    );

    // Seed payments for paid orders
    const paidOrders = orders.filter((o) => o.payment_status === 'paid');
    if (paidOrders.length > 0) {
      await Payment.insertMany(
        paidOrders.map((o) => ({
          order: o._id,
          amount: o.price,
          method: o.payment_method || 'cash',
        })),
      );
    }

    console.log(`✅  Seeded ${orders.length} orders (${paidOrders.length} with payments)`);
  }

  await conn.close();
  console.log('\n✅  Laundry seed complete! Refresh the Laundry dashboard to see data.');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
