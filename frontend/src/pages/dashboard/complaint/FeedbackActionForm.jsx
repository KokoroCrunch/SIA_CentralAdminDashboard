import { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import { complaintApi, STATUS_OPTIONS, STATUS_COLOR } from './api';
import useAutoRefresh from '../../../hooks/useAutoRefresh';

/**
 * FeedbackActionForm
 *
 * Admin / staff panel for recording feedback and action taken on complaints.
 * Shows open and in-progress complaints and lets staff update:
 *   - action_taken  (free-text feedback / response)
 *   - status        (open → in_progress → resolved → closed)
 */
export default function FeedbackActionForm() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Which statuses to show — default: unresolved ones
  const [statusFilter, setStatusFilter] = useState('pending');

  // Action dialog state
  const [selected, setSelected] = useState(null);
  const [actionText, setActionText] = useState('');
  const [newStatus, setNewStatus] = useState('open');
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  useAutoRefresh(load);

  async function load() {
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

  // Filter based on selected view
  const displayed = complaints.filter((c) => {
    if (statusFilter === 'pending') return c.status === 'open' || c.status === 'in_progress';
    if (statusFilter === 'resolved') return c.status === 'resolved' || c.status === 'closed';
    return true; // 'all'
  });

  function openActionDialog(complaint) {
    setSelected(complaint);
    setActionText(complaint.action_taken || '');
    setNewStatus(complaint.status || 'open');
    setDialogError('');
  }

  async function handleSubmit() {
    setDialogError('');
    if (!actionText.trim()) {
      setDialogError('Please enter the feedback / action taken before saving.');
      return;
    }

    setSaving(true);
    try {
      await complaintApi.update(selected._id, {
        action_taken: actionText.trim(),
        status: newStatus,
      });
      setSelected(null);
      setSuccess(`Feedback recorded for complaint ${selected.referenceNumber || selected._id}`);
      load();
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setDialogError(err.response?.data?.message || 'Failed to save feedback');
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
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <RateReviewIcon sx={{ color: '#667eea' }} />
            <Typography variant="h5" fontWeight="bold">
              Submit Feedback / Action Taken
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2" mt={0.5}>
            Record your response or action taken for each complaint. Select a complaint below to add
            feedback.
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={load}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
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

      {/* Filter tabs */}
      <Stack direction="row" spacing={1} mb={2.5}>
        {[
          {
            value: 'pending',
            label: `Pending (${complaints.filter((c) => c.status === 'open' || c.status === 'in_progress').length})`,
          },
          {
            value: 'resolved',
            label: `Resolved (${complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length})`,
          },
          { value: 'all', label: `All (${complaints.length})` },
        ].map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            onClick={() => setStatusFilter(f.value)}
            variant={statusFilter === f.value ? 'filled' : 'outlined'}
            color={statusFilter === f.value ? 'primary' : 'default'}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
        ))}
      </Stack>

      {/* Complaints table */}
      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                '& th': { bgcolor: 'rgba(102,126,234,0.06)', fontWeight: 700, fontSize: '0.78rem' },
              }}
            >
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Submitted By</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current Action Taken</TableCell>
              <TableCell align="center">Respond</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CheckCircleIcon
                    sx={{
                      fontSize: 40,
                      color: 'text.disabled',
                      mb: 1,
                      display: 'block',
                      mx: 'auto',
                    }}
                  />
                  <Typography color="text.secondary">
                    {statusFilter === 'pending'
                      ? 'No pending complaints — all caught up!'
                      : 'No complaints found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((c) => (
                <TableRow key={c._id} hover>
                  {/* Reference */}
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {c.referenceNumber || '—'}
                    </Typography>
                  </TableCell>

                  {/* Date */}
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>

                  {/* Submitted by */}
                  <TableCell>
                    {c.anonymous ? (
                      <Chip label="Anonymous" size="small" variant="outlined" />
                    ) : (
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {c.user_id?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.user_id?.email || '—'}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Chip
                      label={c.complaint_type}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>

                  {/* Message */}
                  <TableCell sx={{ maxWidth: 260 }}>
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

                  {/* Current action taken */}
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography
                      variant="body2"
                      color={c.action_taken ? 'text.primary' : 'text.disabled'}
                      noWrap
                    >
                      {c.action_taken || 'No action recorded yet'}
                    </Typography>
                  </TableCell>

                  {/* Respond button */}
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<RateReviewIcon fontSize="small" />}
                      onClick={() => openActionDialog(c)}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '0.72rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.action_taken ? 'Update' : 'Respond'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* ── Action Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <RateReviewIcon sx={{ color: '#667eea' }} />
            <span>Submit Feedback / Action Taken</span>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {selected && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {dialogError && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                  {dialogError}
                </Alert>
              )}

              {/* Complaint summary */}
              <Box sx={{ p: 2, bgcolor: 'rgba(102,126,234,0.05)', borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
                  {selected.referenceNumber && (
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {selected.referenceNumber}
                    </Typography>
                  )}
                  <Chip
                    label={selected.complaint_type}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Chip
                    label={(selected.status || 'open').replace('_', ' ')}
                    size="small"
                    color={STATUS_COLOR[selected.status] || 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  {selected.anonymous
                    ? 'Anonymous submission'
                    : `By: ${selected.user_id?.name || 'Unknown'} (${selected.user_id?.email || '—'})`}
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  "{selected.message}"
                </Typography>
              </Box>

              <Divider />

              {/* Status update */}
              <FormControl fullWidth size="small">
                <InputLabel>Update Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Update Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={s.label}
                          size="small"
                          color={STATUS_COLOR[s.value] || 'default'}
                          sx={{ minWidth: 90 }}
                        />
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Action taken */}
              <TextField
                label="Feedback / Action Taken"
                fullWidth
                multiline
                rows={5}
                required
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                placeholder="Describe the action taken or feedback given to address this complaint…"
                helperText={`${actionText.length} characters`}
                autoFocus
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSelected(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving}
            startIcon={<RateReviewIcon />}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {saving ? 'Saving...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
