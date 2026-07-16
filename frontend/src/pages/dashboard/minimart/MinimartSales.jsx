import { useState } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import useAutoRefresh from '../../../hooks/useAutoRefresh';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const API = '/api/v1/minimart/sales';

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function SummaryCard({ label, value, sub }) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight="bold" color="primary">
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function MinimartSales() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [from, setFrom] = useState(toDateInput(firstOfMonth));
  const [to, setTo] = useState(toDateInput(today));
  const [data, setData] = useState({ sales: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // transaction detail dialog

  async function fetchSales(fromDate, toDate) {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await axiosInstance.get(API, { params });
      setData(res.data);
    } catch {
      setError('Failed to load sales data.');
    } finally {
      setLoading(false);
    }
  }

  useAutoRefresh(() => fetchSales(from, to));

  function handleSearch() {
    if (from && to && new Date(from) > new Date(to)) {
      setError('Start date cannot be after end date.');
      return;
    }
    fetchSales(from, to);
  }

  function handleClear() {
    setFrom('');
    setTo('');
    fetchSales('', '');
    setError('');
  }

  const columns = [
    {
      field: 'createdAt',
      headerName: 'Date & Time',
      flex: 1.5,
      valueFormatter: (value) => new Date(value).toLocaleString(),
    },
    {
      field: 'total',
      headerName: 'Total (₱)',
      flex: 1,
      valueFormatter: (value) => `₱${Number(value).toFixed(2)}`,
    },
    {
      field: 'items',
      headerName: 'Items Sold',
      flex: 0.8,
      valueFormatter: (value) =>
        Array.isArray(value) ? value.reduce((sum, i) => sum + i.quantity, 0) : 0,
    },
    {
      field: 'itemNames',
      headerName: 'Products',
      flex: 2,
      renderCell: (params) =>
        Array.isArray(params.row.items)
          ? params.row.items.map((i) => (
              <Chip
                key={i.productId || i.name}
                label={`${i.name} ×${i.quantity}`}
                size="small"
                sx={{ mr: 0.5 }}
              />
            ))
          : null,
    },
  ];

  return (
    <Container maxWidth="lg" disableGutters>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Sales Reports
      </Typography>

      {/* Date Range Filter */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="From"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
            Filter
          </Button>
          <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClear}>
            Reset
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={4}>
              <SummaryCard
                label="Total Revenue"
                value={`₱${data.total.toFixed(2)}`}
                sub={`${data.count} transaction(s)`}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SummaryCard
                label="Avg. Transaction Value"
                value={data.count > 0 ? `₱${(data.total / data.count).toFixed(2)}` : '₱0.00'}
                sub="per transaction"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SummaryCard
                label="Total Items Sold"
                value={data.sales.reduce(
                  (sum, s) =>
                    sum +
                    (Array.isArray(s.items) ? s.items.reduce((a, i) => a + i.quantity, 0) : 0),
                  0,
                )}
                sub="across all transactions"
              />
            </Grid>
          </Grid>

          <Paper elevation={2}>
            <DataGrid
              rows={data.sales}
              columns={columns}
              getRowId={(row) => row._id}
              rowHeight={36}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              onRowClick={(params) => setSelected(params.row)}
              sx={{
                height: 'calc(100vh - 430px)',
                cursor: 'pointer',
                '& .MuiDataGrid-row:hover': { backgroundColor: '#e3f2fd' },
              }}
            />
          </Paper>
        </>
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongIcon color="primary" />
          Transaction Details
        </DialogTitle>

        <DialogContent dividers>
          {selected && (
            <Box>
              {/* Meta info */}
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selected._id}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selected.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Items table */}
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                Items Purchased
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(selected.items) &&
                    selected.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">₱{Number(item.price).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />

              {/* Totals */}
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body1">Total Items</Typography>
                <Typography variant="body1">
                  {Array.isArray(selected.items)
                    ? selected.items.reduce((s, i) => s + i.quantity, 0)
                    : 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="h6" fontWeight="bold">
                  Total Amount
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ₱{Number(selected.total).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={() => setSelected(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
