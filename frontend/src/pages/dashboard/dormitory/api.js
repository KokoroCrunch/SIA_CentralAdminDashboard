/**
 * dormitory/api.js
 *
 * API helper for the Dormitory Reservation module.
 * Field names match the original dormitory DB schema:
 *   Room:        roomNumber, type, floor, capacity, pricePerMonth, amenities, status
 *   Reservation: user, room, checkInDate, checkOutDate, status, totalPrice, notes, adminNotes
 */

import axiosInstance from '../../../api/axiosInstance';

const BASE = '/api/v1/dormitory';

export const dormitoryApi = {
  getStats: () => axiosInstance.get(`${BASE}/stats`),

  // Rooms
  getRooms: (params) => axiosInstance.get(`${BASE}/rooms`, { params }),
  createRoom: (data) => axiosInstance.post(`${BASE}/rooms`, data),
  updateRoom: (id, data) => axiosInstance.put(`${BASE}/rooms/${id}`, data),
  deleteRoom: (id) => axiosInstance.delete(`${BASE}/rooms/${id}`),

  // Reservations
  getReservations: (params) => axiosInstance.get(`${BASE}/reservations`, { params }),
  createReservation: (data) => axiosInstance.post(`${BASE}/reservations`, data),
  updateReservation: (id, data) => axiosInstance.patch(`${BASE}/reservations/${id}`, data),
  deleteReservation: (id) => axiosInstance.delete(`${BASE}/reservations/${id}`),

  // Users (admin/staff only)
  getUsers: () => axiosInstance.get(`${BASE}/users`),
  createUser: (data) => axiosInstance.post(`${BASE}/users`, data),
  updateUserRole: (id, role) => axiosInstance.patch(`${BASE}/users/${id}/role`, { role }),
  deleteUser: (id) => axiosInstance.delete(`${BASE}/users/${id}`),
};

export const ROOM_TYPES = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'triple', label: 'Triple' },
  { value: 'quad', label: 'Quad' },
];

export const ROOM_STATUS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const RESERVATION_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];
