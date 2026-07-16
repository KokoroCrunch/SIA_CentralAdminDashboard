import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StatusChip from '../components/StatusChip';
import PaymentChip from '../components/PaymentChip';
import api from '../api';

const SERVICES = {
  wash_dry: 'Wash+Dry',
  wash_dry_iron: 'Wash+Dry+Iron',
  dry_cleaning: 'Dry Cleaning',
};
const STEPS = ['Pending', 'Washing', 'Drying', 'Ready for Pickup', 'Completed'];
const STEP_ICONS = ['⏳', '🫧', '💨', '📦', '✅'];

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [payOrder, setPayOrder] = useState(null);
  const [payTab, setPayTab] = useState(0);
  const [gcashRef, setGcashRef] = useState('');
  const [receipt, setReceipt] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/orders');
      setOrders(r.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const handlePay = async () => {
    const method = payTab === 0 ? 'cash' : 'gcash';
    if (method === 'gcash' && !gcashRef.trim()) return;
    try {
      await api.post('/orders/' + payOrder._id + '/pay', {
        payment_method: method,
        gcash_ref: gcashRef,
      });
      await api.post('/notifications/payment-submitted', {
        order_id: payOrder._id,
        method,
        gcash_ref: gcashRef,
      });
      setMsg({
        text:
          method === 'gcash'
            ? 'GCash payment submitted! Waiting for admin confirmation.'
            : 'Cash payment declared! Please bring the exact amount on pickup.',
        type: 'warning',
      });
      setPayOrder(null);
      setGcashRef('');
      load();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Error', type: 'error' });
    }
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
          My Orders
        </Typography>
        <Typography color="text.secondary">Track your laundry & manage payments</Typography>
      </Box>
      {msg.text && (
        <Alert
          severity={msg.type}
          onClose={() => setMsg({ ...msg, text: '' })}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {msg.text}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography fontSize={48}>🧺</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            You have no orders yet. Visit us to drop off your laundry!
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {orders.map((o) => {
            const stepIdx = STEPS.indexOf(o.status);
            const canPay =
              ['Ready for Pickup', 'Completed'].includes(o.status) && o.payment_status === 'unpaid';
            const borderColor =
              o.status === 'Completed'
                ? '#00b37e'
                : o.status === 'Cancelled'
                  ? '#e53935'
                  : '#00c2cb';
            return (
              <Card key={o._id} sx={{ borderLeft: '4px solid ' + borderColor }}>
                <Box sx={{ p: 2.5 }}>
                  {/* Header */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    flexWrap="wrap"
                    gap={1}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={800} fontFamily="Syne, sans-serif">
                        Order #{o._id.slice(-5)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(o.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <StatusChip status={o.status} />
                      <PaymentChip status={o.payment_status} />
                    </Stack>
                  </Stack>

                  {/* Details */}
                  <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 2 }}>
                    {[
                      ['Service', SERVICES[o.service_type] || o.service_type],
                      ['Weight', o.weight + ' kg'],
                      ['Amount', '₱' + Number(o.price).toFixed(2)],
                    ].map(([k, v]) => (
                      <Box key={k}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#6b7c93',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 600,
                            display: 'block',
                          }}
                        >
                          {k}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={k === 'Amount' ? 'success.main' : 'inherit'}
                        >
                          {v}
                        </Typography>
                      </Box>
                    ))}
                    {o.payment_method && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#6b7c93',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 600,
                            display: 'block',
                          }}
                        >
                          Payment
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {o.payment_method.charAt(0).toUpperCase() + o.payment_method.slice(1)}
                          {o.gcash_ref ? ' · Ref: ' + o.gcash_ref : ''}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Progress */}
                  {o.status !== 'Cancelled' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#6b7c93',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: 600,
                          display: 'block',
                          mb: 1,
                        }}
                      >
                        Progress
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {STEPS.map((step, i) => (
                          <React.Fragment key={step}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  bgcolor: stepIdx >= i ? '#00c2cb' : '#e0e8f0',
                                  color: stepIdx >= i ? '#0d1b2a' : '#b0bec5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                }}
                              >
                                {stepIdx >= i ? STEP_ICONS[i] : '○'}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  mt: 0.5,
                                  fontWeight: stepIdx >= i ? 700 : 400,
                                  color: stepIdx >= i ? '#0d1b2a' : '#b0bec5',
                                  textAlign: 'center',
                                  fontSize: '0.6rem',
                                  maxWidth: 60,
                                  lineHeight: 1.2,
                                }}
                              >
                                {step}
                              </Typography>
                            </Box>
                            {i < STEPS.length - 1 && (
                              <Box
                                sx={{
                                  flex: 1,
                                  height: 3,
                                  bgcolor: stepIdx > i ? '#00c2cb' : '#e0e8f0',
                                  mx: 0.5,
                                  mb: 2,
                                }}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Actions */}
                  <Stack direction="row" spacing={1}>
                    {canPay && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CreditCardIcon />}
                        onClick={() => {
                          setPayOrder(o);
                          setPayTab(0);
                          setGcashRef('');
                        }}
                        sx={{ bgcolor: '#00b37e', '&:hover': { bgcolor: '#00966a' } }}
                      >
                        Pay Now
                      </Button>
                    )}
                    {o.payment_status !== 'unpaid' && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ReceiptIcon />}
                        onClick={() => setReceipt(o)}
                        sx={{ borderColor: '#0d1b2a', color: '#0d1b2a' }}
                      >
                        View Receipt
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Pay Modal */}
      <Dialog open={!!payOrder} onClose={() => setPayOrder(null)} maxWidth="sm" fullWidth>
        <Tabs
          value={payTab}
          onChange={(_, v) => setPayTab(v)}
          sx={{
            bgcolor: '#0d1b2a',
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
            },
            '& .Mui-selected': { color: '#00c2cb !important' },
            '& .MuiTabs-indicator': { bgcolor: '#00c2cb' },
          }}
        >
          <Tab label="💵 Cash" />
          <Tab label="📱 GCash" />
        </Tabs>
        <DialogContent sx={{ pt: 2 }}>
          {payOrder && (
            <Box sx={{ bgcolor: '#f0f4f8', borderRadius: 2, p: 1.5, mb: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                Order #{payOrder._id.slice(-5)} · {SERVICES[payOrder.service_type]} ·{' '}
                <span style={{ color: '#00b37e', fontWeight: 800 }}>
                  ₱{Number(payOrder.price).toFixed(2)}
                </span>
              </Typography>
            </Box>
          )}
          {payTab === 0 ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography fontSize={48}>💵</Typography>
              <Typography
                fontWeight={700}
                variant="h6"
                sx={{ fontFamily: 'Syne, sans-serif', mt: 1 }}
              >
                Pay with Cash
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Please prepare the exact amount. Payment will be collected when you pick up your
                laundry.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box
                sx={{
                  bgcolor: 'linear-gradient(135deg,#00b4d8,#0077b6)',
                  background: 'linear-gradient(135deg,#00b4d8,#0077b6)',
                  borderRadius: 3,
                  p: 2,
                  textAlign: 'center',
                  mb: 2,
                }}
              >
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  Send payment to
                </Typography>
                <Box
                  sx={{ bgcolor: 'white', borderRadius: 2, p: 1, display: 'inline-block', mb: 1.5 }}
                >
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#333' }}>
                    [ GCash QR Code ]
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  fontFamily="Syne, sans-serif"
                  sx={{ color: 'white', letterSpacing: 1 }}
                >
                  0969-571-2694
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  LaundryPro GCash Account
                </Typography>
              </Box>
              <Box sx={{ bgcolor: '#fff3cd', borderRadius: 2, p: 1.5, mb: 2 }}>
                <Typography variant="caption" color="warning.dark">
                  Scan the QR code or send to the number above, then enter your reference number
                  below.
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="GCash Reference Number"
                value={gcashRef}
                onChange={(e) => setGcashRef(e.target.value)}
                placeholder="e.g. 1234567890"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setPayOrder(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePay}
            disabled={payTab === 1 && !gcashRef.trim()}
            sx={{
              bgcolor: '#0d1b2a',
              '&:hover': { bgcolor: '#1b2d42' },
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Confirm Payment
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
          🧺 LaundryPro Official Receipt
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {receipt && (
            <Box>
              <Typography
                align="center"
                variant="h6"
                fontWeight={800}
                fontFamily="Syne, sans-serif"
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
                ['Customer', user.name],
                ['Service', SERVICES[receipt.service_type] || receipt.service_type],
                ['Weight', receipt.weight + ' kg'],
                [
                  'Payment',
                  (receipt.payment_method || '').charAt(0).toUpperCase() +
                    (receipt.payment_method || '').slice(1),
                ],
                receipt.gcash_ref ? ['GCash Ref', receipt.gcash_ref] : null,
              ]
                .filter(Boolean)
                .map(([k, v]) => (
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700} fontFamily="Syne, sans-serif">
                  TOTAL
                </Typography>
                <Typography variant="h6" fontWeight={800} color="success.main">
                  ₱{Number(receipt.price).toFixed(2)}
                </Typography>
              </Box>
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor:
                    receipt.payment_status === 'paid'
                      ? '#e8f5e9'
                      : receipt.payment_status === 'pending_verification'
                        ? '#fff8e1'
                        : '#fdecea',
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Typography
                  fontWeight={700}
                  color={
                    receipt.payment_status === 'paid'
                      ? 'success.main'
                      : receipt.payment_status === 'pending_verification'
                        ? 'warning.main'
                        : 'error.main'
                  }
                >
                  {receipt.payment_status === 'paid'
                    ? '✅ Payment Confirmed'
                    : receipt.payment_status === 'pending_verification'
                      ? '⏳ Pending Verification'
                      : '💳 Unpaid'}
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
