import { useState } from 'react';
import api from '../api/axios';

export default function ReservationModal({ room, onClose, onSuccess }) {
  const [form, setForm] = useState({ checkInDate: '', checkOutDate: '', notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/reservations', {
        roomId: room._id,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        notes: form.notes,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <div className="modal-header">
          <h2 id="modal-title">Reserve Room {room.roomNumber}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-room-info">
          <span>Price: ₱{room.pricePerMonth.toLocaleString()}/month</span>
          <span>Capacity: {room.capacity}</span>
          <span>Floor {room.floor}</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="checkIn">Check-in Date</label>
              <input
                id="checkIn"
                type="date"
                min={today}
                value={form.checkInDate}
                onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="checkOut">Check-out Date</label>
              <input
                id="checkOut"
                type="date"
                min={form.checkInDate || today}
                value={form.checkOutDate}
                onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any special requests or notes..."
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
