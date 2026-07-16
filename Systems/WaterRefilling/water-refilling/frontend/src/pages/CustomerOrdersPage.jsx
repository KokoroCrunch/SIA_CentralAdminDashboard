import { useEffect, useState } from 'react';
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
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusChip from '../components/StatusChip';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/theme';

function OrderRow({ order, onDelete }) {
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
        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          ₱{Number(order.total_amount).toFixed(2)}
        </TableCell>
        <TableCell>
          <StatusChip status={order.status} />
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>
          {order.order_date ? new Date(order.order_date).toLocaleString() : '—'}
        </TableCell>
        <TableCell align="right">
          {/* Only allow cancel if still Pending */}
          {order.status === 'Pending' && (
            <IconButton size="small" onClick={() => onDelete(order)}>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
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
              {order.delivery_date && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
                >
                  Expected delivery:{' '}
                  {new Date(order.delivery_date).toLocaleDateString('en-PH', {
                    dateStyle: 'medium',
                  })}
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

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      setError(err.response?.data?.message || "Couldn't load your orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user._id]);

  function openCreate() {
    setItems([{ product_id: '', quantity: 1 }]);
    setNotes('');
    setFormError('');
    setDialogOpen(true);
  }

  function updateItem(idx, field, value) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  }

  function addItemRow() {
    setItems([...items, { product_id: '', quantity: 1 }]);
  }

  function removeItemRow(idx) {
    const next = items.filter((_, i) => i !== idx);
    setItems(next.length ? next : [{ product_id: '', quantity: 1 }]);
  }

  const formTotal = items.reduce((sum, item) => {
    const product = products.find((p) => p._id === Number(item.product_id));
    if (!product) return sum;
    return sum + product.price * Number(item.quantity || 0);
  }, 0);

  async function handlePlace() {
    setFormError('');
    const valid = items.filter((i) => i.product_id);
    if (valid.length === 0) {
      setFormError('Please select at least one product.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/orders', {
        customer_id: Number(user._id),
        status: 'Pending',
        notes,
        items: valid.map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity || 1),
        })),
      });
      setDialogOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    setDeleting(true);
    try {
      await api.delete(`/orders/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel order.');
    } finally {
      setDeleting(false);
    }
  }

  const activeCount = orders.filter((o) => o.status !== 'Delivered').length;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5">My Orders</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {activeCount > 0
              ? `${activeCount} active order${activeCount > 1 ? 's' : ''}`
              : 'All your orders'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ ml: 2, flexShrink: 0 }}
        >
          Place order
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
              <TableCell>Order ID</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && orders.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 7 }}>
                  <Stack alignItems="center" spacing={1.5}>
                    <ReceiptLongOutlinedIcon sx={{ color: palette.slate, fontSize: 36 }} />
                    <Box textAlign="center">
                      <Typography color="text.secondary">
                        You haven't placed any orders yet.
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click "Place order" to get started.
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              orders.map((order) => (
                <OrderRow key={order._id} order={order} onDelete={setDeleteTarget} />
              ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Place order dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Place an Order</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Typography variant="subtitle2">Select Products</Typography>

            {items.map((item, idx) => (
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                <TextField
                  select
                  label="Product"
                  fullWidth
                  value={item.product_id}
                  onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                >
                  {products
                    .filter((p) => p.stock > 0)
                    .map((p) => (
                      <MenuItem key={p._id} value={p._id}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          width="100%"
                          spacing={2}
                        >
                          <span>{p.product_name}</span>
                          <span style={{ color: palette.slate, fontSize: '0.85em' }}>
                            ₱{Number(p.price).toFixed(2)} · {p.stock} left
                          </span>
                        </Stack>
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
                <IconButton
                  onClick={() => removeItemRow(idx)}
                  size="small"
                  disabled={items.length === 1}
                >
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
              Add another item
            </Button>

            <Divider />

            <TextField
              label="Delivery Notes (optional)"
              fullWidth
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave at the gate, Call before delivery"
            />

            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Order Total</Typography>
              <Typography
                variant="h6"
                sx={{ fontVariantNumeric: 'tabular-nums', color: palette.teal }}
              >
                ₱{formTotal.toFixed(2)}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handlePlace} variant="contained" disabled={saving}>
            {saving ? 'Placing…' : 'Place order'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Cancel order?"
        description={`Cancel order #${deleteTarget?._id}? This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleCancel}
        loading={deleting}
      />
    </Box>
  );
}
