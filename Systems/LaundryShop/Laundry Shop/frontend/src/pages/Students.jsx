import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api';

const EMPTY = {
  student_id: '',
  firstname: '',
  lastname: '',
  middlename: '',
  gender: '',
  birthdate: '',
};
const GENDER_COLORS = {
  Male: { bg: '#cfe2ff', color: '#084298' },
  Female: { bg: '#f8d7fc', color: '#6f1080' },
  Other: { bg: '#e2e3e5', color: '#41464b' },
};

function calcAge(bd) {
  if (!bd) return null;
  const diff = Date.now() - new Date(bd).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/students', { params: { search, gender: genderFilter } });
      setStudents(r.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [search, genderFilter]);

  const openAdd = () => {
    setForm(EMPTY);
    setEditId(null);
    setDialogOpen(true);
  };
  const openEdit = (s) => {
    setForm({
      student_id: s.student_id,
      firstname: s.firstname,
      lastname: s.lastname,
      middlename: s.middlename || '',
      gender: s.gender,
      birthdate: s.birthdate?.split('T')[0] || '',
    });
    setEditId(s._id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put('/students/' + editId, form);
        setMsg({ text: 'Student updated!', type: 'success' });
      } else {
        await api.post('/students', form);
        setMsg({ text: 'Student added!', type: 'success' });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Error', type: 'error' });
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm('Delete student ' + name + '?')) return;
    await api.delete('/students/' + id);
    setMsg({ text: 'Student deleted.', type: 'success' });
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
            Students
          </Typography>
          <Typography color="text.secondary">Manage student records</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={openAdd}
          sx={{ bgcolor: '#0d1b2a', '&:hover': { bgcolor: '#1b2d42' } }}
        >
          Add Student
        </Button>
      </Box>
      {msg.text && (
        <Alert
          severity={msg.type}
          onClose={() => setMsg({ ...msg, text: '' })}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {msg.text}
        </Alert>
      )}

      {/* Search & Filter */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#6b7c93' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={genderFilter}
            label="Gender"
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <MenuItem value="">All Genders</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        {(search || genderFilter) && (
          <Button
            variant="outlined"
            onClick={() => {
              setSearch('');
              setGenderFilter('');
            }}
          >
            Clear
          </Button>
        )}
      </Stack>

      <Card>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#0d1b2a', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>
            All Students ({loading ? '...' : students.length})
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Student ID', 'Full Name', 'Gender', 'Birthdate', 'Age', 'Actions'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6b7c93' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => {
                  const gc = GENDER_COLORS[s.gender] || GENDER_COLORS.Other;
                  const age = calcAge(s.birthdate);
                  return (
                    <TableRow key={s._id} hover>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            bgcolor: '#f0f4f8',
                            px: 1,
                            py: 0.3,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {s.student_id}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {s.lastname}, {s.firstname}
                          {s.middlename ? ' ' + s.middlename.charAt(0) + '.' : ''}
                        </Typography>
                        {s.middlename && (
                          <Typography variant="caption" color="text.secondary">
                            {s.middlename}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.gender}
                          size="small"
                          sx={{
                            bgcolor: gc.bg,
                            color: gc.color,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {s.birthdate
                            ? new Date(s.birthdate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {age !== null ? (
                          <Box
                            sx={{
                              display: 'inline-block',
                              bgcolor: '#e8f4fd',
                              color: '#0d1b2a',
                              px: 1.2,
                              py: 0.3,
                              borderRadius: 10,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            {age} yrs
                          </Box>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(s)}
                            sx={{ color: '#0d1b2a', mr: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(s._id, s.firstname + ' ' + s.lastname)}
                            sx={{ color: '#e53935' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!students.length && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
          {editId ? 'Edit Student' : 'Add Student'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              fullWidth
              label="Student ID (e.g. 2024-00001)"
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              required
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Last Name"
                value={form.lastname}
                onChange={(e) =>
                  setForm({ ...form, lastname: e.target.value.replace(/[0-9]/g, '') })
                }
                required
              />
              <TextField
                fullWidth
                label="First Name"
                value={form.firstname}
                onChange={(e) =>
                  setForm({ ...form, firstname: e.target.value.replace(/[0-9]/g, '') })
                }
                required
              />
            </Stack>
            <TextField
              fullWidth
              label="Middle Name (optional)"
              value={form.middlename}
              onChange={(e) =>
                setForm({ ...form, middlename: e.target.value.replace(/[0-9]/g, '') })
              }
            />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={form.gender}
                  label="Gender"
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Birthdate"
                type="date"
                value={form.birthdate}
                onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().split('T')[0] }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              !form.student_id ||
              !form.firstname ||
              !form.lastname ||
              !form.gender ||
              !form.birthdate
            }
            sx={{ bgcolor: '#0d1b2a', '&:hover': { bgcolor: '#1b2d42' } }}
          >
            {editId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
