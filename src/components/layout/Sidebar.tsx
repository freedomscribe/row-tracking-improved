'''
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Divider } from '@mui/material';
import Link from 'next/link';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const drawerWidth = 240;

const navItems = [
  { text: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Projects', href: '/projects', icon: <FolderIcon /> },
  { text: 'Analytics', href: '/analytics', icon: <BarChartIcon /> },
  { text: 'Settings', href: '/settings', icon: <SettingsIcon /> },
];

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          ROW Tracker
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={pathname === item.href}
              onClick={isMobile ? onClose : undefined}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={isOpen}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
'''
