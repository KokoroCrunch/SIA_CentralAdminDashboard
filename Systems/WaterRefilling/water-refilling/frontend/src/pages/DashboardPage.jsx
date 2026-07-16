import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Alert,
  Skeleton,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import api from '../api/client';
import StatusChip from '../components/StatusChip';
import { palette } from '../theme/theme';

function StatCard({ icon, label, value, color, loading }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, p: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}
          >
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={32} />
          ) : (
            <Typography variant="h5">{value}</Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [oRes, pRes, cRes] = await Promise.all([
          api.get('/orders'),
          api.get('/products'),
          api.get('/users'),
        ]);
        setOrders(oRes.data);
        setProducts(pRes.data);
        setCustomers(cRes.data.filter((u) => u.role === 'customer'));
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const lowStock = products.filter((p) => p.stock <= 5);
  const recentOrders = [...orders].slice(0, 8);

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of your water refilling station
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stat cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ReceiptLongOutlinedIcon />}
            label="Total Orders"
            value={orders.length}
            color={palette.teal}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Inventory2OutlinedIcon />}
            label="Products"
            value={products.length}
            color={palette.aqua}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PeopleAltOutlinedIcon />}
            label="Customers"
            value={customers.length}
            color={palette.amber}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AttachMoneyIcon />}
            label="Revenue"
            value={`₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            color={palette.moss}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Recent orders */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Recent Orders
              </Typography>
            </Box>
            <Divider />
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(11,31,42,0.02)' }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!loading && recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  recentOrders.map((o) => (
                    <TableRow key={o._id} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>#{o._id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{o.customer_name}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        ₱{Number(o.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={o.status} />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {o.order_date ? new Date(o.order_date).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Low stock alert */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden', height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Low Stock
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Products with 5 or fewer units
              </Typography>
            </Box>
            <Divider />
            {loading ? (
              <Box sx={{ px: 2.5, py: 2 }}>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : lowStock.length === 0 ? (
              <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  All products are well-stocked.
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(11,31,42,0.02)' }}>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStock.map((p) => (
                    <TableRow key={p._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{p.product_name}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: p.stock === 0 ? palette.coral : palette.amber,
                          }}
                        >
                          {p.stock}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
