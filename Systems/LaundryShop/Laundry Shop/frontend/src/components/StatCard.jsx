import React from 'react';
import { Card, Box, Typography } from '@mui/material';
export default function StatCard({ label, value, icon, gradient }) {
  return (
    <Card sx={{ background: gradient, color: 'white', p: 2.5, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            p: 1.2,
            display: 'flex',
            fontSize: 28,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, lineHeight: 1 }}
          >
            {value}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.3 }}>
            {label}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
