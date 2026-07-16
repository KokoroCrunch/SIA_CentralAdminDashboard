const router = require('express').Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

router.get('/', auth, async (req, res) => {
  try {
    const [allOrders, customers] = await Promise.all([
      Order.find().populate('customer', 'name'),
      Customer.find(),
    ]);
    const completed = allOrders.filter((o) => o.status === 'Completed');
    const total_revenue = completed.reduce((s, o) => s + o.price, 0);
    const total_orders = allOrders.length;
    const completed_orders = completed.length;
    const cancelled_orders = allOrders.filter((o) => o.status === 'Cancelled').length;

    // Orders by status
    const statusMap = {};
    allOrders.forEach((o) => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });
    const by_status = Object.entries(statusMap).map(([status, cnt]) => ({ status, cnt }));

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = {};
    completed
      .filter((o) => o.createdAt >= sixMonthsAgo)
      .forEach((o) => {
        const key = o.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthly[key]) monthly[key] = { revenue: 0, order_count: 0, date: o.createdAt };
        monthly[key].revenue += o.price;
        monthly[key].order_count += 1;
      });
    const monthly_data = Object.entries(monthly)
      .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
      .map(([m, v]) => ({ month: m, revenue: v.revenue, order_count: v.order_count }));

    // Top customers
    const custMap = {};
    completed.forEach((o) => {
      const id = o.customer?._id?.toString();
      const name = o.customer?.name || 'Unknown';
      if (!custMap[id]) custMap[id] = { name, orders: 0, spent: 0 };
      custMap[id].orders += 1;
      custMap[id].spent += o.price;
    });
    const top_customers = Object.values(custMap)
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
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
