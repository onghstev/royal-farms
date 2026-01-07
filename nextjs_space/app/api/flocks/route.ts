import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Fetch all flocks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flocks = await prisma.flock.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedFlocks = flocks.map(flock => ({
      ...flock,
      costPerBird: flock.costPerBird ? Number(flock.costPerBird) : null,
    }));

    return NextResponse.json(serializedFlocks);
  } catch (error) {
    console.error('Error fetching flocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flocks' },
      { status: 500 }
    );
  }
}

// POST - Create a new flock
export async function POST(request: NextRequest) {
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
      siteId,
      arrivalDate,
      openingStock,
      supplier,
      costPerBird,
      notes,
    } = body;

    // Validation
    if (!flockName || !siteId || !arrivalDate || !openingStock) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if flock name already exists
    const existingFlock = await prisma.flock.findUnique({
      where: { flockName },
    });

    if (existingFlock) {
      return NextResponse.json(
        { error: 'Flock name already exists' },
        { status: 409 }
      );
    }

    // Create flock
    const flock = await prisma.flock.create({
      data: {
        flockName,
        flockType: flockType || 'layers',
        breed,
        siteId,
        arrivalDate: new Date(arrivalDate),
        openingStock: parseInt(openingStock),
        currentStock: parseInt(openingStock),
        status: 'active',
        supplier,
        costPerBird: costPerBird ? parseFloat(costPerBird) : null,
        managedBy: (session.user as any).id,
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
      ...flock,
      costPerBird: flock.costPerBird ? Number(flock.costPerBird) : null,
    };

    return NextResponse.json(serializedFlock, { status: 201 });
  } catch (error: any) {
    console.error('Error creating flock:', error);
    return NextResponse.json(
      { error: 'Failed to create flock' },
      { status: 500 }
    );
  }
}
