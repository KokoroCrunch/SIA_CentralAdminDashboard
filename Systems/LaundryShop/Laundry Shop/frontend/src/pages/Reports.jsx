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
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../api';

const PIE_COLORS = ['#f0a500', '#0d6efd', '#17a2b8', '#7b1fa2', '#00b37e', '#e53935'];

export default function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api
      .get('/reports')
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);
  if (!data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
          Reports
        </Typography>
        <Typography color="text.secondary">Revenue and order analytics</Typography>
      </Box>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Total Revenue"
            value={'₱' + Number(data.total_revenue || 0).toLocaleString()}
            icon={<TrendingUpIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#00b37e,#00966a)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Total Orders"
            value={data.total_orders || 0}
            icon={<ShoppingBasketIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#0d1b2a,#1b2d42)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Completed"
            value={data.completed_orders || 0}
            icon={<CheckCircleIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#f0a500,#e09000)"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Cancelled"
            value={data.cancelled_orders || 0}
            icon={<CancelIcon sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg,#e53935,#c62828)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} fontFamily="Syne, sans-serif" sx={{ mb: 2 }}>
              Monthly Revenue (Last 6 Months)
            </Typography>
            {data.monthly_data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthly_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => '₱' + Number(v).toLocaleString()} />
                  <Bar dataKey="revenue" fill="#00c2cb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No data yet.
              </Typography>
            )}
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} fontFamily="Syne, sans-serif" sx={{ mb: 2 }}>
              Orders by Status
            </Typography>
            {data.by_status?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.by_status}
                    dataKey="cnt"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ status, cnt }) => status + ': ' + cnt}
                  >
                    {data.by_status.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No data yet.
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#00c2cb', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: '#0d1b2a', fontWeight: 700 }}>
            🏆 Top Customers by Spending
          </Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              {['Rank', 'Customer', 'Orders', 'Total Spent', 'Share'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6b7c93' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.top_customers || []).map((c, i) => {
              const share =
                data.total_revenue > 0 ? Math.round((c.spent / data.total_revenue) * 100) : 0;
              return (
                <TableRow key={c.name} hover>
                  <TableCell>{['🥇', '🥈', '🥉'][i] || <strong>#{i + 1}</strong>}</TableCell>
                  <TableCell>
                    <strong>{c.name}</strong>
                  </TableCell>
                  <TableCell>{c.orders}</TableCell>
                  <TableCell>
                    <strong style={{ color: '#00b37e' }}>₱{Number(c.spent).toFixed(2)}</strong>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={share}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#e0e8f0',
                          '& .MuiLinearProgress-bar': { bgcolor: '#00c2cb', borderRadius: 4 },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
                        {share}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {!data.top_customers?.length && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No completed orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
