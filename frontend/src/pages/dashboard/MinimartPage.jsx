import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';

import MinimartDashboard from './minimart/MinimartDashboard';
import MinimartProducts from './minimart/MinimartProducts';
import MinimartInventory from './minimart/MinimartInventory';
import MinimartPOS from './minimart/MinimartPOS';
import MinimartSales from './minimart/MinimartSales';

function TabPanel({ children, value, index }) {
  return (
    <Box sx={{ pt: 2, height: '100%', display: value === index ? 'block' : 'none' }}>
      {children}
    </Box>
  );
}

export default function MinimartPage() {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ height: '100%' }}>
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Minimart
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Dashboard" />
        <Tab label="Products" />
        <Tab label="Inventory" />
        <Tab label="POS" />
        <Tab label="Sales" />
      </Tabs>
      <TabPanel value={tab} index={0}>
        <MinimartDashboard />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <MinimartProducts />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <MinimartInventory />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <MinimartPOS />
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <MinimartSales />
      </TabPanel>
    </Box>
  );
}
