import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import { palette } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 232;

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon /> },
  { label: 'Orders', path: '/orders', icon: <ReceiptLongOutlinedIcon /> },
  { label: 'Products', path: '/products', icon: <Inventory2OutlinedIcon /> },
  { label: 'Customers', path: '/customers', icon: <PeopleAltOutlinedIcon /> },
  { label: 'Delivery Tracking', path: '/delivery', icon: <LocalShippingOutlinedIcon /> },
];

const CUSTOMER_NAV = [
  { label: 'My Orders', path: '/my-orders', icon: <ReceiptLongOutlinedIcon /> },
  { label: 'Products', path: '/products', icon: <Inventory2OutlinedIcon /> },
  { label: 'Track My Order', path: '/tracking', icon: <MyLocationOutlinedIcon /> },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';
  const NAV_ITEMS = isAdmin ? ADMIN_NAV : CUSTOMER_NAV;

  const currentTitle =
    NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.label || 'Dashboard';

  function handleLogout() {
    setAnchorEl(null);
    logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'A';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 2.5, py: 2.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '9px',
            background: `linear-gradient(135deg, ${palette.teal}, ${palette.aqua})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WaterDropOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
            AquaFlow
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {isAdmin ? 'Admin Console' : 'Customer Portal'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Nav links */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '8px',
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(63,182,196,0.16)',
                    '&:hover': { backgroundColor: 'rgba(63,182,196,0.22)' },
                  },
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon
                  sx={{ color: active ? palette.aqua : 'rgba(255,255,255,0.5)', minWidth: 36 }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 700 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
          water_refilling &middot; local MongoDB
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Permanent sidebar — desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: palette.ink,
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Temporary drawer — mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, backgroundColor: palette.ink },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <AppBar position="sticky" color="inherit" sx={{ backgroundColor: '#fff' }}>
          <Toolbar sx={{ gap: 1.5 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {currentTitle}
            </Typography>
            <Tooltip title={user?.name || 'Account'}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ p: 0 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: palette.teal, fontSize: '0.85rem' }}>
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ sx: { mt: 1, minWidth: 180 } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" noWrap>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: palette.coral, gap: 1.5 }}>
                <LogoutOutlinedIcon fontSize="small" />
                Sign out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{ flex: 1, p: { xs: 2, md: 3.5 }, backgroundColor: 'background.default' }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
