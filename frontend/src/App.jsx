import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// Auth context
import AuthProvider from './context/AuthContext';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Route guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Public pages
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome';
import MinimartPage from './pages/dashboard/MinimartPage';
import ComplaintPage from './pages/dashboard/ComplaintPage';
import DormitoryPage from './pages/dashboard/DormitoryPage';
import LaundryPage from './pages/dashboard/LaundryPage';
import WaterStationPage from './pages/dashboard/WaterStationPage';
import TransactionLogs from './pages/dashboard/TransactionLogs';

/**
 * App — root component.
 *
 * Full React Router v6 nested route tree:
 *
 *   /login                         → LoginPage          (public)
 *   /unauthorized                  → UnauthorizedPage   (public)
 *   /                              → ProtectedRoute     (requires auth)
 *     dashboard/                   → DashboardLayout (UIShell layout outlet)
 *       index                      → DashboardHome      (all roles)
 *       minimart                   → RoleRoute(['admin','staff'])
 *       complaint                  → RoleRoute(['admin','staff','student'])
 *       dormitory                  → RoleRoute(['admin','staff','student'])
 *       laundry                    → RoleRoute(['admin','staff','student'])
 *       water-station              → RoleRoute(['admin','staff','student'])
 *
 * Note: AuthProvider is mounted in main.jsx so it wraps the entire tree.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes ─────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Protected root — requires an authenticated session ── */}
          <Route element={<ProtectedRoute />}>
            {/* Redirect bare "/" to "/dashboard" */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* ── Dashboard layout (UIShell) ────────────────────── */}
            <Route path="dashboard" element={<DashboardLayout />}>
              {/* /dashboard → DashboardHome (accessible by all roles) */}
              <Route index element={<DashboardHome />} />

              {/* /dashboard/minimart — admin & staff only */}
              <Route element={<RoleRoute allowedRoles={['admin', 'staff']} />}>
                <Route path="minimart" element={<MinimartPage />} />
              </Route>

              {/* /dashboard/complaint — all three roles */}
              <Route element={<RoleRoute allowedRoles={['admin', 'staff', 'student']} />}>
                <Route path="complaint" element={<ComplaintPage />} />
              </Route>

              {/* /dashboard/dormitory — all three roles */}
              <Route element={<RoleRoute allowedRoles={['admin', 'staff', 'student']} />}>
                <Route path="dormitory" element={<DormitoryPage />} />
              </Route>

              {/* /dashboard/laundry — all three roles */}
              <Route element={<RoleRoute allowedRoles={['admin', 'staff', 'student']} />}>
                <Route path="laundry" element={<LaundryPage />} />
              </Route>

              {/* /dashboard/water-station — all three roles */}
              <Route element={<RoleRoute allowedRoles={['admin', 'staff', 'student']} />}>
                <Route path="water-station" element={<WaterStationPage />} />
              </Route>

              {/* /dashboard/logs — admin & staff only */}
              <Route element={<RoleRoute allowedRoles={['admin', 'staff']} />}>
                <Route path="logs" element={<TransactionLogs />} />
              </Route>
            </Route>
          </Route>

          {/* ── Catch-all: send unknown paths to login ───────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
