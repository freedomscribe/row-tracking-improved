'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TITLE_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETE', label: 'Complete' },
  { value: 'CURATIVE', label: 'Curative' },
  { value: 'HOLD', label: 'Hold' },
];

const ACQUISITION_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ACQUIRED', label: 'Acquired' },
  { value: 'CONDEMNED', label: 'Condemned' },
  { value: 'RELOCATED', label: 'Relocated' },
];

const SPECIAL_CONDITIONS_STATUSES = [
  { value: 'NONE', label: 'None' },
  { value: 'NOTIFICATION_REQUIRED', label: 'Notification Required' },
  { value: 'LOCKED_GATE', label: 'Locked Gate' },
  { value: 'HERBICIDES', label: 'Herbicides' },
  { value: 'FORESTRY', label: 'Forestry' },
  { value: 'OTHER', label: 'Other' },
];

const DAMAGES_STATUSES = [
  { value: 'INVESTIGATE', label: 'Investigate' },
  { value: 'REPORT', label: 'Report' },
  { value: 'RESOLVED', label: 'Resolved' },
];

interface Note {
  id: string;
  content: string;
  category?: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  category?: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
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
  acquisitionStatus?: string;
  titleStatus?: string;
  damagesStatus?: string;
  specialConditionsStatus?: string;
  sequence?: number | null;
  milepost?: number | null;
  acreage?: number | null;
  notes?: Note[];
  documents?: Document[];
}

// Fetch parcel
const fetchParcel = async (id: string): Promise<Parcel> => {
  const res = await fetch(`/api/parcels/${id}`);
  if (!res.ok) throw new Error('Failed to fetch parcel');
  const data = await res.json();
  return data.parcel;
};

