import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  InputAdornment,
  Divider,
} from '@mui/material';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import LockIcon from '@mui/icons-material/Lock';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    contact: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const { full_name, username, contact, password, confirm } = form;
    if (!full_name || !username || !contact || !password) return 'All fields are required.';
    if (!/^[a-zA-Z\s\-\'\. ]+$/.test(full_name)) return 'Full name must contain letters only.';
    if (!/^09[0-9]{9}$/.test(contact)) return 'Contact must be 11 digits starting with 09.';
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username))
      return 'Username: 3-30 chars, letters/numbers/underscore only.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        full_name: form.full_name,
        username: form.username,
        contact: form.contact,
        password: form.password,
      });
      setSuccess('Account created! You can now log in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
      '&.Mui-focused fieldset': { borderColor: '#00c2cb' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#0d1b2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {[
          ['#00c2cb', '-150px', '-150px', '500px'],
          ['#ff6b35', 'auto', '-100px', '400px'],
        ].map(([bg, top, right, size], i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              bgcolor: bg,
              filter: 'blur(80px)',
              opacity: 0.18,
              top,
              right,
            }}
          />
        ))}
        <Card
          sx={{
            width: '100%',
            maxWidth: 460,
            bgcolor: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 4,
            p: 4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{ bgcolor: '#00c2cb', borderRadius: 2, p: 1, display: 'flex' }}>
              <LocalLaundryServiceIcon sx={{ color: '#0d1b2a', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  color: 'white',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                LaundryPro
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Create your account
              </Typography>
            </Box>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {success}
              </Alert>
              <Button
                component={Link}
                to="/login"
                fullWidth
                variant="contained"
                sx={{ bgcolor: '#00c2cb', color: '#0d1b2a', fontFamily: 'Syne, sans-serif' }}
              >
                Sign In Now
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Full Name"
                value={form.full_name}
                onChange={set('full_name')}
                required
                sx={{ ...fieldSx, mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Contact (09XXXXXXXXX)"
                value={form.contact}
                onChange={set('contact')}
                required
                inputProps={{ maxLength: 11 }}
                sx={{ ...fieldSx, mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Username"
                value={form.username}
                onChange={set('username')}
                required
                sx={{ ...fieldSx, mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AlternateEmailIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    required
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Confirm"
                    type="password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    required
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              <Box
                sx={{
                  bgcolor: 'rgba(0,194,203,0.08)',
                  border: '1px solid rgba(0,194,203,0.2)',
                  borderRadius: 2,
                  p: 1.5,
                  mb: 2,
                }}
              >
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Accounts are registered as <strong style={{ color: '#00c2cb' }}>Customer</strong>{' '}
                  only. Contact admin to upgrade.
                </Typography>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  bgcolor: '#00c2cb',
                  color: '#0d1b2a',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#00a8b0' },
                }}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </Box>
          )}
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00c2cb', fontWeight: 600 }}>
              Sign in
            </Link>
          </Typography>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
