import { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../api/axios';

const PIE_COLORS = {
  pending: '#d69e2e',
  approved: '#38a169',
  rejected: '#e53e3e',
  cancelled: '#9ca3af',
  completed: '#3b6cf7',
};

const TYPE_COLORS = ['#3b6cf7', '#38a169', '#d69e2e', '#e53e3e'];

const formatPeso = (v) => `₱${Number(v).toLocaleString()}`;

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef();

  useEffect(() => {
    api
      .get('/reservations/analytics')
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  if (loading)
    return (
      <div className="page">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  if (error)
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  if (!data) return null;

  return (
    <div className="page" ref={printRef}>
      <div className="page-header analytics-header">
        <div>
          <h1>Reports &amp; Analytics</h1>
          <p>Overview of reservation activity and revenue</p>
        </div>
        <button className="btn btn-outline no-print" onClick={handlePrint}>
          Print / Save as PDF
        </button>
      </div>

      {/* ── Summary strip ── */}
      <div className="analytics-summary">
        <div className="analytics-summary-item">
          <span className="analytics-summary-value">{data.avgStayDays}</span>
          <span className="analytics-summary-label">Avg. Stay (days)</span>
        </div>
        <div className="analytics-summary-item">
          <span className="analytics-summary-value">
            {data.statusBreakdown.find((s) => s.name === 'completed')?.value || 0}
          </span>
          <span className="analytics-summary-label">Completed Stays</span>
        </div>
        <div className="analytics-summary-item">
          <span className="analytics-summary-value">
            {data.statusBreakdown.find((s) => s.name === 'pending')?.value || 0}
          </span>
          <span className="analytics-summary-label">Pending Requests</span>
        </div>
        <div className="analytics-summary-item">
          <span className="analytics-summary-value">{data.topRooms[0]?.name || '—'}</span>
          <span className="analytics-summary-label">Most Reserved Room</span>
        </div>
      </div>

      {/* ── Charts row 1 ── */}
      <div className="analytics-grid">
        {/* Monthly Reservations Bar Chart */}
        <div className="chart-card">
          <h2>Monthly Reservations</h2>
          <p className="chart-subtitle">Number of reservations submitted per month</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.monthlyReservations}
              margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Reservations" fill="#3b6cf7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Line Chart */}
        <div className="chart-card">
          <h2>Monthly Revenue</h2>
          <p className="chart-subtitle">Total revenue from approved &amp; completed reservations</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={data.monthlyRevenue}
              margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatPeso(v)} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#38a169"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="analytics-grid">
        {/* Reservation Status Pie Chart */}
        <div className="chart-card">
          <h2>Reservation Status Breakdown</h2>
          <p className="chart-subtitle">Distribution of all reservation statuses</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.statusBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.statusBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#9ca3af'} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Room Type Pie Chart */}
        <div className="chart-card">
          <h2>Reservations by Room Type</h2>
          <p className="chart-subtitle">Which room types are most requested</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.roomTypeBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.roomTypeBreakdown.map((entry, i) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Rooms Bar Chart ── */}
      <div className="chart-card chart-card-full">
        <h2>Top 5 Most Reserved Rooms</h2>
        <p className="chart-subtitle">Rooms with the highest number of reservation requests</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data.topRooms}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
            <Tooltip />
            <Bar dataKey="reservations" name="Reservations" fill="#3b6cf7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Printable Summary Table ── */}
      <div className="chart-card chart-card-full">
        <div className="report-header">
          <h2>Reservation Summary Report</h2>
          <p className="chart-subtitle">
            Generated on{' '}
            {new Date().toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {data.statusBreakdown.map((row) => {
              const total = data.statusBreakdown.reduce((a, b) => a + b.value, 0);
              return (
                <tr key={row.name}>
                  <td style={{ textTransform: 'capitalize' }}>{row.name}</td>
                  <td>{row.value}</td>
                  <td>{total ? ((row.value / total) * 100).toFixed(1) : 0}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '24px' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Reservations</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyReservations.map((row) => {
                const rev = data.monthlyRevenue.find((r) => r.month === row.month);
                return (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{row.count}</td>
                    <td>{rev ? formatPeso(rev.revenue) : '₱0'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
