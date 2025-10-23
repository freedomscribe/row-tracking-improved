'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import { Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import map component (client-side only)
const ParcelMap = dynamic(() => import('@/components/map/ParcelMap'), {
  ssr: false,
  loading: () => <CircularProgress />,
});

interface Note {
  id: string;
  content: string;
  category?: string | null;
  createdAt: Date;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

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
  county?: string | null;
  status: string;
  sequence?: number | null;
  milepost?: number | null;
  geometry?: any;
  acreage?: number | null;
  notes: Note[];
  documents: Document[];
  project: {
    id: string;
    name: string;
  };
}

// Fetch parcel
const fetchParcel = async (id: string): Promise<Parcel> => {
  const res = await fetch(`/api/parcels/${id}`);
  if (!res.ok) throw new Error('Failed to fetch parcel');
  const data = await res.json();
  return data.parcel;
};

export default function ParcelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = params.parcelId as string;
  const projectId = params.id as string;
  const [tabValue, setTabValue] = useState(0);

  const { data: parcel, isLoading, error } = useQuery<Parcel>({
    queryKey: ['parcel', parcelId],
    queryFn: () => fetchParcel(parcelId),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !parcel) {
    return <Alert severity="error">Failed to load parcel</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/projects/${projectId}`)}
            sx={{ mb: 1 }}
          >
            Back to {parcel.project.name}
          </Button>
          <Typography variant="h4">
            {parcel.parcelNumber || `Parcel ${parcel.sequence || 'N/A'}`}
          </Typography>
          <Chip
            label={parcel.status.replace('_', ' ')}
            sx={{
              bgcolor: getStatusColor(parcel.status),
              color: 'white',
              fontWeight: 'bold',
              mt: 1,
            }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/projects/${projectId}/parcels/${parcelId}/edit`)}
        >
          Edit Parcel
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parcel Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <DetailField label="Parcel Number" value={parcel.parcelNumber} />
              <DetailField label="PIN" value={parcel.pin} />
              <DetailField label="Sequence" value={parcel.sequence} />
              <DetailField label="Milepost" value={parcel.milepost} />
              <DetailField label="County" value={parcel.county} />
              <DetailField label="Acreage" value={parcel.acreage ? `${parcel.acreage} acres` : null} />
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Owner Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <DetailField label="Owner Name" value={parcel.owner} />
              <DetailField label="Email" value={parcel.ownerEmail} />
              <DetailField label="Phone" value={parcel.ownerPhone} />
              <DetailField label="Address" value={parcel.ownerAddress} fullWidth />
              <DetailField
                label="City, State ZIP"
                value={
                  parcel.ownerCity || parcel.ownerState || parcel.ownerZip
                    ? `${parcel.ownerCity || ''} ${parcel.ownerState || ''} ${parcel.ownerZip || ''}`.trim()
                    : null
                }
                fullWidth
              />
            </Grid>

            {parcel.legalDesc && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Legal Description
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">{parcel.legalDesc}</Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Map and Tabs */}
        <Grid item xs={12} md={6}>
          {/* Map */}
          {parcel.geometry && (
            <Paper sx={{ p: 2, mb: 3, height: 400 }}>
              <ParcelMap parcels={[parcel]} selectedParcelId={parcel.id} />
            </Paper>
          )}

          {/* Tabs for Notes and Documents */}
          <Paper sx={{ p: 2 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label={`Notes (${parcel.notes.length})`} />
              <Tab label={`Documents (${parcel.documents.length})`} />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {tabValue === 0 && (
                <Box>
                  {parcel.notes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No notes yet
                    </Typography>
                  ) : (
                    <List>
                      {parcel.notes.map((note) => (
                        <ListItem key={note.id} divider>
                          <ListItemText
                            primary={note.content}
                            secondary={
                              <>
                                {note.category && <Chip label={note.category} size="small" sx={{ mr: 1 }} />}
                                {new Date(note.createdAt).toLocaleDateString()}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  <Button variant="outlined" sx={{ mt: 2 }} fullWidth>
                    Add Note
                  </Button>
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  {parcel.documents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No documents yet
                    </Typography>
                  ) : (
                    <List>
                      {parcel.documents.map((doc) => (
                        <ListItem key={doc.id} divider>
                          <ListItemText
                            primary={doc.name}
                            secondary={
                              <>
                                {doc.type} • {(doc.size / 1024).toFixed(2)} KB •{' '}
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  <Button variant="outlined" sx={{ mt: 2 }} fullWidth>
                    Upload Document
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Helper component for detail fields
function DetailField({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | number | null | undefined;
  fullWidth?: boolean;
}) {
  if (!value) return null;

  return (
    <Grid item xs={fullWidth ? 12 : 6}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Grid>
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
