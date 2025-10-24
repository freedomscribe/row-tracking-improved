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

  // Log all available properties for debugging
  console.log(`Feature ${sequence} properties:`, Object.keys(props));
  console.log(`Feature ${sequence} sample data:`, JSON.stringify(props).substring(0, 200));

  // If there's a description field with HTML, parse it and merge with existing props
  const description = props.description || props.Description || props.DESCRIPTION;
  if (description && (description.includes('<') || description.includes('table'))) {
    console.log(`Feature ${sequence} has HTML description, parsing...`);
    const parsedData = parseHTMLDescription(description);
    // Merge parsed data with existing props (existing props take precedence)
    props = { ...parsedData, ...props };
    console.log(`Feature ${sequence} after parsing description:`, Object.keys(props));
  }

  // Try to find common property names for parcel information (case-insensitive)
  // For Tax Map Number
  const parcelNumber = findProp(
    props,
    'Tax Map #', 'TaxMap', 'TAX_MAP', 'Tax Map', 'TAXMAP',
    'parcelNumber', 'PARCEL_NUM', 'ParcelNumber', 'parcel_number',
    'APN', 'parcel', 'Parcel', 'name', 'Name', 'PARCEL_NO'
  );

  // For RPC or PIN
  const pin = findProp(
    props,
    'RPC', 'PIN', 'ParcelID', 'PARCEL_ID', 'Parcel ID'
  );

  // For Owner
  const owner = findProp(
    props,
    'Owner', 'OWNER', 'owner', 'owner_name', 'OwnerName', 'OWNER_NAME',
    'owner1', 'Owner1', 'OWNER1', 'PropOwner', 'PROP_OWNER'
  );

  // For Legal Acres (acreage)
  const acreage = findProp(
    props,
    'Legal Acres', 'LegalAcres', 'LEGAL_ACRES',
    'acreage', 'ACREAGE', 'Acreage', 'acres', 'ACRES', 'Acres',
    'area', 'AREA', 'Area', 'CALC_ACRES', 'GIS_ACRES', 'SHAPE_AREA'
  );

  // For County (might include state info like "Bedford County, VA")
  const countyRaw = findProp(
    props,
    'county', 'County', 'COUNTY', 'county_name', 'CountyName', 'COUNTY_NAME'
  );

  // Extract county and state if format is "County Name, ST"
  let county = countyRaw;
  let state = null;
  if (countyRaw && countyRaw.includes(',')) {
    const parts = countyRaw.split(',');
    county = parts[0].trim();
    state = parts[1].trim();
  }

  // For Owner Address (mailing address)
  const ownerAddress = findProp(
    props,
    'Owner Address', 'OwnerAddress', 'OWNER_ADDRESS', 'owner address',
    'mail_address', 'MAIL_ADDRESS', 'MailAddress', 'mailing_address'
  );

  // Parse owner address to extract city, state, zip if it's a full address
  let ownerCity = null;
  let ownerState = state; // Use state from county if available
  let ownerZip = null;

  if (ownerAddress && typeof ownerAddress === 'string') {
    // Try to extract city, state, zip from address like "PO BOX 964 LYNCHBURG, VA 24505"
    const addressMatch = ownerAddress.match(/,?\s*([A-Z\s]+),?\s+([A-Z]{2})\s+(\d{5})/i);
    if (addressMatch) {
      ownerCity = addressMatch[1].trim();
      ownerState = addressMatch[2].trim();
      ownerZip = addressMatch[3].trim();
    }
  }

  // Also check for separate city, state, zip fields
  if (!ownerCity) {
    ownerCity = findProp(props, 'city', 'City', 'CITY', 'owner_city', 'OWNER_CITY');
  }
  if (!ownerState) {
    ownerState = findProp(props, 'state', 'State', 'STATE', 'owner_state', 'OWNER_STATE');
  }
  if (!ownerZip) {
    ownerZip = findProp(props, 'zip', 'ZIP', 'Zip', 'zipcode', 'ZIPCODE', 'ZipCode', 'owner_zip', 'OWNER_ZIP');
  }

  // Build comprehensive legal description
  const propertyAddress = findProp(props, 'Property Address', 'PropertyAddress', 'PROPERTY_ADDRESS', 'Situs', 'SITUS');
  const legalDescription = findProp(props, 'Legal Description', 'LegalDescription', 'LEGAL_DESCRIPTION', 'legal_desc', 'LEGAL_DESC');
  const pcDescription = findProp(props, 'PC Description', 'PCDescription', 'PC_DESCRIPTION');
  const deedBook = findProp(props, 'Deed Book/Page', 'DeedBook', 'DEED_BOOK', 'Document');

  // Combine all legal/property info into legalDesc field
  const legalDescParts = [];
  if (propertyAddress) legalDescParts.push(`Property: ${propertyAddress}`);
  if (legalDescription) legalDescParts.push(`Legal: ${legalDescription}`);
  if (pcDescription) legalDescParts.push(`Type: ${pcDescription}`);
  if (pin) legalDescParts.push(`RPC: ${pin}`);
  if (deedBook) legalDescParts.push(`Document: ${deedBook}`);

  const combinedLegalDesc = legalDescParts.length > 0 ? legalDescParts.join(' | ') : null;

  const parcelData = {
    projectId,
    parcelNumber: parcelNumber ? String(parcelNumber) : null,
    pin: pin ? String(pin) : null,
    owner: owner ? String(owner) : null,
    ownerAddress: ownerAddress ? String(ownerAddress) : null,
    ownerCity: ownerCity ? String(ownerCity) : null,
    ownerState: ownerState ? String(ownerState) : null,
    ownerZip: ownerZip ? String(ownerZip) : null,
    legalDesc: combinedLegalDesc,
    county: county ? String(county) : null,
    acreage: acreage ? parseFloat(String(acreage)) : null,
    sequence,
    geometry,
    status: 'NOT_STARTED',
  };

  // Log what was extracted
  console.log(`Feature ${sequence} extracted:`, {
    parcelNumber: parcelData.parcelNumber,
    pin: parcelData.pin,
    owner: parcelData.owner,
    county: parcelData.county,
    acreage: parcelData.acreage,
    ownerAddress: parcelData.ownerAddress,
    ownerCity: parcelData.ownerCity,
    ownerState: parcelData.ownerState,
    legalDesc: parcelData.legalDesc?.substring(0, 100),
  });

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
