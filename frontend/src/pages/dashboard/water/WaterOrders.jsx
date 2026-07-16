import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Skeleton,
  Stack,
  Collapse,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import api from './api';
import ConfirmDialog from './WaterConfirmDialog';
import StatusChip from './WaterStatusChip';
import { palette } from './palette';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const STATUSES = ['Pending', 'Processing', 'Out for Delivery', 'Delivered'];

function emptyForm() {
  return {
    customer_id: '',
    status: 'Pending',
    notes: '',
    items: [{ product_id: '', quantity: 1 }],
  };
}

function OrderRow({ order, onEditStatus, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
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
        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          ₱{Number(order.total_amount).toFixed(2)}
        </TableCell>
        <TableCell>
          <TextField
            select
            size="small"
            value={order.status}
            onChange={(e) => onEditStatus(order, e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                <StatusChip status={s} />
              </MenuItem>
            ))}
          </TextField>
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>
          {order.order_date ? new Date(order.order_date).toLocaleString() : '—'}
        </TableCell>
        <TableCell align="right">
          <IconButton size="small" onClick={() => onDelete(order)}>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expandable line items */}
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
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
                Line items
              </Typography>
              <Stack spacing={0.75} mt={1}>
                {order.items.map((item, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ maxWidth: 480 }}
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

export default function WaterOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [oRes, uRes, pRes] = await Promise.all([
        api.get('/orders'),
        api.get('/users'),
        api.get('/products'),
      ]);
      setOrders(oRes.data);
      // WaterUser schema has no role field — all entries are customers
      setCustomers(uRes.data);
      setProducts(pRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load orders. Is the API server running?");
    } finally {
      setLoading(false);
    }
  }

  useAutoRefresh(load);

  function openCreate() {
    setForm(emptyForm());
    setFormError('');
    setDialogOpen(true);
  }

  function updateItem(idx, field, value) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  }

  function addItemRow() {
    setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1 }] });
  }

  function removeItemRow(idx) {
    const items = form.items.filter((_, i) => i !== idx);
    setForm({ ...form, items: items.length ? items : [{ product_id: '', quantity: 1 }] });
  }

  const formTotal = form.items.reduce((sum, item) => {
    const product = products.find((p) => String(p._id) === String(item.product_id));
    if (!product) return sum;
    return sum + product.price * Number(item.quantity || 0);
  }, 0);

  async function handleCreate() {
    setFormError('');
    const validItems = form.items.filter((i) => i.product_id);
    if (!form.customer_id || validItems.length === 0) {
      setFormError('Select a customer and at least one product.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/orders', {
        customer_id: Number(form.customer_id),
        status: form.status,
        notes: form.notes,
        items: validItems.map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity || 1),
        })),
      });
      setDialogOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(order, status) {
    try {
      await api.put(`/orders/${order._id}`, { status });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status } : o)));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update status.");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/orders/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5">Orders</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Customer orders and delivery status
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ ml: 2, flexShrink: 0 }}
        >
          New order
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(11,31,42,0.02)' }}>
              <TableCell sx={{ width: 40 }} />
              <TableCell>ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && orders.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <ReceiptLongOutlinedIcon sx={{ color: palette.slate, fontSize: 32 }} />
                    <Typography color="text.secondary">No orders yet.</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              orders.map((order) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  onEditStatus={handleStatusChange}
                  onDelete={setDeleteTarget}
                />
              ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Create order dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New order</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Customer"
              select
              fullWidth
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            >
              {customers.map((c) => (
                <MenuItem key={c._id} value={String(c._id)}>
                  {c.name} ({c.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Status"
              select
              fullWidth
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Notes (optional)"
              fullWidth
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <Divider />
            <Typography variant="subtitle2">Items</Typography>

            {form.items.map((item, idx) => (
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                <TextField
                  select
                  label="Product"
                  fullWidth
                  value={item.product_id}
                  onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                >
                  {products.map((p) => (
                    <MenuItem key={p._id} value={String(p._id)}>
                      {p.product_name} — ₱{Number(p.price).toFixed(2)} (stock: {p.stock})
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Qty"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  sx={{ width: 90 }}
                  inputProps={{ min: 1 }}
                />
                <IconButton onClick={() => removeItemRow(idx)} size="small">
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={addItemRow}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Add item
            </Button>

            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2">Order total</Typography>
              <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                ₱{formTotal.toFixed(2)}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={saving}>
            Create order
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete order?"
        description={`This will permanently remove order #${deleteTarget?._id}. This can't be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </Box>
  );
}
