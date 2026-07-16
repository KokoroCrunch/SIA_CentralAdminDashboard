import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import AdminDeliveryPage from './pages/AdminDeliveryPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import CustomerTrackingPage from './pages/CustomerTrackingPage';

// Only admins can access — redirects customers to /my-orders
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/my-orders" replace />;
  return children;
}

// Only customers can access — redirects admins to /dashboard
function CustomerRoute({ children }) {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Root redirect based on role
function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/my-orders'} replace />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RootRedirect />} />

              {/* ── Admin only ── */}
              <Route
                path="dashboard"
                element={
                  <AdminRoute>
                    <DashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="orders"
                element={
                  <AdminRoute>
                    <OrdersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="customers"
                element={
                  <AdminRoute>
                    <CustomersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="delivery"
                element={
                  <AdminRoute>
                    <AdminDeliveryPage />
                  </AdminRoute>
                }
              />

              {/* ── Customer only ── */}
              <Route
                path="my-orders"
                element={
                  <CustomerRoute>
                    <CustomerOrdersPage />
                  </CustomerRoute>
                }
              />
              <Route
                path="tracking"
                element={
                  <CustomerRoute>
                    <CustomerTrackingPage />
                  </CustomerRoute>
                }
              />

              {/* ── Shared ── */}
              <Route path="products" element={<ProductsPage />} />
            </Route>

            {/* Catch-all */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <RootRedirect />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
