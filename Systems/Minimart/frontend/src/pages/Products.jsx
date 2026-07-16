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
  IconButton,
  Tooltip,
  MenuItem,
} from '@mui/material';

const CATEGORIES = [
  'Food',
  'Beverages',
  'Snacks',
  'Personal Care',
  'School Supplies',
  'Laundry Essentials',
  'Convenience Items',
  'Health & Wellness',
];
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const API = 'http://localhost:5000/api/products';

const emptyForm = {
  name: '',
  sku: '',
  price: '',
  quantity: '',
  category: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchProducts() {
    try {
      const res = await axios.get(API);
      setProducts(res.data);
    } catch {
      setError('Failed to load products.');
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setOpen(true);
  }

  function openEdit(row) {
    setForm({
      name: row.name,
      sku: row.sku,
      price: row.price,
      quantity: row.quantity,
      category: row.category,
    });
    setEditId(row._id);
    setOpen(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.price) {
      setError('Name and price are required.');
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, {
          name: form.name,
          price: Number(form.price),
          quantity: Number(form.quantity),
          category: form.category,
        });
      } else {
        await axios.post(API, {
          name: form.name,
          price: Number(form.price),
          quantity: Number(form.quantity),
          category: form.category,
        });
      }
      setOpen(false);
      setError('');
      fetchProducts();
    } catch {
      setError('Failed to save product.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchProducts();
    } catch {
      setError('Failed to delete product.');
    }
  }

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'sku', headerName: 'SKU', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    {
      field: 'price',
      headerName: 'Price (₱)',
      flex: 1,
      valueFormatter: (value) => `₱${Number(value).toFixed(2)}`,
    },
    { field: 'quantity', headerName: 'Stock', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => openEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" disableGutters>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Products
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ height: 'calc(100vh - 175px)' }}>
        <DataGrid
          rows={products}
          columns={columns}
          getRowId={(row) => row._id}
          rowHeight={36}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ height: '100%' }}
        />
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Product Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
            {editId && (
              <TextField
                label="SKU"
                value={form.sku}
                fullWidth
                InputProps={{ readOnly: true }}
                helperText="Auto-generated, cannot be changed"
              />
            )}
            <TextField
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
              select
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Price (₱)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
