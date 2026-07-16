import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import WaterDashboard from './water/WaterDashboard';
import WaterOrders from './water/WaterOrders';
import WaterProducts from './water/WaterProducts';
import WaterCustomers from './water/WaterCustomers';
import WaterDelivery from './water/WaterDelivery';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function WaterStationPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          Water Station
        </Typography>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
        <Tab label="Dashboard" />
        <Tab label="Orders" />
        <Tab label="Products" />
        <Tab label="Customers" />
        <Tab label="Delivery" />
      </Tabs>
      <TabPanel value={tab} index={0}>
        <WaterDashboard />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <WaterOrders />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <WaterProducts />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <WaterCustomers />
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <WaterDelivery />
      </TabPanel>
    </Box>
  );
}
