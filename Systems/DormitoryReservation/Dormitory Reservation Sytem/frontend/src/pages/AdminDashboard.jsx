import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reservations/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of dormitory operations</p>
      </div>

      {loading && <div className="loading">Loading stats...</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalRooms}</div>
            <div className="stat-label">Total Rooms</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-number">{stats.availableRooms}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-number">{stats.occupiedRooms}</div>
            <div className="stat-label">Occupied</div>
          </div>
          <div className="stat-card stat-yellow">
            <div className="stat-number">{stats.pendingReservations}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-number">{stats.totalReservations}</div>
            <div className="stat-label">Total Reservations</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-number">₱{stats.totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      )}

      <div className="admin-actions">
        <Link to="/admin/rooms" className="admin-action-card">
          <h3>Manage Rooms</h3>
          <p>Add, edit, or remove rooms</p>
        </Link>
        <Link to="/admin/reservations" className="admin-action-card">
          <h3>Manage Reservations</h3>
          <p>Approve or reject student reservations</p>
        </Link>
        <Link to="/admin/users" className="admin-action-card">
          <h3>Manage Users</h3>
          <p>View registered students</p>
        </Link>
        <Link to="/admin/analytics" className="admin-action-card">
          <h3>Reports &amp; Analytics</h3>
          <p>Charts, revenue, and printable reports</p>
        </Link>
      </div>
    </div>
  );
}
