'use strict';

const router = require('express').Router();
const { getModel: getCustomerModel } = require('../../models/laundry/Customer');
const { getModel: getOrderModel } = require('../../models/laundry/Order');
const auditLog = require('../../utils/auditLog');

// GET /api/v1/laundry/customers
router.get('/', async (req, res) => {
  try {
    const Customer = await getCustomerModel();
    const Order = await getOrderModel();

    const customers = await Customer.find().sort({ createdAt: -1 }).lean();

    const result = await Promise.all(
      customers.map(async (c) => {
        const orders = await Order.find({ customer: c._id }).lean();
        const total_spent = orders.reduce((s, o) => s + (o.price || 0), 0);
        return { ...c, order_count: orders.length, total_spent };
      }),
    );

    res.json(result);
  } catch (e) {
    console.error('[laundry/customers GET]', e);
    res.status(500).json({ message: e.message });
  }
});

// POST /api/v1/laundry/customers
router.post('/', async (req, res) => {
  try {
    const Customer = await getCustomerModel();
    const c = await Customer.create(req.body);
    auditLog(req, {
      system: 'laundry',
      action: 'created',
      entity: 'Customer',
      entityId: c._id,
      description: `Laundry customer "${c.name}" created`,
      meta: { name: c.name, contact: c.contact },
    });
    res.status(201).json(c);
  } catch (e) {
    console.error('[laundry/customers POST]', e);
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/v1/laundry/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const Customer = await getCustomerModel();
    const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    auditLog(req, {
      system: 'laundry',
      action: 'updated',
      entity: 'Customer',
      entityId: c._id,
      description: `Laundry customer "${c.name}" updated`,
      meta: req.body,
    });
    res.json(c);
  } catch (e) {
    console.error('[laundry/customers PUT]', e);
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/v1/laundry/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const Customer = await getCustomerModel();
    const c = await Customer.findByIdAndDelete(req.params.id);
    auditLog(req, {
      system: 'laundry',
      action: 'deleted',
      entity: 'Customer',
      entityId: req.params.id,
      description: `Laundry customer "${c?.name || req.params.id}" deleted`,
      meta: { name: c?.name },
    });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[laundry/customers DELETE]', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
