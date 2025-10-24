'use client';

import { useState } from 'react';
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
} from '@mui/material';

const STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ACQUIRED', label: 'Acquired' },
  { value: 'CONDEMNED', label: 'Condemned' },
  { value: 'RELOCATED', label: 'Relocated' },
];

export default function NewParcelPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only send non-empty fields
      const parcelData: any = {
        projectId,
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

      const response = await fetch('/api/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parcelData),
      });

      if (response.ok) {
        router.push(`/projects/${projectId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create parcel');
      }
    } catch (error) {
      console.error('Error creating parcel:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New Parcel
      </Typography>

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
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Parcel'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/projects/${projectId}`)}
                  disabled={loading}
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
