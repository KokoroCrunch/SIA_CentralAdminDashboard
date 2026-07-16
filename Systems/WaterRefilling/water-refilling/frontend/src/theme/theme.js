import { createTheme } from '@mui/material/styles';

// Palette grounded in the water refilling theme:
// Deep cyan-teal reads as "water" without tipping into generic blue;
// ink-navy surfaces keep dense tables legible.
const palette = {
  ink: '#0B1F2A', // near-black navy — sidebar / headers
  surface: '#F6F8F8', // page background, cool off-white
  paper: '#FFFFFF',
  teal: '#0E7C86', // primary accent — treated-water teal
  tealDark: '#0A5C64',
  aqua: '#3FB6C4', // secondary accent, lighter wash
  amber: '#D98E2C', // warning / Pending status
  coral: '#C75450', // danger / delete
  moss: '#4C8C5C', // success / Delivered
  orange: '#D06A1A', // Out for Delivery
  slate: '#5B6B73', // muted text
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palette.teal, dark: palette.tealDark, contrastText: '#fff' },
    secondary: { main: palette.aqua },
    error: { main: palette.coral },
    warning: { main: palette.amber },
    success: { main: palette.moss },
    background: { default: palette.surface, paper: palette.paper },
    text: { primary: palette.ink, secondary: palette.slate },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h5: { fontWeight: 700, letterSpacing: -0.2 },
    h6: { fontWeight: 700, letterSpacing: -0.2 },
    button: { fontWeight: 600, textTransform: 'none' },
    body2: { fontSize: '0.875rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, boxShadow: 'none' },
        contained: { boxShadow: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none', borderBottom: '1px solid rgba(11,31,42,0.08)' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: '0.75rem' } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: palette.slate,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
      },
    },
  },
});

export default theme;
export { palette };
