import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h4" component="h1">
        403
      </Typography>
      <Typography>You don't have permission to access this page.</Typography>
      <Link component={RouterLink} to="/dashboard">
        Go to Dashboard
      </Link>
    </Box>
  );
}
