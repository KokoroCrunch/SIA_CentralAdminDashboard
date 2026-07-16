import { Box, Typography } from '@mui/material';
import ComplaintForm from '../components/FeedbackForm';
import ComplaintList from '../components/FeedbackList';

function Complaints() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Complaints
      </Typography>
      <ComplaintForm />
      <ComplaintList />
    </Box>
  );
}

export default Complaints;
