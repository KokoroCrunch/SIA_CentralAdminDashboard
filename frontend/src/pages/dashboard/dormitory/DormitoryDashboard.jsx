import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { dormitoryApi } from './api';
import { useAuth } from '../../../context/AuthContext';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

function StatCard({ label, value, icon, gradient }) {
  return (
    <Card sx={{ background: gradient, color: 'white', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {label}
            </Typography>
          </Box>
          <Box sx={{ opacity: 0.8 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function statusColor(status) {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'cancelled') return 'default';
  return 'warning';
}

export default function DormitoryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRes, setRecentRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  useAutoRefresh(loadData);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      if (isAdminOrStaff) {
        const statsRes = await dormitoryApi.getStats();
        setStats(statsRes.data);
      }
      const resRes = await dormitoryApi.getReservations();
      setRecentRes((resRes.data || []).slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          {isAdminOrStaff ? 'Dormitory Dashboard' : 'My Reservations'}
        </Typography>
        <Typography color="text.secondary">
          {isAdminOrStaff
            ? 'Manage dormitory rooms and reservations'
            : 'View your dormitory reservations'}
        </Typography>
      </Box>

      {/* Stats — admin/staff only */}
      {isAdminOrStaff && stats && (
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[
            {
              label: 'Total Rooms',
              value: stats.totalRooms || 0,
              icon: <DoorFrontIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg,#667eea,#764ba2)',
            },
            {
              label: 'Available Rooms',
              value: stats.availableRooms || 0,
              icon: <HotelIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)',
            },
            {
              label: 'Pending Reservations',
              value: stats.pendingReservations || 0,
              icon: <PendingActionsIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg,#f093fb,#f5576c)',
            },
            {
              label: 'Approved Reservations',
              value: stats.approvedReservations || 0,
              icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)',
            },
          ].map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Recent reservations */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#667eea', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>
            {isAdminOrStaff ? 'Recent Reservations' : 'My Reservations'}
          </Typography>
        </Box>
        <CardContent>
          {recentRes.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <HotelIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No reservations yet</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {recentRes.map((r) => {
                const room = r.room;
                const usr = r.user;
                return (
                  <Box
                    key={r._id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'rgba(102,126,234,0.02)', borderColor: '#667eea' },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Room {room?.roomNumber || '—'} — Floor {room?.floor ?? '—'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {room?.type} · ₱{room?.pricePerMonth?.toLocaleString()}/mo
                        </Typography>
                        {isAdminOrStaff && usr?.name && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Student: {usr.name} {usr.studentId ? `(${usr.studentId})` : ''}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={r.status}
                        size="small"
                        color={statusColor(r.status)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Check-in:</strong> {new Date(r.checkInDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Check-out:</strong> {new Date(r.checkOutDate).toLocaleDateString()}
                      </Typography>
                      {r.totalPrice > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          <strong>Total:</strong> ₱{r.totalPrice.toLocaleString()}
                        </Typography>
                      )}
                    </Stack>
                    {r.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Notes: {r.notes}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
