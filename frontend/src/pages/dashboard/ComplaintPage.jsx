import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ComplaintDashboard from './complaint/ComplaintDashboard';
import ComplaintList from './complaint/ComplaintList';
import ComplaintForm from './complaint/ComplaintForm';
import FeedbackActionForm from './complaint/FeedbackActionForm';
import UserManagement from './complaint/UserManagement';
import { useAuth } from '../../context/AuthContext';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const TAB_SX = {
  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
  '& .Mui-selected': { color: '#667eea !important' },
  '& .MuiTabs-indicator': { backgroundColor: '#667eea' },
};

export default function ComplaintPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  const isAdmin = user?.role === 'admin';
  const isAdminOrStaff = isAdmin || user?.role === 'staff';

  /**
   * Tab layout:
   *
   * admin:   Dashboard | All Feedback | Submit Complaint | Submit Feedback/Action | User Management
   * staff:   Dashboard | All Feedback | Submit Complaint | Submit Feedback/Action
   * student: Dashboard | My Feedback  | Submit Complaint
   */

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          Complaint &amp; Feedback Management
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={TAB_SX}
      >
        <Tab label="Dashboard" />
        <Tab label={isAdminOrStaff ? 'All Feedback' : 'My Feedback'} />
        <Tab label="Submit Complaint" />
        {isAdminOrStaff && (
          <Tab
            label="Submit Feedback / Action"
            icon={<RateReviewIcon fontSize="small" />}
            iconPosition="start"
          />
        )}
        {isAdmin && (
          <Tab
            label="User Management"
            icon={<AdminPanelSettingsIcon fontSize="small" />}
            iconPosition="start"
          />
        )}
      </Tabs>

      {/* 0 — Dashboard */}
      <TabPanel value={tab} index={0}>
        <ComplaintDashboard />
      </TabPanel>

      {/* 1 — All / My Feedback list */}
      <TabPanel value={tab} index={1}>
        <ComplaintList />
      </TabPanel>

      {/* 2 — Submit Complaint (all roles) */}
      <TabPanel value={tab} index={2}>
        <ComplaintForm />
      </TabPanel>

      {/* 3 — Submit Feedback / Action Taken (admin + staff only) */}
      {isAdminOrStaff && (
        <TabPanel value={tab} index={3}>
          <FeedbackActionForm />
        </TabPanel>
      )}

      {/* 4 — User Management (admin only) */}
      {isAdmin && (
        <TabPanel value={tab} index={isAdminOrStaff ? 4 : 3}>
          <UserManagement />
        </TabPanel>
      )}
    </Box>
  );
}
