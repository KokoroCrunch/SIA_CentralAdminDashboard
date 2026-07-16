import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function ComplaintList() {
  const { token, user } = useAuth();
  const [data, setData] = useState([]);
  const [actionText, setActionText] = useState({});

  useEffect(() => {
    if (token) {
      fetchComplaints();
    }
  }, [token]);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/complaints', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionChange = (id, value) => {
    setActionText((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdateAction = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/complaints/${id}`,
        {
          action_taken: actionText[id] || '',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      fetchComplaints();
      setActionText((prev) => ({ ...prev, [id]: '' }));
    } catch (err) {
      console.error(err);
      alert('⚠️ Failed to update action taken.');
    }
  };

  return (
    <Stack spacing={2}>
      {data.map((item) => (
        <Paper key={item._id} sx={{ p: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              {item.complaint_type}
            </Typography>
            {user?.role === 'admin' && (
              <Typography variant="body2" color="primary">
                <strong>From:</strong> {item.user_id?.name || 'Unknown'}
              </Typography>
            )}
          </Box>
          <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
            {item.message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Action Taken:</strong> {item.action_taken || 'None yet'}
          </Typography>
          {user?.role === 'admin' && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <TextField
                label="Action taken"
                value={actionText[item._id] || ''}
                onChange={(e) => handleActionChange(item._id, e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
              />
              <Button variant="contained" onClick={() => handleUpdateAction(item._id)}>
                Save Action
              </Button>
            </Box>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

export default ComplaintList;
