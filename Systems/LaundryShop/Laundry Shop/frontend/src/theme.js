import { createTheme } from '@mui/material';
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0d1b2a' },
    secondary: { main: '#00c2cb' },
    success: { main: '#00b37e' },
    warning: { main: '#f0a500' },
    error: { main: '#e53935' },
    background: { default: '#f0f4f8', paper: '#ffffff' },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h1: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 700, borderRadius: 10 } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
  },
});
export default theme;
