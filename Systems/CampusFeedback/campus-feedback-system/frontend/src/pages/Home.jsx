import { Box, Typography, Paper, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            Hello, {user?.name}! 👋
          </Typography>
          <Typography variant="h5" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
            Welcome to the Complaint and Feedback Management System
          </Typography>
          <Typography variant="body1" sx={{ mt: 3, lineHeight: 1.8 }}>
            This system allows you to submit and track complaints about campus facilities and
            services. You can report issues related to dormitories, minimart, laundry shops, water
            refilling stations, and more. Our administration team will review and take action on
            your complaints.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default Home;
