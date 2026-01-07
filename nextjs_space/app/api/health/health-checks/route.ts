import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch health checks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const flockId = searchParams.get('flockId');
    const batchId = searchParams.get('batchId');

    const checks = await prisma.healthCheck.findMany({
      where: {
        ...(flockId && { flockId }),
        ...(batchId && { batchId }),
      },
      include: {
        flock: { select: { flockName: true } },
        batch: { select: { batchName: true } },
        inspector: { select: { firstName: true, lastName: true } },
      },
      orderBy: { checkDate: 'desc' },
    });

    return NextResponse.json({ checks });
  } catch (error) {
    console.error('Error fetching health checks:', error);
    return NextResponse.json({ error: 'Failed to fetch checks' }, { status: 500 });
  }
}

// POST - Create health check
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const check = await prisma.healthCheck.create({
      data: {
        ...data,
        inspectedBy: (session.user as any).id,
        checkDate: new Date(data.checkDate),
      },
      include: {
        flock: { select: { flockName: true } },
        batch: { select: { batchName: true } },
      },
    });

    return NextResponse.json({ check }, { status: 201 });
  } catch (error) {
    console.error('Error creating health check:', error);
    return NextResponse.json({ error: 'Failed to create check' }, { status: 500 });
  }
}

// PUT - Update health check
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...data } = await request.json();

    const check = await prisma.healthCheck.update({
      where: { id },
      data: {
        ...data,
        checkDate: new Date(data.checkDate),
      },
    });

    return NextResponse.json({ check });
  } catch (error) {
    console.error('Error updating health check:', error);
    return NextResponse.json({ error: 'Failed to update check' }, { status: 500 });
  }
}

// DELETE - Delete health check
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

    await prisma.healthCheck.delete({ where: { id } });

    return NextResponse.json({ message: 'Check deleted successfully' });
  } catch (error) {
    console.error('Error deleting health check:', error);
    return NextResponse.json({ error: 'Failed to delete check' }, { status: 500 });
  }
}
