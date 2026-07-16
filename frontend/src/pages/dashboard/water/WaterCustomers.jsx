import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Skeleton,
  Stack,
  Chip,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import api from './api';
import ConfirmDialog from './WaterConfirmDialog';
import { palette } from './palette';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const ROLES = ['customer', 'staff', 'admin'];

const ROLE_STYLE = {
  admin: { bg: 'rgba(14,124,134,0.14)', color: palette.tealDark },
  staff: { bg: 'rgba(103,78,234,0.12)', color: '#4527a0' },
  customer: { bg: 'rgba(91,107,115,0.12)', color: palette.slate },
};

function emptyForm() {
  return { name: '', email: '', phone: '', address: '', role: 'customer' };
}

export default function WaterCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Role-change dialog
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load users.");
    } finally {
      setLoading(false);
    }
  }

  useAutoRefresh(load);

  // ── Add / Edit ────────────────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(user) {
    setEditTarget(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'customer',
    });
    setFormError('');
    setDialogOpen(true);
  }

  async function handleSave() {
    setFormError('');
    if (!form.name || !form.email) {
      setFormError('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        role: form.role,
      };
      if (editTarget) {
        await api.put(`/users/${editTarget._id}`, payload);
        setSuccess('User updated.');
      } else {
        await api.post('/users', payload);
        setSuccess('User created.');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  // ── Role change ───────────────────────────────────────────────────────────

  function openRoleDialog(user) {
    setRoleTarget(user);
    setNewRole(user.role || 'customer');
  }

  async function handleRoleChange() {
    if (newRole === (roleTarget.role || 'customer')) {
      setRoleTarget(null);
      return;
    }
    setRoleSaving(true);
    try {
      await api.put(`/users/${roleTarget._id}`, { ...roleTarget, role: newRole });
      setSuccess(`Role changed to "${newRole}".`);
      setRoleTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Role update failed.');
      setRoleTarget(null);
    } finally {
      setRoleSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      setDeleteTarget(null);
      setSuccess('User deleted.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5">Customers</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Registered users and their roles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ ml: 2, flexShrink: 0 }}
        >
          Add user
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(11,31,42,0.02)' }}>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && users.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <PeopleAltOutlinedIcon sx={{ color: palette.slate, fontSize: 32 }} />
                    <Typography color="text.secondary">No users yet.</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              users.map((u) => {
                const rs = ROLE_STYLE[u.role] || ROLE_STYLE.customer;
                return (
                  <TableRow key={u._id} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>#{u._id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                    <TableCell>{u.phone || '—'}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.address || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.role || 'customer'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'capitalize',
                          backgroundColor: rs.bg,
                          color: rs.color,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        <Tooltip title="Change role">
                          <IconButton size="small" onClick={() => openRoleDialog(u)}>
                            <ManageAccountsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit user">
                          <IconButton size="small" onClick={() => openEdit(u)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton size="small" onClick={() => setDeleteTarget(u)}>
                            <DeleteOutlineIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Paper>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editTarget ? 'Edit user' : 'New user'}</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Full Name"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <TextField
              label="Phone"
              fullWidth
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <TextField
              label="Role"
              select
              fullWidth
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => {
                const rs = ROLE_STYLE[r];
                return (
                  <MenuItem key={r} value={r}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={r}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'capitalize',
                          bgcolor: rs.bg,
                          color: rs.color,
                        }}
                      />
                    </Stack>
                  </MenuItem>
                );
              })}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving…' : editTarget ? 'Save changes' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Change Role Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!roleTarget} onClose={() => setRoleTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Change Role</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {roleTarget && (
            <Stack spacing={2.5}>
              {/* User summary */}
              <Box sx={{ p: 2, bgcolor: 'rgba(11,31,42,0.04)', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={700}>
                  {roleTarget.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleTarget.email}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current role:{' '}
                  </Typography>
                  <Chip
                    label={roleTarget.role || 'customer'}
                    size="small"
                    sx={{
                      ml: 0.5,
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      bgcolor: ROLE_STYLE[roleTarget.role || 'customer'].bg,
                      color: ROLE_STYLE[roleTarget.role || 'customer'].color,
                    }}
                  />
                </Box>
              </Box>

              <TextField
                label="New Role"
                select
                fullWidth
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {ROLES.map((r) => {
                  const rs = ROLE_STYLE[r];
                  return (
                    <MenuItem key={r} value={r}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={r}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            textTransform: 'capitalize',
                            bgcolor: rs.bg,
                            color: rs.color,
                          }}
                        />
                      </Stack>
                    </MenuItem>
                  );
                })}
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRoleTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleRoleChange}
            variant="contained"
            disabled={roleSaving || newRole === (roleTarget?.role || 'customer')}
          >
            {roleSaving ? 'Saving…' : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user?"
        description={`This will permanently remove "${deleteTarget?.name}". This can't be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </Box>
  );
}
