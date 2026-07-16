import { useState, useEffect } from 'react';
import api from '../api/axios';

const STATUS_COLORS = {
  pending: 'badge-yellow',
  approved: 'badge-green',
  rejected: 'badge-red',
  cancelled: 'badge-gray',
  completed: 'badge-blue',
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminNotes, setAdminNotes] = useState({});

  const fetchReservations = async () => {
    try {
      const { data } = await api.get('/reservations');
      setReservations(data);
    } catch {
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/reservations/${id}/status`, {
        status,
        adminNotes: adminNotes[id] || '',
      });
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
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
        <h1>Manage Reservations</h1>
        <p>Review and process student reservation requests</p>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && reservations.length === 0 && (
        <div className="empty-state">No reservations yet.</div>
      )}

      <div className="reservation-list">
        {reservations.map((r) => (
          <div key={r._id} className="reservation-card">
            <div className="reservation-card-header">
              <div>
                <h2>
                  Room {r.room?.roomNumber} — {r.user?.name}
                </h2>
                <span className="reservation-type">
                  Student ID: {r.user?.studentId} · {r.user?.email}
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
                <strong>Student notes:</strong> {r.notes}
              </p>
            )}
            {r.status === 'pending' && (
              <div className="admin-action-row">
                <input
                  placeholder="Admin notes (optional)"
                  value={adminNotes[r._id] || ''}
                  onChange={(e) => setAdminNotes({ ...adminNotes, [r._id]: e.target.value })}
                  className="admin-notes-input"
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleStatus(r._id, 'approved')}
                >
                  Approve
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleStatus(r._id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            )}
            {r.status === 'approved' && (
              <div className="admin-action-row">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleStatus(r._id, 'completed')}
                >
                  Mark Completed
                </button>
              </div>
            )}
            {r.adminNotes && (
              <p className="reservation-notes admin-notes">
                <strong>Admin notes:</strong> {r.adminNotes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
