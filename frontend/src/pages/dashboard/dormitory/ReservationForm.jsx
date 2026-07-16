import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Stack,
} from '@mui/material';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import { dormitoryApi } from './api';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

export default function ReservationForm() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ room_id: '', checkInDate: '', checkOutDate: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useAutoRefresh(loadRooms);

  async function loadRooms() {
    try {
      const res = await dormitoryApi.getRooms({ status: 'available' });
      setRooms(res.data || []);
    } catch {
      setError('Failed to load available rooms');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.room_id || !form.checkInDate || !form.checkOutDate) {
      setError('Please fill in all required fields');
      return;
    }
    if (new Date(form.checkInDate) >= new Date(form.checkOutDate)) {
      setError('Check-out date must be after check-in date');
      return;
    }

    setSubmitting(true);
    try {
      await dormitoryApi.createReservation({
        room_id: form.room_id,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        notes: form.notes,
      });
      setSuccess(true);
      setForm({ room_id: '', checkInDate: '', checkOutDate: '', notes: '' });
      setTimeout(() => setSuccess(false), 5000);
      loadRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Make a Reservation
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Reserve a dormitory room. Your request will be reviewed by an admin.
      </Typography>

      <Card sx={{ maxWidth: 600, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && (
                <Alert severity="success">
                  Reservation submitted! Please wait for admin approval.
                </Alert>
              )}

              <TextField
                label="Room"
                select
                fullWidth
                required
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                helperText={
                  rooms.length === 0
                    ? 'No available rooms at the moment'
                    : 'Select an available room'
                }
              >
                {rooms.map((room) => (
                  <MenuItem key={room._id} value={room._id}>
                    Room {room.roomNumber} — Floor {room.floor} ({room.type})
                    {room.pricePerMonth ? ` · ₱${room.pricePerMonth.toLocaleString()}/mo` : ''}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Check-In Date"
                  type="date"
                  fullWidth
                  required
                  value={form.checkInDate}
                  onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Check-Out Date"
                  type="date"
                  fullWidth
                  required
                  value={form.checkOutDate}
                  onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <TextField
                label="Notes (Optional)"
                multiline
                rows={4}
                fullWidth
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any special requests or information..."
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting || rooms.length === 0}
                startIcon={<BookOnlineIcon />}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)' },
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Reservation'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 600, mt: 3, borderRadius: 3, bgcolor: 'rgba(102,126,234,0.05)' }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            ℹ️ How it works
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {[
              'Submit your reservation request with preferred dates',
              'An admin will review and approve or reject your request',
              'You will see the status update in your reservations list',
              'Contact the dormitory office for payment after approval',
            ].map((tip) => (
              <Typography key={tip} variant="body2" color="text.secondary">
                • {tip}
              </Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
