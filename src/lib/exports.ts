import { Parser } from 'json2csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Parcel } from '@prisma/client';
import { getParcelStatusLabel } from './utils';

// ============================================
// CSV Export
// ============================================

export interface ExportParcel {
  parcelNumber: string | null;
  pin: string | null;
  owner: string | null;
  ownerAddress: string | null;
  ownerCity: string | null;
  ownerState: string | null;
  ownerZip: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  county: string | null;
  status: string;
  sequence: number | null;
  milepost: number | null;
  acreage: number | null;
  legalDesc: string | null;
}

export function exportToCSV(parcels: Parcel[]): string {
  const fields = [
    { label: 'Parcel Number', value: 'parcelNumber' },
    { label: 'PIN', value: 'pin' },
    { label: 'Owner', value: 'owner' },
    { label: 'Owner Address', value: 'ownerAddress' },
    { label: 'Owner City', value: 'ownerCity' },
    { label: 'Owner State', value: 'ownerState' },
    { label: 'Owner Zip', value: 'ownerZip' },
    { label: 'Owner Phone', value: 'ownerPhone' },
    { label: 'Owner Email', value: 'ownerEmail' },
    { label: 'County', value: 'county' },
    { label: 'Status', value: 'status' },
    { label: 'Sequence', value: 'sequence' },
    { label: 'Milepost', value: 'milepost' },
    { label: 'Acreage', value: 'acreage' },
    { label: 'Legal Description', value: 'legalDesc' },
  ];

  const data = parcels.map((parcel) => ({
    parcelNumber: parcel.parcelNumber || '',
    pin: parcel.pin || '',
    owner: parcel.owner || '',
    ownerAddress: parcel.ownerAddress || '',
    ownerCity: parcel.ownerCity || '',
    ownerState: parcel.ownerState || '',
    ownerZip: parcel.ownerZip || '',
    ownerPhone: parcel.ownerPhone || '',
    ownerEmail: parcel.ownerEmail || '',
    county: parcel.county || '',
    status: getParcelStatusLabel(parcel.status),
    sequence: parcel.sequence || '',
    milepost: parcel.milepost || '',
    acreage: parcel.acreage || '',
    legalDesc: parcel.legalDesc || '',
  }));

  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  return csv;
}

// ============================================
// PDF Export
// ============================================

export function exportToPDF(
  parcels: Parcel[],
  projectName: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`ROW Line List Report`, 14, 15);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 22);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  doc.text(`Total Parcels: ${parcels.length}`, 14, 34);

  // Prepare table data
  const tableData = parcels.map((parcel) => [
    parcel.sequence || '-',
    parcel.parcelNumber || '-',
    parcel.owner || '-',
    parcel.county || '-',
    getParcelStatusLabel(parcel.status),
    parcel.milepost?.toFixed(2) || '-',
    parcel.acreage?.toFixed(2) || '-',
    parcel.legalDesc ? (parcel.legalDesc.substring(0, 40) + '...') : '-',
  ]);

  // Add table
  autoTable(doc, {
    head: [
      [
        'Seq',
        'Parcel #',
        'Owner',
        'County',
        'Status',
        'Milepost',
        'Acres',
        'Legal Desc',
      ],
    ],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [76, 175, 80], // Green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 12 }, // Seq
      1: { cellWidth: 25 }, // Parcel #
      2: { cellWidth: 40 }, // Owner
      3: { cellWidth: 25 }, // County
      4: { cellWidth: 25 }, // Status
      5: { cellWidth: 20 }, // Milepost
      6: { cellWidth: 18 }, // Acres
      7: { cellWidth: 50 }, // Legal Desc
    },
  });

  // Add footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}

// ============================================
// Detailed PDF Export (with notes)
// ============================================

export function exportDetailedPDF(
  parcels: (Parcel & { notes: { content: string; createdAt: Date }[] })[],
  projectName: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Detailed ROW Report: ${projectName}`, 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

  let yPosition = 30;

  parcels.forEach((parcel, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Parcel header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${parcel.parcelNumber || 'N/A'}`, 14, yPosition);
    yPosition += 7;

    // Parcel details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const details = [
      `Owner: ${parcel.owner || 'N/A'}`,
      `County: ${parcel.county || 'N/A'}`,
      `Status: ${getParcelStatusLabel(parcel.status)}`,
      `Sequence: ${parcel.sequence || 'N/A'}`,
      `Milepost: ${parcel.milepost?.toFixed(2) || 'N/A'}`,
      `Acreage: ${parcel.acreage?.toFixed(2) || 'N/A'}`,
    ];

    details.forEach((detail) => {
      doc.text(detail, 20, yPosition);
      yPosition += 5;
    });

    // Legal description
    if (parcel.legalDesc) {
      doc.text('Legal Description:', 20, yPosition);
      yPosition += 5;
      const splitDesc = doc.splitTextToSize(parcel.legalDesc, 170);
      doc.text(splitDesc, 25, yPosition);
      yPosition += splitDesc.length * 5;
    }

    // Notes
    if (parcel.notes && parcel.notes.length > 0) {
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      parcel.notes.forEach((note) => {
        const noteText = `• ${new Date(note.createdAt).toLocaleDateString()}: ${note.content}`;
        const splitNote = doc.splitTextToSize(noteText, 165);
        doc.text(splitNote, 25, yPosition);
        yPosition += splitNote.length * 5 + 2;
      });
    }

    yPosition += 5; // Space between parcels
  });

  return doc;
}

// ============================================
// GeoJSON Export
// ============================================

export function exportToGeoJSON(parcels: Parcel[]): string {
  const features = parcels
    .filter((parcel) => parcel.geometry)
    .map((parcel) => ({
      type: 'Feature',
      properties: {
        id: parcel.id,
        parcelNumber: parcel.parcelNumber,
        owner: parcel.owner,
        county: parcel.county,
        status: parcel.status,
        sequence: parcel.sequence,
        milepost: parcel.milepost,
        acreage: parcel.acreage,
      },
      geometry: parcel.geometry,
    }));

  const geoJSON = {
    type: 'FeatureCollection',
    features,
  };

  return JSON.stringify(geoJSON, null, 2);
}

