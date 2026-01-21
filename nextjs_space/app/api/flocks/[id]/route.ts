import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Fetch a single flock
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flock = await prisma.flock.findUnique({
      where: { id: params.id },
      include: {
        site: {
          select: {
            name: true,
          },
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        eggCollections: {
          take: 10,
          orderBy: { collectionDate: 'desc' },
        },
        mortalityRecords: {
          take: 10,
          orderBy: { mortalityDate: 'desc' },
        },
      },
    });

    if (!flock) {
      return NextResponse.json(
        { error: 'Flock not found' },
        { status: 404 }
      );
    }

    // Convert Decimal to number for JSON serialization
    const serializedFlock = {
      ...flock,
      costPerBird: flock.costPerBird ? Number(flock.costPerBird) : null,
      eggCollections: flock.eggCollections.map((ec: any) => ({
        ...ec,
        productionPercentage: ec.productionPercentage ? Number(ec.productionPercentage) : null,
      })),
      mortalityRecords: flock.mortalityRecords.map((mr: any) => ({
        ...mr,
        mortalityRate: mr.mortalityRate ? Number(mr.mortalityRate) : null,
      })),
    };

    return NextResponse.json(serializedFlock);
  } catch (error) {
    console.error('Error fetching flock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flock' },
      { status: 500 }
    );
  }
}

// PUT - Update a flock
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      flockName,
      flockType,
      breed,
      status,
      supplier,
      costPerBird,
      notes,
    } = body;

    // Check if flock exists
    const existingFlock = await prisma.flock.findUnique({
      where: { id: params.id },
    });

    if (!existingFlock) {
      return NextResponse.json(
        { error: 'Flock not found' },
        { status: 404 }
      );
    }

    // If flockName is being changed, check for duplicates
    if (flockName && flockName !== existingFlock.flockName) {
      const duplicateFlock = await prisma.flock.findUnique({
        where: { flockName },
      });

      if (duplicateFlock) {
        return NextResponse.json(
          { error: 'Flock name already exists' },
          { status: 409 }
        );
      }
    }

    // Update flock
    const updatedFlock = await prisma.flock.update({
      where: { id: params.id },
      data: {
        flockName,
        flockType,
        breed,
        status,
        supplier,
        costPerBird: costPerBird ? parseFloat(costPerBird) : null,
        notes,
      },
      include: {
        site: {
          select: {
            name: true,
          },
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedFlock = {
      ...updatedFlock,
      costPerBird: updatedFlock.costPerBird ? Number(updatedFlock.costPerBird) : null,
    };

    return NextResponse.json(serializedFlock);
  } catch (error: any) {
    console.error('Error updating flock:', error);
    return NextResponse.json(
      { error: 'Failed to update flock' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a flock
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;

    // Only managers can delete flocks
    if (role !== 'Manager') {
      return NextResponse.json(
        { error: 'Unauthorized - Manager role required' },
        { status: 403 }
      );
    }

    // Check if flock exists
    const existingFlock = await prisma.flock.findUnique({
      where: { id: params.id },
    });

    if (!existingFlock) {
      return NextResponse.json(
        { error: 'Flock not found' },
        { status: 404 }
      );
    }

    await prisma.flock.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Flock deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting flock:', error);
    return NextResponse.json(
      { error: 'Failed to delete flock' },
      { status: 500 }
    );
  }
}
