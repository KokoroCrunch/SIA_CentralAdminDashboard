import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { dormitoryApi } from './api';
import { useAuth } from '../../../context/AuthContext';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

const DORM_ROLES = ['student', 'admin', 'staff'];

const ROLE_COLOR = {
  admin: 'error',
  staff: 'primary',
  student: 'default',
};

const EMPTY_ADD_FORM = {
  name: '',
  email: '',
  password: '',
  studentId: '',
  phone: '',
  role: 'student',
};

export default function DormitoryUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Add user dialog ─────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  // ── Role-change dialog ──────────────────────────────────────────────────────
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);

  // ── Delete dialog ───────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === 'admin';

  useAutoRefresh(loadUsers);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? users.filter(
            (u) =>
              u.name?.toLowerCase().includes(q) ||
              u.email?.toLowerCase().includes(q) ||
              u.studentId?.toLowerCase().includes(q),
          )
        : users,
    );
  }, [search, users]);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const res = await dormitoryApi.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  // ── Add user ────────────────────────────────────────────────────────────────

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
      await dormitoryApi.createUser(addForm);
      setAddOpen(false);
      setSuccess('User created successfully');
      loadUsers();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setAddSaving(false);
    }
  }

  // ── Role change ─────────────────────────────────────────────────────────────

  function openRoleDialog(u) {
    setRoleTarget(u);
    setNewRole(u.role || 'student');
  }

  async function handleRoleChange() {
    if (newRole === (roleTarget.role || 'student')) {
      setRoleTarget(null);
      return;
    }
    setRoleSaving(true);
    try {
      await dormitoryApi.updateUserRole(roleTarget._id, newRole);
      setSuccess(`Role updated to "${newRole}" for ${roleTarget.name}`);
      setRoleTarget(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
      setRoleTarget(null);
    } finally {
      setRoleSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true);
    try {
      await dormitoryApi.deleteUser(deleteTarget._id);
      setSuccess(`${deleteTarget.name} removed.`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2.5}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight="bold">
          Dormitory Users ({filtered.length})
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Search name, email or student ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={openAdd}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                whiteSpace: 'nowrap',
              }}
            >
              Add User
            </Button>
          )}
        </Stack>
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
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(102,126,234,0.05)' }}>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Registered</TableCell>
              {isAdmin && (
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} align="center" sx={{ py: 6 }}>
                  <PersonIcon
                    sx={{
                      fontSize: 48,
                      color: 'text.secondary',
                      mb: 1,
                      display: 'block',
                      mx: 'auto',
                    }}
                  />
                  <Typography color="text.secondary">
                    {search ? 'No users match your search' : 'No users found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {u.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {u.studentId || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{u.phone || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.role || 'student'}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                      color={ROLE_COLOR[u.role] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        <Tooltip title="Change role">
                          <IconButton size="small" onClick={() => openRoleDialog(u)}>
                            <ManageAccountsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove user">
                          <IconButton size="small" onClick={() => setDeleteTarget(u)}>
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  )}
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
            <span>Add Dormitory User</span>
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
              autoFocus
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

            <Divider />

            <TextField
              label="Student ID"
              fullWidth
              value={addForm.studentId}
              onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
              placeholder="e.g. 2021-00001"
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              placeholder="e.g. 09XX-XXX-XXXX"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={addForm.role}
                label="Role"
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              >
                {DORM_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    <Chip
                      label={r}
                      size="small"
                      color={ROLE_COLOR[r] || 'default'}
                      sx={{ textTransform: 'capitalize', minWidth: 64 }}
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
            {addSaving ? 'Creating…' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Change Role Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!roleTarget} onClose={() => setRoleTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Role</DialogTitle>
        <DialogContent>
          {roleTarget && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(102,126,234,0.05)', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600}>
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
                    label={roleTarget.role || 'student'}
                    size="small"
                    color={ROLE_COLOR[roleTarget.role] || 'default'}
                    sx={{ textTransform: 'capitalize', ml: 0.5, height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>
              <FormControl fullWidth>
                <InputLabel>New Role</InputLabel>
                <Select
                  value={newRole}
                  label="New Role"
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {DORM_ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      <Chip
                        label={r}
                        size="small"
                        color={ROLE_COLOR[r] || 'default'}
                        sx={{ textTransform: 'capitalize', minWidth: 64 }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            disabled={roleSaving || newRole === (roleTarget?.role || 'student')}
          >
            {roleSaving ? 'Saving…' : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove User?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) from the dormitory
            system? Their reservation history will remain.
          </Typography>
          {deleteTarget && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                bgcolor: 'rgba(211,47,47,0.05)',
                borderRadius: 1.5,
                border: '1px solid rgba(211,47,47,0.15)',
              }}
            >
              <Chip
                label={deleteTarget.role || 'student'}
                size="small"
                color={ROLE_COLOR[deleteTarget.role] || 'default'}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
