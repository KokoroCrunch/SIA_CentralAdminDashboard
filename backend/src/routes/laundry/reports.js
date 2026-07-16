'use strict';

const router = require('express').Router();
const { getModel: getOrderModel } = require('../../models/laundry/Order');
const { getModel: getCustomerModel } = require('../../models/laundry/Customer');

// GET /api/v1/laundry/reports
router.get('/', async (req, res) => {
  try {
    const Order = await getOrderModel();
    const Customer = await getCustomerModel();

    const [allOrders, customers] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).lean(),
      Customer.find().lean(),
    ]);

    // Manual populate customers onto orders
    const custMap = {};
    customers.forEach((c) => {
      custMap[String(c._id)] = c;
    });
    const orders = allOrders.map((o) => ({
      ...o,
      customer: custMap[String(o.customer)] || { name: 'Unknown' },
    }));

    const completed = orders.filter((o) => o.status === 'Completed');
    const total_revenue = completed.reduce((s, o) => s + (o.price || 0), 0);
    const total_orders = orders.length;
    const completed_orders = completed.length;
    const cancelled_orders = orders.filter((o) => o.status === 'Cancelled').length;

    // Orders by status
    const statusMap = {};
    orders.forEach((o) => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });
    const by_status = Object.entries(statusMap).map(([status, cnt]) => ({ status, cnt }));

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = {};
    completed
      .filter((o) => new Date(o.createdAt) >= sixMonthsAgo)
      .forEach((o) => {
        const key = new Date(o.createdAt).toLocaleString('default', {
          month: 'short',
          year: 'numeric',
        });
        if (!monthly[key]) monthly[key] = { revenue: 0, order_count: 0, date: o.createdAt };
        monthly[key].revenue += o.price || 0;
        monthly[key].order_count += 1;
      });
    const monthly_data = Object.entries(monthly)
      .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
      .map(([m, v]) => ({ month: m, revenue: v.revenue, order_count: v.order_count }));

    // Top customers
    const custSpend = {};
    completed.forEach((o) => {
      const id = String(o.customer?._id || o.customer);
      const name = o.customer?.name || 'Unknown';
      if (!custSpend[id]) custSpend[id] = { name, orders: 0, spent: 0 };
      custSpend[id].orders += 1;
      custSpend[id].spent += o.price || 0;
    });
    const top_customers = Object.values(custSpend)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    res.json({
      total_revenue,
      total_orders,
      completed_orders,
      cancelled_orders,
      by_status,
      monthly_data,
      top_customers,
      total_customers: customers.length,
    });
  } catch (e) {
    console.error('[laundry/reports GET]', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
