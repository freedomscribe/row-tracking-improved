'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// Dynamically import map component (client-side only)
const ParcelMap = dynamic(() => import('@/components/map/ParcelMap'), {
  ssr: false,
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>,
});

const STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ACQUIRED', label: 'Acquired' },
  { value: 'CONDEMNED', label: 'Condemned' },
  { value: 'RELOCATED', label: 'Relocated' },
];

interface Parcel {
  id: string;
  parcelNumber?: string | null;
  pin?: string | null;
  owner?: string | null;
  ownerAddress?: string | null;
  ownerCity?: string | null;
  ownerState?: string | null;
  ownerZip?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  legalDesc?: string | null;
  status: string;
  geometry?: any;
  acreage?: number | null;
  county?: string | null;
  sequence?: number | null;
  milepost?: number | null;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  parcels: Parcel[];
}

// Fetch project with parcels
const fetchProject = async (id: string): Promise<Project> => {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  const data = await res.json();
  return data.project;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: project, isLoading, error} = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  });

  // Delete parcel mutation
  const deleteParcelMutation = useMutation({
    mutationFn: async (parcelId: string) => {
      const res = await fetch(`/api/parcels/${parcelId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete parcel');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setSelectedParcelId(null);
    },
  });

  // Update parcel status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ parcelId, status }: { parcelId: string; status: string }) => {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const handleDeleteParcel = (parcelId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the parcel when clicking delete
    if (window.confirm('Are you sure you want to delete this parcel?')) {
      deleteParcelMutation.mutate(parcelId);
    }
  };

  const handleStatusChange = (parcelId: string, newStatus: string) => {
    updateStatusMutation.mutate({ parcelId, status: newStatus });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load project: {error.message}</Alert>;
  }

  if (!project) {
    return <Alert severity="error">Project not found</Alert>;
  }

  // Filter parcels based on search query
  const filteredParcels = project.parcels?.filter((parcel) => {
    const query = searchQuery.toLowerCase();
    return (
      parcel.parcelNumber?.toLowerCase().includes(query) ||
      parcel.owner?.toLowerCase().includes(query) ||
      parcel.county?.toLowerCase().includes(query)
    );
  }) || [];

  const selectedParcel = filteredParcels.find((p) => p.id === selectedParcelId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">{project.name}</Typography>
          {project.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {project.description}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => router.push(`/projects/${projectId}/import`)}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => router.push(`/projects/${projectId}/export`)}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push(`/projects/${projectId}/parcels/new`)}
          >
            Add Parcel
          </Button>
        </Box>
      </Box>

      {/* Main Content: Side Panel + Map */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
        {/* Side Panel - Parcel List */}
        <Paper
          sx={{
            width: 400,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search and Filters */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search parcels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {filteredParcels.length} parcel{filteredParcels.length !== 1 ? 's' : ''}
              </Typography>
              <IconButton size="small">
                <FilterIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Parcel List */}
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {filteredParcels.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No parcels found. Click "Add Parcel" to get started.
                </Typography>
              </Box>
            ) : (
              filteredParcels.map((parcel) => (
                <Box key={parcel.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => handleDeleteParcel(parcel.id, e)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      selected={selectedParcelId === parcel.id}
                      onClick={() => setSelectedParcelId(parcel.id)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
                            <Typography variant="body1">
                              {parcel.parcelNumber || `Parcel ${parcel.sequence || 'N/A'}`}
                            </Typography>
                            <Chip
                              label={parcel.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(parcel.status),
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            {parcel.owner && (
                              <Typography variant="body2" color="text.secondary">
                                Owner: {parcel.owner}
                              </Typography>
                            )}
                            {parcel.county && (
                              <Typography variant="caption" color="text.secondary">
                                {parcel.county} County
                                {parcel.acreage && ` • ${parcel.acreage} acres`}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </Box>
              ))
            )}
          </List>
        </Paper>

        {/* Map Area */}
        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ParcelMap
            parcels={filteredParcels}
            selectedParcelId={selectedParcelId}
            onParcelClick={(id) => setSelectedParcelId(id)}
          />
        </Paper>

        {/* Parcel Detail Panel (shows when parcel is selected) */}
        {selectedParcel && (
          <Paper
            sx={{
              width: 400,
              flexShrink: 0,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
              <Typography variant="h6">Parcel Details</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => router.push(`/projects/${projectId}/parcels/${selectedParcel.id}/edit`)}
              >
                Edit
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Status */}
              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedParcel.status}
                    label="Status"
                    onChange={(e) => handleStatusChange(selectedParcel.id, e.target.value)}
                    disabled={updateStatusMutation.isPending}
                    sx={{
                      '& .MuiSelect-select': {
                        bgcolor: getStatusColor(selectedParcel.status),
                        color: 'white',
                        fontWeight: 'bold',
                      },
                    }}
                  >
                    {STATUSES.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: getStatusColor(status.value),
                            }}
                          />
                          {status.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              {/* Parcel Identification */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Parcel Identification
                </Typography>
                {selectedParcel.pin && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      PIN/RPC
                    </Typography>
                    <Typography variant="body2">{selectedParcel.pin}</Typography>
                  </Box>
                )}
                {selectedParcel.parcelNumber && selectedParcel.parcelNumber !== selectedParcel.pin && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Parcel Number
                    </Typography>
                    <Typography variant="body2">{selectedParcel.parcelNumber}</Typography>
                  </Box>
                )}
                {selectedParcel.sequence && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Sequence
                    </Typography>
                    <Typography variant="body2">{selectedParcel.sequence}</Typography>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Owner Information */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Owner Information
                </Typography>
                {selectedParcel.owner && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Owner Name
                    </Typography>
                    <Typography variant="body2">{selectedParcel.owner}</Typography>
                  </Box>
                )}
                {selectedParcel.ownerAddress && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Mailing Address
                    </Typography>
                    <Typography variant="body2">{selectedParcel.ownerAddress}</Typography>
                    {(selectedParcel.ownerCity || selectedParcel.ownerState || selectedParcel.ownerZip) && (
                      <Typography variant="body2">
                        {selectedParcel.ownerCity && `${selectedParcel.ownerCity}, `}
                        {selectedParcel.ownerState} {selectedParcel.ownerZip}
                      </Typography>
                    )}
                  </Box>
                )}
                {selectedParcel.ownerPhone && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body2">{selectedParcel.ownerPhone}</Typography>
                  </Box>
                )}
                {selectedParcel.ownerEmail && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2">{selectedParcel.ownerEmail}</Typography>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Property Information */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Property Information
                </Typography>
                {selectedParcel.county && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      County
                    </Typography>
                    <Typography variant="body2">{selectedParcel.county}</Typography>
                  </Box>
                )}
                {selectedParcel.acreage && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Acreage
                    </Typography>
                    <Typography variant="body2">{selectedParcel.acreage} acres</Typography>
                  </Box>
                )}
                {selectedParcel.milepost && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Milepost
                    </Typography>
                    <Typography variant="body2">{selectedParcel.milepost}</Typography>
                  </Box>
                )}
                {selectedParcel.legalDesc && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Property Details
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {selectedParcel.legalDesc}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

// Helper function to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'NOT_STARTED':
      return '#9e9e9e';
    case 'IN_PROGRESS':
      return '#2196f3';
    case 'ACQUIRED':
      return '#4caf50';
    case 'CONDEMNED':
      return '#ff9800';
    case 'RELOCATED':
      return '#9c27b0';
    default:
      return '#757575';
  }
}
