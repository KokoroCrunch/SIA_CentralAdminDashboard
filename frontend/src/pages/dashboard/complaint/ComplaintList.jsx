import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { complaintApi, COMPLAINT_TYPES, STATUS_OPTIONS, STATUS_COLOR } from './api';
import AttachmentViewer from './AttachmentViewer';
import { useAuth } from '../../../context/AuthContext';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

export default function ComplaintList() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionTaken, setActionTaken] = useState('');
  const [newStatus, setNewStatus] = useState('open');
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const isAdmin = user?.role === 'admin';
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  useAutoRefresh(loadComplaints);
  useEffect(() => {
    applyFilters();
  }, [complaints, filterType, filterStatus]);

  async function loadComplaints() {
    setLoading(true);
    setError('');
    try {
      const res = await complaintApi.getAll();
      setComplaints(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let f = [...complaints];
    if (filterType !== 'all') f = f.filter((c) => c.complaint_type === filterType);
    if (filterStatus !== 'all') f = f.filter((c) => (c.status || 'open') === filterStatus);
    setFiltered(f);
  }

  function openEdit(complaint) {
    setSelected(complaint);
    setActionTaken(complaint.action_taken || '');
    setNewStatus(complaint.status || 'open');
    setEditDialog(true);
  }

  function openDelete(complaint) {
    setSelected(complaint);
    setDeleteDialog(true);
  }

  async function handleUpdate() {
    setSaving(true);
    try {
      await complaintApi.update(selected._id, { action_taken: actionTaken, status: newStatus });
      setEditDialog(false);
      loadComplaints();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update complaint');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await complaintApi.remove(selected._id);
      setDeleteDialog(false);
      loadComplaints();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete complaint');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      {/* ── Header + filters ── */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2.5}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight="bold">
          {isAdminOrStaff
            ? `All Feedback (${filtered.length})`
            : `My Feedback (${filtered.length})`}
        </Typography>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterType}
              label="Category"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {COMPLAINT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Table ── */}
      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(102,126,234,0.05)' }}>
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
              {isAdminOrStaff && <TableCell>Submitted By</TableCell>}
              <TableCell>Category</TableCell>
              <TableCell>Message / Attachments</TableCell>
              <TableCell>Status</TableCell>
              {isAdminOrStaff && <TableCell>Action Taken</TableCell>}
              {isAdminOrStaff && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdminOrStaff ? 8 : 5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No complaints found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c._id} hover>
                  {/* Reference */}
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      {c.referenceNumber || '—'}
                    </Typography>
                  </TableCell>

                  {/* Date */}
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.createdAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>

                  {/* Submitted by */}
                  {isAdminOrStaff && (
                    <TableCell>
                      {c.anonymous ? (
                        <Chip label="Anonymous" size="small" variant="outlined" />
                      ) : (
                        <>
                          <Typography variant="body2">{c.user_id?.name || 'Unknown'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.user_id?.email || '—'}
                          </Typography>
                          {c.user_id?.role && (
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                label={c.user_id.role}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }}
                                color={
                                  c.user_id.role === 'admin'
                                    ? 'error'
                                    : c.user_id.role === 'staff'
                                      ? 'primary'
                                      : 'default'
                                }
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </TableCell>
                  )}

                  {/* Category */}
                  <TableCell>
                    <Chip
                      label={c.complaint_type}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>

                  {/* Message + attachments */}
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {c.message}
                    </Typography>
                    {c.attachments?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <AttachmentViewer complaintId={c._id} attachments={c.attachments} />
                      </Box>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      label={(c.status || 'open').replace('_', ' ')}
                      size="small"
                      color={STATUS_COLOR[c.status] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>

                  {/* Action taken */}
                  {isAdminOrStaff && (
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>
                        {c.action_taken || '—'}
                      </Typography>
                    </TableCell>
                  )}

                  {/* Edit / Delete */}
                  {isAdminOrStaff && (
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                        <IconButton size="small" onClick={() => openEdit(c)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {isAdmin && (
                          <IconButton size="small" onClick={() => openDelete(c)}>
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* ── Edit dialog ── */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Submitter */}
            {selected?.anonymous ? (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Chip label="Anonymous submission" size="small" variant="outlined" />
              </Box>
            ) : (
              selected?.user_id?.name && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(102,126,234,0.05)', borderRadius: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="bold"
                    display="block"
                    gutterBottom
                  >
                    SUBMITTED BY
                  </Typography>
                  <Typography variant="body2">
                    {selected.user_id.name}{' '}
                    <Chip
                      label={selected.user_id.role}
                      size="small"
                      sx={{ textTransform: 'capitalize', height: 18, fontSize: '0.68rem', ml: 0.5 }}
                      color={
                        selected.user_id.role === 'admin'
                          ? 'error'
                          : selected.user_id.role === 'staff'
                            ? 'primary'
                            : 'default'
                      }
                    />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selected.user_id.email}
                  </Typography>
                </Box>
              )
            )}

            {/* Ref + category */}
            <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" alignItems="center">
              {selected?.referenceNumber && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Ref:</strong> {selected.referenceNumber}
                </Typography>
              )}
              <Chip
                label={selected?.complaint_type}
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            </Stack>

            {/* Message */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              <strong>Message:</strong>
            </Typography>
            <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2">{selected?.message}</Typography>
            </Box>

            {/* Attachments */}
            {selected?.attachments?.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Attachments:</strong>
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <AttachmentViewer complaintId={selected._id} attachments={selected.attachments} />
                </Box>
                <Divider sx={{ mb: 2 }} />
              </>
            )}

            {/* Status */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Action taken */}
            <TextField
              label="Action Taken"
              fullWidth
              multiline
              rows={4}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Describe the action taken to resolve this complaint..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleUpdate} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Feedback?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this feedback? This action cannot be undone.
          </Typography>
          {selected?.referenceNumber && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Ref: {selected.referenceNumber}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
