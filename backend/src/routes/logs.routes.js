'use strict';

/**
 * Transaction Logs Route
 *
 * GET /api/v1/logs
 *
 * Merges two data sources into a single time-sorted feed:
 *
 *   1. TransactionLog collection — persistent audit entries written by auditLog()
 *      for every create / update / delete across all systems (users, orders,
 *      products, reservations, complaints, etc.)
 *
 *   2. Live sub-system queries — reads directly from each sub-system DB for
 *      transactional records (sales, laundry orders/payments, dormitory
 *      reservations, water orders, complaints) to catch any records that
 *      pre-date the audit log or were created outside this dashboard.
 *
 * Normalised entry shape:
 * {
 *   id:          string
 *   system:      'auth' | 'users' | 'minimart' | 'laundry' | 'dormitory' | 'water' | 'complaint'
 *   type:        string   — e.g. 'Sale', 'Order', 'User', 'Student', 'Reservation', …
 *   action:      string   — 'created' | 'updated' | 'deleted' | 'login' | 'logout' | 'payment' | 'status_change'
 *   amount:      number | null
 *   description: string
 *   status:      string | null
 *   timestamp:   Date
 *   meta:        object
 * }
 *
 * Query params:
 *   system   — filter by system name (default: 'all')
 *   from     — ISO date string, lower bound on timestamp
 *   to       — ISO date string, upper bound on timestamp
 *   limit    — max rows returned (default 200, max 500)
 */

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// ── Audit log model (main connection) ────────────────────────────────────────
const TransactionLog = require('../models/TransactionLog');

// ── Sub-system model imports ─────────────────────────────────────────────────
const { getModel: getMinimartSale } = require('../models/minimart/Sale');
const { getModel: getLaundryOrder } = require('../models/laundry/Order');
const { getModel: getLaundryPayment } = require('../models/laundry/Payment');
const { getModel: getLaundryCustomer } = require('../models/laundry/Customer');
const { getReservationModel } = require('../models/dormitory/Reservation');
const { getRoomModel } = require('../models/dormitory/Room');
const { getModel: getWaterOrder } = require('../models/water/Order');
const { getFeedbackModel } = require('../models/complaint/Feedback');

const router = Router();

