/**
 * AttachmentViewer.jsx
 *
 * Renders a list of attachment chips. Clicking a chip fetches the binary
 * via the authenticated axios instance (so the Bearer token is sent),
 * creates a blob URL, and opens it in a new tab or shows an image preview
 * dialog for image types.
 */

import { useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Tooltip,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import axiosInstance from '../../../api/axiosInstance';

const BASE = '/api/v1/complaint';

function fileIcon(mimetype) {
  if (!mimetype) return <AttachFileIcon fontSize="small" />;
  if (mimetype.startsWith('image/')) return <ImageIcon fontSize="small" />;
  if (mimetype === 'application/pdf') return <PictureAsPdfIcon fontSize="small" />;
  return <InsertDriveFileIcon fontSize="small" />;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentViewer({ complaintId, attachments = [] }) {
  const [loading, setLoading] = useState(null); // attId being loaded
  const [preview, setPreview] = useState(null); // { url, name, mime }
  const [error, setError] = useState('');

  if (!attachments.length) return null;

  async function handleClick(att) {
    setError('');
    setLoading(att._id);
    try {
      const res = await axiosInstance.get(`${BASE}/${complaintId}/attachments/${att._id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: att.mimetype || res.data.type });
      const blobUrl = URL.createObjectURL(blob);
      const name = att.originalName || att.filename || 'attachment';
      const mime = att.mimetype || '';

      if (mime.startsWith('image/')) {
        // Show inline preview dialog
        setPreview({ url: blobUrl, name, mime });
      } else {
        // Download / open in new tab
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = name;
        a.target = '_blank';
        a.click();
        // Revoke after a short delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      }
    } catch (err) {
      setError('Failed to load attachment');
    } finally {
      setLoading(null);
    }
  }

  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  function downloadPreview() {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview.url;
    a.download = preview.name;
    a.click();
  }

  return (
    <Box>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {attachments.map((att) => {
          const name = att.originalName || att.filename || 'attachment';
          const isLoading = loading === att._id;
          return (
            <Tooltip key={att._id} title={`${name}${att.size ? ' · ' + formatSize(att.size) : ''}`}>
              <Chip
                icon={
                  isLoading ? (
                    <CircularProgress size={14} sx={{ ml: '4px !important' }} />
                  ) : (
                    fileIcon(att.mimetype)
                  )
                }
                label={name.length > 24 ? name.slice(0, 22) + '…' : name}
                size="small"
                variant="outlined"
                color="primary"
                clickable
                disabled={isLoading}
                onClick={() => handleClick(att)}
                sx={{ maxWidth: 200 }}
              />
            </Tooltip>
          );
        })}
      </Stack>

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}

      {/* Image preview dialog */}
      <Dialog open={!!preview} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography noWrap sx={{ maxWidth: '80%' }}>
            {preview?.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 1, textAlign: 'center', bgcolor: '#000' }}>
          {preview && (
            <Box
              component="img"
              src={preview.url}
              alt={preview.name}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button startIcon={<DownloadIcon />} onClick={downloadPreview} variant="outlined">
            Download
          </Button>
          <Button onClick={closePreview} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