export default function EditParcelPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const parcelId = params.parcelId as string;
  const queryClient = useQueryClient();

  const { data: parcel, isLoading, error } = useQuery<Parcel>({
    queryKey: ['parcel', parcelId],
    queryFn: () => fetchParcel(parcelId),
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Basic Information Form
  const [basicFormData, setBasicFormData] = useState({
    parcelNumber: '',
    pin: '',
    owner: '',
    ownerAddress: '',
    ownerCity: '',
    ownerState: '',
    ownerZip: '',
    ownerPhone: '',
    ownerEmail: '',
    legalDesc: '',
    county: '',
    sequence: '',
    milepost: '',
    acreage: '',
  });

  // Status Forms
  const [titleStatus, setTitleStatus] = useState('NOT_STARTED');
  const [acquisitionStatus, setAcquisitionStatus] = useState('NOT_STARTED');
  const [specialConditionsStatus, setSpecialConditionsStatus] = useState('NONE');
  const [damagesStatus, setDamagesStatus] = useState('INVESTIGATE');

  // Note Forms
  const [titleNote, setTitleNote] = useState('');
  const [acquisitionNote, setAcquisitionNote] = useState('');
  const [specialConditionsNote, setSpecialConditionsNote] = useState('');
  const [damagesNote, setDamagesNote] = useState('');

  // Populate form when parcel loads
  useEffect(() => {
    if (parcel) {
      setBasicFormData({
        parcelNumber: parcel.parcelNumber || '',
        pin: parcel.pin || '',
        owner: parcel.owner || '',
        ownerAddress: parcel.ownerAddress || '',
        ownerCity: parcel.ownerCity || '',
        ownerState: parcel.ownerState || '',
        ownerZip: parcel.ownerZip || '',
        ownerPhone: parcel.ownerPhone || '',
        ownerEmail: parcel.ownerEmail || '',
        legalDesc: parcel.legalDesc || '',
        county: parcel.county || '',
        sequence: parcel.sequence?.toString() || '',
        milepost: parcel.milepost?.toString() || '',
        acreage: parcel.acreage?.toString() || '',
      });
      setTitleStatus(parcel.titleStatus || 'NOT_STARTED');
      setAcquisitionStatus(parcel.acquisitionStatus || 'NOT_STARTED');
      setSpecialConditionsStatus(parcel.specialConditionsStatus || 'NONE');
      setDamagesStatus(parcel.damagesStatus || 'INVESTIGATE');
    }
  }, [parcel]);

  // Mutations
  const updateBasicInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update parcel');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      setSnackbar({ open: true, message: 'Basic information updated successfully' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string }) => {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      const statusName = variables.field === 'titleStatus' ? 'Title'
        : variables.field === 'acquisitionStatus' ? 'Acquisition'
        : variables.field === 'specialConditionsStatus' ? 'Special Conditions'
        : variables.field === 'damagesStatus' ? 'Damages'
        : 'Status';
      setSnackbar({ open: true, message: `${statusName} status updated successfully` });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ content, category }: { content: string; category: string }) => {
      const res = await fetch(`/api/parcels/${parcelId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      setSnackbar({ open: true, message: 'Note added successfully' });
      // Clear the note input
      if (variables.category === 'title') setTitleNote('');
      if (variables.category === 'acquisition') setAcquisitionNote('');
      if (variables.category === 'special_conditions') setSpecialConditionsNote('');
      if (variables.category === 'damages') setDamagesNote('');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      setSnackbar({ open: true, message: 'Note deleted successfully' });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, category, type }: { file: File; category: string; type: string }) => {
      const reader = new FileReader();
      return new Promise<any>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const res = await fetch(`/api/parcels/${parcelId}/documents`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: file.name,
                type,
                category,
                file: base64,
                size: file.size,
                mimeType: file.type,
              }),
            });
            if (!res.ok) throw new Error('Failed to upload document');
            resolve(await res.json());
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      setSnackbar({ open: true, message: 'Document uploaded successfully' });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      setSnackbar({ open: true, message: 'Document deleted successfully' });
    },
  });

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {};
    if (basicFormData.parcelNumber) data.parcelNumber = basicFormData.parcelNumber;
    if (basicFormData.pin) data.pin = basicFormData.pin;
    if (basicFormData.owner) data.owner = basicFormData.owner;
    if (basicFormData.ownerAddress) data.ownerAddress = basicFormData.ownerAddress;
    if (basicFormData.ownerCity) data.ownerCity = basicFormData.ownerCity;
    if (basicFormData.ownerState) data.ownerState = basicFormData.ownerState;
    if (basicFormData.ownerZip) data.ownerZip = basicFormData.ownerZip;
    if (basicFormData.ownerPhone) data.ownerPhone = basicFormData.ownerPhone;
    if (basicFormData.ownerEmail) data.ownerEmail = basicFormData.ownerEmail;
    if (basicFormData.legalDesc) data.legalDesc = basicFormData.legalDesc;
    if (basicFormData.county) data.county = basicFormData.county;
    if (basicFormData.sequence) data.sequence = parseInt(basicFormData.sequence);
    if (basicFormData.milepost) data.milepost = parseFloat(basicFormData.milepost);
    if (basicFormData.acreage) data.acreage = parseFloat(basicFormData.acreage);

    updateBasicInfoMutation.mutate(data);
  };

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBasicFormData({
      ...basicFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocumentMutation.mutate({ file, category, type: 'Document' });
    }
    e.target.value = ''; // Reset input
  };

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

  // Filter notes and documents by category
  const getTitleNotes = () => parcel.notes?.filter(n => n.category === 'title') || [];
  const getAcquisitionNotes = () => parcel.notes?.filter(n => n.category === 'acquisition') || [];
  const getSpecialConditionsNotes = () => parcel.notes?.filter(n => n.category === 'special_conditions') || [];
  const getDamagesNotes = () => parcel.notes?.filter(n => n.category === 'damages') || [];

  const getTitleDocuments = () => parcel.documents?.filter(d => d.category === 'title') || [];
  const getAcquisitionDocuments = () => parcel.documents?.filter(d => d.category === 'acquisition') || [];
  const getSpecialConditionsDocuments = () => parcel.documents?.filter(d => d.category === 'special_conditions') || [];
  const getDamagesDocuments = () => parcel.documents?.filter(d => d.category === 'damages') || [];

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/projects/${projectId}`)}
        sx={{ mb: 2 }}
      >
        Back to Project
      </Button>

      <Typography variant="h4" gutterBottom>
        Edit Parcel {parcel.parcelNumber || parcel.pin || ''}
      </Typography>

      {/* Section 1: Basic Information */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box component="form" onSubmit={handleBasicInfoSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parcel Number"
                name="parcelNumber"
                value={basicFormData.parcelNumber}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PIN"
                name="pin"
                value={basicFormData.pin}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sequence"
                name="sequence"
                type="number"
                value={basicFormData.sequence}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Milepost"
                name="milepost"
                type="number"
                inputProps={{ step: '0.01' }}
                value={basicFormData.milepost}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="County"
                name="county"
                value={basicFormData.county}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Name"
                name="owner"
                value={basicFormData.owner}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Email"
                name="ownerEmail"
                type="email"
                value={basicFormData.ownerEmail}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Owner Address"
                name="ownerAddress"
                value={basicFormData.ownerAddress}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="ownerCity"
                value={basicFormData.ownerCity}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                name="ownerState"
                value={basicFormData.ownerState}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="ownerZip"
                value={basicFormData.ownerZip}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="ownerPhone"
                value={basicFormData.ownerPhone}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Acreage"
                name="acreage"
                type="number"
                inputProps={{ step: '0.01' }}
                value={basicFormData.acreage}
                onChange={handleBasicChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Legal Description"
                name="legalDesc"
                value={basicFormData.legalDesc}
                onChange={handleBasicChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={updateBasicInfoMutation.isPending}
              >
                {updateBasicInfoMutation.isPending ? 'Saving...' : 'Save Basic Information'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Section 2: Title Status */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Title Status
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Title Status</InputLabel>
              <Select
                value={titleStatus}
                onChange={(e) => setTitleStatus(e.target.value)}
                label="Title Status"
              >
                {TITLE_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Notes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a note..."
                value={titleNote}
                onChange={(e) => setTitleNote(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => titleNote && addNoteMutation.mutate({ content: titleNote, category: 'title' })}
                disabled={!titleNote || addNoteMutation.isPending}
              >
                Add
              </Button>
            </Box>
            <List>
              {getTitleNotes().map((note) => (
                <ListItem key={note.id} divider>
                  <ListItemText
                    primary={note.content}
                    secondary={new Date(note.createdAt).toLocaleDateString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {getTitleNotes().length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No notes yet
                </Typography>
              )}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Documents
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploadDocumentMutation.isPending}
            >
              Upload Document
              <input
                type="file"
                hidden
                onChange={(e) => handleFileUpload(e, 'title')}
              />
            </Button>
            <List sx={{ mt: 2 }}>
              {getTitleDocuments().map((doc) => (
                <ListItem key={doc.id} divider>
                  <FileIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary={doc.name}
                    secondary={`${(doc.size / 1024).toFixed(1)} KB • ${new Date(doc.createdAt).toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deleteDocumentMutation.mutate(doc.id)}
                      disabled={deleteDocumentMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {getTitleDocuments().length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No documents yet
                </Typography>
              )}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={() => updateStatusMutation.mutate({ field: 'titleStatus', value: titleStatus })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Save Title Status'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 3: Acquisition Status */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Acquisition Status
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Acquisition Status</InputLabel>
              <Select
                value={acquisitionStatus}
                onChange={(e) => setAcquisitionStatus(e.target.value)}
                label="Acquisition Status"
              >
                {ACQUISITION_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Notes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a note..."
                value={acquisitionNote}
                onChange={(e) => setAcquisitionNote(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => acquisitionNote && addNoteMutation.mutate({ content: acquisitionNote, category: 'acquisition' })}
                disabled={!acquisitionNote || addNoteMutation.isPending}
              >
                Add
              </Button>
            </Box>
            <List>
              {getAcquisitionNotes().map((note) => (
                <ListItem key={note.id} divider>
                  <ListItemText
                    primary={note.content}
                    secondary={new Date(note.createdAt).toLocaleDateString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {getAcquisitionNotes().length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No notes yet
                </Typography>
              )}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Documents
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploadDocumentMutation.isPending}
            >
              Upload Document
              <input
                type="file"
                hidden
                onChange={(e) => handleFileUpload(e, 'acquisition')}
              />
            </Button>
            <List sx={{ mt: 2 }}>
              {getAcquisitionDocuments().map((doc) => (
                <ListItem key={doc.id} divider>
                  <FileIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary={doc.name}
                    secondary={`${(doc.size / 1024).toFixed(1)} KB • ${new Date(doc.createdAt).toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deleteDocumentMutation.mutate(doc.id)}
                      disabled={deleteDocumentMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {getAcquisitionDocuments().length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No documents yet
                </Typography>
              )}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={() => updateStatusMutation.mutate({ field: 'acquisitionStatus', value: acquisitionStatus })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Save Acquisition Status'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 4: Special Conditions Status */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Special Conditions Status
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Special Conditions Status</InputLabel>
              <Select
                value={specialConditionsStatus}
                onChange={(e) => setSpecialConditionsStatus(e.target.value)}
                label="Special Conditions Status"
              >
                {SPECIAL_CONDITIONS_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Notes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a note..."
                value={specialConditionsNote}
                onChange={(e) => setSpecialConditionsNote(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => specialConditionsNote && addNoteMutation.mutate({ content: specialConditionsNote, category: 'special_conditions' })}
                disabled={!specialConditionsNote || addNoteMutation.isPending}
              >
                Add
              </Button>
            </Box>
            <List>
              {getSpecialConditionsNotes().map((note) => (
                <ListItem key={note.id} divider>
                  <ListItemText
                    primary={note.content}
                    secondary={new Date(note.createdAt).toLocaleDateString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {getSpecialConditionsNotes().length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No notes yet
                </Typography>
              )}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Documents
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploadDocumentMutation.isPending}
            >
              Upload Document
              <input
                type="file"
                hidden
                onChange={(e) => handleFileUpload(e, 'special_conditions')}
              />
            </Button>
            <List sx={{ mt: 2 }}>
              {getSpecialConditionsDocuments().map((doc) => (
                <ListItem key={doc.id} divider>
                  <FileIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary={doc.name}
                    secondary={`${(doc.size / 1024).toFixed(1)} KB • ${new Date(doc.createdAt).toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deleteDocumentMutation.mutate(doc.id)}
                      disabled={deleteDocumentMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {getSpecialConditionsDocuments().length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No documents yet
                </Typography>
              )}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={() => updateStatusMutation.mutate({ field: 'specialConditionsStatus', value: specialConditionsStatus })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Save Special Conditions Status'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 5: Damages Status */}
      <Paper sx={{ p: 3, mt: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Damages Status
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Damages Status</InputLabel>
              <Select
                value={damagesStatus}
                onChange={(e) => setDamagesStatus(e.target.value)}
                label="Damages Status"
              >
                {DAMAGES_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Notes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a note..."
                value={damagesNote}
                onChange={(e) => setDamagesNote(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => damagesNote && addNoteMutation.mutate({ content: damagesNote, category: 'damages' })}
                disabled={!damagesNote || addNoteMutation.isPending}
              >
                Add
              </Button>
            </Box>
            <List>
              {getDamagesNotes().map((note) => (
                <ListItem key={note.id} divider>
                  <ListItemText
                    primary={note.content}
                    secondary={new Date(note.createdAt).toLocaleDateString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {getDamagesNotes().length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No notes yet
                </Typography>
              )}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Documents
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploadDocumentMutation.isPending}
            >
              Upload Document
              <input
                type="file"
                hidden
                onChange={(e) => handleFileUpload(e, 'damages')}
              />
            </Button>
            <List sx={{ mt: 2 }}>
              {getDamagesDocuments().map((doc) => (
                <ListItem key={doc.id} divider>
                  <FileIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary={doc.name}
                    secondary={`${(doc.size / 1024).toFixed(1)} KB • ${new Date(doc.createdAt).toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => deleteDocumentMutation.mutate(doc.id)}
                      disabled={deleteDocumentMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {getDamagesDocuments().length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No documents yet
                </Typography>
              )}
            </List>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={() => updateStatusMutation.mutate({ field: 'damagesStatus', value: damagesStatus })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Save Damages Status'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
