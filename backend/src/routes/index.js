'use strict';

/**
 * API Router (combined)
 *
 * Mounts all sub-routers under their respective path prefixes and exports
 * the combined router to be mounted at /api/v1 in app.js.
 *
 * Route prefixes:
 *   /auth  — authentication routes (register, login, refresh, logout)
 *
 * Requirements: 1.1, 2.1, 3.1, 4.1
 */

const { Router } = require('express');

const authRoutes = require('./auth.routes');
const minimartRoutes = require('./minimart.routes');
const complaintRoutes = require('./complaint/index');
const dormitoryRoutes = require('./dormitory/index');
const userRoutes = require('./users.routes');
const logsRoutes = require('./logs.routes');

// Laundry shop routes
const laundryCustomers = require('./laundry/customers');
const laundryOrders = require('./laundry/orders');
const laundryPayments = require('./laundry/payments');
const laundryNotifications = require('./laundry/notifications');
const laundryStudents = require('./laundry/students');
const laundryReports = require('./laundry/reports');

const router = Router();

// Mount complaint / campus-feedback routes at /complaint
router.use('/complaint', complaintRoutes);

// Mount auth routes at /auth
router.use('/auth', authRoutes);

// Mount user management routes at /users (admin-only)
router.use('/users', userRoutes);

// Mount transaction logs route at /logs (admin + staff)
router.use('/logs', logsRoutes);

// Mount minimart routes at /minimart
// Full paths (relative to /api/v1 mount point):
//   GET    /api/v1/minimart/products
//   POST   /api/v1/minimart/products
//   PUT    /api/v1/minimart/products/:id
//   DELETE /api/v1/minimart/products/:id
//   PATCH  /api/v1/minimart/inventory/stock-in/:id
//   PATCH  /api/v1/minimart/inventory/stock-out/:id
//   GET    /api/v1/minimart/inventory/low-stock
//   POST   /api/v1/minimart/pos/checkout
//   GET    /api/v1/minimart/sales
//   GET    /api/v1/minimart/sales/daily
//   GET    /api/v1/minimart/sales/weekly
//   GET    /api/v1/minimart/sales/monthly
router.use('/minimart', minimartRoutes);

// Mount laundry routes at /laundry
router.use('/laundry/customers', laundryCustomers);
router.use('/laundry/orders', laundryOrders);
router.use('/laundry/payments', laundryPayments);
router.use('/laundry/notifications', laundryNotifications);
router.use('/laundry/students', laundryStudents);
router.use('/laundry/reports', laundryReports);

// Water refilling routes
const waterUsers = require('./water/users');
const waterProducts = require('./water/products');
const waterOrders = require('./water/orders');

router.use('/water/users', waterUsers);
router.use('/water/products', waterProducts);
router.use('/water/orders', waterOrders);

// Dormitory routes
router.use('/dormitory', dormitoryRoutes);

module.exports = router;
