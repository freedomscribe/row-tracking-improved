import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as toGeoJSON from '@tmcw/togeojson';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

// Helper to parse KML string to GeoJSON
function parseKML(kmlString: string): any {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlString, 'text/xml');
  return toGeoJSON.kml(kmlDoc);
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
  const props = feature.properties || {};
  const geometry = feature.geometry;

  // Log all available properties for debugging
  console.log(`Feature ${sequence} properties:`, Object.keys(props));
  console.log(`Feature ${sequence} sample data:`, JSON.stringify(props).substring(0, 200));

  // Try to find common property names for parcel information (case-insensitive)
  const parcelNumber = findProp(
    props,
    'parcelNumber', 'PARCEL_NUM', 'ParcelNumber', 'parcel_number',
    'APN', 'PIN', 'parcel', 'Parcel', 'name', 'Name', 'PARCEL_NO'
  );

  const owner = findProp(
    props,
    'owner', 'Owner', 'OWNER', 'owner_name', 'OwnerName', 'OWNER_NAME',
    'owner1', 'Owner1', 'OWNER1', 'PropOwner', 'PROP_OWNER'
  );

  const acreage = findProp(
    props,
    'acreage', 'ACREAGE', 'Acreage', 'acres', 'ACRES', 'Acres',
    'area', 'AREA', 'Area', 'CALC_ACRES', 'GIS_ACRES', 'SHAPE_AREA'
  );

  const county = findProp(
    props,
    'county', 'County', 'COUNTY', 'county_name', 'CountyName', 'COUNTY_NAME'
  );

  const address = findProp(
    props,
    'address', 'Address', 'ADDRESS', 'situs_address', 'SitusAddress', 'SITUS_ADDRESS',
    'situs', 'SITUS', 'site_address', 'SITE_ADDRESS', 'mail_address', 'MAIL_ADDRESS',
    'owner_address', 'OWNER_ADDRESS'
  );

  const city = findProp(
    props,
    'city', 'City', 'CITY', 'owner_city', 'OWNER_CITY', 'situs_city', 'SITUS_CITY'
  );

  const state = findProp(
    props,
    'state', 'State', 'STATE', 'owner_state', 'OWNER_STATE', 'situs_state', 'SITUS_STATE'
  );

  const zip = findProp(
    props,
    'zip', 'ZIP', 'Zip', 'zipcode', 'ZIPCODE', 'ZipCode',
    'owner_zip', 'OWNER_ZIP', 'situs_zip', 'SITUS_ZIP'
  );

  const legalDesc = findProp(
    props,
    'legal_desc', 'LEGAL_DESC', 'LegalDesc', 'legalDescription', 'LEGAL_DESCRIPTION',
    'legal', 'LEGAL', 'description', 'Description', 'DESCRIPTION'
  );

  const parcelData = {
    projectId,
    parcelNumber: parcelNumber ? String(parcelNumber) : null,
    owner: owner ? String(owner) : null,
    ownerAddress: address ? String(address) : null,
    ownerCity: city ? String(city) : null,
    ownerState: state ? String(state) : null,
    ownerZip: zip ? String(zip) : null,
    legalDesc: legalDesc ? String(legalDesc) : null,
    county: county ? String(county) : null,
    acreage: acreage ? parseFloat(String(acreage)) : null,
    sequence,
    geometry,
    status: 'NOT_STARTED',
  };

  // Log what was extracted
  console.log(`Feature ${sequence} extracted:`, {
    parcelNumber: parcelData.parcelNumber,
    owner: parcelData.owner,
    county: parcelData.county,
    acreage: parcelData.acreage,
    address: parcelData.ownerAddress,
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
