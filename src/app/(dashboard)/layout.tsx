"use client";

import { useState } from 'react';
import { Box, useMediaQuery, Theme } from '@mui/material';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarToggle} isMobile={isMobile} />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Header onSidebarToggle={handleSidebarToggle} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
'''
