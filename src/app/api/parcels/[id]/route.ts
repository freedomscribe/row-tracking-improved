import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateParcelSchema } from '@/lib/validations';

// GET /api/parcels/[id] - Get a specific parcel
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const parcel = await prisma.parcel.findFirst({
      where: {
        id: params.id,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: true,
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }
    
    return NextResponse.json({ parcel });
  } catch (error) {
    console.error('Error fetching parcel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parcel' },
      { status: 500 }
    );
  }
}

// PATCH /api/parcels/[id] - Update a parcel
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership
    const existingParcel = await prisma.parcel.findFirst({
      where: {
        id: params.id,
        project: {
          userId: session.user.id,
        },
      },
    });
    
    if (!existingParcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }
    
    const body = await req.json();
    const validatedData = updateParcelSchema.parse(body);
    
    const parcel = await prisma.parcel.update({
      where: { id: params.id },
      data: validatedData,
    });
    
    return NextResponse.json({ parcel });
  } catch (error) {
    console.error('Error updating parcel:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update parcel' },
      { status: 500 }
    );
  }
}

// DELETE /api/parcels/[id] - Delete a parcel
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership
    const existingParcel = await prisma.parcel.findFirst({
      where: {
        id: params.id,
        project: {
          userId: session.user.id,
        },
      },
    });
    
    if (!existingParcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }
    
    // Delete parcel (cascades to notes and documents)
    await prisma.parcel.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Parcel deleted successfully' });
  } catch (error) {
    console.error('Error deleting parcel:', error);
    return NextResponse.json(
      { error: 'Failed to delete parcel' },
      { status: 500 }
    );
  }
}

