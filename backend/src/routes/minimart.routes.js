'use strict';

const { Router } = require('express');
const { getModel: getProduct } = require('../models/minimart/Product');
const { getModel: getSale } = require('../models/minimart/Sale');
const auditLog = require('../utils/auditLog');
const authenticate = require('../middleware/authenticate');

const router = Router();

// All minimart routes require authentication
router.use(authenticate);

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

router.get('/products', async (req, res) => {
  try {
    const Product = await getProduct();
    // Strip the base64 image from list responses — it can be 50–100 KB per product
    // and bloats every list fetch. The full image is only needed by the Products and
    // POS tabs which request it individually via GET /products/:id, or embedded when
    // the UI already has the data in state.
    const noImage = req.query.noImage === 'true';
    const projection = noImage ? '-image' : '';
    const products = await Product.find({}, projection);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /products/:id  — full document including image
router.get('/products/:id', async (req, res) => {
  try {
    const Product = await getProduct();
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const Product = await getProduct();
    const product = new Product(req.body);
    await product.save();
    auditLog(req, {
      system: 'minimart',
      action: 'created',
      entity: 'Product',
      entityId: product._id,
      description: `Product "${product.name}" created (SKU: ${product.sku})`,
      meta: {
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: product.quantity,
      },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const Product = await getProduct();
    const { sku, ...updateData } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    auditLog(req, {
      system: 'minimart',
      action: 'updated',
      entity: 'Product',
      entityId: req.params.id,
      description: `Product "${product?.name}" updated`,
      meta: updateData,
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const Product = await getProduct();
    const product = await Product.findByIdAndDelete(req.params.id);
    auditLog(req, {
      system: 'minimart',
      action: 'deleted',
      entity: 'Product',
      entityId: req.params.id,
      description: `Product "${product?.name}" (SKU: ${product?.sku}) deleted`,
      meta: { name: product?.name, sku: product?.sku },
    });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── INVENTORY ───────────────────────────────────────────────────────────────

router.patch('/inventory/stock-in/:id', async (req, res) => {
  try {
    const Product = await getProduct();
    const { quantity } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: Number(quantity) } },
      { new: true },
    );
    auditLog(req, {
      system: 'minimart',
      action: 'updated',
      entity: 'Product',
      entityId: req.params.id,
      description: `Stock-in: added ${quantity} units to "${product?.name}"`,
      meta: { name: product?.name, addedQty: quantity, newStock: product?.quantity },
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/inventory/stock-out/:id', async (req, res) => {
  try {
    const Product = await getProduct();
    const { quantity } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });
    product.quantity -= Number(quantity);
    await product.save();
    auditLog(req, {
      system: 'minimart',
      action: 'updated',
      entity: 'Product',
      entityId: req.params.id,
      description: `Stock-out: removed ${quantity} units from "${product.name}"`,
      meta: { name: product.name, removedQty: quantity, newStock: product.quantity },
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory/low-stock', async (req, res) => {
  try {
    const Product = await getProduct();
    const threshold = Number(req.query.threshold) || 10;
    res.json(await Product.find({ quantity: { $lte: threshold } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POS ─────────────────────────────────────────────────────────────────────

router.post('/pos/checkout', async (req, res) => {
  try {
    const Product = await getProduct();
    const Sale = await getSale();
    const { items, total } = req.body;
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
    auditLog(req, {
      system: 'minimart',
      action: 'payment',
      entity: 'Sale',
      entityId: sale._id,
      description: `POS checkout — ${items.length} item(s), total ₱${total}`,
      amount: total,
      status: 'completed',
      meta: {
        itemCount: items.length,
        items: items.map((i) => `${i.name} ×${i.quantity}`).join(', '),
      },
    });
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SALES ───────────────────────────────────────────────────────────────────

router.get('/sales', async (req, res) => {
  try {
    const Sale = await getSale();
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = d;
      }
    }
    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json({ sales, total: sales.reduce((s, x) => s + x.total, 0), count: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales/daily', async (req, res) => {
  try {
    const Sale = await getSale();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sales = await Sale.find({ createdAt: { $gte: today, $lt: tomorrow } });
    res.json({ sales, total: sales.reduce((s, x) => s + x.total, 0), count: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales/weekly', async (req, res) => {
  try {
    const Sale = await getSale();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sales = await Sale.find({ createdAt: { $gte: weekAgo } });
    res.json({ sales, total: sales.reduce((s, x) => s + x.total, 0), count: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales/monthly', async (req, res) => {
  try {
    const Sale = await getSale();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const sales = await Sale.find({ createdAt: { $gte: monthAgo } });
    res.json({ sales, total: sales.reduce((s, x) => s + x.total, 0), count: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
