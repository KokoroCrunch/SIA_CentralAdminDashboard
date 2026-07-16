import { useEffect, useState, useCallback } from 'react';
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
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import axiosInstance from '../../api/axiosInstance';

// ── Constants ────────────────────────────────────────────────────────────────

const SYSTEMS = [
  { value: 'all', label: 'All Systems' },
  { value: 'auth', label: 'Auth' },
  { value: 'users', label: 'Users' },
  { value: 'minimart', label: 'Minimart' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'water', label: 'Water Station' },
  { value: 'complaint', label: 'Complaint & Feedback Management' },
];

const SYSTEM_COLOR = {
  auth: { bg: '#fff8e1', text: '#f57f17', label: 'Auth' },
  users: { bg: '#e8eaf6', text: '#283593', label: 'Users' },
  minimart: { bg: '#e3f2fd', text: '#1565c0' },
  laundry: { bg: '#e8f5e9', text: '#2e7d32' },
  dormitory: { bg: '#fce4ec', text: '#c62828' },
  water: { bg: '#e0f7fa', text: '#00695c' },
  complaint: { bg: '#f3e5f5', text: '#6a1b9a', label: 'Complaint & Feedback' },
};

const TYPE_ICON = {
  // Entities
  Sale: '🛒',
  Order: '📦',
  Payment: '💳',
  Reservation: '🏠',
  Complaint: '📢',
  User: '👤',
  WaterUser: '👤',
  DormUser: '👤',
  ComplaintUser: '👤',
  Student: '🎓',
  Customer: '🙋',
  Product: '🏷️',
  Room: '🚪',
};

const STATUS_COLOR = {
  // Laundry
  Pending: 'warning',
  Washing: 'info',
  Drying: 'info',
  'Ready for Pickup': 'secondary',
  Completed: 'success',
  Cancelled: 'error',
  completed: 'success',
  paid: 'success',
  // Dormitory
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'error',
  // Water
  Processing: 'info',
  'Out for Delivery': 'secondary',
  Delivered: 'success',
  // Complaint
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
};

const ACTION_COLOR = {
  created: { color: '#2e7d32', bg: '#e8f5e9' },
  updated: { color: '#1565c0', bg: '#e3f2fd' },
  deleted: { color: '#c62828', bg: '#fce4ec' },
  login: { color: '#f57f17', bg: '#fff8e1' },
  logout: { color: '#6d4c41', bg: '#efebe9' },
  payment: { color: '#00695c', bg: '#e0f7fa' },
  status_change: { color: '#6a1b9a', bg: '#f3e5f5' },
};

// ── Row component (expandable) ───────────────────────────────────────────────

