import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button,
  TextField,
  Container,
  Paper,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const API = 'http://localhost:5000/api';
const LOW_STOCK_THRESHOLD = 10;

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState(0); // 0 = all, 1 = low stock
  const [dialog, setDialog] = useState({ open: false, type: '', product: null });
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchProducts() {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data);
    } catch {
      setError('Failed to load inventory.');
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function openDialog(type, product) {
    setDialog({ open: true, type, product });
    setQty('');
    setError('');
  }

  function closeDialog() {
    setDialog({ open: false, type: '', product: null });
    setQty('');
  }

  async function handleStockChange() {
    const amount = Number(qty);
    if (!amount || amount <= 0) {
      setError('Enter a valid quantity greater than 0.');
      return;
    }

    const endpoint =
      dialog.type === 'in'
        ? `${API}/inventory/stock-in/${dialog.product._id}`
        : `${API}/inventory/stock-out/${dialog.product._id}`;

    try {
      await axios.patch(endpoint, { quantity: amount });
      setSuccess(`Stock ${dialog.type === 'in' ? 'added' : 'removed'} successfully.`);
      closeDialog();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed.');
    }
  }

  const allRows = products;
  const lowStockRows = products.filter((p) => p.quantity <= LOW_STOCK_THRESHOLD);
  const rows = tab === 1 ? lowStockRows : allRows;

  const columns = [
    { field: 'name', headerName: 'Product', flex: 1.5 },
    { field: 'sku', headerName: 'SKU', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    {
      field: 'quantity',
      headerName: 'Stock',
      flex: 0.8,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value <= LOW_STOCK_THRESHOLD ? 'error' : 'success'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<AddCircleIcon />}
            onClick={() => openDialog('in', params.row)}
          >
            In
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<RemoveCircleIcon />}
            onClick={() => openDialog('out', params.row)}
          >
            Out
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" disableGutters>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Inventory
        </Typography>
        {lowStockRows.length > 0 && (
          <Chip
            icon={<WarningAmberIcon />}
            label={`${lowStockRows.length} low stock item(s)`}
            color="warning"
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`All Products (${allRows.length})`} />
        <Tab
          label={`Low Stock (${lowStockRows.length})`}
          iconPosition="start"
          icon={lowStockRows.length > 0 ? <WarningAmberIcon color="warning" /> : undefined}
        />
      </Tabs>

      <Paper elevation={2} sx={{ height: 'calc(100vh - 210px)' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
          rowHeight={36}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ height: '100%' }}
        />
      </Paper>

      {/* Stock In / Out Dialog */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dialog.type === 'in' ? 'Stock In' : 'Stock Out'} — {dialog.product?.name}
        </DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Current stock: <strong>{dialog.product?.quantity}</strong>
            </Typography>
            <TextField
              label="Quantity"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
              autoFocus
            />
            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            color={dialog.type === 'in' ? 'success' : 'error'}
            onClick={handleStockChange}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
