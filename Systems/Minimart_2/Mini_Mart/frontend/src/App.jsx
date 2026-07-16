import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  CssBaseline,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BarChartIcon from '@mui/icons-material/BarChart';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Sales from './pages/Sales';

const DRAWER_WIDTH = 220;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Products', path: '/products', icon: <InventoryIcon /> },
  { label: 'Inventory', path: '/inventory', icon: <ShoppingCartIcon /> },
  { label: 'POS', path: '/pos', icon: <PointOfSaleIcon /> },
  { label: 'Sales', path: '/sales', icon: <BarChartIcon /> },
];

export default function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: '#1a1a2e',
              color: '#fff',
            },
          }}
        >
          <Toolbar>
            <Typography variant="h6" fontWeight="bold" color="#e94560">
              Mini Mart
            </Typography>
          </Toolbar>
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                end={item.path === '/'}
                sx={{
                  color: '#aaa',
                  '&.active': { color: '#e94560', backgroundColor: '#16213e' },
                  '&:hover': { backgroundColor: '#16213e', color: '#fff' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        {/* Main content */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <AppBar position="static" elevation={1} sx={{ backgroundColor: '#16213e' }}>
            <Toolbar>
              <Typography variant="h6" color="#e94560" fontWeight="bold">
                Mini Mart POS System
              </Typography>
            </Toolbar>
          </AppBar>

          <Box sx={{ p: 3, flexGrow: 1, backgroundColor: '#f4f6f9', overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/sales" element={<Sales />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </BrowserRouter>
  );
}
