const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getNextId } = require('../utils/getNextId');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { product_name, description, container_type, volume_liters, price, stock } = req.body;
    if (!product_name || price === undefined)
      return res.status(400).json({ message: 'product_name and price are required' });
    const _id = await getNextId(Product);
    const product = await Product.create({
      _id,
      product_name,
      description,
      container_type,
      volume_liters,
      price,
      stock,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { product_name, description, container_type, volume_liters, price, stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { product_name, description, container_type, volume_liters, price, stock },
      { new: true, runValidators: true },
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
