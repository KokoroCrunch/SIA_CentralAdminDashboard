import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import api from '../api';

const DRAWER_WIDTH = 240;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get('/notifications');
        setUnread(r.data.unread);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Orders', icon: <ShoppingBasketIcon />, path: '/orders' },
    { label: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { label: 'Payments', icon: <PaymentIcon />, path: '/payments' },
    { label: 'Reports', icon: <BarChartIcon />, path: '/reports' },
    { label: 'Students', icon: <SchoolIcon />, path: '/students' },
  ];
  const custNav = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'My Orders', icon: <ShoppingBasketIcon />, path: '/my-orders' },
    { label: 'My Profile', icon: <PersonIcon />, path: '/my-profile' },
  ];
  const navItems = user?.role === 'admin' ? adminNav : custNav;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0d1b2a' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ bgcolor: '#00c2cb', borderRadius: 2, p: 0.8, display: 'flex' }}>
          <LocalLaundryServiceIcon sx={{ color: '#0d1b2a', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{ color: 'white', lineHeight: 1, fontFamily: 'Syne, sans-serif' }}
          >
            LaundryPro
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Management System
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ flex: 1, px: 1.5, pt: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => isMobile && setOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: active ? 'rgba(0,194,203,0.15)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
              }}
            >
              <ListItemIcon
                sx={{ color: active ? '#00c2cb' : 'rgba(255,255,255,0.5)', minWidth: 36 }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#00c2cb' : 'rgba(255,255,255,0.75)',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#00c2cb',
              color: '#0d1b2a',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              sx={{
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.72rem',
                textTransform: 'capitalize',
              }}
            >
              {user?.role}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(229,57,53,0.15)' } }}
        >
          <ListItemIcon sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 36 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {isMobile ? (
          <Drawer
            open={open}
            onClose={() => setOpen(false)}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
            }}
          >
            {drawer}
          </Drawer>
        )}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AppBar
            position="sticky"
            elevation={0}
            sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e8f0' }}
          >
            <Toolbar sx={{ gap: 1 }}>
              {isMobile && (
                <IconButton onClick={() => setOpen(true)} edge="start">
                  <MenuIcon />
                </IconButton>
              )}
              <Box sx={{ flex: 1 }} />
              <Tooltip title="Notifications">
                <IconButton
                  component={Link}
                  to={user?.role === 'admin' ? '/payments' : '/my-orders'}
                >
                  <Badge badgeContent={unread} color="error">
                    <NotificationsIcon sx={{ color: '#0d1b2a' }} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: '#0d1b2a',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Toolbar>
          </AppBar>
          <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
