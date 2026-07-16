import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import LaundryDashboard from './laundry/LaundryDashboard';
import LaundryOrders from './laundry/LaundryOrders';
import LaundryCustomers from './laundry/LaundryCustomers';
import LaundryPayments from './laundry/LaundryPayments';
import LaundryReports from './laundry/LaundryReports';
import LaundryStudents from './laundry/LaundryStudents';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function LaundryPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          Laundry Shop
        </Typography>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
        <Tab label="Dashboard" />
        <Tab label="Orders" />
        <Tab label="Customers" />
        <Tab label="Payments" />
        <Tab label="Reports" />
        <Tab label="Students" />
      </Tabs>
      <TabPanel value={tab} index={0}>
        <LaundryDashboard />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <LaundryOrders />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <LaundryCustomers />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <LaundryPayments />
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <LaundryReports />
      </TabPanel>
      <TabPanel value={tab} index={5}>
        <LaundryStudents />
      </TabPanel>
    </Box>
  );
}
