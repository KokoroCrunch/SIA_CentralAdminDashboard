import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import RoleRoute from './RoleRoute';

// ── Helper: wrap RoleRoute in a MemoryRouter ───────────────────────────────
function renderRoleRoute({ user, allowedRoles }) {
  const authValue = { user, accessToken: null, error: null };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/minimart']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={allowedRoles} />}>
            <Route path="/minimart" element={<div>minimart content</div>} />
          </Route>
          <Route
            path="/unauthorized"
            element={<div data-testid="unauthorized-page">unauthorized</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RoleRoute', () => {
  // ── wrong role ────────────────────────────────────────────────────────────
  it('redirects to /unauthorized when user role is not in allowedRoles', () => {
    renderRoleRoute({
      user: { id: '2', name: 'Bob', email: 'b@b.com', role: 'student' },
      allowedRoles: ['admin', 'staff'],
    });
    expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
    expect(screen.queryByText('minimart content')).not.toBeInTheDocument();
  });

  // ── correct role ──────────────────────────────────────────────────────────
  it('renders the outlet when user role is in allowedRoles', () => {
    renderRoleRoute({
      user: { id: '1', name: 'Alice', email: 'a@b.com', role: 'admin' },
      allowedRoles: ['admin', 'staff'],
    });
    expect(screen.getByText('minimart content')).toBeInTheDocument();
    expect(screen.queryByTestId('unauthorized-page')).not.toBeInTheDocument();
  });
});
