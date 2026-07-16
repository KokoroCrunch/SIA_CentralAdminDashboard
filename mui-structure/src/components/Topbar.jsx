import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PropTypes from 'prop-types';

/**
 * Topbar component — renders a top app bar with:
 * - Hamburger menu button (mobile drawer toggle) on the left
 * - App title in the center-left
 * - User name + role chip + logout button on the right
 */
function Topbar({ user, onLogout, onMenuOpen }) {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {/* Hamburger icon — visible only on mobile (md breakpoint and below) */}
        <IconButton
          color="inherit"
          aria-label="open navigation menu"
          edge="start"
          onClick={onMenuOpen}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* App / page title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Central Admin Dashboard
        </Typography>

        {/* Right-side: user name, role chip, logout */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {user?.name && (
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user.name}
            </Typography>
          )}

          {user?.role && (
            <Chip
              label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              size="small"
              color="secondary"
              sx={{ fontWeight: 500 }}
            />
          )}

          <IconButton color="inherit" aria-label="logout" edge="end" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

Topbar.propTypes = {
  /** Authenticated user object — requires at minimum `name` and `role` fields */
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
  /** Called when the logout icon button is clicked */
  onLogout: PropTypes.func.isRequired,
  /** Called when the hamburger menu icon is clicked (for mobile drawer toggle) */
  onMenuOpen: PropTypes.func.isRequired,
};

export default Topbar;
