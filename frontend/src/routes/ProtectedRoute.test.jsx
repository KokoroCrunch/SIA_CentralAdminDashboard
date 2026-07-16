import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Captures the current location so tests can inspect where the router ended up
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname + location.search}</div>;
}

// ── Helper: wrap ProtectedRoute in a MemoryRouter ──────────────────────────
function renderProtectedRoute({ user = null, initialPath = '/dashboard' } = {}) {
  const authValue = { user, accessToken: null, error: null };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        {/* LocationDisplay sits at the root level to always capture current path */}
        <LocationDisplay />
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>dashboard content</div>} />
            <Route path="/dashboard/laundry" element={<div>laundry content</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  // ── unauthenticated ──────────────────────────────────────────────────────
  it('redirects to /login when there is no authenticated user', () => {
    renderProtectedRoute({ user: null });
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  // ── authenticated ────────────────────────────────────────────────────────
  it('renders the outlet when user is authenticated', () => {
    renderProtectedRoute({
      user: { id: '1', name: 'Alice', email: 'a@b.com', role: 'admin' },
    });
    expect(screen.getByText('dashboard content')).toBeInTheDocument();
  });

  // ── redirect param preserved ─────────────────────────────────────────────
  it('redirects to /login?redirect=%2Fdashboard%2Flaundry when accessing protected path without auth', () => {
    renderProtectedRoute({ user: null, initialPath: '/dashboard/laundry' });

    // Navigate rendered the login page
    expect(screen.getByTestId('login-page')).toBeInTheDocument();

    // The LocationDisplay shows where the router is now
    const location = screen.getByTestId('location-display').textContent;
    expect(location).toBe('/login?redirect=%2Fdashboard%2Flaundry');
  });
});
