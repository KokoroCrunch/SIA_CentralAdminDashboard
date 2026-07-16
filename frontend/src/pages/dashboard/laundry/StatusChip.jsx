import React from 'react';
import { Chip } from '@mui/material';
const MAP = {
  Pending: { color: '#f0a500', bg: '#fff8e1' },
  Washing: { color: '#0d6efd', bg: '#e7f0ff' },
  Drying: { color: '#0097a7', bg: '#e0f7fa' },
  'Ready for Pickup': { color: '#7b1fa2', bg: '#f3e5f5' },
  Completed: { color: '#00b37e', bg: '#e8f5e9' },
  Cancelled: { color: '#e53935', bg: '#fdecea' },
};
export default function StatusChip({ status }) {
  const s = MAP[status] || { color: '#666', bg: '#eee' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.72rem' }}
    />
  );
}
