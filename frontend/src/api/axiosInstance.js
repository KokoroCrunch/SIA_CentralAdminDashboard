/**
 * axiosInstance.js
 *
 * Axios instance pre-configured with:
 *  - baseURL from VITE_API_URL env var (falls back to localhost:5000)
 *  - withCredentials: true  → HTTP-only refresh-token cookie is sent automatically
 *  - Request interceptor   → attaches Bearer token from in-memory auth state
 *  - Response interceptor  → handles 401 by refreshing once, then retries;
 *                            on refresh failure (401) calls logout and redirects;
 *                            on network errors does NOT logout (backend may be restarting)
 */

import axios from 'axios';
import { authStateRef } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  withCredentials: true, // ensures the HTTP-only refresh-token cookie is sent
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token if one exists in memory
// ---------------------------------------------------------------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authStateRef.accessToken;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — transparent token refresh on 401
// ---------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  // Pass-through for successful responses
  (response) => response,

  async (error) => {
    const originalConfig = error.config;

    // Only attempt refresh for 401 responses that haven't been retried yet.
    // The _retry flag prevents an infinite refresh loop.
    if (error.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        // Ask AuthContext to call POST /api/v1/auth/refresh (cookie sent automatically).
        // Returns the new access token string and updates authStateRef.accessToken.
        // AuthContext.refreshAccessToken() deduplicates concurrent refresh calls.
        const newToken = await authStateRef.refreshAccessToken();

        // Update the Authorization header on the original request config
        originalConfig.headers = originalConfig.headers ?? {};
        originalConfig.headers['Authorization'] = `Bearer ${newToken}`;

        // Retry the original request with the refreshed token
        return axiosInstance(originalConfig);
      } catch (refreshError) {
        // Only force logout if the refresh token itself was rejected (401).
        // Network errors (backend restarting) should NOT log the user out —
        // the session is still valid and will recover when the backend is back.
        const isTokenInvalid =
          refreshError?.message?.includes('401') ||
          refreshError?.message?.includes('revoked') ||
          refreshError?.message?.includes('expired') ||
          refreshError?.message?.includes('Refresh failed (401)');

        if (isTokenInvalid) {
          await authStateRef.logout?.();
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Non-401 errors (or already-retried 401s) bubble up to the caller
    return Promise.reject(error);
  },
);

export default axiosInstance;
