import { Chip } from '@mui/material';
import { palette } from '../theme/theme';

const STATUS_STYLES = {
  Pending: { bg: 'rgba(217,142,44,0.14)', color: palette.amber },
  Processing: { bg: 'rgba(63,182,196,0.16)', color: palette.tealDark },
  'Out for Delivery': { bg: 'rgba(208,106,26,0.14)', color: palette.orange },
  Delivered: { bg: 'rgba(76,140,92,0.14)', color: palette.moss },
};

export default function StatusChip({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <Chip
      label={status}
      size="small"
      sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 700 }}
    />
  );
}