router.use(authenticate, authorize('admin', 'staff'));

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const system = req.query.system || 'all';
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    // ── Shared date filter helper ─────────────────────────────────────────
    function dateFilter(field) {
      if (!from && !to) return {};
      const f = {};
      if (from) f[field] = { ...(f[field] || {}), $gte: from };
      if (to) f[field] = { ...(f[field] || {}), $lte: to };
      return f;
    }

    // ─────────────────────────────────────────────────────────────────────
    // SOURCE 1: TransactionLog (audit entries — users, products, etc.)
    // These cover every create/update/delete written by auditLog()
    // ─────────────────────────────────────────────────────────────────────
    const auditFetcher = (async () => {
      try {
        const filter = {};
        if (system !== 'all') filter.system = system;
        if (from || to) {
          filter.createdAt = {};
          if (from) filter.createdAt.$gte = from;
          if (to) filter.createdAt.$lte = to;
        }

        const logs = await TransactionLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

        return logs.map((l) => ({
          id: String(l._id),
          system: l.system,
          type: l.entity,
          action: l.action,
          amount: l.amount ?? null,
          description: l.description,
          status: l.status ?? null,
          timestamp: l.createdAt,
          meta: {
            ...l.meta,
            actor: l.actor?.id ? `${l.actor.role} (${l.actor.id})` : 'system',
          },
        }));
      } catch {
        return [];
      }
    })();

    // ─────────────────────────────────────────────────────────────────────
    // SOURCE 2: Live sub-system queries (transactional records)
    // ─────────────────────────────────────────────────────────────────────
    const fetchers = [auditFetcher];

    // ── Minimart Sales ────────────────────────────────────────────────────
    if (system === 'all' || system === 'minimart') {
      fetchers.push(
        (async () => {
          try {
            const Sale = await getMinimartSale();
            const sales = await Sale.find(dateFilter('createdAt'))
              .sort({ createdAt: -1 })
              .limit(limit)
              .lean();
            return sales.map((s) => ({
              id: String(s._id),
              system: 'minimart',
              type: 'Sale',
              action: 'payment',
              amount: s.total ?? null,
              description: `POS sale — ${Array.isArray(s.items) ? s.items.length : 0} item(s)`,
              status: 'completed',
              timestamp: s.createdAt,
              meta: {
                itemCount: Array.isArray(s.items) ? s.items.length : 0,
                items: Array.isArray(s.items)
                  ? s.items.map((i) => `${i.name || i.productId} ×${i.quantity}`).join(', ')
                  : '',
              },
            }));
          } catch {
            return [];
          }
        })(),
      );
    }

    // ── Laundry Orders ────────────────────────────────────────────────────
    if (system === 'all' || system === 'laundry') {
      fetchers.push(
        (async () => {
          try {
            const Order = await getLaundryOrder();
            const Customer = await getLaundryCustomer();
            const orders = await Order.find(dateFilter('createdAt'))
              .sort({ createdAt: -1 })
              .limit(limit)
              .lean();

            const custIds = [...new Set(orders.map((o) => String(o.customer)))];
            const custs = await Customer.find({ _id: { $in: custIds } }).lean();
            const custMap = {};
            custs.forEach((c) => {
              custMap[String(c._id)] = c.name;
            });

            return orders.map((o) => ({
              id: String(o._id),
              system: 'laundry',
              type: 'Order',
              action: 'created',
              amount: o.price ?? null,
              description: `${custMap[String(o.customer)] || 'Customer'} — ${o.service_type?.replace(/_/g, ' ')} ${o.weight}kg`,
              status: o.status,
              timestamp: o.createdAt,
              meta: {
                customer: custMap[String(o.customer)] || '—',
                service_type: o.service_type,
                weight: o.weight,
                payment_status: o.payment_status,
              },
            }));
          } catch {
            return [];
          }
        })(),
      );

      // ── Laundry Payments ───────────────────────────────────────────────
      fetchers.push(
        (async () => {
          try {
            const Payment = await getLaundryPayment();
            const Order = await getLaundryOrder();
            const payments = await Payment.find(dateFilter('createdAt'))
              .sort({ createdAt: -1 })
              .limit(limit)
              .lean();

            const orderIds = [...new Set(payments.map((p) => String(p.order)))];
            const orders = await Order.find({ _id: { $in: orderIds } }).lean();
            const orderMap = {};
            orders.forEach((o) => {
              orderMap[String(o._id)] = o;
            });

            return payments.map((p) => {
              const o = orderMap[String(p.order)];
              return {
                id: String(p._id),
                system: 'laundry',
                type: 'Payment',
                action: 'payment',
                amount: p.amount ?? null,
                description: `Payment confirmed — ${p.method?.toUpperCase()} for order #${String(p.order).slice(-5)}`,
                status: 'paid',
                timestamp: p.createdAt,
                meta: {
                  method: p.method,
                  order_id: String(p.order),
                  service_type: o?.service_type,
                },
              };
            });
          } catch {
            return [];
          }
        })(),
      );
    }

    // ── Dormitory Reservations ────────────────────────────────────────────
    if (system === 'all' || system === 'dormitory') {
      fetchers.push(
        (async () => {
          try {
            const Reservation = await getReservationModel();
            const Room = await getRoomModel();
            const reservations = await Reservation.find(dateFilter('createdAt'))
              .sort({ createdAt: -1 })
              .limit(limit)
              .lean();

            const roomIds = [...new Set(reservations.map((r) => String(r.room)))];
            const rooms = await Room.find({ _id: { $in: roomIds } }).lean();
            const roomMap = {};
            rooms.forEach((rm) => {
              roomMap[String(rm._id)] = rm.roomNumber;
            });

            return reservations.map((r) => ({
              id: String(r._id),
              system: 'dormitory',
              type: 'Reservation',
              action: 'created',
              amount: r.totalPrice ?? null,
              description: `Room ${roomMap[String(r.room)] || r.room} — check-in ${r.checkInDate ? new Date(r.checkInDate).toLocaleDateString() : '?'}`,
              status: r.status,
              timestamp: r.createdAt,
              meta: {
                room: roomMap[String(r.room)] || '—',
                checkInDate: r.checkInDate,
                checkOutDate: r.checkOutDate,
                adminNotes: r.adminNotes,
              },
            }));
          } catch {
            return [];
          }
        })(),
      );
    }

    // ── Water Orders ──────────────────────────────────────────────────────
    if (system === 'all' || system === 'water') {
      fetchers.push(
        (async () => {
          try {
            const Order = await getWaterOrder();
            const orders = await Order.find(dateFilter('order_date'))
              .sort({ order_date: -1 })
              .limit(limit)
              .lean();
            return orders.map((o) => ({
              id: String(o._id),
              system: 'water',
              type: 'Order',
              action: 'created',
              amount: o.total_amount ?? null,
              description: `${o.customer_name || 'Customer'} — ${Array.isArray(o.items) ? o.items.map((i) => `${i.quantity}× ${i.product_name}`).join(', ') : ''}`,
              status: o.status,
              timestamp: o.order_date,
              meta: {
                customer_name: o.customer_name,
                item_count: Array.isArray(o.items) ? o.items.length : 0,
                delivery_date: o.delivery_date,
              },
            }));
          } catch {
            return [];
          }
        })(),
      );
    }

    // ── Complaints ────────────────────────────────────────────────────────
    if (system === 'all' || system === 'complaint') {
      fetchers.push(
        (async () => {
          try {
            const Feedback = await getFeedbackModel();
            const complaints = await Feedback.find(dateFilter('createdAt'))
              .sort({ createdAt: -1 })
              .limit(limit)
              .lean();
            return complaints.map((c) => ({
              id: String(c._id),
              system: 'complaint',
              type: 'Complaint',
              action: 'created',
              amount: null,
              description: `${c.anonymous ? 'Anonymous' : 'User'} — ${c.complaint_type} — ${String(c.message).slice(0, 80)}${c.message?.length > 80 ? '…' : ''}`,
              status: c.status,
              timestamp: c.createdAt,
              meta: {
                complaint_type: c.complaint_type,
                reference: c.referenceNumber,
                anonymous: c.anonymous,
                action_taken: c.action_taken,
              },
            }));
          } catch {
            return [];
          }
        })(),
      );
    }

    // ── Merge, deduplicate, sort, limit ───────────────────────────────────
    const arrays = await Promise.all(fetchers);
    const flat = arrays.flat();

    // Deduplicate: for records that exist in BOTH the audit log and a live
    // sub-system query (e.g. a laundry order that was also logged via auditLog),
    // keep only the audit log version (richer, has actor info). We identify
    // duplicates by matching entityId in audit entries against id in live entries.
    const auditEntityIds = new Set(
      flat
        .filter((e) => e.meta?.actor) // audit log entries have an actor field
        .map((e) => e.id),
    );

    // For live sub-system entries, drop those whose id appears in auditEntityIds
    // to avoid double-counting the same operation.
    const deduped = flat.filter((e) => {
      // Keep all audit log entries
      if (e.meta?.actor !== undefined) return true;
      // Keep live entries only if not already in audit log
      return !auditEntityIds.has(e.id);
    });

    const result = deduped
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({ success: true, data: result, total: result.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
