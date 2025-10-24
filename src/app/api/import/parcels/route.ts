import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as toGeoJSON from '@tmcw/togeojson';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { parse as parseHTML } from 'node-html-parser';

// Helper to parse KML string to GeoJSON
function parseKML(kmlString: string): any {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlString, 'text/xml');
  return toGeoJSON.kml(kmlDoc);
}

// Helper to parse HTML description field and extract key-value pairs
function parseHTMLDescription(htmlString: string): Record<string, string> {
  const data: Record<string, string> = {};

  try {
    const root = parseHTML(htmlString);

    // Try to find table rows with key-value pairs
    const rows = root.querySelectorAll('tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const key = cells[0].textContent.trim();
        const value = cells[1].textContent.trim();
        if (key && value) {
          data[key] = value;
        }
      }
    });

    // Also try to extract from div/span elements
    const divs = root.querySelectorAll('div, span');
    divs.forEach((div) => {
      const text = div.textContent;
      // Look for patterns like "Key: Value" or "Key = Value"
      const match = text.match(/^([^:=]+)[:=]\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && value && !data[key]) {
          data[key] = value;
        }
      }
    });

    console.log('Parsed HTML description data:', Object.keys(data));
  } catch (error) {
    console.error('Error parsing HTML description:', error);
  }

  return data;
}

// Helper function to find property by various name variations (case-insensitive)
function findProp(props: any, ...names: string[]): any {
  for (const name of names) {
    // Try exact match first
    if (props[name] !== undefined && props[name] !== null && props[name] !== '') {
      return props[name];
    }
    // Try case-insensitive match
    const lowerName = name.toLowerCase();
    const key = Object.keys(props).find(k => k.toLowerCase() === lowerName);
    if (key && props[key] !== undefined && props[key] !== null && props[key] !== '') {
      return props[key];
    }
  }
  return null;
}

