import { useState, useRef, useCallback } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import useAutoRefresh from '../../../hooks/useAutoRefresh';
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
  Avatar,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

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

const API = '/api/v1/minimart/products';

const emptyForm = {
  name: '',
  sku: '',
  price: '',
  quantity: '',
  category: '',
  image: '',
};

export default function MinimartProducts() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API);
      // Backend returns a plain array
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load products.');
    } finally {
      setFetching(false);
    }
  }, []);

  useAutoRefresh(fetchProducts);

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
      image: row.image || '',
    });
    setEditId(row._id);
    setOpen(true);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Resize + convert to Base64
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX) {
          h = (h * MAX) / w;
          w = MAX;
        } else if (h > MAX) {
          w = (w * MAX) / h;
          h = MAX;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setForm((prev) => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.8) }));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!form.name || !form.price) {
      setError('Name and price are required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        quantity: Number(form.quantity),
        category: form.category,
        image: form.image,
      };
      if (editId) {
        await axiosInstance.put(`${API}/${editId}`, payload);
      } else {
        await axiosInstance.post(API, payload);
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
      await axiosInstance.delete(`${API}/${id}`);
      fetchProducts();
    } catch {
      setError('Failed to delete product.');
    }
  }

  const columns = [
    {
      field: 'image',
      headerName: 'Photo',
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <Avatar src={params.value || ''} variant="rounded" sx={{ width: 32, height: 32 }}>
          {!params.value && params.row.name?.[0]}
        </Avatar>
      ),
    },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'sku', headerName: 'SKU', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1 },
    {
      field: 'price',
      headerName: 'Price (₱)',
      flex: 1,
      valueFormatter: (value) => `₱${Number(value).toFixed(2)}`,
    },
    { field: 'quantity', headerName: 'Stock', flex: 0.7 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
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

      <Paper
        elevation={2}
        sx={{
          height: 'calc(100vh - 175px)',
          display: 'flex',
          alignItems: fetching ? 'center' : 'stretch',
          justifyContent: fetching ? 'center' : 'stretch',
        }}
      >
        {fetching ? (
          <CircularProgress />
        ) : (
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
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {/* Image upload */}
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <Avatar
                src={form.image || ''}
                variant="rounded"
                sx={{ width: 120, height: 120, border: '2px dashed #ccc' }}
              >
                {!form.image && <AddPhotoAlternateIcon sx={{ fontSize: 40, color: '#aaa' }} />}
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => fileInputRef.current.click()}
              >
                {form.image ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {form.image && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                >
                  Remove Photo
                </Button>
              )}
            </Box>

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
