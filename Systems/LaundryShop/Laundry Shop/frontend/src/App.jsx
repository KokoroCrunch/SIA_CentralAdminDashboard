import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Students from './pages/Students';
import MyOrders from './pages/MyOrders';
import MyProfile from './pages/MyProfile';

const Private = ({ children, adminOnly }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

export default function App() {
  const { user } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={
            <Private>
              <Layout />
            </Private>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="orders"
            element={
              <Private adminOnly>
                <Orders />
              </Private>
            }
          />
          <Route
            path="customers"
            element={
              <Private adminOnly>
                <Customers />
              </Private>
            }
          />
          <Route
            path="payments"
            element={
              <Private adminOnly>
                <Payments />
              </Private>
            }
          />
          <Route
            path="reports"
            element={
              <Private adminOnly>
                <Reports />
              </Private>
            }
          />
          <Route
            path="students"
            element={
              <Private adminOnly>
                <Students />
              </Private>
            }
          />
          <Route path="my-orders" element={<MyOrders />} />
          <Route path="my-profile" element={<MyProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