// Helper to extract parcel data from GeoJSON feature
function extractParcelData(feature: any, projectId: string, sequence: number): any {
  let props = feature.properties || {};
  const geometry = feature.geometry;

  // If there's a description field with HTML, parse it and merge with existing props
  const description = props.description || props.Description || props.DESCRIPTION;
  if (description && (description.includes('<') || description.includes('table'))) {
    const parsedData = parseHTMLDescription(description);
    // Merge parsed data with existing props (parsed data has priority for Bedford County)
    props = { ...props, ...parsedData };
  }

  // STREAMLINED EXTRACTION - Only essential fields for ROW tracking
  console.log(`\n=== Feature ${sequence} ===`);
  console.log('Available fields:', Object.keys(props).slice(0, 20).join(', '));

  // 1. PARCEL ID - Try PIN/RPC first (most important for tax records)
  const pin = findProp(props, 'pin', 'PIN', 'rpc', 'RPC', 'gpin', 'GPIN');
  console.log('PIN/RPC:', pin);

  // 2. OWNER NAME
  const owner = findProp(props, 'owner1', 'OWNER1', 'owner', 'OWNER', 'ownername', 'OWNERNAME');
  console.log('Owner:', owner);

  // 3. MAILING ADDRESS (where to send correspondence)
  const mailAddr = findProp(props, 'mailaddr', 'MAILADDR', 'mail_address', 'MAIL_ADDRESS');
  const mailCity = findProp(props, 'mailcity', 'MAILCITY', 'mail_city', 'MAIL_CITY');
  const mailState = findProp(props, 'mailstat', 'MAILSTAT', 'mailstate', 'MAILSTATE', 'mail_state', 'MAIL_STATE');
  const mailZip = findProp(props, 'mailzip', 'MAILZIP', 'mail_zip', 'MAIL_ZIP');
  console.log('Mailing Address:', mailAddr);
  console.log('City:', mailCity);
  console.log('State:', mailState);
  console.log('ZIP:', mailZip);

  // 4. ACREAGE
  const acreage = findProp(props, 'legalac', 'LEGALAC', 'acreage', 'ACREAGE', 'acres', 'ACRES');
  console.log('Acreage:', acreage);

  // 5. PROPERTY LOCATION (optional - for reference in legalDesc)
  const propLocation = findProp(props, 'locaddr', 'LOCADDR', 'location', 'LOCATION', 'situs', 'SITUS');
  console.log('Property Location:', propLocation);

  // 6. ZONING / PROPERTY CLASS (residential, commercial, etc.)
  const zoning = findProp(props, 'pcdesc', 'PCDESC', 'propclass', 'PROPCLASS', 'zoning', 'ZONING', 'class', 'CLASS');
  console.log('Zoning/Property Class:', zoning);

  // Build legal description with property location and zoning
  const legalDescParts = [];
  if (propLocation) legalDescParts.push(`Location: ${propLocation}`);
  if (zoning) legalDescParts.push(`Zoning: ${zoning}`);
  const legalDesc = legalDescParts.length > 0 ? legalDescParts.join(' | ') : null;

  const parcelData = {
    projectId,
    parcelNumber: pin ? String(pin).trim() : null,
    pin: pin ? String(pin).trim() : null,
    owner: owner ? String(owner).trim() : null,
    ownerAddress: mailAddr ? String(mailAddr).trim() : null,
    ownerCity: mailCity ? String(mailCity).trim() : null,
    ownerState: mailState ? String(mailState).trim() : null,
    ownerZip: mailZip ? String(mailZip).trim() : null,
    legalDesc: legalDesc,
    county: 'Bedford', // Hardcode for Bedford County
    acreage: acreage ? parseFloat(String(acreage)) : null,
    sequence,
    geometry,
    status: 'NOT_STARTED',
  };

  console.log('FINAL EXTRACTED DATA:', JSON.stringify({
    pin: parcelData.pin,
    owner: parcelData.owner,
    ownerAddress: parcelData.ownerAddress,
    ownerCity: parcelData.ownerCity,
    ownerState: parcelData.ownerState,
    ownerZip: parcelData.ownerZip,
    acreage: parcelData.acreage,
  }, null, 2));

  return parcelData;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'No project ID provided' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        parcels: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileName = file.name.toLowerCase();
    const buffer = await file.arrayBuffer();
    let geoJSON: any;

    try {
      if (fileName.endsWith('.kml')) {
        // Parse KML
        console.log('Parsing KML file:', fileName);
        const kmlString = new TextDecoder().decode(buffer);
        console.log('KML string length:', kmlString.length);
        geoJSON = parseKML(kmlString);
        console.log('Parsed GeoJSON features:', geoJSON?.features?.length || 0);
      } else if (fileName.endsWith('.kmz')) {
        // Parse KMZ (compressed KML)
        console.log('Parsing KMZ file:', fileName);
        const zip = await JSZip.loadAsync(buffer);
        const kmlFile = Object.keys(zip.files).find((name) =>
          name.toLowerCase().endsWith('.kml')
        );

        if (!kmlFile) {
          return NextResponse.json(
            { error: 'No KML file found in KMZ archive' },
            { status: 400 }
          );
        }

        console.log('Found KML file in archive:', kmlFile);
        const kmlString = await zip.files[kmlFile].async('text');
        console.log('KML string length:', kmlString.length);
        geoJSON = parseKML(kmlString);
        console.log('Parsed GeoJSON features:', geoJSON?.features?.length || 0);
      } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        // Parse GeoJSON
        console.log('Parsing GeoJSON file:', fileName);
        const jsonString = new TextDecoder().decode(buffer);
        geoJSON = JSON.parse(jsonString);
        console.log('GeoJSON features:', geoJSON?.features?.length || 0);
      } else {
        return NextResponse.json(
          { error: 'Unsupported file format. Please use KML, KMZ, or GeoJSON' },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      console.error('Error details:', {
        message: parseError instanceof Error ? parseError.message : 'Unknown error',
        stack: parseError instanceof Error ? parseError.stack : undefined,
      });
      return NextResponse.json(
        {
          error: 'Failed to parse file. Please ensure it is a valid format',
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Extract features
    const features = geoJSON.features || [];
    if (features.length === 0) {
      return NextResponse.json(
        { error: 'No features found in the file' },
        { status: 400 }
      );
    }

    // Get current parcel count for sequence numbering
    const currentMaxSequence =
      project.parcels.length > 0
        ? Math.max(...project.parcels.map((p) => p.sequence || 0))
        : 0;

    // Prepare parcels for creation
    const parcelsToCreate: any[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    features.forEach((feature: any, index: number) => {
      try {
        // Only process features with geometry
        if (!feature.geometry) {
          warnings.push(`Feature ${index + 1}: No geometry found, skipped`);
          return;
        }

        const parcelData = extractParcelData(
          feature,
          projectId,
          currentMaxSequence + index + 1
        );

        // Check parcel limit
        if (
          subscription.parcelLimitPerProject !== -1 &&
          project.parcels.length + parcelsToCreate.length >=
            subscription.parcelLimitPerProject
        ) {
          errors.push(
            `Parcel limit reached. Your ${subscription.tier} plan allows ${subscription.parcelLimitPerProject} parcels per project.`
          );
          return;
        }

        parcelsToCreate.push(parcelData);
      } catch (err) {
        console.error(`Error processing feature ${index + 1}:`, err);
        errors.push(`Feature ${index + 1}: Failed to process`);
      }
    });

    if (parcelsToCreate.length === 0) {
      return NextResponse.json(
        {
          success: false,
          parcelsCreated: 0,
          errors: errors.length > 0 ? errors : ['No valid parcels found in file'],
          warnings,
        },
        { status: 400 }
      );
    }

    // Create parcels in database
    let createdCount = 0;
    for (const parcelData of parcelsToCreate) {
      try {
        await prisma.parcel.create({
          data: parcelData,
        });
        createdCount++;
      } catch (err) {
        console.error('Error creating parcel:', err);
        errors.push(`Failed to create parcel at sequence ${parcelData.sequence}`);
      }
    }

    console.log(`Successfully imported ${createdCount} parcels into project ${projectId}`);

    return NextResponse.json({
      success: true,
      parcelsCreated: createdCount,
      errors,
      warnings,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import parcels' },
      { status: 500 }
    );
  }
}
