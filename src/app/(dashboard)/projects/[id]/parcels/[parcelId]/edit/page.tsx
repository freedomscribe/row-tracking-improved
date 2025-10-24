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
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

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
  county?: string | null;
  status: string;
  sequence?: number | null;
  milepost?: number | null;
  acreage?: number | null;
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

  const { data: parcel, isLoading, error } = useQuery<Parcel>({
    queryKey: ['parcel', parcelId],
    queryFn: () => fetchParcel(parcelId),
  });

  const [formData, setFormData] = useState({
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
    status: 'NOT_STARTED',
    sequence: '',
    milepost: '',
    acreage: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Populate form when parcel loads
  useEffect(() => {
    if (parcel) {
      setFormData({
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
        status: parcel.status,
        sequence: parcel.sequence?.toString() || '',
        milepost: parcel.milepost?.toString() || '',
        acreage: parcel.acreage?.toString() || '',
      });
    }
  }, [parcel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      // Only send non-empty fields
      const parcelData: any = {
        status: formData.status,
      };

      // Add optional fields if they have values
      if (formData.parcelNumber) parcelData.parcelNumber = formData.parcelNumber;
      if (formData.pin) parcelData.pin = formData.pin;
      if (formData.owner) parcelData.owner = formData.owner;
      if (formData.ownerAddress) parcelData.ownerAddress = formData.ownerAddress;
      if (formData.ownerCity) parcelData.ownerCity = formData.ownerCity;
      if (formData.ownerState) parcelData.ownerState = formData.ownerState;
      if (formData.ownerZip) parcelData.ownerZip = formData.ownerZip;
      if (formData.ownerPhone) parcelData.ownerPhone = formData.ownerPhone;
      if (formData.ownerEmail) parcelData.ownerEmail = formData.ownerEmail;
      if (formData.legalDesc) parcelData.legalDesc = formData.legalDesc;
      if (formData.county) parcelData.county = formData.county;
      if (formData.sequence) parcelData.sequence = parseInt(formData.sequence);
      if (formData.milepost) parcelData.milepost = parseFloat(formData.milepost);
      if (formData.acreage) parcelData.acreage = parseFloat(formData.acreage);

      const response = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parcelData),
      });

      if (response.ok) {
        router.push(`/projects/${projectId}/parcels/${parcelId}`);
      } else {
        const error = await response.json();
        setSaveError(error.error || 'Failed to update parcel');
      }
    } catch (error) {
      console.error('Error updating parcel:', error);
      setSaveError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/projects/${projectId}/parcels/${parcelId}`)}
        sx={{ mb: 2 }}
      >
        Back to Parcel Details
      </Button>

      <Typography variant="h4" gutterBottom>
        Edit Parcel
      </Typography>

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {saveError}
        </Alert>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parcel Number"
                name="parcelNumber"
                value={formData.parcelNumber}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PIN"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sequence"
                name="sequence"
                type="number"
                value={formData.sequence}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Milepost"
                name="milepost"
                type="number"
                inputProps={{ step: '0.01' }}
                value={formData.milepost}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  {STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Owner Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Owner Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Name"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Email"
                name="ownerEmail"
                type="email"
                value={formData.ownerEmail}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Owner Address"
                name="ownerAddress"
                value={formData.ownerAddress}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="ownerCity"
                value={formData.ownerCity}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                name="ownerState"
                value={formData.ownerState}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="ownerZip"
                value={formData.ownerZip}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
              />
            </Grid>

            {/* Property Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Property Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="County"
                name="county"
                value={formData.county}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Acreage"
                name="acreage"
                type="number"
                inputProps={{ step: '0.01' }}
                value={formData.acreage}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Legal Description"
                name="legalDesc"
                value={formData.legalDesc}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/projects/${projectId}/parcels/${parcelId}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
