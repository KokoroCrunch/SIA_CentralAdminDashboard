import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import StatCard from './StatCard';
import StatusChip from './StatusChip';
import api from './api';

const SERVICE_LABELS = {
  wash_dry: 'Wash+Dry',
  wash_dry_iron: 'Wash+Dry+Iron',
  dry_cleaning: 'Dry Cleaning',
};

export default function LaundryDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [rRes, oRes] = await Promise.all([api.get('/reports'), api.get('/orders')]);
        const r = rRes.data;
        setData({
          totalCustomers: r.total_customers || 0,
          totalOrders: r.total_orders || 0,
          totalRevenue: r.total_revenue || 0,
          pendingOrders:
            (r.total_orders || 0) - (r.completed_orders || 0) - (r.cancelled_orders || 0),
          recentOrders: oRes.data.slice(0, 8),
        });
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load dashboard data');
      }
    }
    load();
  }, []);

  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  if (!data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
          Admin Dashboard
        </Typography>
        <Typography color="text.secondary">
          Welcome back, <strong>Admin</strong> 👋
        </Typography>
      </Box>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Customers"
            value={data.totalCustomers}
            icon={<PeopleIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#0d1b2a,#1b2d42)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Total Orders"
            value={data.totalOrders}
            icon={<ShoppingBasketIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#00b37e,#00966a)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Revenue"
            value={'₱' + Number(data.totalRevenue || 0).toLocaleString()}
            icon={<AttachMoneyIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#f0a500,#e09000)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Active Orders"
            value={data.pendingOrders}
            icon={<HourglassEmptyIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#ff6b35,#e05520)"
          />
        </Grid>
      </Grid>
      <Card>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#0d1b2a', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>Recent Orders</Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              {['#', 'Customer', 'Service', 'Weight', 'Price', 'Status', 'Date'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6b7c93' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.recentOrders || []).map((o) => (
              <TableRow key={o._id} hover>
                <TableCell>
                  <strong>#{o._id.slice(-5)}</strong>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {o.customer?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {o.customer?.contact}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {SERVICE_LABELS[o.service_type] || o.service_type}
                  </Typography>
                </TableCell>
                <TableCell>{o.weight} kg</TableCell>
                <TableCell>
                  <strong>₱{Number(o.price).toFixed(2)}</strong>
                </TableCell>
                <TableCell>
                  <StatusChip status={o.status} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {!data.recentOrders?.length && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        {[
          { icon: '👤', label: 'Customers', sub: 'View customer records', color: '#0d1b2a' },
          { icon: '🧺', label: 'Orders', sub: 'Manage laundry orders', color: '#00b37e' },
          { icon: '💳', label: 'Payments', sub: 'Confirm payments', color: '#f0a500' },
          { icon: '📊', label: 'Reports', sub: 'Revenue & analytics', color: '#ff6b35' },
        ].map((q) => (
          <Grid item xs={6} md={3} key={q.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Typography fontSize={32}>{q.icon}</Typography>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ mt: 1, color: '#1e2d3d', fontFamily: 'Syne, sans-serif' }}
                >
                  {q.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {q.sub}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
