import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/theme';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in — send to the right page
  if (user) {
    const dest = user.role === 'admin' ? '/dashboard' : '/my-orders';
    return <Navigate to={dest} replace />;
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });
      const userData = res.data.user;
      login(userData);
      // Go to the page they came from, or their role's home
      const from = location.state?.from?.pathname;
      const home = userData.role === 'admin' ? '/dashboard' : '/my-orders';
      navigate(from && from !== '/' ? from : home, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surface,
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Brand header — outside the card */}
        <Stack alignItems="center" spacing={1.5} mb={4}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${palette.teal}, ${palette.aqua})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WaterDropOutlinedIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700, color: palette.ink }}>
              AquaFlow
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Water Refilling Station
            </Typography>
          </Box>
        </Stack>

        <Paper
          variant="outlined"
          sx={{ borderRadius: 3, p: { xs: 3, sm: 4 } }}
          component="form"
          onSubmit={handleSubmit}
          noValidate
        >
          <Typography variant="h6" mb={0.5}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sign in to your account to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Email address"
              type="email"
              fullWidth
              autoComplete="email"
              autoFocus
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>

          <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
            Don&apos;t have an account?{' '}
            <Link component={RouterLink} to="/register" underline="hover" color="primary">
              Create one
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
