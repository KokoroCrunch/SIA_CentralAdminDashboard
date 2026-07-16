import { useEffect, useState } from 'react';
import axios from 'axios';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Alert } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const API = 'http://localhost:5000/api';

function StatCard({ title, value, icon, color }) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [productsRes, lowStockRes, dailyRes, monthlyRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/inventory/low-stock`),
          axios.get(`${API}/sales/daily`),
          axios.get(`${API}/sales/monthly`),
        ]);
        setStats({
          totalProducts: productsRes.data.length,
          lowStock: lowStockRes.data.length,
          dailyTotal: dailyRes.data.total,
          monthlyTotal: monthlyRes.data.total,
          dailyTransactions: dailyRes.data.count,
        });
      } catch {
        setError('Failed to load dashboard data. Is the backend running?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<InventoryIcon sx={{ color: '#fff' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={stats.lowStock}
            icon={<WarningAmberIcon sx={{ color: '#fff' }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Sales"
            value={`₱${stats.dailyTotal.toFixed(2)}`}
            icon={<AttachMoneyIcon sx={{ color: '#fff' }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Sales"
            value={`₱${stats.monthlyTotal.toFixed(2)}`}
            icon={<ReceiptLongIcon sx={{ color: '#fff' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Today&apos;s Transactions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {stats.dailyTransactions} transaction(s) completed today.
        </Typography>
      </Box>
    </Box>
  );
}
