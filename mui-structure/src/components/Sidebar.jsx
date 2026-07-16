import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

/** Width of the sidebar drawer in pixels */
const DRAWER_WIDTH = 240;

/**
 * Sidebar component — responsive navigation drawer:
 * - ≥768 px (md breakpoint): `variant="permanent"` — always visible alongside content
 * - <768 px:               `variant="temporary"` — slides in/out, controlled by `open` + `onClose`
 *
 * Props:
 *   navItems    — array of `{ label, route, icon? }` already filtered by role
 *   activeRoute — current path string used to highlight the matching nav item
 *   open        — boolean controlling the temporary (mobile) drawer visibility
 *   onClose     — callback fired when the temporary drawer requests to close
 */
function Sidebar({ navItems, activeRoute, open, onClose }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();

  /** Shared drawer content — a list of nav items with active-link highlight */
  const drawerContent = (
    <>
      {/*
        Spacer that aligns the nav list below the fixed AppBar.
        <Toolbar /> outputs an empty block whose height matches the AppBar height.
      */}
      <Toolbar />
      <List component="nav" aria-label="main navigation">
        {navItems.map(({ label, route, icon: Icon }) => {
          const isActive = location.pathname === route;
          return (
            <ListItemButton
              key={route}
              selected={isActive}
              component={Link}
              to={route}
              aria-current={isActive ? 'page' : undefined}
              sx={{
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText,
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {Icon && (
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.secondary,
                  }}
                >
                  <Icon />
                </ListItemIcon>
              )}
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </>
  );

  if (isDesktop) {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }} // improves mobile performance
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

Sidebar.propTypes = {
  /** Nav items already filtered by the current user's role */
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      /** Display label for the nav item */
      label: PropTypes.string.isRequired,
      /** Route path — used as href and for active-link comparison */
      route: PropTypes.string.isRequired,
      /** Optional MUI SvgIcon component rendered on the left */
      icon: PropTypes.elementType,
    }),
  ).isRequired,
  /** Current route path — the matching nav item receives an active highlight */
  activeRoute: PropTypes.string.isRequired,
  /** Controls the temporary (mobile) drawer — ignored on desktop */
  open: PropTypes.bool,
  /** Called when the temporary drawer requests to close (e.g. backdrop click) */
  onClose: PropTypes.func,
};

Sidebar.defaultProps = {
  open: false,
  onClose: () => {},
};

export default Sidebar;
