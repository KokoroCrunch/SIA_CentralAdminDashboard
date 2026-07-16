import React from 'react';
import { Chip } from '@mui/material';
const MAP = {
  unpaid: { label: 'Unpaid', color: '#e53935', bg: '#fdecea' },
  pending_verification: { label: 'Verifying', color: '#f0a500', bg: '#fff8e1' },
  paid: { label: 'Paid', color: '#00b37e', bg: '#e8f5e9' },
};
export default function PaymentChip({ status }) {
  const s = MAP[status] || MAP.unpaid;
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.72rem' }}
    />
  );
}
