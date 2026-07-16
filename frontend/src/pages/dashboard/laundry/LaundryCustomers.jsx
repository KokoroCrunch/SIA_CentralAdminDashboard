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
  Stack,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from './api';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const EMPTY = { name: '', contact: '', address: '' };

export default function LaundryCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const r = await api.get('/customers');
      setCustomers(r.data);
    } catch (e) {
      setLoadError(e.response?.data?.message || e.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };
  useAutoRefresh(load);

  const openAdd = () => {
    setForm(EMPTY);
    setEditId(null);
    setDialogOpen(true);
  };
  const openEdit = (c) => {
    setForm({ name: c.name, contact: c.contact, address: c.address || '' });
    setEditId(c._id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put('/customers/' + editId, form);
        setMsg('Customer updated!');
      } else {
        await api.post('/customers', form);
        setMsg('Customer added!');
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer and all their orders?')) return;
    await api.delete('/customers/' + id);
    setMsg('Customer deleted.');
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Syne, sans-serif', color: '#0d1b2a' }}>
            Customers
          </Typography>
          <Typography color="text.secondary">Manage your customer records</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={openAdd}
          sx={{ bgcolor: '#0d1b2a', '&:hover': { bgcolor: '#1b2d42' } }}
        >
          Add Customer
        </Button>
      </Box>
      {msg && (
        <Alert severity="success" onClose={() => setMsg('')} sx={{ mb: 2, borderRadius: 2 }}>
          {msg}
        </Alert>
      )}
      {loadError && (
        <Alert severity="error" onClose={() => setLoadError('')} sx={{ mb: 2, borderRadius: 2 }}>
          {loadError}
        </Alert>
      )}
      <Card>
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#0d1b2a', borderRadius: '16px 16px 0 0' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>
            All Customers ({loading ? '...' : customers.length})
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
                  {['#', 'Name', 'Contact', 'Address', 'Orders', 'Total Spent', 'Actions'].map(
                    (h) => (
                      <TableCell
                        key={h}
                        sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6b7c93' }}
                      >
                        {h}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((c, i) => (
                  <TableRow key={c._id} hover>
                    <TableCell sx={{ color: '#6b7c93' }}>{i + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {c.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{c.contact}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {c.address || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          bgcolor: '#e8f4fd',
                          color: '#0d1b2a',
                          px: 1.5,
                          py: 0.3,
                          borderRadius: 10,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {c.order_count || 0}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <strong>₱{Number(c.total_spent || 0).toFixed(2)}</strong>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => openEdit(c)}
                          sx={{ color: '#0d1b2a', mr: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(c._id)}
                          sx={{ color: '#e53935' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!customers.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No customers yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
          {editId ? 'Edit Customer' : 'Add Customer'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Contact Number"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name}
            sx={{ bgcolor: '#0d1b2a', '&:hover': { bgcolor: '#1b2d42' } }}
          >
            {editId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
