import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Skeleton,
  Stack,
  Divider,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/theme';

const STEPS = [
  {
    key: 'Pending',
    label: 'Order Placed',
    desc: 'Your order has been received.',
    icon: <HourglassEmptyOutlinedIcon fontSize="small" />,
  },
  {
    key: 'Processing',
    label: 'Processing',
    desc: "We're preparing your order.",
    icon: <SettingsOutlinedIcon fontSize="small" />,
  },
  {
    key: 'Out for Delivery',
    label: 'Out for Delivery',
    desc: 'Your order is on the way!',
    icon: <LocalShippingOutlinedIcon fontSize="small" />,
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    desc: 'Your order has been delivered.',
    icon: <CheckCircleOutlinedIcon fontSize="small" />,
  },
];

const STATUS_INDEX = {
  Pending: 0,
  Processing: 1,
  'Out for Delivery': 2,
  Delivered: 3,
};

const STEP_COLORS = [palette.amber, palette.teal, palette.orange, palette.moss];

function TrackingCard({ order }) {
  const [open, setOpen] = useState(true);
  const currentStep = STATUS_INDEX[order.status] ?? 0;
  const stepColor = STEP_COLORS[currentStep];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(11,31,42,0.02)' },
        }}
        onClick={() => setOpen(!open)}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '9px',
              backgroundColor: `${stepColor}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stepColor,
            }}
          >
            <LocalShippingOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2">Order #{order._id}</Typography>
              <Chip
                label={order.status}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  backgroundColor: `${stepColor}18`,
                  color: stepColor,
                }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {order.order_date
                ? `Placed on ${new Date(order.order_date).toLocaleDateString('en-PH', { dateStyle: 'medium' })}`
                : '—'}
              {order.delivery_date
                ? ` · Expected ${new Date(order.delivery_date).toLocaleDateString('en-PH', { dateStyle: 'medium' })}`
                : ''}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            ₱{Number(order.total_amount).toFixed(2)}
          </Typography>
          <IconButton size="small">
            {open ? (
              <KeyboardArrowUpIcon fontSize="small" />
            ) : (
              <KeyboardArrowDownIcon fontSize="small" />
            )}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={open}>
        <Divider />

        {/* Progress stepper */}
        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Stack direction="row" alignItems="flex-start">
            {STEPS.map((step, idx) => {
              const done = idx < currentStep;
              const active = idx === currentStep;
              const color = active ? stepColor : done ? palette.moss : 'rgba(0,0,0,0.2)';

              return (
                <Box
                  key={step.key}
                  sx={{
                    flex: idx < STEPS.length - 1 ? 1 : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  <Stack alignItems="center" spacing={0.75} sx={{ minWidth: 72 }}>
                    {/* Circle */}
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: active
                          ? stepColor
                          : done
                            ? `${palette.moss}20`
                            : 'rgba(0,0,0,0.06)',
                        border: `2px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: active ? '#fff' : color,
                        transition: 'all 0.3s',
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Typography
                      variant="caption"
                      textAlign="center"
                      sx={{
                        fontWeight: active ? 700 : 500,
                        color: active ? stepColor : done ? palette.moss : 'text.secondary',
                        lineHeight: 1.3,
                        maxWidth: 70,
                      }}
                    >
                      {step.label}
                    </Typography>
                    {active && (
                      <Typography
                        variant="caption"
                        textAlign="center"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.68rem',
                          maxWidth: 70,
                          lineHeight: 1.3,
                        }}
                      >
                        {step.desc}
                      </Typography>
                    )}
                  </Stack>

                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <Box
                      sx={{
                        flex: 1,
                        height: 2,
                        mt: '17px',
                        mx: 0.5,
                        backgroundColor: idx < currentStep ? palette.moss : 'rgba(0,0,0,0.1)',
                        transition: 'background-color 0.3s',
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Notes */}
        {order.notes && (
          <>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Note from store:</strong> {order.notes}
              </Typography>
            </Box>
          </>
        )}

        {/* Line items */}
        <Divider />
        <Box sx={{ px: 2.5, py: 1.75 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'text.secondary',
              letterSpacing: 0.5,
            }}
          >
            Items Ordered
          </Typography>
          <Stack spacing={0.5} mt={1}>
            {order.items.map((item, idx) => (
              <Stack
                key={idx}
                direction="row"
                justifyContent="space-between"
                sx={{ maxWidth: 400 }}
              >
                <Typography variant="body2">
                  {item.quantity} × {item.product_name || `Product #${item.product_id}`}
                </Typography>
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  ₱{Number((item.unit_price || 0) * item.quantity).toFixed(2)}
                </Typography>
              </Stack>
            ))}
            <Divider sx={{ my: 0.5, maxWidth: 400 }} />
            <Stack direction="row" justifyContent="space-between" sx={{ maxWidth: 400 }}>
              <Typography variant="body2" fontWeight={700}>
                Total
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                ₱{Number(order.total_amount).toFixed(2)}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function CustomerTrackingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/orders?customer_id=${user._id}`);
        setOrders(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load your orders.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user._id]);

  const filtered =
    filterStatus === 'All' ? orders : orders.filter((o) => o.status === filterStatus);

  const statusOptions = ['All', 'Pending', 'Processing', 'Out for Delivery', 'Delivered'];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5">Track My Orders</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Real-time status of your deliveries
          </Typography>
        </Box>
      </Stack>

      {/* Filter chips */}
      <Stack direction="row" spacing={1} mb={2.5} flexWrap="wrap">
        {statusOptions.map((s) => {
          const count = s === 'All' ? orders.length : orders.filter((o) => o.status === s).length;
          return (
            <Chip
              key={s}
              label={`${s} (${count})`}
              onClick={() => setFilterStatus(s)}
              variant={filterStatus === s ? 'filled' : 'outlined'}
              sx={{
                fontWeight: filterStatus === s ? 700 : 500,
                backgroundColor: filterStatus === s ? palette.teal : undefined,
                color: filterStatus === s ? '#fff' : undefined,
                borderColor: filterStatus === s ? palette.teal : undefined,
                cursor: 'pointer',
              }}
            />
          );
        })}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Stack spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2.5 }} />
          ))}
        </Stack>
      )}

      {!loading && filtered.length === 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2.5, py: 7 }}>
          <Stack alignItems="center" spacing={1}>
            <LocalShippingOutlinedIcon sx={{ color: palette.slate, fontSize: 40 }} />
            <Typography color="text.secondary">
              {filterStatus === 'All'
                ? 'You have no orders yet.'
                : `No orders with status "${filterStatus}".`}
            </Typography>
          </Stack>
        </Paper>
      )}

      {!loading && (
        <Stack spacing={2}>
          {filtered.map((order) => (
            <TrackingCard key={order._id} order={order} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
