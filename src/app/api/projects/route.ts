import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectSchema } from '@/lib/validations';

// GET /api/projects - Get all projects for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { parcels: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check subscription limits
    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Auto-create FREE subscription if missing (safety fallback)
    if (!subscription) {
      console.log('No subscription found for user, creating FREE subscription');
      subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          stripeCustomerId: '', // Will be set when user subscribes
          tier: 'FREE',
          status: 'ACTIVE',
          projectLimit: 2,
          parcelLimitPerProject: 50,
          userLimit: 1,
          storageLimit: 0,
        },
      });
    }
    
    // Check project limit
    const projectCount = await prisma.project.count({
      where: { userId: session.user.id },
    });
    
    if (
      subscription.projectLimit !== -1 &&
      projectCount >= subscription.projectLimit
    ) {
      return NextResponse.json(
        {
          error: `Project limit reached. Your ${subscription.tier} plan allows ${subscription.projectLimit} projects.`,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    console.log('Received project data:', body);

    const validatedData = projectSchema.parse(body);
    console.log('Validated data:', validatedData);

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    });
    
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

