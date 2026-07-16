import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../api';

const SERVICE_LABELS = {
  wash_dry: 'Wash+Dry',
  wash_dry_iron: 'Wash+Dry+Iron',
  dry_cleaning: 'Dry Cleaning',
};

export default function Payments() {
  const [pending, setPending] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [confirmForm, setConfirmForm] = useState({ amount: '', method: 'cash' });
  const [receipt, setReceipt] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, pyRes, nRes] = await Promise.all([
        api.get('/payments/pending'),
        api.get('/payments'),
        api.get('/notifications'),
      ]);
      setPending(pRes.data);
      setPayments(pyRes.data);
      setNotifs(nRes.data.notifications);
      setUnread(nRes.data.unread);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openConfirm = (o) => {
    setConfirmOrder(o);
    setConfirmForm({ amount: o.price, method: o.payment_method || 'cash' });
  };

  const handleConfirm = async () => {
    try {
      const r = await api.post('/payments/confirm', {
        order_id: confirmOrder._id,
        amount: confirmForm.amount,
        method: confirmForm.method,
      });
      setMsg('Payment confirmed!');
      setConfirmOrder(null);
      setReceipt(r.data.order);
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error');
    }
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnread(0);
    setNotifs(notifs.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
            Payments
          </Typography>
          <Typography color="text.secondary">Confirm payments & view history</Typography>
        </Box>
        {unread > 0 && (
          <Chip
            label={unread + ' New Notification' + (unread > 1 ? 's' : '')}
            onClick={markAllRead}
            sx={{ bgcolor: '#fff3cd', color: '#856404', fontWeight: 700, cursor: 'pointer' }}
          />
        )}
      </Box>
      {msg && (
        <Alert severity="success" onClose={() => setMsg('')} sx={{ mb: 2, borderRadius: 2 }}>
          {msg}
        </Alert>
      )}

      {/* Notifications */}
      {notifs.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <Box
            sx={{
              px: 2.5,
              py: 1.8,
              display: 'flex',
              justifyContent: 'space-between',
              bgcolor: '#0d1b2a',
              borderRadius: '16px 16px 0 0',
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 700 }}>Notifications</Typography>
            <Button
              size="small"
              onClick={markAllRead}
              sx={{ color: '#00c2cb', fontSize: '0.8rem' }}
            >
              Mark all read
            </Button>
          </Box>
          {notifs.map((n) => (
            <Box
              key={n._id}
              sx={{
                display: 'flex',
                gap: 1.5,
                p: 2,
                borderBottom: '1px solid #e0e8f0',
                bgcolor: n.is_read ? 'white' : '#f0f9ff',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: n.is_read ? '#e0e8f0' : '#00c2cb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {n.type === 'payment' ? '💳' : '📦'}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={n.is_read ? 400 : 600}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(n.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Card>
      )}

      {/* Pending confirmations */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#f0a500', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>
            Pending Confirmations ({loading ? '...' : pending.length})
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : pending.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            ✅ No pending payments to confirm.
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Order #', 'Customer', 'Amount', 'Method', 'GCash Ref', 'Date', 'Action'].map(
                    (h) => (
                      <TableCell
                        key={h}
                        sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6b7c93' }}
                      >
                        {h}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {pending.map((p) => (
                  <TableRow
                    key={p._id}
                    sx={{ bgcolor: p.payment_method === 'gcash' ? '#f0f9ff' : '#fffff0' }}
                    hover
                  >
                    <TableCell>
                      <strong>#{p._id.slice(-5)}</strong>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {p.customer?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.customer?.contact}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#00b37e' }}>₱{Number(p.price).toFixed(2)}</strong>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.payment_method === 'gcash' ? '📱 GCash' : '💵 Cash'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          bgcolor: p.payment_method === 'gcash' ? '#cfe2ff' : '#fff3cd',
                          color: p.payment_method === 'gcash' ? '#084298' : '#856404',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {p.gcash_ref || '—'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => openConfirm(p)}
                        sx={{
                          bgcolor: '#00b37e',
                          '&:hover': { bgcolor: '#00966a' },
                          fontSize: '0.78rem',
                        }}
                      >
                        Confirm
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Payment History */}
      <Card>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#0d1b2a', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>Payment History</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['#', 'Order', 'Customer', 'Amount', 'Method', 'Date Paid'].map((h) => (
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
              {payments.map((p, i) => (
                <TableRow key={p._id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <strong>#{p.order?._id?.slice(-5) || '—'}</strong>
                  </TableCell>
                  <TableCell>{p.order?.customer?.name || '—'}</TableCell>
                  <TableCell>
                    <strong style={{ color: '#00b37e' }}>₱{Number(p.amount).toFixed(2)}</strong>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.method === 'gcash' ? '📱 GCash' : '💵 Cash'}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(p.createdAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {!payments.length && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No payment records yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmOrder} onClose={() => setConfirmOrder(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
          ✅ Confirm Payment
        </DialogTitle>
        <DialogContent>
          {confirmOrder && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Order #{confirmOrder._id.slice(-5)} — {confirmOrder.customer?.name} — ₱
              {Number(confirmOrder.price).toFixed(2)}
            </Typography>
          )}
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              fullWidth
              label="Amount Received (₱)"
              type="number"
              value={confirmForm.amount}
              onChange={(e) => setConfirmForm({ ...confirmForm, amount: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={confirmForm.method}
                label="Payment Method"
                onChange={(e) => setConfirmForm({ ...confirmForm, method: e.target.value })}
              >
                <MenuItem value="cash">💵 Cash</MenuItem>
                <MenuItem value="gcash">📱 GCash</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmOrder(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            sx={{ bgcolor: '#00b37e', '&:hover': { bgcolor: '#00966a' } }}
          >
            Confirm & Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receipt} onClose={() => setReceipt(null)} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={{
            bgcolor: '#0d1b2a',
            color: 'white',
            textAlign: 'center',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
          }}
        >
          🧺 LaundryPro Receipt
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {receipt && (
            <Box>
              <Typography
                align="center"
                variant="h6"
                fontWeight={800}
                sx={{ fontFamily: 'Syne, sans-serif' }}
              >
                RCP-{receipt._id.slice(-5).padStart(5, '0')}
              </Typography>
              <Typography
                align="center"
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 2 }}
              >
                {new Date().toLocaleString()}
              </Typography>
              <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
              {[
                ['Order #', '#' + receipt._id.slice(-5)],
                ['Customer', receipt.customer?.name || '—'],
                ['Service', SERVICE_LABELS[receipt.service_type] || receipt.service_type],
                ['Weight', receipt.weight + ' kg'],
                [
                  'Payment',
                  (receipt.payment_method || '—').charAt(0).toUpperCase() +
                    (receipt.payment_method || '—').slice(1),
                ],
              ].map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {k}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {v}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography fontWeight={700} fontFamily="Syne, sans-serif">
                  TOTAL
                </Typography>
                <Typography variant="h6" fontWeight={800} color="success.main">
                  ₱{Number(receipt.price).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2, textAlign: 'center' }}>
                <Typography fontWeight={700} color="success.main">
                  ✅ Payment Confirmed
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => window.print()} variant="contained" sx={{ bgcolor: '#0d1b2a' }}>
            Print
          </Button>
          <Button onClick={() => setReceipt(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
