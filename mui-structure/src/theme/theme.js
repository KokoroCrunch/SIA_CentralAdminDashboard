import { createTheme } from '@mui/material/styles';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens/designTokens';

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.primary,
      light: COLORS.primaryLight,
      dark: COLORS.primaryDark,
    },
    secondary: {
      main: COLORS.secondary,
      light: COLORS.secondaryLight,
      dark: COLORS.secondaryDark,
    },
    error: {
      main: COLORS.error,
    },
    warning: {
      main: COLORS.warning,
    },
    info: {
      main: COLORS.info,
    },
    success: {
      main: COLORS.success,
    },
    background: {
      default: COLORS.background,
      paper: COLORS.surface,
    },
    text: {
      primary: COLORS.textPrimary,
      secondary: COLORS.textSecondary,
    },
    divider: COLORS.divider,
  },

  typography: {
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  // MUI's spacing function: theme.spacing(n) = n * base
  // SPACING.sm = 8, which matches MUI's default 8px base unit
  spacing: SPACING.sm,

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768, // overridden for sidebar responsive behavior
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;
