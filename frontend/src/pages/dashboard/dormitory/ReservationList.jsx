import { useEffect, useState } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { dormitoryApi, RESERVATION_STATUS } from './api';
import { useAuth } from '../../../context/AuthContext';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

function statusColor(s) {
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'error';
  if (s === 'cancelled') return 'default';
  if (s === 'completed') return 'info';
  return 'warning';
}

export default function ReservationList() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: '', adminNotes: '' });
  const [saving, setSaving] = useState(false);

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  useAutoRefresh(loadReservations);

  async function loadReservations() {
    setLoading(true);
    try {
      const res = await dormitoryApi.getReservations();
      setReservations(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(r) {
    setSelected(r);
    setForm({ status: r.status, adminNotes: r.adminNotes || '' });
    setEditDialog(true);
  }

  async function handleUpdate() {
    setSaving(true);
    setError('');
    try {
      await dormitoryApi.updateReservation(selected._id, form);
      setEditDialog(false);
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reservation');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await dormitoryApi.deleteReservation(deleteTarget._id);
      setDeleteTarget(null);
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reservation');
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
      <Typography variant="h5" fontWeight="bold" mb={2.5}>
        {isAdminOrStaff
          ? `All Reservations (${reservations.length})`
          : `My Reservations (${reservations.length})`}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(102,126,234,0.05)' }}>
              {isAdminOrStaff && <TableCell>Student</TableCell>}
              <TableCell>Room</TableCell>
              <TableCell>Check-In</TableCell>
              <TableCell>Check-Out</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdminOrStaff ? 7 : 6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No reservations found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((r) => {
                const room = r.room;
                const usr = r.user;
                return (
                  <TableRow key={r._id} hover>
                    {isAdminOrStaff && (
                      <TableCell>
                        <Typography variant="body2">{usr?.name || 'Unknown'}</Typography>
                        {usr?.studentId && (
                          <Typography variant="caption" color="text.secondary">
                            {usr.studentId}
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {room?.roomNumber || 'N/A'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {room?.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(r.checkInDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(r.checkOutDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {r.totalPrice ? `₱${r.totalPrice.toLocaleString()}` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.status}
                        size="small"
                        color={statusColor(r.status)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        {isAdminOrStaff && (
                          <IconButton size="small" onClick={() => openEdit(r)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => setDeleteTarget(r)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Edit dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Reservation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {/* Room & student summary */}
            {selected && (
              <Box sx={{ p: 1.5, bgcolor: 'rgba(102,126,234,0.05)', borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Room:</strong> {selected.room?.roomNumber} ({selected.room?.type})
                </Typography>
                {isAdminOrStaff && selected.user?.name && (
                  <Typography variant="body2">
                    <strong>Student:</strong> {selected.user.name}
                    {selected.user.studentId ? ` — ${selected.user.studentId}` : ''}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Dates:</strong> {new Date(selected.checkInDate).toLocaleDateString()} →{' '}
                  {new Date(selected.checkOutDate).toLocaleDateString()}
                </Typography>
              </Box>
            )}

            <TextField
              label="Status"
              select
              fullWidth
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {RESERVATION_STATUS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Admin Notes (optional)"
              multiline
              rows={3}
              fullWidth
              value={form.adminNotes}
              onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
              placeholder="Internal notes for staff reference"
            />
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleUpdate} variant="contained" disabled={saving}>
            {saving ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Reservation?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this reservation? This cannot be undone.
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
    </Box>
  );
}
