import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CategoryIcon from '@mui/icons-material/Category';
import { complaintApi, STATUS_COLOR } from './api';
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

export default function ComplaintDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  useAutoRefresh(loadData);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      if (isAdminOrStaff) {
        const statsRes = await complaintApi.getStats();
        setStats(statsRes.data.data);
      }
      const complaintsRes = await complaintApi.getAll();
      const complaintsData = complaintsRes.data.data || [];
      setRecentComplaints(Array.isArray(complaintsData) ? complaintsData.slice(0, 5) : []);
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
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isAdminOrStaff ? 'Complaint & Feedback Management Dashboard' : 'My Feedback'}
        </Typography>
        <Typography color="text.secondary">
          {isAdminOrStaff
            ? 'Manage and track campus feedback'
            : 'View your submitted feedback and their status'}
        </Typography>
      </Box>

      {/* Stats cards — admin/staff only */}
      {isAdminOrStaff && stats && (
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Total"
              value={stats.total || 0}
              icon={<FeedbackIcon sx={{ fontSize: 40 }} />}
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Open"
              value={stats.open || 0}
              icon={<PendingActionsIcon sx={{ fontSize: 40 }} />}
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="In Progress"
              value={stats.in_progress || 0}
              icon={<PendingActionsIcon sx={{ fontSize: 40 }} />}
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Resolved / Closed"
              value={stats.resolved_total || 0}
              icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
              gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            />
          </Grid>
        </Grid>
      )}

      {/* By category breakdown */}
      {isAdminOrStaff && stats?.byType?.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Feedback by Category
            </Typography>
            <Grid container spacing={2}>
              {stats.byType.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item._id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(102,126,234,0.05)',
                      border: '1px solid rgba(102,126,234,0.1)',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {item._id}
                      </Typography>
                      <Chip
                        label={item.count}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recent feedback */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#667eea', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>
            {isAdminOrStaff ? 'Recent Feedback' : 'My Recent Feedback'}
          </Typography>
        </Box>
        <CardContent>
          {recentComplaints.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <FeedbackIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No feedback yet</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {recentComplaints.map((c) => (
                <Box
                  key={c._id}
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
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {c.complaint_type}
                        </Typography>
                        {c.referenceNumber && (
                          <Typography variant="caption" color="text.secondary">
                            #{c.referenceNumber}
                          </Typography>
                        )}
                        {isAdminOrStaff && c.user_id?.role && (
                          <Chip
                            label={c.anonymous ? 'Anonymous' : c.user_id.role}
                            size="small"
                            sx={{ height: 18, fontSize: '0.68rem', textTransform: 'capitalize' }}
                            color={
                              c.user_id.role === 'admin'
                                ? 'error'
                                : c.user_id.role === 'staff'
                                  ? 'primary'
                                  : 'default'
                            }
                          />
                        )}
                      </Stack>
                      {isAdminOrStaff && c.user_id?.name && !c.anonymous && (
                        <Typography variant="caption" color="text.secondary">
                          by {c.user_id.name} · {c.user_id.email}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(c.createdAt).toLocaleDateString()} at{' '}
                        {new Date(c.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={c.status || 'open'}
                      size="small"
                      color={STATUS_COLOR[c.status] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {c.message}
                  </Typography>
                  {c.action_taken && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        bgcolor: 'rgba(67,233,123,0.1)',
                        borderRadius: 1,
                        borderLeft: '3px solid #43e97b',
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold" color="success.main">
                        Action Taken:{' '}
                      </Typography>
                      <Typography variant="body2">{c.action_taken}</Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
