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
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  PendingActions as PendingActionsIcon,
  Gavel as GavelIcon,
  DriveFileMove as DriveFileMoveIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// Dynamically import map component (client-side only)
const ParcelMap = dynamic(() => import('@/components/map/ParcelMap'), {
  ssr: false,
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>,
});

const ACQUISITION_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started', icon: HourglassEmptyIcon },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: PendingActionsIcon },
  { value: 'ACQUIRED', label: 'Acquired', icon: CheckCircleIcon },
  { value: 'CONDEMNED', label: 'Condemned', icon: GavelIcon },
  { value: 'RELOCATED', label: 'Relocated', icon: DriveFileMoveIcon },
];

const TITLE_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started', icon: HourglassEmptyIcon },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: PendingActionsIcon },
  { value: 'COMPLETE', label: 'Complete', icon: CheckCircleIcon },
  { value: 'CURATIVE', label: 'Curative', icon: GavelIcon },
  { value: 'HOLD', label: 'Hold', icon: PendingActionsIcon },
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
  acquisitionStatus?: string;
  titleStatus?: string;
  status?: string; // Keep for backward compatibility
  geometry?: any;
  acreage?: number | null;
  county?: string | null;
  sequence?: number | null;
  milepost?: number | null;
  notes?: any[];
  documents?: any[];
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
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedParcelIds, setSelectedParcelIds] = useState<string[]>([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; parcelId: string | null; parcelName: string }>({
    open: false,
    parcelId: null,
    parcelName: '',
  });

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
      setSnackbar({ open: true, message: 'Parcel deleted successfully' });
    },
  });

  // Update parcel status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ parcelId, status, statusType }: { parcelId: string; status: string; statusType?: string }) => {
      const body = statusType === 'title'
        ? { titleStatus: status }
        : statusType === 'acquisition'
        ? { acquisitionStatus: status }
        : { status }; // Fallback for backward compatibility

      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      const statuses = variables.statusType === 'title' ? TITLE_STATUSES : ACQUISITION_STATUSES;
      const statusLabel = statuses.find(s => s.value === variables.status)?.label || variables.status;
      const statusType = variables.statusType === 'title' ? 'Title' : 'Acquisition';
      setSnackbar({ open: true, message: `${statusType} status updated to ${statusLabel}` });
    },
  });

  const handleDeleteParcel = (parcel: Parcel, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the parcel when clicking delete
    setDeleteDialog({
      open: true,
      parcelId: parcel.id,
      parcelName: parcel.parcelNumber || parcel.pin || `Parcel ${parcel.sequence}` || 'this parcel',
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.parcelId) {
      deleteParcelMutation.mutate(deleteDialog.parcelId);
    }
    setDeleteDialog({ open: false, parcelId: null, parcelName: '' });
  };

  const handleStatusChange = (parcelId: string, newStatus: string, statusType: 'acquisition' | 'title' = 'acquisition') => {
    updateStatusMutation.mutate({ parcelId, status: newStatus, statusType });
  };

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (status: string) => {
      const promises = selectedParcelIds.map(parcelId =>
        fetch(`/api/parcels/${parcelId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      const statusLabel = STATUSES.find(s => s.value === status)?.label || status;
      setSnackbar({ open: true, message: `Updated ${selectedParcelIds.length} parcels to ${statusLabel}` });
      setSelectedParcelIds([]);
      setBulkStatusDialogOpen(false);
    },
  });

  const handleBulkStatusUpdate = (status: string) => {
    bulkUpdateMutation.mutate(status);
  };

  const toggleParcelSelection = (parcelId: string) => {
    setSelectedParcelIds(prev =>
      prev.includes(parcelId)
        ? prev.filter(id => id !== parcelId)
        : [...prev, parcelId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedParcelIds.length === filteredParcels.length) {
      setSelectedParcelIds([]);
    } else {
      setSelectedParcelIds(filteredParcels.map(p => p.id));
    }
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

  // Filter parcels based on search query and status
  const filteredParcels = project.parcels?.filter((parcel) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      parcel.parcelNumber?.toLowerCase().includes(query) ||
      parcel.owner?.toLowerCase().includes(query) ||
      parcel.county?.toLowerCase().includes(query) ||
      parcel.pin?.toLowerCase().includes(query)
    );

    const parcelStatus = parcel.acquisitionStatus || parcel.status || 'NOT_STARTED';
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(parcelStatus);

    return matchesSearch && matchesStatus;
  }) || [];

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

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
          {/* Bulk Actions Toolbar */}
          {selectedParcelIds.length > 0 && (
            <Toolbar
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                minHeight: 48,
              }}
            >
              <Typography variant="body2" sx={{ flex: 1 }}>
                {selectedParcelIds.length} selected
              </Typography>
              <Button
                size="small"
                variant="contained"
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                onClick={() => setBulkStatusDialogOpen(true)}
              >
                Update Status
              </Button>
              <Button
                size="small"
                sx={{ color: 'white', ml: 1 }}
                onClick={() => setSelectedParcelIds([])}
              >
                Clear
              </Button>
            </Toolbar>
          )}

          {/* Search and Filters */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            {filteredParcels.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Checkbox
                  checked={selectedParcelIds.length === filteredParcels.length && filteredParcels.length > 0}
                  indeterminate={selectedParcelIds.length > 0 && selectedParcelIds.length < filteredParcels.length}
                  onChange={toggleSelectAll}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Select All
                </Typography>
              </Box>
            )}
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

            {/* Acquisition Status Filter Chips */}
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
              {ACQUISITION_STATUSES.map((status) => {
                const StatusIcon = status.icon;
                const isActive = statusFilter.includes(status.value);
                return (
                  <Chip
                    key={status.value}
                    size="small"
                    icon={<StatusIcon sx={{ fontSize: 14 }} />}
                    label={status.label}
                    onClick={() => toggleStatusFilter(status.value)}
                    sx={{
                      bgcolor: isActive ? getStatusColor(status.value) : 'transparent',
                      color: isActive ? 'white' : 'text.secondary',
                      border: `1px solid ${isActive ? getStatusColor(status.value) : '#ddd'}`,
                      '&:hover': {
                        bgcolor: isActive ? getStatusColor(status.value) : '#f5f5f5',
                      },
                      fontWeight: isActive ? 'bold' : 'normal',
                    }}
                  />
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {filteredParcels.length} parcel{filteredParcels.length !== 1 ? 's' : ''}
                {statusFilter.length > 0 && ` (filtered)`}
              </Typography>
              {statusFilter.length > 0 && (
                <Button
                  size="small"
                  onClick={() => setStatusFilter([])}
                  sx={{ fontSize: '0.75rem', p: 0, minWidth: 'auto' }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>

          {/* Parcel List */}
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {filteredParcels.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <LocationOnIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {statusFilter.length > 0 || searchQuery
                    ? 'No parcels match your filters'
                    : 'No parcels yet'}
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  {statusFilter.length > 0 || searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Click "Import" or "Add Parcel" to get started'}
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
                        onClick={(e) => handleDeleteParcel(parcel, e)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <Checkbox
                      checked={selectedParcelIds.includes(parcel.id)}
                      onChange={() => toggleParcelSelection(parcel.id)}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                    <ListItemButton
                      selected={selectedParcelId === parcel.id}
                      onClick={() => setSelectedParcelId(parcel.id)}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(4px)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          borderLeft: '4px solid',
                          borderColor: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.light',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
                            <Typography variant="body1">
                              {parcel.parcelNumber || `Parcel ${parcel.sequence || 'N/A'}`}
                            </Typography>
                            <Chip
                              label={(parcel.acquisitionStatus || parcel.status || 'NOT_STARTED').replace('_', ' ')}
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(parcel.acquisitionStatus || parcel.status || 'NOT_STARTED'),
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
              {/* Acquisition Status */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Acquisition Status
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedParcel.acquisitionStatus || selectedParcel.status || 'NOT_STARTED'}
                    onChange={(e) => handleStatusChange(selectedParcel.id, e.target.value, 'acquisition')}
                    disabled={updateStatusMutation.isPending}
                    sx={{
                      '& .MuiSelect-select': {
                        bgcolor: getStatusColor(selectedParcel.acquisitionStatus || selectedParcel.status || 'NOT_STARTED'),
                        color: 'white',
                        fontWeight: 'bold',
                      },
                    }}
                  >
                    {ACQUISITION_STATUSES.map((status) => {
                      const StatusIcon = status.icon;
                      return (
                        <MenuItem key={status.value} value={status.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusIcon sx={{ fontSize: 18, color: getStatusColor(status.value) }} />
                            {status.label}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>

              {/* Title Status */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Title Status
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedParcel.titleStatus || 'NOT_STARTED'}
                    onChange={(e) => handleStatusChange(selectedParcel.id, e.target.value, 'title')}
                    disabled={updateStatusMutation.isPending}
                    sx={{
                      '& .MuiSelect-select': {
                        bgcolor: getTitleStatusColor(selectedParcel.titleStatus || 'NOT_STARTED'),
                        color: 'white',
                        fontWeight: 'bold',
                      },
                    }}
                  >
                    {TITLE_STATUSES.map((status) => {
                      const StatusIcon = status.icon;
                      return (
                        <MenuItem key={status.value} value={status.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusIcon sx={{ fontSize: 18, color: getTitleStatusColor(status.value) }} />
                            {status.label}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              {/* Parcel Identification */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TagIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="primary" fontWeight="bold">
                    Parcel Identification
                  </Typography>
                </Box>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <PersonIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="primary" fontWeight="bold">
                    Owner Information
                  </Typography>
                </Box>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <HomeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="primary" fontWeight="bold">
                    Property Information
                  </Typography>
                </Box>
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

              <Divider />

              {/* Notes */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="subtitle2" color="primary" fontWeight="bold">
                    Notes
                  </Typography>
                </Box>
                {selectedParcel.notes && selectedParcel.notes.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedParcel.notes.map((note: any, index: number) => (
                      <Paper key={index} variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {note.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No notes yet
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Documents */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="subtitle2" color="primary" fontWeight="bold">
                    Documents
                  </Typography>
                </Box>
                {selectedParcel.documents && selectedParcel.documents.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedParcel.documents.map((doc: any, index: number) => (
                      <Paper key={index} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {doc.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(doc.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No documents yet
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Success Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, parcelId: null, parcelName: '' })}
      >
        <DialogTitle>Delete Parcel?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.parcelName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, parcelId: null, parcelName: '' })}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Acquisition Status Update Dialog */}
      <Dialog open={bulkStatusDialogOpen} onClose={() => setBulkStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Acquisition Status for {selectedParcelIds.length} Parcels</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            {ACQUISITION_STATUSES.map((status) => {
              const StatusIcon = status.icon;
              return (
                <Button
                  key={status.value}
                  variant="outlined"
                  fullWidth
                  startIcon={<StatusIcon />}
                  onClick={() => handleBulkStatusUpdate(status.value)}
                  disabled={bulkUpdateMutation.isPending}
                  sx={{
                    justifyContent: 'flex-start',
                    borderColor: getStatusColor(status.value),
                    color: getStatusColor(status.value),
                    '&:hover': {
                      bgcolor: getStatusColor(status.value),
                      color: 'white',
                      borderColor: getStatusColor(status.value),
                    },
                  }}
                >
                  {status.label}
                </Button>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkStatusDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
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

// Helper function to get status icon
function getStatusIcon(status: string) {
  const statusObj = ACQUISITION_STATUSES.find(s => s.value === status);
  return statusObj?.icon || HourglassEmptyIcon;
}

// Helper function to get title status color
function getTitleStatusColor(status: string): string {
  switch (status) {
    case 'NOT_STARTED':
      return '#9e9e9e';
    case 'IN_PROGRESS':
      return '#2196f3';
    case 'COMPLETE':
      return '#4caf50';
    case 'CURATIVE':
      return '#ff9800';
    case 'HOLD':
      return '#f44336';
    default:
      return '#757575';
  }
}
