import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { UIShell } from '@project/mui-structure';
import { useAuth } from '../context/AuthContext';
import { getNavItemsForRole } from '../navConfig';

/**
 * DashboardLayout
 *
 * Layout route that wraps all authenticated dashboard pages with UIShell.
 * - Derives `navItems` from the authenticated user's role via navConfig.
 * - Derives `activeRoute` from the current location pathname.
 * - Passes `user` and `onLogout` from AuthContext down to UIShell → Topbar.
 * - Wraps logout() with a 10-second timeout; shows a Snackbar warning on
 *   timeout or failure (user stays on the current page, state is still cleared).
 * - Renders the child route page via <Outlet /> inside UIShell's children.
 */
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [snackOpen, setSnackOpen] = useState(false);

  const navItems = getNavItemsForRole(user?.role);
  const activeRoute = location.pathname;

  async function handleLogout() {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logout timed out')), 10_000),
      );
      await Promise.race([logout(), timeoutPromise]);
    } catch {
      setSnackOpen(true);
    }
  }

  return (
    <>
      <UIShell user={user} onLogout={handleLogout} navItems={navItems} activeRoute={activeRoute}>
        <Outlet />
      </UIShell>
      <Snackbar open={snackOpen} autoHideDuration={5000} onClose={() => setSnackOpen(false)}>
        <Alert severity="warning" onClose={() => setSnackOpen(false)}>
          Logout encountered an issue. You may close this page manually.
        </Alert>
      </Snackbar>
    </>
  );
}
