const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Product = require('../models/Product');
const Sale = require('../models/Sale');

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product (SKU is immutable — strip it from the update payload)
app.put('/api/products/:id', async (req, res) => {
  try {
    const { sku, ...updateData } = req.body; // prevent SKU from being overwritten
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── INVENTORY ───────────────────────────────────────────────────────────────

// Stock In — add quantity
app.patch('/api/inventory/stock-in/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: Number(quantity) } },
      { new: true },
    );
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock Out — remove quantity
app.patch('/api/inventory/stock-out/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    product.quantity -= Number(quantity);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Low stock — items with quantity <= threshold (default 10)
app.get('/api/inventory/low-stock', async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;
    const products = await Product.find({ quantity: { $lte: threshold } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POS / CHECKOUT ──────────────────────────────────────────────────────────

// Checkout: deduct stock and record sale
app.post('/api/pos/checkout', async (req, res) => {
  try {
    const { items, total } = req.body;
    // items: [{ productId, name, price, quantity }]

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Product ${item.name} not found` });
      if (product.quantity < item.quantity)
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      product.quantity -= item.quantity;
      await product.save();
    }

    const sale = new Sale({ items, total });
    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SALES REPORTS ───────────────────────────────────────────────────────────

// All sales (optional ?from=&to= date range filter)
app.get('/api/sales', async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // include the full end day
        filter.createdAt.$lte = toDate;
      }
    }
    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    res.json({ sales, total, count: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily sales summary
app.get('/api/sales/daily', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await Sale.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    res.json({ sales, total, count: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Weekly sales summary
app.get('/api/sales/weekly', async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sales = await Sale.find({ createdAt: { $gte: weekAgo } });
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    res.json({ sales, total, count: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly sales summary
app.get('/api/sales/monthly', async (req, res) => {
  try {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const sales = await Sale.find({ createdAt: { $gte: monthAgo } });
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    res.json({ sales, total, count: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Running on port ${process.env.PORT}`);
});
