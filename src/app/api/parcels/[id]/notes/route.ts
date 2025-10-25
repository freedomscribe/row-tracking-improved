import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
  category: z.string().optional(),
});

// POST /api/parcels/[id]/notes - Create a note for a parcel
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify parcel ownership
    const parcel = await prisma.parcel.findFirst({
      where: {
        id: id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = createNoteSchema.parse(body);

    const note = await prisma.note.create({
      data: {
        parcelId: id,
        content: validatedData.content,
        category: validatedData.category,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
