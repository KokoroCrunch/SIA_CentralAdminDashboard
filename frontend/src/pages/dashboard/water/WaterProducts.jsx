import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Skeleton,
  Stack,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import api from './api';
import ConfirmDialog from './WaterConfirmDialog';
import { palette } from './palette';

const CONTAINER_TYPES = ['Slim', 'Round', 'Mineral', 'Purified', 'Alkaline', 'Other'];

function emptyForm() {
  return {
    product_name: '',
    description: '',
    container_type: 'Purified',
    volume_liters: '',
    price: '',
    stock: '',
    image: '',
  };
}

/** Resize an image file to a max dimension and return a Base64 JPEG string. */
function resizeImage(file, maxPx = 600) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > h && w > maxPx) {
          h = Math.round((h * maxPx) / w);
          w = maxPx;
        } else if (h > maxPx) {
          w = Math.round((w * maxPx) / h);
          h = maxPx;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function WaterProducts() {
  const isAdmin = true;
  const fileInputRef = useRef();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewImg, setPreviewImg] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load products. Is the API server running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(product) {
    setEditTarget(product);
    setForm({
      product_name: product.product_name,
      description: product.description || '',
      container_type: product.container_type,
      volume_liters: product.volume_liters ?? '',
      price: product.price,
      stock: product.stock,
      image: product.image || '',
    });
    setFormError('');
    setDialogOpen(true);
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setForm((prev) => ({ ...prev, image: base64 }));
    e.target.value = '';
  }

  async function handleSave() {
    setFormError('');
    if (!form.product_name || form.price === '') {
      setFormError('Product name and price are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        product_name: form.product_name,
        description: form.description,
        container_type: form.container_type,
        volume_liters: Number(form.volume_liters) || 0,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        image: form.image || '',
      };
      if (editTarget) {
        await api.put(`/products/${editTarget._id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5">Products</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Water containers and refill products
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ ml: 2, flexShrink: 0 }}
          >
            Add product
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(11,31,42,0.02)' }}>
              <TableCell sx={{ width: 56 }}>Photo</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Volume</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Stock</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(isAdmin ? 8 : 7)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && products.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <Inventory2OutlinedIcon sx={{ color: palette.slate, fontSize: 32 }} />
                    <Typography color="text.secondary">No products yet.</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              products.map((p) => (
                <TableRow key={p._id} hover>
                  {/* Photo thumbnail */}
                  <TableCell>
                    <Tooltip title={p.image ? 'Click to preview' : 'No image'}>
                      <Avatar
                        src={p.image || ''}
                        variant="rounded"
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'rgba(63,182,196,0.1)',
                          cursor: p.image ? 'pointer' : 'default',
                        }}
                        onClick={() => p.image && setPreviewImg(p.image)}
                      >
                        {!p.image && <WaterDropIcon sx={{ color: palette.aqua, fontSize: 20 }} />}
                      </Avatar>
                    </Tooltip>
                  </TableCell>

                  <TableCell sx={{ color: 'text.secondary' }}>#{p._id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.product_name}</TableCell>
                  <TableCell>
                    <Chip label={p.container_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{p.volume_liters ? `${p.volume_liters}L` : '—'}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    ₱{Number(p.price).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color:
                          p.stock === 0 ? palette.coral : p.stock <= 5 ? palette.amber : 'inherit',
                      }}
                    >
                      {p.stock}
                    </Typography>
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        <IconButton size="small" onClick={() => openEdit(p)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteTarget(p)}>
                          <DeleteOutlineIcon fontSize="small" color="error" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ── Create / Edit dialog ─────────────────────────────────────────── */}
      {isAdmin && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editTarget ? 'Edit product' : 'New product'}
          </DialogTitle>
          <DialogContent sx={{ pt: '20px !important' }}>
            <Stack spacing={2.5}>
              {formError && <Alert severity="error">{formError}</Alert>}

              {/* Image upload */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  mb={1}
                >
                  PRODUCT PHOTO
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={form.image || ''}
                    variant="rounded"
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: 'rgba(63,182,196,0.08)',
                      border: '2px dashed',
                      borderColor: form.image ? palette.teal : 'rgba(0,0,0,0.15)',
                    }}
                  >
                    {!form.image && <WaterDropIcon sx={{ color: palette.aqua, fontSize: 36 }} />}
                  </Avatar>
                  <Stack spacing={1}>
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
                        variant="text"
                        onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                      >
                        Remove Photo
                      </Button>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      JPEG / PNG · max 600 px
                    </Typography>
                  </Stack>
                </Stack>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </Box>

              <TextField
                label="Product Name"
                fullWidth
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Container Type"
                  select
                  fullWidth
                  value={form.container_type}
                  onChange={(e) => setForm({ ...form, container_type: e.target.value })}
                >
                  {CONTAINER_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Volume (L)"
                  type="number"
                  fullWidth
                  value={form.volume_liters}
                  onChange={(e) => setForm({ ...form, volume_liters: e.target.value })}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Price (₱)"
                  type="number"
                  fullWidth
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  label="Stock"
                  type="number"
                  fullWidth
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  inputProps={{ min: 0 }}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>
              {editTarget ? 'Save changes' : 'Add product'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {isAdmin && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete product?"
          description={`This will permanently remove "${deleteTarget?.product_name}". This can't be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}

      {/* ── Full-size image preview ───────────────────────────────────────── */}
      <Dialog open={!!previewImg} onClose={() => setPreviewImg('')} maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700 }}>Product Photo</DialogTitle>
        <DialogContent sx={{ p: 1, bgcolor: '#000', textAlign: 'center' }}>
          <Box
            component="img"
            src={previewImg}
            alt="Product preview"
            sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewImg('')}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
