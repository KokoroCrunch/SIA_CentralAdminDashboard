import { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

function ComplaintForm() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    complaint_type: 'dormitory',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('http://localhost:5000/api/complaints', form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setForm({ complaint_type: 'dormitory', message: '' });
      alert('✅ Complaint submitted');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('⚠️ Failed to submit complaint.');
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Submit a Complaint
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <FormControl fullWidth margin="normal">
          <InputLabel id="complaint-type-label">Complaint Type</InputLabel>
          <Select
            labelId="complaint-type-label"
            label="Complaint Type"
            name="complaint_type"
            value={form.complaint_type}
            onChange={handleChange}
            required
          >
            <MenuItem value="dormitory">Dormitory</MenuItem>
            <MenuItem value="minimart">Minimart</MenuItem>
            <MenuItem value="laundry shop">Laundry shop</MenuItem>
            <MenuItem value="water refilling station">Water refilling station</MenuItem>
            <MenuItem value="others">Others</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Complaint"
          name="message"
          value={form.message}
          onChange={handleChange}
          multiline
          rows={4}
          fullWidth
          margin="normal"
          required
        />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Submit Complaint
        </Button>
      </Box>
    </Paper>
  );
}

export default ComplaintForm;
