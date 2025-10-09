import Link from 'next/link';
import { Button, Container, Typography, Box, Grid, Card, CardContent } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SecurityIcon from '@mui/icons-material/Security';

export default function HomePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 12,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            ROW Tracking
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Professional Right-of-Way Management for Transmission Line Projects
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              component={Link}
              href="/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Get Started Free
            </Button>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { borderColor: 'grey.100', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
          Everything You Need
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Powerful tools to manage your ROW projects efficiently
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <MapIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Interactive Maps
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Visualize parcels with color-coded status on interactive maps with GeoJSON support
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <AssessmentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track progress with real-time statistics and visual charts
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <CloudDownloadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Export Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generate line lists in CSV and PDF formats with detailed information
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Secure & Reliable
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enterprise-grade security with automatic backups and data protection
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Start with our free plan and upgrade as you grow
          </Typography>
          <Button
            component={Link}
            href="/register"
            variant="contained"
            size="large"
            color="primary"
          >
            Create Free Account
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                ROW Tracking
              </Typography>
              <Typography variant="body2" color="grey.400">
                Professional right-of-way management for transmission line projects
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                Product
              </Typography>
              <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2" color="grey.400" sx={{ mb: 1 }}>
                  Pricing
                </Typography>
              </Link>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                Company
              </Typography>
              <Typography variant="body2" color="grey.400">
                © 2025 ROW Tracking
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

