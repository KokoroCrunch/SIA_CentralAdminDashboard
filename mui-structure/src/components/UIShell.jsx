import { useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/** Width kept in sync with Sidebar's internal DRAWER_WIDTH */
const DRAWER_WIDTH = 240;

/**
 * UIShell — root layout wrapper for authenticated pages.
 *
 * Renders the three-panel shell:
 *   ┌────────────────────────────────────┐
 *   │           <Topbar>                 │  fixed, full-width
 *   ├──────────┬─────────────────────────┤
 *   │          │                         │
 *   │ <Sidebar>│   <Box component="main">│
 *   │          │      {children}         │
 *   │          │                         │
 *   └──────────┴─────────────────────────┘
 *
 * On mobile (<768 px) the sidebar collapses into a temporary drawer
 * controlled by the internal `drawerOpen` state toggled via the Topbar
 * hamburger menu.
 *
 * Props:
 *   children    — page content rendered inside the main area
 *   user        — `{ name, role }` forwarded to Topbar
 *   onLogout    — logout callback forwarded to Topbar
 *   navItems    — role-filtered nav array forwarded to Sidebar
 *   activeRoute — current path string forwarded to Sidebar
 */
function UIShell({ children, user, onLogout, navItems, activeRoute }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuOpen = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Fixed top app bar */}
      <Topbar user={user} onLogout={onLogout} onMenuOpen={handleMenuOpen} />

      {/* Responsive sidebar drawer */}
      <Sidebar
        navItems={navItems}
        activeRoute={activeRoute}
        open={drawerOpen}
        onClose={handleDrawerClose}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // On desktop, leave room for the permanent sidebar
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          // Prevent content from sliding under the fixed AppBar
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/*
          <Toolbar /> acts as a spacer that matches the AppBar height,
          pushing the page content below the fixed top bar.
        */}
        <Toolbar />
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

UIShell.propTypes = {
  /** Page content to render in the main area */
  children: PropTypes.node.isRequired,
  /** Authenticated user — passed to Topbar for display */
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
  /** Called when the user clicks the logout button in the Topbar */
  onLogout: PropTypes.func.isRequired,
  /** Role-filtered navigation items passed to Sidebar */
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      route: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
    }),
  ).isRequired,
  /** Current route path — used to highlight the active Sidebar link */
  activeRoute: PropTypes.string.isRequired,
};

export default UIShell;
