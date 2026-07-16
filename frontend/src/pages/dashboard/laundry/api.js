/**
 * laundry/api.js
 *
 * Uses axiosInstance so the Bearer token is attached on every request.
 */
import axiosInstance from '../../../api/axiosInstance';

const laundryApi = {
  get: (path, config) => axiosInstance.get(`/api/v1/laundry${path}`, config),
  post: (path, data, config) => axiosInstance.post(`/api/v1/laundry${path}`, data, config),
  put: (path, data, config) => axiosInstance.put(`/api/v1/laundry${path}`, data, config),
  delete: (path, config) => axiosInstance.delete(`/api/v1/laundry${path}`, config),
};

export default laundryApi;
