import { Navigate, Outlet, useLocation } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, isRestoring } = useAuth();
  const location = useLocation();

  // Wait for the silent bootstrap refresh to complete before deciding
  // whether to render the protected content or redirect to /login.
  // Without this, a page reload kicks the user to /login for ~200ms
  // while the refresh call is in-flight.
  if (isRestoring) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
