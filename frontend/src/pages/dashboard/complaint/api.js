/**
 * complaint/api.js
 * Thin API helper for the CampusFeedback module.
 */

import axiosInstance from '../../../api/axiosInstance';

const BASE = '/api/v1/complaint';
const COMPLAINT_USERS = '/api/v1/complaint/users';

export const complaintApi = {
  getStats: () => axiosInstance.get(`${BASE}/stats`),
  getAll: () => axiosInstance.get(BASE),
  getById: (id) => axiosInstance.get(`${BASE}/${id}`),
  create: (data) => axiosInstance.post(BASE, data),
  update: (id, data) => axiosInstance.patch(`${BASE}/${id}`, data),
  remove: (id) => axiosInstance.delete(`${BASE}/${id}`),
  attachmentUrl: (complaintId, attId) =>
    `${axiosInstance.defaults.baseURL || ''}${BASE}/${complaintId}/attachments/${attId}`,
};

// Complaint-system user management (reads complaint DB users, not central dashboard users)
export const userMgmtApi = {
  getAll: () => axiosInstance.get(COMPLAINT_USERS),
  create: (data) => axiosInstance.post(COMPLAINT_USERS, data),
  update: (id, data) => axiosInstance.patch(`${COMPLAINT_USERS}/${id}`, data),
  updateRole: (id, role) => axiosInstance.patch(`${COMPLAINT_USERS}/${id}/role`, { role }),
  remove: (id) => axiosInstance.delete(`${COMPLAINT_USERS}/${id}`),
};

export const COMPLAINT_TYPES = [
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'minimart', label: 'Minimart' },
  { value: 'laundry shop', label: 'Laundry Shop' },
  { value: 'water refilling station', label: 'Water Refilling Station' },
  { value: 'others', label: 'Others' },
];

export const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const STATUS_COLOR = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
};
