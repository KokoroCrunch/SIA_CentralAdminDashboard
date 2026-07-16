import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Alert,
  Skeleton,
  Stack,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Collapse,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import api from './api';
import StatusChip from './WaterStatusChip';
import { palette } from './palette';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const STATUSES = ['Pending', 'Processing', 'Out for Delivery', 'Delivered'];

const STATUS_STEPS = {
  Pending: 0,
  Processing: 1,
  'Out for Delivery': 2,
  Delivered: 3,
};

function StepBar({ status }) {
  const current = STATUS_STEPS[status] ?? 0;
  const colors = {
    0: palette.amber,
    1: palette.teal,
    2: palette.orange,
    3: palette.moss,
  };
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 220 }}>
      {STATUSES.map((s, i) => (
        <Box
          key={s}
          sx={{ display: 'flex', alignItems: 'center', flex: i < STATUSES.length - 1 ? 1 : 'none' }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: i <= current ? colors[current] : 'rgba(0,0,0,0.12)',
              border: `2px solid ${i <= current ? colors[current] : 'rgba(0,0,0,0.12)'}`,
            }}
          />
          {i < STATUSES.length - 1 && (
            <Box
              sx={{
                flex: 1,
                height: 2,
                backgroundColor: i < current ? colors[current] : 'rgba(0,0,0,0.1)',
                mx: 0.25,
              }}
            />
          )}
        </Box>
      ))}
    </Stack>
  );
}

function OrderRow({ order, onEdit }) {
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
        <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          #{order._id}
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{order.customer_name}</TableCell>
        <TableCell>
          <StepBar status={order.status} />
        </TableCell>
        <TableCell>
          <StatusChip status={order.status} />
        </TableCell>
        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          ₱{Number(order.total_amount).toFixed(2)}
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>
          {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>
          {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '—'}
        </TableCell>
        <TableCell align="right">
          <IconButton size="small" onClick={() => onEdit(order)}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
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
              <Stack spacing={0.5} mt={0.75}>
                {order.items.map((item, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ maxWidth: 440 }}
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

export default function WaterDelivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', notes: '', delivery_date: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load orders.");
    } finally {
      setLoading(false);
    }
  }

  useAutoRefresh(load);

  function openEdit(order) {
    setEditTarget(order);
    setEditForm({
      status: order.status,
      notes: order.notes || '',
      delivery_date: order.delivery_date
        ? new Date(order.delivery_date).toISOString().slice(0, 10)
        : '',
    });
    setEditError('');
  }

  async function handleSave() {
    setSaving(true);
    setEditError('');
    try {
      await api.put(`/orders/${editTarget._id}`, {
        status: editForm.status,
        notes: editForm.notes,
        delivery_date: editForm.delivery_date || null,
      });
      setEditTarget(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    filterStatus === 'All' ? orders : orders.filter((o) => o.status === filterStatus);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5">Delivery Tracking</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Monitor and update all order deliveries
          </Typography>
        </Box>
      </Stack>

      {/* Summary chips */}
      <Stack direction="row" spacing={1} mb={2.5} flexWrap="wrap">
        {[
          { label: 'All', value: orders.length },
          ...STATUSES.map((s) => ({ label: s, value: counts[s] })),
        ].map(({ label, value }) => (
          <Chip
            key={label}
            label={`${label} (${value})`}
            onClick={() => setFilterStatus(label)}
            variant={filterStatus === label ? 'filled' : 'outlined'}
            sx={{
              fontWeight: filterStatus === label ? 700 : 500,
              backgroundColor: filterStatus === label ? palette.teal : undefined,
              color: filterStatus === label ? '#fff' : undefined,
              borderColor: filterStatus === label ? palette.teal : undefined,
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(11,31,42,0.02)' }}>
              <TableCell sx={{ width: 40 }} />
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Delivery Date</TableCell>
              <TableCell align="right">Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(9)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <LocalShippingOutlinedIcon sx={{ color: palette.slate, fontSize: 32 }} />
                    <Typography color="text.secondary">No orders found.</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filtered.map((order) => <OrderRow key={order._id} order={order} onEdit={openEdit} />)}
          </TableBody>
        </Table>
      </Paper>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Order #{editTarget?._id}</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Stack spacing={2.5}>
            {editError && <Alert severity="error">{editError}</Alert>}

            <TextField
              label="Status"
              select
              fullWidth
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Delivery Date"
              type="date"
              fullWidth
              value={editForm.delivery_date}
              onChange={(e) => setEditForm({ ...editForm, delivery_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="e.g. Driver: Juan, Contact: 09171234567"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
