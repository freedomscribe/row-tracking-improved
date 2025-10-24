'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ImportResult {
  success: boolean;
  parcelsCreated: number;
  errors: string[];
  warnings: string[];
}

export default function ImportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file extension
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['kml', 'kmz', 'geojson', 'json'].includes(extension || '')) {
        setError('Please select a valid KML, KMZ, or GeoJSON file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const response = await fetch('/api/import/parcels', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.success && data.parcelsCreated > 0) {
          // Redirect after 3 seconds
          setTimeout(() => {
            router.push(`/projects/${projectId}`);
          }, 3000);
        }
      } else {
        setError(data.error || 'Failed to import parcels');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('An error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/projects/${projectId}`)}
          sx={{ mb: 2 }}
        >
          Back to Project
        </Button>
        <Typography variant="h4">Import Parcels</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Upload KML, KMZ, or GeoJSON files to import parcels into your project
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <input
            accept=".kml,.kmz,.geojson,.json"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
              size="large"
              sx={{ mb: 2 }}
            >
              Select File
            </Button>
          </label>

          {file && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${file.name} (${(file.size / 1024).toFixed(2)} KB)`}
                color="primary"
                sx={{ fontSize: '1rem', py: 3 }}
              />
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert
            severity={result.success ? 'success' : 'error'}
            icon={result.success ? <CheckIcon /> : <ErrorIcon />}
            sx={{ mb: 3 }}
          >
            {result.success
              ? `Successfully imported ${result.parcelsCreated} parcel${result.parcelsCreated !== 1 ? 's' : ''}!`
              : 'Import failed. Please check the errors below.'}
          </Alert>
        )}

        {result?.warnings && result.warnings.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Warnings
            </Typography>
            <List dense>
              {result.warnings.map((warning, index) => (
                <ListItem key={index}>
                  <ListItemText primary={warning} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {result?.errors && result.errors.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="error">
              Errors
            </Typography>
            <List dense>
              {result.errors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Processing file...
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || loading}
            size="large"
          >
            {loading ? 'Importing...' : 'Import Parcels'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push(`/projects/${projectId}`)}
            disabled={loading}
            size="large"
          >
            Cancel
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Supported Formats
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="KML (Keyhole Markup Language)"
                secondary="Google Earth format - typically used for parcel boundaries"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="KMZ (Compressed KML)"
                secondary="Compressed version of KML files"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="GeoJSON"
                secondary="Modern geospatial data format with geometry and properties"
              />
            </ListItem>
          </List>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>Note:</strong> The import process will extract parcel boundaries and attempt
            to map properties like parcel numbers, owner information, and acreage from the file's
            attributes.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
