import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch all livestock types
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const livestockTypes = await prisma.livestockType.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(livestockTypes);
  } catch (error: any) {
    console.error('Error fetching livestock types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch livestock types', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new livestock type
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'Farm Manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, description, icon } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const livestockType = await prisma.livestockType.create({
      data: {
        name,
        category,
        description: description || null,
        icon: icon || null,
      },
    });

    return NextResponse.json(livestockType, { status: 201 });
  } catch (error: any) {
    console.error('Error creating livestock type:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A livestock type with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create livestock type', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update livestock type
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'Farm Manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, category, description, icon, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const livestockType = await prisma.livestockType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(livestockType);
  } catch (error: any) {
    console.error('Error updating livestock type:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A livestock type with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update livestock type', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete livestock type
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'Farm Manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if any flocks or batches use this type
    const livestockType = await prisma.livestockType.findUnique({ where: { id } });
    if (!livestockType) {
      return NextResponse.json({ error: 'Livestock type not found' }, { status: 404 });
    }

    const flocksCount = await prisma.flock.count({
      where: { flockType: livestockType.name.toLowerCase() },
    });
    const batchesCount = await prisma.batch.count({
      where: { batchType: livestockType.name.toLowerCase() },
    });

    if (flocksCount > 0 || batchesCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${flocksCount} flock(s) and ${batchesCount} batch(es) use this type. Deactivate instead.`,
        },
        { status: 400 }
      );
    }

    await prisma.livestockType.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting livestock type:', error);
    return NextResponse.json(
      { error: 'Failed to delete livestock type', details: error.message },
      { status: 500 }
    );
  }
}
