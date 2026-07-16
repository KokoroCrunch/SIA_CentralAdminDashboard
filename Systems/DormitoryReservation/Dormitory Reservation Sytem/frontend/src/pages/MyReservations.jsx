import { useState, useEffect } from 'react';
import api from '../api/axios';

const STATUS_COLORS = {
  pending: 'badge-yellow',
  approved: 'badge-green',
  rejected: 'badge-red',
  cancelled: 'badge-gray',
  completed: 'badge-blue',
};

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    try {
      const { data } = await api.get('/reservations/my');
      setReservations(data);
    } catch (err) {
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.put(`/reservations/${id}/cancel`);
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>Track the status of your room reservations</p>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && reservations.length === 0 && (
        <div className="empty-state">
          <p>You have no reservations yet.</p>
          <a href="/rooms" className="btn btn-primary">
            Browse Rooms
          </a>
        </div>
      )}

      <div className="reservation-list">
        {reservations.map((r) => (
          <div key={r._id} className="reservation-card">
            <div className="reservation-card-header">
              <div>
                <h2>Room {r.room?.roomNumber}</h2>
                <span className="reservation-type">
                  {r.room?.type} room — Floor {r.room?.floor}
                </span>
              </div>
              <span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span>
            </div>
            <div className="reservation-dates">
              <span>Check-in: {formatDate(r.checkInDate)}</span>
              <span>Check-out: {formatDate(r.checkOutDate)}</span>
              {r.totalPrice && <span>Total: ₱{r.totalPrice.toLocaleString()}</span>}
            </div>
            {r.notes && (
              <p className="reservation-notes">
                <strong>Your notes:</strong> {r.notes}
              </p>
            )}
            {r.adminNotes && (
              <p className="reservation-notes admin-notes">
                <strong>Admin notes:</strong> {r.adminNotes}
              </p>
            )}
            <div className="reservation-footer">
              <span className="reservation-date-created">Submitted: {formatDate(r.createdAt)}</span>
              {['pending', 'approved'].includes(r.status) && (
                <button className="btn btn-danger" onClick={() => handleCancel(r._id)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
