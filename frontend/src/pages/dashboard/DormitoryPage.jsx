import { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import DormitoryDashboard from './dormitory/DormitoryDashboard';
import RoomList from './dormitory/RoomList';
import ReservationList from './dormitory/ReservationList';
import ReservationForm from './dormitory/ReservationForm';
import DormitoryUsers from './dormitory/DormitoryUsers';
import { useAuth } from '../../context/AuthContext';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const TAB_STYLE = {
  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
  '& .Mui-selected': { color: '#667eea !important' },
  '& .MuiTabs-indicator': { backgroundColor: '#667eea' },
};

export default function DormitoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  /**
   * Tab layout:
   *
   * admin / staff:
   *   0 Dashboard | 1 Rooms | 2 Reservations | 3 Users | 4 New Reservation
   *
   * student:
   *   0 Dashboard | 1 Reservations | 2 New Reservation
   */

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          Dormitory Reservation
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={TAB_STYLE}
      >
        <Tab label="Dashboard" />
        {isAdminOrStaff && <Tab label="Rooms" />}
        <Tab label={isAdminOrStaff ? 'All Reservations' : 'My Reservations'} />
        {isAdminOrStaff && <Tab label="Users" />}
        <Tab label="New Reservation" />
      </Tabs>

      {/* Dashboard — index 0 for everyone */}
      <TabPanel value={tab} index={0}>
        <DormitoryDashboard />
      </TabPanel>

      {/* Admin/staff only tabs */}
      {isAdminOrStaff && (
        <TabPanel value={tab} index={1}>
          <RoomList />
        </TabPanel>
      )}

      {/* Reservations — index 2 for admin/staff, 1 for student */}
      <TabPanel value={tab} index={isAdminOrStaff ? 2 : 1}>
        <ReservationList />
      </TabPanel>

      {/* Users — index 3 for admin/staff only */}
      {isAdminOrStaff && (
        <TabPanel value={tab} index={3}>
          <DormitoryUsers />
        </TabPanel>
      )}

      {/* New Reservation — index 4 for admin/staff, 2 for student */}
      <TabPanel value={tab} index={isAdminOrStaff ? 4 : 2}>
        <ReservationForm />
      </TabPanel>
    </Box>
  );
}
