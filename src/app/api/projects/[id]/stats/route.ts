import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/stats - Get statistics for a project
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
    
    // Get parcel statistics
    const parcels = await prisma.parcel.findMany({
      where: { projectId: params.id },
      select: {
        status: true,
        acreage: true,
      },
    });
    
    // Calculate statistics
    const total = parcels.length;
    const statusCounts = parcels.reduce((acc, parcel) => {
      acc[parcel.status] = (acc[parcel.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const acquired = statusCounts.ACQUIRED || 0;
    const inProgress = statusCounts.IN_PROGRESS || 0;
    const notStarted = statusCounts.NOT_STARTED || 0;
    const condemned = statusCounts.CONDEMNED || 0;
    const relocated = statusCounts.RELOCATED || 0;
    
    const totalAcreage = parcels.reduce(
      (sum, parcel) => sum + (parcel.acreage || 0),
      0
    );
    
    const completionPercentage = total > 0 ? Math.round((acquired / total) * 100) : 0;
    
    return NextResponse.json({
      stats: {
        total,
        acquired,
        inProgress,
        notStarted,
        condemned,
        relocated,
        totalAcreage: Math.round(totalAcreage * 100) / 100,
        completionPercentage,
        statusBreakdown: statusCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project statistics' },
      { status: 500 }
    );
  }
}