function LogRow({ row }) {
  const [open, setOpen] = useState(false);
  const sc = SYSTEM_COLOR[row.system] || { bg: '#f5f5f5', text: '#333' };

  return (
    <>
      <TableRow hover sx={{ '& td': { borderBottom: open ? 'none' : undefined } }}>
        {/* Expand toggle */}
        <TableCell sx={{ width: 36, p: 0.5 }}>
          <IconButton size="small" onClick={() => setOpen((o) => !o)}>
            {open ? (
              <KeyboardArrowDownIcon fontSize="small" />
            ) : (
              <KeyboardArrowRightIcon fontSize="small" />
            )}
          </IconButton>
        </TableCell>

        {/* Timestamp */}
        <TableCell sx={{ whiteSpace: 'nowrap', width: 150 }}>
          <Typography variant="body2">{new Date(row.timestamp).toLocaleDateString()}</Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(row.timestamp).toLocaleTimeString()}
          </Typography>
        </TableCell>

        {/* System */}
        <TableCell sx={{ width: 120 }}>
          <Chip
            label={sc.label || row.system.charAt(0).toUpperCase() + row.system.slice(1)}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              bgcolor: sc.bg,
              color: sc.text,
            }}
          />
        </TableCell>

        {/* Type */}
        <TableCell sx={{ width: 110 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <span style={{ fontSize: '1rem' }}>{TYPE_ICON[row.type] || '📄'}</span>
            <Typography variant="body2" fontWeight={600}>
              {row.type}
            </Typography>
          </Stack>
        </TableCell>

        {/* Action */}
        <TableCell sx={{ width: 110 }}>
          {row.action
            ? (() => {
                const ac = ACTION_COLOR[row.action] || { color: '#555', bg: '#f5f5f5' };
                return (
                  <Chip
                    label={row.action.replace(/_/g, ' ')}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      bgcolor: ac.bg,
                      color: ac.color,
                      textTransform: 'capitalize',
                    }}
                  />
                );
              })()
            : '—'}
        </TableCell>

        {/* Description */}
        <TableCell>
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 340,
            }}
          >
            {row.description}
          </Typography>
        </TableCell>

        {/* Amount */}
        <TableCell align="right" sx={{ width: 110, whiteSpace: 'nowrap' }}>
          {row.amount != null ? (
            <Typography variant="body2" fontWeight={700} color="success.main">
              ₱{Number(row.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          )}
        </TableCell>

        {/* Status */}
        <TableCell sx={{ width: 130 }}>
          {row.status ? (
            <Chip
              label={row.status.replace(/_/g, ' ')}
              size="small"
              color={STATUS_COLOR[row.status] || 'default'}
              sx={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.7rem' }}
            />
          ) : (
            '—'
          )}
        </TableCell>
      </TableRow>

      {/* Expanded detail row */}
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 6, pr: 2, py: 1.5, bgcolor: 'rgba(0,0,0,0.015)' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                display="block"
                mb={0.75}
              >
                DETAILS
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {row.id}
                  </Typography>
                </Box>
                {Object.entries(row.meta || {}).map(([k, v]) =>
                  v != null && v !== '' ? (
                    <Box key={k}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {k.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="body2">
                        {v instanceof Date || (typeof v === 'string' && /^\d{4}-\d{2}/.test(v))
                          ? new Date(v).toLocaleDateString()
                          : String(v)}
                      </Typography>
                    </Box>
                  ) : null,
                )}
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TransactionLogs() {
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [system, setSystem] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Always fetch all systems so summary chips never disappear
      const params = { system: 'all', limit: 500 };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo + 'T23:59:59';

      const res = await axiosInstance.get('/api/v1/logs', { params });
      setAllLogs(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transaction logs');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  // Apply system filter client-side so chips stay visible
  const logs = system === 'all' ? allLogs : allLogs.filter((l) => l.system === system);

  // Client-side text search
  const filtered = search.trim()
    ? logs.filter(
        (l) =>
          l.description.toLowerCase().includes(search.toLowerCase()) ||
          l.type.toLowerCase().includes(search.toLowerCase()) ||
          l.system.toLowerCase().includes(search.toLowerCase()) ||
          (l.status || '').toLowerCase().includes(search.toLowerCase()) ||
          String(l.id).includes(search),
      )
    : logs;

  // Summary counts per system (always from the full unfiltered set)
  const counts = allLogs.reduce((acc, l) => {
    acc[l.system] = (acc[l.system] || 0) + 1;
    return acc;
  }, {});

  // Total revenue (monetary entries only)
  const totalRevenue = logs
    .filter((l) => l.amount != null && ['Sale', 'Payment', 'Order', 'Reservation'].includes(l.type))
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptLongIcon sx={{ color: '#667eea' }} />
            <Typography variant="h5" fontWeight="bold">
              Transaction Logs
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            All transactions across every sub-system, newest first.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Toggle filters">
            <IconButton
              onClick={() => setShowFilters((f) => !f)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Summary chips ───────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1} mb={2.5} flexWrap="wrap" useFlexGap>
        <Chip
          label={`Total: ${allLogs.length}`}
          size="small"
          variant={system === 'all' ? 'filled' : 'outlined'}
          color={system === 'all' ? 'primary' : 'default'}
          sx={{ fontWeight: 700, cursor: 'pointer' }}
          onClick={() => setSystem('all')}
        />
        {Object.entries(counts).map(([sys, cnt]) => {
          const sc = SYSTEM_COLOR[sys] || { bg: '#f5f5f5', text: '#333' };
          const label = sc.label || sys.charAt(0).toUpperCase() + sys.slice(1);
          const isActive = system === sys;
          return (
            <Chip
              key={sys}
              label={`${label}: ${cnt}`}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: isActive ? sc.text : sc.bg,
                color: isActive ? '#fff' : sc.text,
                cursor: 'pointer',
                outline: isActive ? `2px solid ${sc.text}` : 'none',
              }}
              onClick={() => setSystem(sys)}
            />
          );
        })}
        {totalRevenue > 0 && (
          <Chip
            label={`Revenue: ₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
            <TextField
              label="System"
              select
              size="small"
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              {SYSTEMS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="From"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />

            <TextField
              label="To"
              type="date"
              size="small"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />

            {(system !== 'all' || dateFrom || dateTo) && (
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={() => {
                  setSystem('all');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear filters
              </Button>
            )}
          </Stack>
        </Paper>
      </Collapse>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <TextField
        placeholder="Search by description, type, system or status…"
        size="small"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                '& th': { bgcolor: 'rgba(102,126,234,0.06)', fontWeight: 700, fontSize: '0.78rem' },
              }}
            >
              <TableCell sx={{ width: 36 }} />
              <TableCell>Date / Time</TableCell>
              <TableCell>System</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Skeleton rows
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((__, j) => (
                    <TableCell key={j}>
                      <Box
                        sx={{
                          height: 16,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          width: j === 4 ? '80%' : '60%',
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <ReceiptLongIcon
                    sx={{
                      fontSize: 40,
                      color: 'text.disabled',
                      mb: 1,
                      display: 'block',
                      mx: 'auto',
                    }}
                  />
                  <Typography color="text.secondary">
                    {search ? 'No results match your search.' : 'No transactions found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => <LogRow key={`${row.system}-${row.id}`} row={row} />)
            )}
          </TableBody>
        </Table>

        {!loading && filtered.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Showing {filtered.length} of {logs.length} transaction{logs.length !== 1 ? 's' : ''}
                {system !== 'all'
                  ? ` in ${SYSTEMS.find((s) => s.value === system)?.label || system}`
                  : ''}
                {search ? ` matching "${search}"` : ''}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
