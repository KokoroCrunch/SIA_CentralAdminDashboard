import { useState, useEffect } from 'react';
import api from '../api/axios';
import ReservationModal from '../components/ReservationModal';

const BACKEND = 'http://localhost:5000';

const TYPE_LABELS = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  quad: 'Quad',
};

const STATUS_COLORS = {
  available: 'badge-green',
  occupied: 'badge-red',
  maintenance: 'badge-yellow',
};

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.type) params.type = filter.type;
      const { data } = await api.get('/rooms', { params });
      setRooms(data);
    } catch (err) {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Available Rooms</h1>
        <p>Browse and reserve a dormitory room</p>
      </div>

      <div className="filters">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          <option value="single">Single</option>
          <option value="double">Double</option>
          <option value="triple">Triple</option>
          <option value="quad">Quad</option>
        </select>
      </div>

      {loading && <div className="loading">Loading rooms...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && rooms.length === 0 && (
        <div className="empty-state">No rooms found matching your filters.</div>
      )}

      <div className="room-grid">
        {rooms.map((room) => (
          <div key={room._id} className="room-card">
            {room.image ? (
              <img
                src={`${BACKEND}${room.image}`}
                alt={`Room ${room.roomNumber}`}
                className="room-card-image"
              />
            ) : (
              <div className="room-card-no-image">No image available</div>
            )}
            <div className="room-card-body">
              <div className="room-card-header">
                <h2>Room {room.roomNumber}</h2>
                <span className={`badge ${STATUS_COLORS[room.status]}`}>{room.status}</span>
              </div>
              <div className="room-details">
                <span>{TYPE_LABELS[room.type]}</span>
                <span>Floor {room.floor}</span>
                <span>Capacity: {room.capacity}</span>
                <span>₱{room.pricePerMonth.toLocaleString()}/mo</span>
              </div>
              {room.amenities.length > 0 && (
                <div className="amenities">
                  {room.amenities.map((a) => (
                    <span key={a} className="amenity-tag">
                      {a}
                    </span>
                  ))}
                </div>
              )}
              {room.description && <p className="room-description">{room.description}</p>}
              <button
                className="btn btn-primary btn-full"
                disabled={room.status !== 'available'}
                onClick={() => setSelectedRoom(room)}
              >
                {room.status === 'available' ? 'Reserve Room' : 'Not Available'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedRoom && (
        <ReservationModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSuccess={() => {
            setSelectedRoom(null);
            fetchRooms();
          }}
        />
      )}
    </div>
  );
}
