/**
 * water/api.js
 *
 * Axios instance for all water refilling station API calls.
 * Uses the shared axiosInstance so the Bearer token is automatically
 * attached on every request (required — all /api/v1 routes go through
 * the central dashboard auth middleware).
 */
import axiosInstance from '../../../api/axiosInstance';

// Thin wrapper that prepends /water to every path
const waterApi = {
  get: (path, config) => axiosInstance.get(`/api/v1/water${path}`, config),
  post: (path, data, config) => axiosInstance.post(`/api/v1/water${path}`, data, config),
  put: (path, data, config) => axiosInstance.put(`/api/v1/water${path}`, data, config),
  delete: (path, config) => axiosInstance.delete(`/api/v1/water${path}`, config),
};

export default waterApi;
