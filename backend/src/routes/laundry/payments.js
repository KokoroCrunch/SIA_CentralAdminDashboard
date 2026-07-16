'use strict';

const router = require('express').Router();
const { getModel: getPaymentModel } = require('../../models/laundry/Payment');
const { getModel: getOrderModel } = require('../../models/laundry/Order');
const { getModel: getCustomerModel } = require('../../models/laundry/Customer');

// GET /api/v1/laundry/payments
router.get('/', async (req, res) => {
  try {
    const Payment = await getPaymentModel();
    const Order = await getOrderModel();
    const Customer = await getCustomerModel();

    const payments = await Payment.find().sort({ createdAt: -1 }).lean();

    // Manual populate order → customer
    const orderIds = [...new Set(payments.map((p) => String(p.order)))];
    const orders = await Order.find({ _id: { $in: orderIds } }).lean();
    const orderMap = {};
    orders.forEach((o) => {
      orderMap[String(o._id)] = o;
    });

    const custIds = [...new Set(orders.map((o) => String(o.customer)))];
    const custs = await Customer.find({ _id: { $in: custIds } })
      .select('name')
      .lean();
    const custMap = {};
    custs.forEach((c) => {
      custMap[String(c._id)] = c;
    });

    const populated = payments.map((p) => {
      const order = orderMap[String(p.order)];
      if (order) {
        order.customer = custMap[String(order.customer)] || { name: 'Unknown' };
      }
      return { ...p, order: order || p.order };
    });

    res.json(populated);
  } catch (e) {
    console.error('[laundry/payments GET]', e);
    res.status(500).json({ message: e.message });
  }
});

// GET /api/v1/laundry/payments/pending
// NOTE: This route MUST be defined before /:id routes to avoid Express
// matching "pending" as an :id parameter.
router.get('/pending', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const Customer = await getCustomerModel();

    const orders = await Order.find({ payment_status: 'pending_verification' })
      .sort({ createdAt: -1 })
      .lean();

    const custIds = [...new Set(orders.map((o) => String(o.customer)))];
    const custs = await Customer.find({ _id: { $in: custIds } })
      .select('name contact')
      .lean();
    const custMap = {};
    custs.forEach((c) => {
      custMap[String(c._id)] = c;
    });

    const populated = orders.map((o) => ({
      ...o,
      customer: custMap[String(o.customer)] || { name: 'Unknown', contact: '' },
    }));

    res.json(populated);
  } catch (e) {
    console.error('[laundry/payments/pending GET]', e);
    res.status(500).json({ message: e.message });
  }
});

// POST /api/v1/laundry/payments/confirm
router.post('/confirm', async (req, res) => {
  try {
    const Payment = await getPaymentModel();
    const Order = await getOrderModel();

    const { order_id, amount, method } = req.body;
    await Payment.create({ order: order_id, amount, method });
    const order = await Order.findByIdAndUpdate(
      order_id,
      { payment_status: 'paid', status: 'Completed' },
      { new: true },
    ).lean();

    res.json({ message: 'Payment confirmed', order });
  } catch (e) {
    console.error('[laundry/payments/confirm POST]', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
