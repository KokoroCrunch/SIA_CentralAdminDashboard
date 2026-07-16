import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Grid,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import PersonCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import api from '../api';

export default function MyProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({ full_name: user?.name || '', contact: '' });
  const [pw, setPw] = useState({ old_password: '', new_password: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState({ text: '', type: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/customers/me')
      .then((r) => {
        if (r.data) setProfile((p) => ({ ...p, contact: r.data.contact || '' }));
      })
      .catch(() => {});
  }, []);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', { full_name: profile.full_name, contact: profile.contact });
      const token = localStorage.getItem('token');
      login(token, { ...user, name: profile.full_name });
      setProfileMsg('Profile updated!');
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/password', pw);
      setPwMsg({ text: 'Password changed!', type: 'success' });
      setPw({ old_password: '', new_password: '' });
    } catch (err) {
      setPwMsg({ text: err.response?.data?.message || 'Error', type: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
          My Profile
        </Typography>
        <Typography color="text.secondary">Update your personal information</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <Box
              sx={{
                px: 2.5,
                py: 1.8,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: '#0d1b2a',
                borderRadius: '16px 16px 0 0',
              }}
            >
              <PersonCircleIcon sx={{ color: '#00c2cb' }} />
              <Typography sx={{ color: 'white', fontWeight: 700 }}>Personal Information</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {profileMsg && (
                <Alert
                  severity="success"
                  onClose={() => setProfileMsg('')}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  {profileMsg}
                </Alert>
              )}
              <Box component="form" onSubmit={handleProfile}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Username"
                    value={user?.username || ''}
                    disabled
                    sx={{ '& .MuiInputBase-input': { bgcolor: '#f0f4f8' } }}
                    helperText="Username cannot be changed."
                  />
                  <TextField
                    fullWidth
                    label="Contact Number"
                    value={profile.contact}
                    onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    sx={{
                      bgcolor: '#0d1b2a',
                      '&:hover': { bgcolor: '#1b2d42' },
                      py: 1.3,
                      fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <Box
              sx={{
                px: 2.5,
                py: 1.8,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: '#1b2d42',
                borderRadius: '16px 16px 0 0',
              }}
            >
              <LockIcon sx={{ color: '#00c2cb' }} />
              <Typography sx={{ color: 'white', fontWeight: 700 }}>Change Password</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {pwMsg.text && (
                <Alert
                  severity={pwMsg.type}
                  onClose={() => setPwMsg({ ...pwMsg, text: '' })}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  {pwMsg.text}
                </Alert>
              )}
              <Box component="form" onSubmit={handlePassword}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={pw.old_password}
                    onChange={(e) => setPw({ ...pw, old_password: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={pw.new_password}
                    onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                    required
                    inputProps={{ minLength: 6 }}
                    helperText="Minimum 6 characters."
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      bgcolor: '#1b2d42',
                      '&:hover': { bgcolor: '#0d1b2a' },
                      py: 1.3,
                      fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    Update Password
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
