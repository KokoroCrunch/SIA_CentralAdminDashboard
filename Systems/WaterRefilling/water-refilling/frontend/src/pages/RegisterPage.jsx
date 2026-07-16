import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Divider,
} from '@mui/material';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/theme';

function emptyForm() {
  return {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  };
}

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Full name, email, and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      login(res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      <Box sx={{ width: '100%', maxWidth: 480 }}>
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
            Create an account
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Fill in your details to get started
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {/* Personal info */}
            <TextField
              label="Full Name"
              fullWidth
              autoComplete="name"
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />

            <TextField
              label="Email Address"
              type="email"
              fullWidth
              autoComplete="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />

            <TextField
              label="Phone Number"
              type="tel"
              fullWidth
              autoComplete="tel"
              placeholder="e.g. 09171234567"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />

            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              autoComplete="street-address"
              placeholder="Street, Barangay, City"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />

            <Divider />

            {/* Password */}
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="new-password"
              helperText="At least 6 characters"
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

            <TextField
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              fullWidth
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowConfirm((v) => !v)}
                      edge="end"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? (
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
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </Stack>

          <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover" color="primary">
              Sign in
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
