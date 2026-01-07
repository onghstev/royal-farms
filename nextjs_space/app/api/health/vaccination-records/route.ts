import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch vaccination records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const flockId = searchParams.get('flockId');
    const batchId = searchParams.get('batchId');

    const records = await prisma.vaccinationRecord.findMany({
      where: {
        ...(flockId && { flockId }),
        ...(batchId && { batchId }),
      },
      include: {
        flock: { select: { flockName: true } },
        batch: { select: { batchName: true } },
        administrator: { select: { firstName: true, lastName: true } },
        schedule: true,
      },
      orderBy: { vaccinationDate: 'desc' },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching vaccination records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

// POST - Create vaccination record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const record = await prisma.vaccinationRecord.create({
      data: {
        ...data,
        administeredBy: (session.user as any).id,
        vaccinationDate: new Date(data.vaccinationDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
      include: {
        flock: { select: { flockName: true } },
        batch: { select: { batchName: true } },
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Error creating vaccination record:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}

// PUT - Update vaccination record
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...data } = await request.json();

    const record = await prisma.vaccinationRecord.update({
      where: { id },
      data: {
        ...data,
        vaccinationDate: new Date(data.vaccinationDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error updating vaccination record:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

// DELETE - Delete vaccination record
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

    await prisma.vaccinationRecord.delete({ where: { id } });

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting vaccination record:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
