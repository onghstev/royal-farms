import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Fetch all egg collections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const flockId = searchParams.get('flockId');

    const where = flockId ? { flockId } : {};

    const eggCollections = await prisma.dailyEggCollection.findMany({
      where,
      include: {
        flock: {
          select: {
            flockName: true,
            currentStock: true,
          },
        },
        recorder: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        collectionDate: 'desc',
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedCollections = eggCollections.map((collection: any) => ({
      ...collection,
      productionPercentage: collection.productionPercentage ? Number(collection.productionPercentage) : null,
    }));

    return NextResponse.json(serializedCollections);
  } catch (error) {
    console.error('Error fetching egg collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch egg collections' },
      { status: 500 }
    );
  }
}

// POST - Create a new egg collection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user from database by email
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      flockId,
      collectionDate,
      goodEggsCount,
      brokenEggsCount,
      collectionTime,
      notes,
    } = body;

    // Validation
    if (!flockId || !collectionDate || goodEggsCount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get flock to calculate production percentage
    const flock = await prisma.flock.findUnique({
      where: { id: flockId },
    });

    if (!flock) {
      return NextResponse.json(
        { error: 'Flock not found' },
        { status: 404 }
      );
    }

    const totalEggsCount = parseInt(goodEggsCount) + (parseInt(brokenEggsCount) || 0);
    const productionPercentage = flock.currentStock > 0 
      ? (totalEggsCount / flock.currentStock) * 100 
      : 0;

    // Create egg collection
    const eggCollection = await prisma.dailyEggCollection.create({
      data: {
        flockId,
        collectionDate: new Date(collectionDate),
        goodEggsCount: parseInt(goodEggsCount),
        brokenEggsCount: parseInt(brokenEggsCount) || 0,
        totalEggsCount,
        collectionTime,
        productionPercentage,
        recordedBy: currentUser.id,
        notes,
      },
      include: {
        flock: {
          select: {
            flockName: true,
            currentStock: true,
          },
        },
        recorder: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedCollection = {
      ...eggCollection,
      productionPercentage: eggCollection.productionPercentage ? Number(eggCollection.productionPercentage) : null,
    };

    return NextResponse.json(serializedCollection, { status: 201 });
  } catch (error: any) {
    console.error('Error creating egg collection:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An egg collection already exists for this flock on this date' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create egg collection' },
      { status: 500 }
    );
  }
}
