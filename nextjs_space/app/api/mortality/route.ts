import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Fetch all mortality records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get('recordType');
    const flockId = searchParams.get('flockId');
    const batchId = searchParams.get('batchId');

    let where: any = {};
    if (recordType) where.recordType = recordType;
    if (flockId) where.flockId = flockId;
    if (batchId) where.batchId = batchId;

    const mortalityRecords = await prisma.mortalityRecord.findMany({
      where,
      include: {
        flock: {
          select: {
            flockName: true,
          },
        },
        batch: {
          select: {
            batchName: true,
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
        mortalityDate: 'desc',
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedRecords = mortalityRecords.map(record => ({
      ...record,
      mortalityRate: record.mortalityRate ? Number(record.mortalityRate) : null,
    }));

    return NextResponse.json(serializedRecords);
  } catch (error) {
    console.error('Error fetching mortality records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mortality records' },
      { status: 500 }
    );
  }
}

// POST - Create a new mortality record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      recordType,
      flockId,
      batchId,
      mortalityDate,
      mortalityCount,
      cause,
      notes,
    } = body;

    // Validation
    if (!recordType || !mortalityDate || !mortalityCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (recordType === 'flock' && !flockId) {
      return NextResponse.json(
        { error: 'Flock ID required for flock mortality' },
        { status: 400 }
      );
    }

    if (recordType === 'batch' && !batchId) {
      return NextResponse.json(
        { error: 'Batch ID required for batch mortality' },
        { status: 400 }
      );
    }

    // Get current stock and calculate mortality rate
    let currentStock = 0;
    let mortalityRate = 0;

    if (recordType === 'flock' && flockId) {
      const flock = await prisma.flock.findUnique({
        where: { id: flockId },
      });

      if (!flock) {
        return NextResponse.json(
          { error: 'Flock not found' },
          { status: 404 }
        );
      }

      currentStock = flock.currentStock;
      mortalityRate = currentStock > 0 ? (parseInt(mortalityCount) / currentStock) * 100 : 0;

      // Update flock current stock
      await prisma.flock.update({
        where: { id: flockId },
        data: {
          currentStock: Math.max(0, currentStock - parseInt(mortalityCount)),
        },
      });
    } else if (recordType === 'batch' && batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }

      currentStock = batch.currentStock;
      mortalityRate = currentStock > 0 ? (parseInt(mortalityCount) / currentStock) * 100 : 0;

      // Update batch current stock
      await prisma.batch.update({
        where: { id: batchId },
        data: {
          currentStock: Math.max(0, currentStock - parseInt(mortalityCount)),
        },
      });
    }

    // Create mortality record
    const mortalityRecord = await prisma.mortalityRecord.create({
      data: {
        recordType,
        flockId: recordType === 'flock' ? flockId : null,
        batchId: recordType === 'batch' ? batchId : null,
        mortalityDate: new Date(mortalityDate),
        mortalityCount: parseInt(mortalityCount),
        cause: cause || 'Unknown',
        mortalityRate,
        recordedBy: (session.user as any).id,
        notes,
      },
      include: {
        flock: {
          select: {
            flockName: true,
          },
        },
        batch: {
          select: {
            batchName: true,
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
    const serializedRecord = {
      ...mortalityRecord,
      mortalityRate: mortalityRecord.mortalityRate ? Number(mortalityRecord.mortalityRate) : null,
    };

    return NextResponse.json(serializedRecord, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mortality record:', error);
    return NextResponse.json(
      { error: 'Failed to create mortality record' },
      { status: 500 }
    );
  }
}
