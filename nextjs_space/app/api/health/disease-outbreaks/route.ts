import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch disease outbreaks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const flockId = searchParams.get('flockId');
    const batchId = searchParams.get('batchId');
    const isResolved = searchParams.get('isResolved');

    const outbreaks = await prisma.diseaseOutbreak.findMany({
      where: {
        ...(flockId && { flockId }),
        ...(batchId && { batchId }),
        ...(isResolved !== null && { isResolved: isResolved === 'true' }),
      },
      include: {
        flock: { select: { flockName: true } },
        batch: { select: { batchName: true } },
        recorder: { select: { firstName: true, lastName: true } },
      },
      orderBy: { outbreakDate: 'desc' },
    });

    return NextResponse.json({ outbreaks });
  } catch (error) {
    console.error('Error fetching disease outbreaks:', error);
    return NextResponse.json({ error: 'Failed to fetch outbreaks' }, { status: 500 });
  }
}

// POST - Create disease outbreak
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const outbreak = await prisma.diseaseOutbreak.create({
      data: {
        ...data,
        recordedBy: (session.user as any).id,
        outbreakDate: new Date(data.outbreakDate),
        resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : null,
      },
      include: {
        flock: { select: { flockName: true } },
        batch: { select: { batchName: true } },
      },
    });

    return NextResponse.json({ outbreak }, { status: 201 });
  } catch (error) {
    console.error('Error creating disease outbreak:', error);
    return NextResponse.json({ error: 'Failed to create outbreak' }, { status: 500 });
  }
}

// PUT - Update disease outbreak
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...data } = await request.json();

    const outbreak = await prisma.diseaseOutbreak.update({
      where: { id },
      data: {
        ...data,
        outbreakDate: new Date(data.outbreakDate),
        resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : null,
      },
    });

    return NextResponse.json({ outbreak });
  } catch (error) {
    console.error('Error updating disease outbreak:', error);
    return NextResponse.json({ error: 'Failed to update outbreak' }, { status: 500 });
  }
}

// DELETE - Delete disease outbreak
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await prisma.diseaseOutbreak.delete({ where: { id } });

    return NextResponse.json({ message: 'Outbreak deleted successfully' });
  } catch (error) {
    console.error('Error deleting disease outbreak:', error);
    return NextResponse.json({ error: 'Failed to delete outbreak' }, { status: 500 });
  }
}
