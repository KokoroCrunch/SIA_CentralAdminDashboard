'use strict';

const express = require('express');
const router = express.Router();
const { getModel: getProductModel } = require('../../models/water/Product');
const { getNextId } = require('../../models/water/getNextId');

// GET /api/v1/water/products
router.get('/', async (req, res) => {
  try {
    const Product = await getProductModel();
    const products = await Product.find().sort({ _id: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/v1/water/products/:id
router.get('/:id', async (req, res) => {
  try {
    const Product = await getProductModel();
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/v1/water/products
router.post('/', async (req, res) => {
  try {
    const Product = await getProductModel();
    const { product_name, description, container_type, volume_liters, price, stock, image } =
      req.body;
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
      image: image || '',
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/v1/water/products/:id
router.put('/:id', async (req, res) => {
  try {
    const Product = await getProductModel();
    const { product_name, description, container_type, volume_liters, price, stock, image } =
      req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { product_name, description, container_type, volume_liters, price, stock, image },
      { new: true, runValidators: true },
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/v1/water/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const Product = await getProductModel();
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
