import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Fetch all weight records or filter by batch
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    const where = batchId ? { batchId } : {};

    const weightRecords = await prisma.weightRecord.findMany({
      where,
      include: {
        batch: {
          select: {
            batchName: true,
            docArrivalDate: true,
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
        weighingDate: 'desc',
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedRecords = weightRecords.map(record => ({
      ...record,
      averageWeight: Number(record.averageWeight),
      minWeight: record.minWeight ? Number(record.minWeight) : null,
      maxWeight: record.maxWeight ? Number(record.maxWeight) : null,
      uniformity: record.uniformity ? Number(record.uniformity) : null,
    }));

    return NextResponse.json(serializedRecords);
  } catch (error) {
    console.error('Error fetching weight records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weight records' },
      { status: 500 }
    );
  }
}

// POST - Create a new weight record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      batchId,
      weighingDate,
      ageInDays,
      sampleSize,
      averageWeight,
      minWeight,
      maxWeight,
      uniformity,
      notes,
    } = body;

    // Validation
    if (!batchId || !weighingDate || !ageInDays || !sampleSize || !averageWeight) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Create weight record
    const weightRecord = await prisma.weightRecord.create({
      data: {
        batchId,
        weighingDate: new Date(weighingDate),
        ageInDays: parseInt(ageInDays),
        sampleSize: parseInt(sampleSize),
        averageWeight: parseFloat(averageWeight),
        minWeight: minWeight ? parseFloat(minWeight) : null,
        maxWeight: maxWeight ? parseFloat(maxWeight) : null,
        uniformity: uniformity ? parseFloat(uniformity) : null,
        recordedBy: (session.user as any).id,
        notes,
      },
      include: {
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
      ...weightRecord,
      averageWeight: Number(weightRecord.averageWeight),
      minWeight: weightRecord.minWeight ? Number(weightRecord.minWeight) : null,
      maxWeight: weightRecord.maxWeight ? Number(weightRecord.maxWeight) : null,
      uniformity: weightRecord.uniformity ? Number(weightRecord.uniformity) : null,
    };

    return NextResponse.json(serializedRecord, { status: 201 });
  } catch (error: any) {
    console.error('Error creating weight record:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A weight record already exists for this batch on this date' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create weight record' },
      { status: 500 }
    );
  }
}
