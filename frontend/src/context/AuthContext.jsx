import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Module-level auth state ref
// Allows axiosInstance.js to read the current token and call auth methods
// without going through React hooks, avoiding circular dependency issues.
// Keep this in sync with React state changes.
// ---------------------------------------------------------------------------
export const authStateRef = {
  accessToken: null,
  logout: null,
  refreshAccessToken: null,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// AuthProvider (default export)
// ---------------------------------------------------------------------------
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [error, setError] = useState(null);
  // isRestoring: true while the silent bootstrap refresh is in-flight.
  // ProtectedRoute waits for this before deciding to redirect to /login.
  const [isRestoring, setIsRestoring] = useState(true);
  // Prevent concurrent refresh calls (e.g. multiple 401s firing simultaneously)
  const refreshPromiseRef = useRef(null);

  // -------------------------------------------------------------------------
  // login(credentials) — POST /api/v1/auth/login
  // Sets user and accessToken on success; sets error state on failure.
  // -------------------------------------------------------------------------
  const login = useCallback(
    async (credentials) => {
      setError(null);
      try {
        const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // send/receive HTTP-only cookies
          body: JSON.stringify(credentials),
        });

        const body = await response.json();

        if (!response.ok) {
          const message = body?.message || 'Login failed';
          setError(message);
          throw new Error(message);
        }

        // Backend returns { success, data: { accessToken, user? }, message }
        const token = body?.data?.accessToken ?? body?.accessToken ?? null;

        if (!token) {
          const message = 'No access token returned from server';
          setError(message);
          throw new Error(message);
        }

        // Accept a user object directly from the response, or decode the JWT.
        const userFromResponse = body?.data?.user ?? body?.user ?? null;
        let resolvedUser = userFromResponse;

        if (!resolvedUser && token) {
          try {
            const payloadBase64 = token.split('.')[1];
            const decoded = JSON.parse(atob(payloadBase64));
            resolvedUser = {
              id: decoded.sub,
              name: decoded.name ?? null,
              email: decoded.email ?? null,
              role: decoded.role,
            };
          } catch {
            // Cannot decode — leave as null until a /me endpoint is called
            resolvedUser = null;
          }
        }

        setUser(resolvedUser);
        setAccessToken(token);
        authStateRef.accessToken = token;
      } catch (err) {
        if (!error) setError(err.message);
        throw err;
      }
    },
    [error],
  );

  // -------------------------------------------------------------------------
  // logout() — POST /api/v1/auth/logout with 10-second timeout
  // Always clears user and accessToken regardless of network outcome.
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    const currentToken = authStateRef.accessToken;

    const logoutRequest = fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
      credentials: 'include',
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Logout request timed out')), 10_000),
    );

    try {
      await Promise.race([logoutRequest, timeout]);
    } catch {
      // Swallow — network failure or timeout must not block local cleanup
    } finally {
      // Always clear auth state, regardless of server response
      setUser(null);
      setAccessToken(null);
      setError(null);
      authStateRef.accessToken = null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // refreshAccessToken() — POST /api/v1/auth/refresh
  // Updates accessToken state + authStateRef, returns the new token string.
  // Called by axiosInstance's 401 response interceptor AND by the bootstrap
  // effect on app load.
  //
  // Deduplication: if a refresh is already in-flight (e.g. multiple
  // concurrent 401s), all callers share the same promise.
  //
  // Error policy:
  //   - 401 from the server → refresh token is expired/invalid → logout
  //   - Network error / 5xx → backend is temporarily down → throw without
  //     clearing auth state so the user isn't kicked out during a restart
  // -------------------------------------------------------------------------
  const refreshAccessToken = useCallback(async () => {
    // Return existing in-flight refresh to prevent duplicate calls
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doRefresh = async () => {
      let response;
      try {
        response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // refresh token is in an HTTP-only cookie
        });
      } catch (networkErr) {
        // Network failure (backend down / restarting) — do NOT clear auth state.
        // The user should stay logged in and the request will be retried when
        // the backend comes back.
        throw networkErr;
      }

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          // Refresh token is expired or revoked — must logout
          setUser(null);
          setAccessToken(null);
          authStateRef.accessToken = null;
        }
        // For 5xx (backend temporarily unavailable), throw without clearing
        // auth state so the user isn't logged out during a backend restart.
        throw new Error(body?.message || `Refresh failed (${response.status})`);
      }

      const newToken = body?.data?.accessToken ?? body?.accessToken ?? null;

      if (!newToken) {
        throw new Error('No access token returned from refresh');
      }

      // Preserve the existing user, only update the token
      setAccessToken(newToken);
      authStateRef.accessToken = newToken;

      return newToken;
    };

    refreshPromiseRef.current = doRefresh().finally(() => {
      refreshPromiseRef.current = null;
    });

    return refreshPromiseRef.current;
  }, []);

  // -------------------------------------------------------------------------
  // Silent bootstrap — runs once on mount.
  // Calls /auth/refresh using the HTTP-only cookie to silently restore the
  // session when the page loads or after a Vite HMR reload / backend restart.
  // This prevents the admin from being kicked to /login just because the
  // in-memory accessToken was lost.
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (cancelled) return;

        if (!response.ok) {
          // 401 = no valid session → stay logged out (normal first visit)
          // Other errors → also stay logged out on bootstrap
          return;
        }

        const body = await response.json().catch(() => ({}));
        const token = body?.data?.accessToken ?? body?.accessToken ?? null;

        if (!token || cancelled) return;

        // Decode the JWT payload to restore user info without a /me endpoint
        let restoredUser = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          restoredUser = {
            id: payload.sub,
            name: payload.name ?? null,
            email: payload.email ?? null,
            role: payload.role,
          };
        } catch {
          // Malformed token — cannot restore user info
          return;
        }

        if (!cancelled) {
          setUser(restoredUser);
          setAccessToken(token);
          authStateRef.accessToken = token;
        }
      } catch {
        // Network error on bootstrap (backend not yet up) — silently stay
        // logged out. The user will see the login page and can sign in once
        // the backend is ready.
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // Keep authStateRef methods in sync so axiosInstance can call them without hooks
  authStateRef.logout = logout;
  authStateRef.refreshAccessToken = refreshAccessToken;

  const value = {
    user,
    accessToken,
    isRestoring,
    login,
    logout,
    refreshAccessToken,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// useAuth hook
// Returns { user, accessToken, login, logout, refreshAccessToken, error }
// ---------------------------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
