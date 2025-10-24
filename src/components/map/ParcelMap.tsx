'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@mui/material';

// Fix for default markers not showing in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Parcel {
  id: string;
  parcelNumber?: string | null;
  owner?: string | null;
  status: string;
  geometry?: any;
  acreage?: number | null;
  county?: string | null;
}

interface ParcelMapProps {
  parcels: Parcel[];
  selectedParcelId?: string | null;
  onParcelClick?: (parcelId: string) => void;
  center?: [number, number];
  zoom?: number;
}

export default function ParcelMap({
  parcels,
  selectedParcelId,
  onParcelClick,
  center = [39.8283, -98.5795], // Geographic center of USA
  zoom = 5,
}: ParcelMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker | L.GeoJSON }>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(center, zoom);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when parcels change
  useEffect(() => {
    if (!mapRef.current || !parcels) return;

    const map = mapRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });
    markersRef.current = {};

    // Add new markers
    const bounds: L.LatLngBoundsExpression[] = [];

    parcels.forEach((parcel) => {
      if (parcel.geometry) {
        try {
          // Handle GeoJSON geometry
          const geoJsonLayer = L.geoJSON(parcel.geometry, {
            style: () => ({
              color: getStatusColor(parcel.status),
              weight: 2,
              fillOpacity: selectedParcelId === parcel.id ? 0.5 : 0.3,
            }),
            onEachFeature: (feature, layer) => {
              // Add popup
              const popupContent = `
                <div>
                  <strong>${parcel.parcelNumber || 'N/A'}</strong><br/>
                  Owner: ${parcel.owner || 'N/A'}<br/>
                  Status: ${parcel.status}<br/>
                  ${parcel.acreage ? `Acreage: ${parcel.acreage}` : ''}
                </div>
              `;
              layer.bindPopup(popupContent);

              // Add click handler
              layer.on('click', () => {
                if (onParcelClick) {
                  onParcelClick(parcel.id);
                }
              });
            },
          }).addTo(map);

          markersRef.current[parcel.id] = geoJsonLayer;

          // Add to bounds
          const layerBounds = geoJsonLayer.getBounds();
          if (layerBounds.isValid()) {
            bounds.push(layerBounds);
          }
        } catch (error) {
          console.error('Error rendering parcel geometry:', error);
        }
      }
    });

    // Fit map to show all parcels
    if (bounds.length > 0) {
      const group = L.featureGroup(
        Object.values(markersRef.current).filter((m) => m instanceof L.GeoJSON) as L.GeoJSON[]
      );
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [parcels, selectedParcelId, onParcelClick]);

  return (
    <Box
      ref={mapContainerRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        '& .leaflet-container': {
          height: '100%',
          width: '100%',
        },
      }}
    />
  );
}

// Helper function to get color based on parcel status
function getStatusColor(status: string): string {
  switch (status) {
    case 'NOT_STARTED':
      return '#9e9e9e'; // Gray
    case 'IN_PROGRESS':
      return '#2196f3'; // Blue
    case 'ACQUIRED':
      return '#4caf50'; // Green
    case 'CONDEMNED':
      return '#ff9800'; // Orange
    case 'RELOCATED':
      return '#9c27b0'; // Purple
    default:
      return '#757575'; // Default gray
  }
}
