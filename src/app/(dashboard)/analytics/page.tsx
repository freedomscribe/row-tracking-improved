'use client';

import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Project {
  id: string;
  name: string;
  status: string;
  _count: {
    parcels: number;
  };
}

interface Parcel {
  id: string;
  status: string;
  county?: string | null;
  acreage?: number | null;
}

// Fetch projects
const fetchProjects = async (): Promise<Project[]> => {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.projects;
};

// Fetch all parcels
const fetchParcels = async (): Promise<Parcel[]> => {
  const res = await fetch('/api/parcels');
  if (!res.ok) throw new Error('Failed to fetch parcels');
  const data = await res.json();
  return data.parcels;
};

const STATUS_COLORS = {
  NOT_STARTED: '#9e9e9e',
  IN_PROGRESS: '#2196f3',
  ACQUIRED: '#4caf50',
  CONDEMNED: '#ff9800',
  RELOCATED: '#9c27b0',
};

export default function AnalyticsPage() {
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const { data: parcels, isLoading: parcelsLoading } = useQuery<Parcel[]>({
    queryKey: ['parcels'],
    queryFn: fetchParcels,
  });

  if (projectsLoading || parcelsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate statistics
  const totalProjects = projects?.length || 0;
  const totalParcels = parcels?.length || 0;
  const totalAcreage = parcels?.reduce((sum, p) => sum + (p.acreage || 0), 0) || 0;

  // Status distribution for pie chart
  const statusData = Object.entries(
    parcels?.reduce((acc, parcel) => {
      acc[parcel.status] = (acc[parcel.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  ).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#757575',
  }));

  // County distribution for bar chart
  const countyData = Object.entries(
    parcels
      ?.filter((p) => p.county)
      .reduce((acc, parcel) => {
        const county = parcel.county || 'Unknown';
        acc[county] = (acc[county] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
  )
    .map(([county, count]) => ({ county, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 counties

  // Project parcels distribution
  const projectData =
    projects
      ?.map((project) => ({
        name: project.name,
        parcels: project._count.parcels,
      }))
      .sort((a, b) => b.parcels - a.parcels) || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">
              {totalProjects}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">
              {totalParcels}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Parcels
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">
              {totalAcreage.toFixed(2)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Acres
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {parcels?.filter((p) => p.status === 'ACQUIRED').length || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Acquired Parcels
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Parcel Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parcel Status Distribution
            </Typography>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info">No parcel data available</Alert>
            )}
          </Paper>
        </Grid>

        {/* Parcels by Project */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parcels by Project
            </Typography>
            {projectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="parcels" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info">No project data available</Alert>
            )}
          </Paper>
        </Grid>

        {/* Parcels by County */}
        {countyData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top 10 Counties by Parcel Count
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="county" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
