import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch all birth records
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

    const birthRecords = await prisma.birthRecord.findMany({
      where,
      include: {
        flock: {
          select: {
            flockName: true,
            flockType: true,
          },
        },
        batch: {
          select: {
            batchName: true,
            batchType: true,
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
        birthDate: 'desc',
      },
    });

    return NextResponse.json(birthRecords);
  } catch (error) {
    console.error('Error fetching birth records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch birth records' },
      { status: 500 }
    );
  }
}

// POST - Create a new birth record
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
      birthDate,
      birthCount,
      maleCount,
      femaleCount,
      motherDetails,
      fatherDetails,
      healthStatus,
      notes,
    } = body;

    // Validation
    if (!recordType || !birthDate || !birthCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (recordType === 'flock' && !flockId) {
      return NextResponse.json(
        { error: 'Flock ID required for flock birth record' },
        { status: 400 }
      );
    }

    if (recordType === 'batch' && !batchId) {
      return NextResponse.json(
        { error: 'Batch ID required for batch birth record' },
        { status: 400 }
      );
    }

    // Update current stock (add births to stock)
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

      // Add healthy births to current stock
      const healthyBirths = healthStatus === 'stillborn' ? 0 : parseInt(birthCount);
      await prisma.flock.update({
        where: { id: flockId },
        data: {
          currentStock: flock.currentStock + healthyBirths,
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

      // Add healthy births to current stock
      const healthyBirths = healthStatus === 'stillborn' ? 0 : parseInt(birthCount);
      await prisma.batch.update({
        where: { id: batchId },
        data: {
          currentStock: batch.currentStock + healthyBirths,
        },
      });
    }

    // Create birth record
    const birthRecord = await prisma.birthRecord.create({
      data: {
        recordType,
        flockId: recordType === 'flock' ? flockId : null,
        batchId: recordType === 'batch' ? batchId : null,
        birthDate: new Date(birthDate),
        birthCount: parseInt(birthCount),
        maleCount: parseInt(maleCount) || 0,
        femaleCount: parseInt(femaleCount) || 0,
        motherDetails: motherDetails || null,
        fatherDetails: fatherDetails || null,
        healthStatus: healthStatus || 'healthy',
        recordedBy: (session.user as any).id,
        notes,
      },
      include: {
        flock: {
          select: {
            flockName: true,
            flockType: true,
          },
        },
        batch: {
          select: {
            batchName: true,
            batchType: true,
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

    return NextResponse.json(birthRecord, { status: 201 });
  } catch (error: any) {
    console.error('Error creating birth record:', error);
    return NextResponse.json(
      { error: 'Failed to create birth record' },
      { status: 500 }
    );
  }
}
