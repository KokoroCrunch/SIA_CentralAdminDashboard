import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Divider,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { userMgmtApi } from './api';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const ROLES = ['user', 'admin'];

const ROLE_COLOR = { admin: 'error', user: 'default' };

const EMPTY_ADD_FORM = { name: '', email: '', password: '', role: 'user' };
const EMPTY_EDIT_FORM = { name: '', email: '', role: 'user' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Add user dialog ────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  // ── Edit user dialog (name, email, role) ──────────────────────────────────
  const [editTarget, setEditTarget] = useState(null); // user object
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // ── Delete dialog ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useAutoRefresh(load);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await userMgmtApi.getAll();
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  // ── Add user ───────────────────────────────────────────────────────────────

  function openAdd() {
    setAddForm(EMPTY_ADD_FORM);
    setAddError('');
    setAddOpen(true);
  }

  async function handleAdd() {
    setAddError('');
    if (!addForm.name.trim()) return setAddError('Name is required');
    if (!addForm.email.trim()) return setAddError('Email is required');
    if (addForm.password.length < 8) return setAddError('Password must be at least 8 characters');

    setAddSaving(true);
    try {
      await userMgmtApi.create(addForm);
      setAddOpen(false);
      setSuccess('User created successfully');
      load();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setAddSaving(false);
    }
  }

  // ── Edit user ──────────────────────────────────────────────────────────────

  function openEdit(user) {
    setEditTarget(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setEditError('');
  }

  async function handleEdit() {
    setEditError('');
    if (!editForm.name.trim()) return setEditError('Name is required');
    if (!editForm.email.trim()) return setEditError('Email is required');

    // Collect only changed fields
    const updates = {};
    if (editForm.name.trim() !== editTarget.name) updates.name = editForm.name.trim();
    if (editForm.email.trim() !== editTarget.email) updates.email = editForm.email.trim();

    const roleChanged = editForm.role !== editTarget.role;

    if (!Object.keys(updates).length && !roleChanged) {
      setEditTarget(null);
      return;
    }

    setEditSaving(true);
    try {
      // Update name/email if changed
      if (Object.keys(updates).length) {
        await userMgmtApi.update(editTarget._id, updates);
      }
      // Update role separately if changed
      if (roleChanged) {
        await userMgmtApi.updateRole(editTarget._id, editForm.role);
      }
      setEditTarget(null);
      setSuccess('User updated successfully');
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleteSaving(true);
    try {
      await userMgmtApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      setSuccess('User removed');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setDeleteTarget(null);
    } finally {
      setDeleteSaving(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <AdminPanelSettingsIcon sx={{ color: '#667eea' }} />
            <Typography variant="h5" fontWeight="bold">
              User Management
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
            Manage Complaint &amp; Feedback Management System users — add accounts, change roles,
            and remove users.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={openAdd}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          Add User
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

      {/* Role summary chips */}
      <Stack direction="row" spacing={1.5} mb={2.5}>
        {ROLES.map((role) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <Chip
              key={role}
              label={`${role.charAt(0).toUpperCase() + role.slice(1)}: ${count}`}
              color={ROLE_COLOR[role]}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
            />
          );
        })}
        <Chip
          label={`Total: ${users.length}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      {/* Users table */}
      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(102,126,234,0.06)' }}>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {u.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.role}
                      size="small"
                      color={ROLE_COLOR[u.role] || 'default'}
                      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                      <Tooltip title="Edit User">
                        <IconButton size="small" onClick={() => openEdit(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove User">
                        <IconButton size="small" onClick={() => setDeleteTarget(u)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* ── Add User Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonAddIcon sx={{ color: '#667eea' }} />
            <span>Add New User</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {addError && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {addError}
              </Alert>
            )}
            <TextField
              label="Full Name"
              fullWidth
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              required
            />
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              helperText="Minimum 8 characters"
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={addForm.role}
                label="Role"
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    <Chip
                      label={r}
                      size="small"
                      color={ROLE_COLOR[r]}
                      sx={{ textTransform: 'capitalize', minWidth: 60 }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={addSaving}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {addSaving ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit User Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <EditIcon sx={{ color: '#667eea' }} />
            <span>Edit User</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {editTarget && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {editError && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                  {editError}
                </Alert>
              )}

              <TextField
                label="Full Name"
                fullWidth
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                autoFocus
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />

              <Divider />

              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editForm.role}
                  label="Role"
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      <Chip
                        label={r}
                        size="small"
                        color={ROLE_COLOR[r]}
                        sx={{ textTransform: 'capitalize', minWidth: 60 }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={editSaving}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove User?</DialogTitle>
        <DialogContent>
          {deleteTarget && (
            <Box>
              <Typography gutterBottom>
                Are you sure you want to remove this user? They will no longer be able to log in.
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'rgba(211,47,47,0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(211,47,47,0.2)',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {deleteTarget.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {deleteTarget.email}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={deleteTarget.role}
                    size="small"
                    color={ROLE_COLOR[deleteTarget.role]}
                    sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteSaving}>
            {deleteSaving ? 'Removing...' : 'Remove User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
