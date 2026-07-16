/**
 * seed-water.js — seeds sample water refilling data into Atlas.
 *
 * Usage:  node seed-water.js   (from backend/)
 * Safe to re-run — skips collections that already have data.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

const BASE_URI = process.env.MONGO_URI;
if (!BASE_URI) {
  console.error('MONGO_URI not set');
  process.exit(1);
}

function buildUri(base, db) {
  const [path, qs] = base.split('?');
  return `${path.replace(/\/[^/]*$/, '')}/${db}${qs ? '?' + qs : ''}`;
}

const uri = buildUri(BASE_URI, 'water_refilling');

const ProductSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    product_name: String,
    description: String,
    container_type: String,
    volume_liters: Number,
    price: Number,
    stock: Number,
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'products', versionKey: false },
);

const UserSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: String,
    email: String,
    phone: String,
    address: String,
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'users', versionKey: false },
);

const OrderItemSchema = new mongoose.Schema(
  {
    product_id: Number,
    product_name: String,
    unit_price: Number,
    quantity: Number,
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    customer_id: Number,
    customer_name: String,
    items: [OrderItemSchema],
    total_amount: Number,
    status: String,
    notes: String,
    order_date: { type: Date, default: Date.now },
    delivery_date: Date,
  },
  { collection: 'orders', versionKey: false },
);

async function seed() {
  console.log('Connecting to water_refilling...');
  const conn = await mongoose.createConnection(uri).asPromise();
  console.log('Connected.');

  const Product = conn.model('WaterProduct', ProductSchema);
  const User = conn.model('WaterUser', UserSchema);
  const Order = conn.model('WaterOrder', OrderSchema);

  // ── Products ──────────────────────────────────────────────────────────────
  const prodCount = await Product.countDocuments();
  let products = [];
  if (prodCount > 0) {
    console.log(`ℹ️  ${prodCount} products already exist — skipping`);
    products = await Product.find().lean();
  } else {
    products = await Product.insertMany([
      {
        _id: 1,
        product_name: 'Slim Purified Water',
        container_type: 'Slim',
        volume_liters: 5,
        price: 35,
        stock: 50,
        description: '5L slim container, purified',
      },
      {
        _id: 2,
        product_name: 'Round Purified Water',
        container_type: 'Round',
        volume_liters: 5,
        price: 35,
        stock: 40,
        description: '5L round container, purified',
      },
      {
        _id: 3,
        product_name: 'Round Mineral Water',
        container_type: 'Mineral',
        volume_liters: 5,
        price: 40,
        stock: 30,
        description: '5L mineral water',
      },
      {
        _id: 4,
        product_name: 'Alkaline Water',
        container_type: 'Alkaline',
        volume_liters: 5,
        price: 55,
        stock: 20,
        description: 'pH 8+ alkaline water',
      },
      {
        _id: 5,
        product_name: '1-Gallon Purified',
        container_type: 'Round',
        volume_liters: 3.8,
        price: 25,
        stock: 4,
        description: '1 gallon purified, low stock',
      },
    ]);
    console.log(`✅  Seeded ${products.length} products`);
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  const userCount = await User.countDocuments();
  let users = [];
  if (userCount > 0) {
    console.log(`ℹ️  ${userCount} users already exist — skipping`);
    users = await User.find().lean();
  } else {
    const nextId = userCount + 1;
    users = await User.insertMany([
      {
        _id: nextId,
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '09171111111',
        address: 'Dorm A Room 101',
      },
      {
        _id: nextId + 1,
        name: 'Juan dela Cruz',
        email: 'juan@example.com',
        phone: '09282222222',
        address: 'Dorm B Room 203',
      },
      {
        _id: nextId + 2,
        name: 'Ana Reyes',
        email: 'ana@example.com',
        phone: '09393333333',
        address: 'Off-campus',
      },
    ]);
    console.log(`✅  Seeded ${users.length} users`);
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  const orderCount = await Order.countDocuments();
  if (orderCount > 0) {
    console.log(`ℹ️  ${orderCount} orders already exist — skipping`);
  } else {
    // Refresh users list in case we skipped seeding above
    const allUsers = await User.find().lean();
    const allProds = await Product.find().lean();
    const u1 = allUsers[0];
    const u2 = allUsers[1] || allUsers[0];
    const u3 = allUsers[2] || allUsers[0];
    const p1 = allProds[0],
      p2 = allProds[1] || allProds[0],
      p3 = allProds[2] || allProds[0];

    await Order.insertMany([
      {
        _id: 1,
        customer_id: u1._id,
        customer_name: u1.name,
        items: [
          { product_id: p1._id, product_name: p1.product_name, unit_price: p1.price, quantity: 2 },
        ],
        total_amount: p1.price * 2,
        status: 'Delivered',
        order_date: new Date(Date.now() - 7 * 86400000),
        delivery_date: new Date(Date.now() - 6 * 86400000),
      },
      {
        _id: 2,
        customer_id: u2._id,
        customer_name: u2.name,
        items: [
          { product_id: p1._id, product_name: p1.product_name, unit_price: p1.price, quantity: 1 },
          { product_id: p2._id, product_name: p2.product_name, unit_price: p2.price, quantity: 1 },
        ],
        total_amount: p1.price + p2.price,
        status: 'Out for Delivery',
        order_date: new Date(Date.now() - 2 * 86400000),
      },
      {
        _id: 3,
        customer_id: u1._id,
        customer_name: u1.name,
        items: [
          { product_id: p3._id, product_name: p3.product_name, unit_price: p3.price, quantity: 3 },
        ],
        total_amount: p3.price * 3,
        status: 'Processing',
        order_date: new Date(Date.now() - 86400000),
      },
      {
        _id: 4,
        customer_id: u3._id,
        customer_name: u3.name,
        items: [
          { product_id: p2._id, product_name: p2.product_name, unit_price: p2.price, quantity: 2 },
        ],
        total_amount: p2.price * 2,
        status: 'Pending',
        order_date: new Date(),
      },
    ]);
    console.log('✅  Seeded 4 orders');
  }

  await conn.close();
  console.log('\n✅  Water station seed complete! Refresh the Water Station dashboard.');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
