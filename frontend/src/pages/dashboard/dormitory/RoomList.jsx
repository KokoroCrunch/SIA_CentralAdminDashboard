import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import HotelIcon from '@mui/icons-material/Hotel';
import { dormitoryApi, ROOM_TYPES, ROOM_STATUS } from './api';
import { useAuth } from '../../../context/AuthContext';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const EMPTY_FORM = {
  roomNumber: '',
  floor: '',
  capacity: '',
  type: 'double',
  pricePerMonth: '',
  amenities: '',
  description: '',
  status: 'available',
  image: '',
};

/** Resize an image file to a max dimension and return a Base64 JPEG string. */
function resizeImage(file, maxPx = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
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

export default function RoomList() {
  const { user } = useAuth();
  const fileInputRef = useRef();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Preview dialog for full-size room image
  const [previewImg, setPreviewImg] = useState('');

  const isAdmin = user?.role === 'admin';

  useAutoRefresh(loadRooms);

  async function loadRooms() {
    setLoading(true);
    try {
      const res = await dormitoryApi.getRooms();
      setRooms(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError('');
    setDialogOpen(true);
  }

  function openEdit(room) {
    setEditTarget(room);
    setError('');
    setForm({
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      type: room.type,
      pricePerMonth: room.pricePerMonth,
      amenities: (room.amenities || []).join(', '),
      description: room.description || '',
      status: room.status,
      image: room.image || '',
    });
    setDialogOpen(true);
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setForm((prev) => ({ ...prev, image: base64 }));
    // Reset the input so the same file can be re-selected after removal
    e.target.value = '';
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        pricePerMonth: Number(form.pricePerMonth),
        amenities: form.amenities
          ? form.amenities
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
      };
      if (editTarget) {
        await dormitoryApi.updateRoom(editTarget._id, data);
      } else {
        await dormitoryApi.createRoom(data);
      }
      setDialogOpen(false);
      loadRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await dormitoryApi.deleteRoom(deleteTarget._id);
      setDeleteTarget(null);
      loadRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete room');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Typography variant="h5" fontWeight="bold">
          Rooms ({rooms.length})
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add Room
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(102,126,234,0.05)' }}>
              <TableCell>Photo</TableCell>
              <TableCell>Room No.</TableCell>
              <TableCell>Floor</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Price / Month</TableCell>
              <TableCell>Amenities</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No rooms found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rooms.map((room) => (
                <TableRow key={room._id} hover>
                  {/* Photo thumbnail */}
                  <TableCell>
                    <Tooltip title={room.image ? 'Click to preview' : 'No image'}>
                      <Avatar
                        src={room.image || ''}
                        variant="rounded"
                        sx={{
                          width: 44,
                          height: 44,
                          cursor: room.image ? 'pointer' : 'default',
                          bgcolor: 'grey.100',
                        }}
                        onClick={() => room.image && setPreviewImg(room.image)}
                      >
                        {!room.image && <HotelIcon sx={{ color: 'grey.400' }} />}
                      </Avatar>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight="bold">{room.roomNumber}</Typography>
                  </TableCell>
                  <TableCell>{room.floor}</TableCell>
                  <TableCell>
                    <Chip label={room.type} size="small" sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>₱{(room.pricePerMonth || 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="caption" noWrap>
                      {(room.amenities || []).join(', ') || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={room.status}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                      color={
                        room.status === 'available'
                          ? 'success'
                          : room.status === 'occupied'
                            ? 'warning'
                            : 'default'
                      }
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        <Tooltip title="Edit room">
                          <IconButton size="small" onClick={() => openEdit(room)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete room">
                          <IconButton size="small" onClick={() => setDeleteTarget(room)}>
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTarget ? `Edit Room — ${editTarget.roomNumber}` : 'Add New Room'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            {/* Image upload */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                display="block"
                mb={1}
              >
                ROOM PHOTO
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {/* Preview */}
                <Avatar
                  src={form.image || ''}
                  variant="rounded"
                  sx={{
                    width: 120,
                    height: 90,
                    bgcolor: 'grey.100',
                    border: '2px dashed',
                    borderColor: 'grey.300',
                  }}
                >
                  {!form.image && <HotelIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                </Avatar>

                {/* Buttons */}
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
                    JPEG / PNG / WebP · max 800 px
                  </Typography>
                </Stack>
              </Stack>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </Box>

            {/* Room details */}
            <TextField
              label="Room Number"
              fullWidth
              required
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Floor"
                type="number"
                fullWidth
                inputProps={{ min: 1 }}
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
              />
              <TextField
                label="Capacity"
                type="number"
                fullWidth
                inputProps={{ min: 1 }}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </Stack>
            <TextField
              label="Room Type"
              select
              fullWidth
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {ROOM_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Price per Month (₱)"
              type="number"
              fullWidth
              inputProps={{ min: 0 }}
              value={form.pricePerMonth}
              onChange={(e) => setForm({ ...form, pricePerMonth: e.target.value })}
            />
            <TextField
              label="Amenities (comma-separated)"
              fullWidth
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              placeholder="Wi-Fi, Air Conditioning, Study Table"
              helperText="Separate each amenity with a comma"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <TextField
              label="Status"
              select
              fullWidth
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {ROOM_STATUS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Room'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Room?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete room <strong>{deleteTarget?.roomNumber}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Full-size Image Preview ────────────────────────────────────────── */}
      <Dialog open={!!previewImg} onClose={() => setPreviewImg('')} maxWidth="md">
        <DialogTitle>Room Photo</DialogTitle>
        <DialogContent sx={{ p: 1 }}>
          <Box
            component="img"
            src={previewImg}
            alt="Room preview"
            sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewImg('')}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
