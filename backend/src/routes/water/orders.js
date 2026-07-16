'use strict';

const express = require('express');
const router = express.Router();
const { getModel: getOrderModel } = require('../../models/water/Order');
const { getModel: getProductModel } = require('../../models/water/Product');
const getUserModel = require('../../models/water/User');
const { getNextId } = require('../../models/water/getNextId');

function computeTotal(items) {
  return items.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 0), 0);
}

// GET /api/v1/water/orders
router.get('/', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const filter = {};
    if (req.query.customer_id) filter.customer_id = Number(req.query.customer_id);
    const orders = await Order.find(filter).sort({ _id: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/v1/water/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/v1/water/orders
router.post('/', async (req, res) => {
  try {
    const { customer_id, items, status, notes, delivery_date } = req.body;

    if (!customer_id || !items || items.length === 0)
      return res.status(400).json({ message: 'customer_id and at least one item are required' });

    const Order = await getOrderModel();
    const Product = await getProductModel();
    const User = await getUserModel();

    const customer = await User.findById(Number(customer_id)).lean();
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(Number(item.product_id)).lean();
        if (!product) throw new Error(`Product #${item.product_id} not found`);
        const qty = Number(item.quantity) || 1;
        if (product.stock < qty)
          throw new Error(
            `Insufficient stock for "${product.product_name}" (available: ${product.stock})`,
          );
        await Product.findByIdAndUpdate(product._id, { $inc: { stock: -qty } });
        return {
          product_id: product._id,
          product_name: product.product_name,
          unit_price: product.price,
          quantity: qty,
        };
      }),
    );

    const total_amount = computeTotal(enrichedItems);
    const _id = await getNextId(Order);

    const order = await Order.create({
      _id,
      customer_id: Number(customer_id),
      customer_name: customer.name,
      items: enrichedItems,
      total_amount,
      status: status || 'Pending',
      notes: notes || '',
      delivery_date: delivery_date || null,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/v1/water/orders/:id
router.put('/:id', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const { status, notes, delivery_date } = req.body;
    const update = {};
    if (status !== undefined) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (delivery_date !== undefined) update.delivery_date = delivery_date;

    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/v1/water/orders/:id
router.delete('/:id', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
