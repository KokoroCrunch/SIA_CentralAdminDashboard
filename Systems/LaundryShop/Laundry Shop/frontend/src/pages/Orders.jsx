import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusChip from '../components/StatusChip';
import api from '../api';

const SERVICES = [
  { value: 'wash_dry', label: 'Wash + Dry', rate: 35 },
  { value: 'wash_dry_iron', label: 'Wash + Dry + Iron', rate: 50 },
  { value: 'dry_cleaning', label: 'Dry Cleaning', rate: 80 },
];
const STATUSES = ['Pending', 'Washing', 'Drying', 'Ready for Pickup', 'Completed', 'Cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [editOrder, setEditOrder] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    customer: '',
    weight: '',
    service_type: 'wash_dry',
    status: 'Pending',
    notes: '',
  });
  const price = form.weight
    ? (
        parseFloat(form.weight) * (SERVICES.find((s) => s.value === form.service_type)?.rate || 35)
      ).toFixed(2)
    : '';

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, cRes] = await Promise.all([
        api.get('/orders', { params: filterStatus ? { status: filterStatus } : {} }),
        api.get('/customers'),
      ]);
      setOrders(oRes.data);
      setCustomers(cRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  const handleAdd = async () => {
    try {
      await api.post('/orders', { ...form, price });
      setMsg('Order added!');
      setAddOpen(false);
      setForm({ customer: '', weight: '', service_type: 'wash_dry', status: 'Pending', notes: '' });
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await api.put('/orders/' + editOrder._id, { status: editOrder.status });
      setMsg('Status updated!');
      setEditOrder(null);
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    await api.delete('/orders/' + id);
    setMsg('Order deleted.');
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
            Orders
          </Typography>
          <Typography color="text.secondary">Manage all laundry orders</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
          sx={{ bgcolor: '#00b37e', '&:hover': { bgcolor: '#00966a' } }}
        >
          New Order
        </Button>
      </Box>
      {msg && (
        <Alert severity="success" onClose={() => setMsg('')} sx={{ mb: 2, borderRadius: 2 }}>
          {msg}
        </Alert>
      )}

      {/* Filter bar */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {['', 'Pending', 'Washing', 'Drying', 'Ready for Pickup', 'Completed', 'Cancelled'].map(
          (s) => (
            <Chip
              key={s || 'all'}
              label={s || 'All'}
              onClick={() => setFilterStatus(s)}
              variant={filterStatus === s ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700,
                bgcolor: filterStatus === s ? '#0d1b2a' : '',
                color: filterStatus === s ? 'white' : '',
                borderColor: '#cdd5e0',
                cursor: 'pointer',
              }}
            />
          ),
        )}
      </Stack>

      <Card>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#0d1b2a', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>
            Orders ({loading ? '...' : orders.length})
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {[
                    '#',
                    'Customer',
                    'Service',
                    'Weight',
                    'Price',
                    'Status',
                    'Payment',
                    'Date',
                    'Actions',
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: '#6b7c93',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
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
                        {SERVICES.find((s) => s.value === o.service_type)?.label || o.service_type}
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
                      <Chip
                        label={
                          o.payment_status === 'paid'
                            ? 'Paid'
                            : o.payment_status === 'pending_verification'
                              ? 'Verifying'
                              : 'Unpaid'
                        }
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          bgcolor:
                            o.payment_status === 'paid'
                              ? '#e8f5e9'
                              : o.payment_status === 'pending_verification'
                                ? '#fff8e1'
                                : '#fdecea',
                          color:
                            o.payment_status === 'paid'
                              ? '#00b37e'
                              : o.payment_status === 'pending_verification'
                                ? '#f0a500'
                                : '#e53935',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Update Status">
                        <IconButton
                          size="small"
                          onClick={() => setEditOrder({ ...o })}
                          sx={{ color: '#0d1b2a', mr: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(o._id)}
                          sx={{ color: '#e53935' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!orders.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Add Order Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
          Add New Order
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={form.customer}
                label="Customer"
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
              >
                {customers.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name} — {c.contact}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Service Type</InputLabel>
              <Select
                value={form.service_type}
                label="Service Type"
                onChange={(e) => setForm({ ...form, service_type: e.target.value })}
              >
                {SERVICES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label} (₱{s.rate}/kg)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Weight (kg)"
              type="number"
              inputProps={{ step: 0.1, min: 0.1 }}
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
            <TextField
              fullWidth
              label="Estimated Price"
              value={price ? '₱' + price : ''}
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input': { fontWeight: 700, color: '#00b37e' } }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                label="Status"
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.slice(0, -1).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!form.customer || !form.weight}
            sx={{ bgcolor: '#00b37e', '&:hover': { bgcolor: '#00966a' } }}
          >
            Add Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={!!editOrder} onClose={() => setEditOrder(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
          Update Order Status
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editOrder && (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Box sx={{ bgcolor: '#f0f4f8', borderRadius: 2, p: 2, fontSize: '0.9rem' }}>
                Order #{editOrder._id.slice(-5)} &bull; {editOrder.weight} kg &bull;{' '}
                <strong>₱{Number(editOrder.price).toFixed(2)}</strong>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editOrder.status}
                  label="Status"
                  onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditOrder(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdate}
            sx={{ bgcolor: '#0d1b2a', '&:hover': { bgcolor: '#1b2d42' } }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
