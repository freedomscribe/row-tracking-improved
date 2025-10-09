
"use client";

import { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Project } from '@prisma/client';

// Mock API functions - replace with actual API calls
const fetchProjects = async (): Promise<Project[]> => {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.projects;
};

const deleteProject = async (id: string): Promise<void> => {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
};

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedRow, setSelectedRow] = useState<Project | null>(null);

  const { data: projects, isLoading, error } = useQuery<Project[]>({ 
    queryKey: ['projects'], 
    queryFn: fetchProjects 
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Project Name', flex: 1, renderCell: (params) => (
      <Link href={`/projects/${params.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {params.value}
      </Link>
    )}, 
    { field: 'status', headerName: 'Status', width: 150 },
    { field: 'parcels', headerName: 'Parcels', width: 120, valueGetter: (value, row) => row._count?.parcels || 0 },
    { field: 'createdAt', headerName: 'Created At', width: 180, valueFormatter: (value) => new Date(value).toLocaleDateString() },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Button size="small" startIcon={<EditIcon />} onClick={() => router.push(`/projects/${params.id}/edit`)}>Edit</Button>
          <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(params.id as string)}>Delete</Button>
        </Box>
      ),
    },
  ];

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Projects</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/projects/new')}>
          New Project
        </Button>
      </Box>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={projects || []}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          onRowClick={(params) => setSelectedRow(params.row)}
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
}

// Add a Link component if not already available
const Link = ({ href, children, ...props }: any) => (
  <a href={href} {...props}>
    {children}
  </a>
);

