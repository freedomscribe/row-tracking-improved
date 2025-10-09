import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exportToCSV, exportToPDF, exportDetailedPDF } from '@/lib/exports';

// GET /api/projects/[id]/export - Export project parcels
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const detailed = searchParams.get('detailed') === 'true';
    const sortBy = searchParams.get('sortBy') || 'sequence';
    const filterStatus = searchParams.get('status');
    const filterCounty = searchParams.get('county');
    
    // Build where clause
    const where: any = { projectId: params.id };
    
    if (filterStatus) {
      where.status = filterStatus;
    }
    
    if (filterCounty) {
      where.county = filterCounty;
    }
    
    // Fetch parcels
    const parcels = await prisma.parcel.findMany({
      where,
      include: detailed ? {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      } : undefined,
      orderBy: {
        [sortBy]: 'asc',
      },
    });
    
    if (parcels.length === 0) {
      return NextResponse.json(
        { error: 'No parcels found to export' },
        { status: 404 }
      );
    }
    
    // Generate export based on format
    if (format === 'csv') {
      const csv = exportToCSV(parcels);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${project.name}-parcels.csv"`,
        },
      });
    } else if (format === 'pdf') {
      const pdf = detailed
        ? exportDetailedPDF(parcels as any, project.name)
        : exportToPDF(parcels, project.name);
      
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${project.name}-parcels.pdf"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting parcels:', error);
    return NextResponse.json(
      { error: 'Failed to export parcels' },
      { status: 500 }
    );
  }
}

