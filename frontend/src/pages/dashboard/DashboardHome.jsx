import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useAuth } from '../../context/AuthContext';

export default function DashboardHome() {
  const { user } = useAuth();
  return (
    <Box>
      <Card sx={{ maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </Typography>
          {user?.role && (
            <Chip
              label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              color="primary"
              size="small"
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
