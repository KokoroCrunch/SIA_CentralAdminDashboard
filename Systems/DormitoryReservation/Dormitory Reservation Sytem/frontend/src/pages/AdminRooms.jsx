import { useState, useEffect } from 'react';
import api from '../api/axios';

const BACKEND = 'http://localhost:5000';

const emptyForm = {
  roomNumber: '',
  type: 'single',
  floor: '',
  capacity: '',
  pricePerMonth: '',
  amenities: '',
  description: '',
  status: 'available',
};

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Use FormData so we can send the image file alongside text fields
    const formData = new FormData();
    formData.append('roomNumber', form.roomNumber);
    formData.append('type', form.type);
    formData.append('floor', form.floor);
    formData.append('capacity', form.capacity);
    formData.append('pricePerMonth', form.pricePerMonth);
    formData.append('description', form.description);
    formData.append('status', form.status);
    formData.append(
      'amenities',
      JSON.stringify(
        form.amenities
          ? form.amenities
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
      ),
    );
    if (imageFile) formData.append('image', imageFile);

    try {
      if (editing) {
        await api.put(`/rooms/${editing}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Room updated successfully');
      } else {
        await api.post('/rooms', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Room created successfully');
      }
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview('');
      setEditing(null);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (room) => {
    setEditing(room._id);
    setForm({
      roomNumber: room.roomNumber,
      type: room.type,
      floor: room.floor,
      capacity: room.capacity,
      pricePerMonth: room.pricePerMonth,
      amenities: room.amenities.join(', '),
      description: room.description || '',
      status: room.status,
    });
    setImageFile(null);
    setImagePreview(room.image ? `${BACKEND}${room.image}` : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Manage Rooms</h1>
      </div>

      <div className="admin-form-section">
        <h2>{editing ? 'Edit Room' : 'Add New Room'}</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Room Number</label>
              <input
                name="roomNumber"
                value={form.roomNumber}
                onChange={handleChange}
                placeholder="e.g. 101"
                required
                disabled={!!editing}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="quad">Quad</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Floor</label>
              <input
                type="number"
                name="floor"
                value={form.floor}
                onChange={handleChange}
                placeholder="1"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                placeholder="2"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Price / Month (₱)</label>
              <input
                type="number"
                name="pricePerMonth"
                value={form.pricePerMonth}
                onChange={handleChange}
                placeholder="3000"
                min="0"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Amenities (comma-separated)</label>
            <input
              name="amenities"
              value={form.amenities}
              onChange={handleChange}
              placeholder="WiFi, Air Conditioning, Study Desk"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Optional room description"
            />
          </div>
          <div className="form-group">
            <label>Room Image {editing && '(leave empty to keep current)'}</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <img src={imagePreview} alt="Room preview" className="image-preview" />
            )}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editing ? 'Update Room' : 'Add Room'}
            </button>
            {editing && (
              <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && <div className="loading">Loading rooms...</div>}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Room #</th>
              <th>Type</th>
              <th>Floor</th>
              <th>Capacity</th>
              <th>Price/mo</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room._id}>
                <td>
                  {room.image ? (
                    <img
                      src={`${BACKEND}${room.image}`}
                      alt={`Room ${room.roomNumber}`}
                      className="table-room-image"
                    />
                  ) : (
                    <div className="table-room-no-image">No image</div>
                  )}
                </td>
                <td>{room.roomNumber}</td>
                <td>{room.type}</td>
                <td>{room.floor}</td>
                <td>{room.capacity}</td>
                <td>₱{room.pricePerMonth.toLocaleString()}</td>
                <td>
                  <span
                    className={`badge badge-sm ${
                      room.status === 'available'
                        ? 'badge-green'
                        : room.status === 'occupied'
                          ? 'badge-red'
                          : 'badge-yellow'
                    }`}
                  >
                    {room.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(room)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(room._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
