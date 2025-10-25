import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

const createDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.string().optional(),
  file: z.string(), // Base64 encoded file
  mimeType: z.string(),
  size: z.number(),
});

// POST /api/parcels/[id]/documents - Upload a document for a parcel
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
    const validatedData = createDocumentSchema.parse(body);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFilename = validatedData.name.replace(/[^a-z0-9.-]/gi, '_');
    const filename = `${timestamp}-${safeFilename}`;
    const filepath = join(uploadsDir, filename);

    // Decode base64 and save file
    const base64Data = validatedData.file.split(',')[1] || validatedData.file;
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filepath, buffer);

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        parcelId: id,
        name: validatedData.name,
        type: validatedData.type || 'Other',
        url: `/uploads/documents/${filename}`,
        size: validatedData.size,
        mimeType: validatedData.mimeType,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
