import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import api from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await api.post('/auth/login', form);
      login(r.data.token, r.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Blobs */}
        {[
          ['#00c2cb', '-150px', '-150px', '500px'],
          ['#ff6b35', 'auto', '-100px', '400px'],
          ['#5a4fcf', '50%', '20%', '300px'],
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
              opacity: 0.2,
              top,
              right,
            }}
          />
        ))}
        <Card
          sx={{
            width: '100%',
            maxWidth: 420,
            bgcolor: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 4,
            p: 4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
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
                Management System
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2.5, fontSize: '1rem' }}>
            Sign in to continue
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#00c2cb' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
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
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#00c2cb' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPw(!showPw)}
                      edge="end"
                      sx={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
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
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
          <Divider
            sx={{
              my: 2.5,
              borderColor: 'rgba(255,255,255,0.1)',
              '&::before, &::after': { borderColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              New here?
            </Typography>
          </Divider>
          <Button
            component={Link}
            to="/register"
            fullWidth
            variant="outlined"
            sx={{
              py: 1.4,
              borderColor: 'rgba(0,194,203,0.4)',
              color: '#00c2cb',
              fontFamily: 'Syne, sans-serif',
              '&:hover': { borderColor: '#00c2cb', bgcolor: 'rgba(0,194,203,0.08)' },
            }}
          >
            Create an Account
          </Button>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
