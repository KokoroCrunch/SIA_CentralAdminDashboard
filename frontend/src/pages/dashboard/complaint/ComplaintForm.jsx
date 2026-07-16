import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { complaintApi, COMPLAINT_TYPES } from './api';

export default function ComplaintForm({ onSubmitSuccess }) {
  const [form, setForm] = useState({
    complaint_type: '',
    message: '',
    anonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!form.complaint_type || !form.message.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (form.message.trim().length < 5) {
      setError('Message must be at least 5 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const res = await complaintApi.create(form);
      const created = res.data.data;
      setSuccess(created);
      setForm({ complaint_type: '', message: '', anonymous: false });
      if (onSubmitSuccess) onSubmitSuccess();
      setTimeout(() => setSuccess(null), 8000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Submit Complaint
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Let us know about any issues or concerns regarding campus facilities and services.
      </Typography>

      <Card sx={{ maxWidth: 600, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}

              {success && (
                <Alert severity="success">
                  Complaint submitted successfully!
                  {success.referenceNumber && (
                    <>
                      {' '}
                      Your reference number is <strong>{success.referenceNumber}</strong>.
                    </>
                  )}{' '}
                  We'll review it and take appropriate action.
                </Alert>
              )}

              <TextField
                label="Category"
                select
                fullWidth
                required
                value={form.complaint_type}
                onChange={(e) => setForm({ ...form, complaint_type: e.target.value })}
                helperText="Select the category that best matches your complaint"
              >
                {COMPLAINT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Message"
                multiline
                rows={6}
                fullWidth
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your complaint in detail — include location, time, and any relevant details..."
                helperText={`${form.message.length}/500 characters (minimum 5)`}
                inputProps={{ maxLength: 500 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={form.anonymous}
                    onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Submit anonymously
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your name and email will not be visible to staff
                    </Typography>
                  </Box>
                }
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                startIcon={<SendIcon />}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)' },
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 600, mt: 3, borderRadius: 3, bgcolor: 'rgba(102,126,234,0.05)' }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            💡 Tips for submitting a complaint:
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {[
              'Be specific about the issue and provide details',
              'Include location, date, and time when relevant',
              'Keep your message professional and constructive',
              'Use the anonymous option if you prefer privacy',
              'Check back later using your reference number to see updates',
            ].map((tip) => (
              <Typography key={tip} variant="body2" color="text.secondary">
                • {tip}
              </Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
