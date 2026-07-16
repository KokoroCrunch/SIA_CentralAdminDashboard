import axiosInstance from '../../api/axiosInstance';

export async function loginRequest(credentials) {
  const response = await axiosInstance.post('/api/v1/auth/login', credentials);
  return response.data;
}

export async function logoutRequest() {
  const response = await axiosInstance.post('/api/v1/auth/logout');
  return response.data;
}

export async function refreshRequest() {
  const response = await axiosInstance.post('/api/v1/auth/refresh');
  return response.data;
}
