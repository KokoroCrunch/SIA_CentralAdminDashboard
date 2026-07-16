import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import StatCard from '../components/StatCard';
import StatusChip from '../components/StatusChip';
import api from '../api';

const SERVICE_LABELS = {
  wash_dry: 'Wash+Dry',
  wash_dry_iron: 'Wash+Dry+Iron',
  dry_cleaning: 'Dry Cleaning',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get('/users/dashboard')
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  if (!data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );

  if (user?.role === 'admin') {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
              Admin Dashboard
            </Typography>
            <Typography color="text.secondary">
              Welcome back, <strong>{user.name}</strong> 👋
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/orders"
            variant="contained"
            startIcon={<AddCircleIcon />}
            sx={{ bgcolor: '#0d1b2a', '&:hover': { bgcolor: '#1b2d42' } }}
          >
            New Order
          </Button>
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
          <Box
            sx={{
              px: 2.5,
              py: 1.8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: '#0d1b2a',
              borderRadius: '16px 16px 0 0',
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 700 }}>Recent Orders</Typography>
            <Button
              component={Link}
              to="/orders"
              size="small"
              sx={{ color: '#00c2cb', fontSize: '0.8rem' }}
            >
              View All →
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['#', 'Customer', 'Service', 'Weight', 'Price', 'Status', 'Date'].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6b7c93' }}
                  >
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
            {
              to: '/customers',
              icon: '👤',
              label: 'Add Customer',
              sub: 'Register a new customer',
              color: '#0d1b2a',
            },
            {
              to: '/orders',
              icon: '🧺',
              label: 'New Order',
              sub: 'Add a laundry order',
              color: '#00b37e',
            },
            {
              to: '/payments',
              icon: '💳',
              label: 'Record Payment',
              sub: 'Mark an order as paid',
              color: '#f0a500',
            },
            {
              to: '/reports',
              icon: '📊',
              label: 'View Reports',
              sub: 'Revenue & analytics',
              color: '#ff6b35',
            },
          ].map((q) => (
            <Grid item xs={6} md={3} key={q.to}>
              <Card
                component={Link}
                to={q.to}
                sx={{
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'transform 0.2s,box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
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

  // Customer Dashboard
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
          My Dashboard
        </Typography>
        <Typography color="text.secondary">
          Hello, <strong>{user.name}</strong>! Here's your laundry status 🧺
        </Typography>
      </Box>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <StatCard
            label="Total Orders"
            value={data.myOrders || 0}
            icon={<ShoppingBasketIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#0d1b2a,#1b2d42)"
          />
        </Grid>
        <Grid item xs={4}>
          <StatCard
            label="In Progress"
            value={data.myPending || 0}
            icon={<HourglassEmptyIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#f0a500,#e09000)"
          />
        </Grid>
        <Grid item xs={4}>
          <StatCard
            label="Completed"
            value={data.myCompleted || 0}
            icon={<CheckCircleIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#00b37e,#00966a)"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card
            component={Link}
            to="/my-orders"
            sx={{
              textDecoration: 'none',
              border: '2px solid #00c2cb',
              bgcolor: 'rgba(0,194,203,0.04)',
              display: 'block',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TrackChangesIcon sx={{ fontSize: 40, color: '#00c2cb' }} />
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mt: 1, fontFamily: 'Syne, sans-serif' }}
              >
                Track My Orders
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Check laundry status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card component={Link} to="/my-profile" sx={{ textDecoration: 'none', display: 'block' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PeopleIcon sx={{ fontSize: 40, color: '#0d1b2a' }} />
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mt: 1, fontFamily: 'Syne, sans-serif' }}
              >
                My Profile
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Update your info
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {data.recentOrders?.length > 0 && (
        <Card>
          <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#0d1b2a', borderRadius: '16px 16px 0 0' }}>
            <Typography sx={{ color: 'white', fontWeight: 700 }}>My Recent Orders</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['#', 'Service', 'Weight', 'Price', 'Status', 'Date'].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6b7c93' }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentOrders.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell>
                    <strong>#{o._id.slice(-5)}</strong>
                  </TableCell>
                  <TableCell>{SERVICE_LABELS[o.service_type] || o.service_type}</TableCell>
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
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
