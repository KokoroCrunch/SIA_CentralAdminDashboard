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
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import api from '../api/client';
import StatusChip from '../components/StatusChip';
import { useAuth } from '../context/AuthContext';
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

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? (
              <KeyboardArrowDownIcon fontSize="small" />
            ) : (
              <KeyboardArrowRightIcon fontSize="small" />
            )}
          </IconButton>
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>#{order._id}</TableCell>
        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          ₱{Number(order.total_amount).toFixed(2)}
        </TableCell>
        <TableCell>
          <StatusChip status={order.status} />
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>
          {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
        </TableCell>
      </TableRow>

      {/* Expandable items */}
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, pl: 6 }}>
              {order.notes && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
                >
                  Note: {order.notes}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}
              >
                Items
              </Typography>
              <Stack spacing={0.75} mt={1}>
                {order.items.map((item, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ maxWidth: 420 }}
                  >
                    <Typography variant="body2">
                      {item.quantity} × {item.product_name || `Product #${item.product_id}`}
                    </Typography>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      ₱{Number((item.unit_price || 0) * item.quantity).toFixed(2)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [oRes, pRes] = await Promise.all([
          api.get(`/orders?customer_id=${user._id}`),
          api.get('/products'),
        ]);
        setOrders(oRes.data);
        setProducts(pRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load your data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user._id]);

  const totalSpent = orders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const activeOrders = orders.filter((o) => o.status !== 'Delivered').length;

  return (
    <Box>
      {/* Greeting */}
      <Box mb={3}>
        <Typography variant="h5">Hello, {user?.name?.split(' ')[0]} 👋</Typography>
        <Typography variant="body2" color="text.secondary">
          Here's a summary of your orders and available products.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stat cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<ReceiptLongOutlinedIcon />}
            label="Total Orders"
            value={orders.length}
            color={palette.teal}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<WaterDropOutlinedIcon />}
            label="Active Orders"
            value={activeOrders}
            color={palette.amber}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<Inventory2OutlinedIcon />}
            label="Total Spent"
            value={`₱${totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            color={palette.moss}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* My Orders */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                My Orders
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All your orders and their current status
              </Typography>
            </Box>
            <Divider />
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(11,31,42,0.02)' }}>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell>Order ID</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading &&
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!loading && orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Stack alignItems="center" spacing={1}>
                        <ReceiptLongOutlinedIcon sx={{ color: palette.slate, fontSize: 32 }} />
                        <Typography variant="body2" color="text.secondary">
                          You haven't placed any orders yet.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && orders.map((o) => <OrderRow key={o._id} order={o} />)}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Available Products */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Available Products
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Products currently in stock
              </Typography>
            </Box>
            <Divider />
            {loading ? (
              <Box sx={{ px: 2.5, py: 2 }}>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} sx={{ mb: 1 }} height={40} />
                ))}
              </Box>
            ) : products.filter((p) => p.stock > 0).length === 0 ? (
              <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No products available right now.
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(11,31,42,0.02)' }}>
                    <TableCell>Product</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products
                    .filter((p) => p.stock > 0)
                    .map((p) => (
                      <TableRow key={p._id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{p.product_name}</TableCell>
                        <TableCell>
                          <Chip label={p.container_type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          ₱{Number(p.price).toFixed(2)}
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
