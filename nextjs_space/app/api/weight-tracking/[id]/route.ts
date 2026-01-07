import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Fetch a single weight record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weightRecord = await prisma.weightRecord.findUnique({
      where: { id: params.id },
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
    });

    if (!weightRecord) {
      return NextResponse.json(
        { error: 'Weight record not found' },
        { status: 404 }
      );
    }

    // Convert Decimal to number for JSON serialization
    const serializedRecord = {
      ...weightRecord,
      averageWeight: Number(weightRecord.averageWeight),
      minWeight: weightRecord.minWeight ? Number(weightRecord.minWeight) : null,
      maxWeight: weightRecord.maxWeight ? Number(weightRecord.maxWeight) : null,
      uniformity: weightRecord.uniformity ? Number(weightRecord.uniformity) : null,
    };

    return NextResponse.json(serializedRecord);
  } catch (error) {
    console.error('Error fetching weight record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weight record' },
      { status: 500 }
    );
  }
}

// PUT - Update a weight record
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
      weighingDate,
      ageInDays,
      sampleSize,
      averageWeight,
      minWeight,
      maxWeight,
      uniformity,
      notes,
    } = body;

    // Check if record exists
    const existingRecord = await prisma.weightRecord.findUnique({
      where: { id: params.id },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Weight record not found' },
        { status: 404 }
      );
    }

    // Update weight record
    const updatedRecord = await prisma.weightRecord.update({
      where: { id: params.id },
      data: {
        weighingDate: weighingDate ? new Date(weighingDate) : undefined,
        ageInDays: ageInDays ? parseInt(ageInDays) : undefined,
        sampleSize: sampleSize ? parseInt(sampleSize) : undefined,
        averageWeight: averageWeight ? parseFloat(averageWeight) : undefined,
        minWeight: minWeight ? parseFloat(minWeight) : undefined,
        maxWeight: maxWeight ? parseFloat(maxWeight) : undefined,
        uniformity: uniformity ? parseFloat(uniformity) : undefined,
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
      ...updatedRecord,
      averageWeight: Number(updatedRecord.averageWeight),
      minWeight: updatedRecord.minWeight ? Number(updatedRecord.minWeight) : null,
      maxWeight: updatedRecord.maxWeight ? Number(updatedRecord.maxWeight) : null,
      uniformity: updatedRecord.uniformity ? Number(updatedRecord.uniformity) : null,
    };

    return NextResponse.json(serializedRecord);
  } catch (error: any) {
    console.error('Error updating weight record:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A weight record already exists for this batch on this date' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update weight record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a weight record
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

    // Only managers can delete records
    if (role !== 'Manager') {
      return NextResponse.json(
        { error: 'Unauthorized - Manager role required' },
        { status: 403 }
      );
    }

    // Check if record exists
    const existingRecord = await prisma.weightRecord.findUnique({
      where: { id: params.id },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Weight record not found' },
        { status: 404 }
      );
    }

    await prisma.weightRecord.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Weight record deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting weight record:', error);
    return NextResponse.json(
      { error: 'Failed to delete weight record' },
      { status: 500 }
    );
  }
}
