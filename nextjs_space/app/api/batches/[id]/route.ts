import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Fetch a single batch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batch = await prisma.batch.findUnique({
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
        mortalityRecords: {
          take: 10,
          orderBy: { mortalityDate: 'desc' },
        },
        weightRecords: {
          take: 10,
          orderBy: { weighingDate: 'desc' },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Convert Decimal to number for JSON serialization
    const serializedBatch = {
      ...batch,
      docCostPerBird: batch.docCostPerBird ? Number(batch.docCostPerBird) : null,
      mortalityRecords: batch.mortalityRecords.map(mr => ({
        ...mr,
        mortalityRate: mr.mortalityRate ? Number(mr.mortalityRate) : null,
      })),
      weightRecords: batch.weightRecords.map(wr => ({
        ...wr,
        averageWeight: Number(wr.averageWeight),
        minWeight: wr.minWeight ? Number(wr.minWeight) : null,
        maxWeight: wr.maxWeight ? Number(wr.maxWeight) : null,
        uniformity: wr.uniformity ? Number(wr.uniformity) : null,
      })),
    };

    return NextResponse.json(serializedBatch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

// PUT - Update a batch
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
      batchName,
      batchType,
      breed,
      status,
      supplier,
      docCostPerBird,
      expectedSaleDate,
      actualHarvestDate,
      notes,
    } = body;

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id: params.id },
    });

    if (!existingBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // If batchName is being changed, check for duplicates
    if (batchName && batchName !== existingBatch.batchName) {
      const duplicateBatch = await prisma.batch.findUnique({
        where: { batchName },
      });

      if (duplicateBatch) {
        return NextResponse.json(
          { error: 'Batch name already exists' },
          { status: 409 }
        );
      }
    }

    // Update batch
    const updatedBatch = await prisma.batch.update({
      where: { id: params.id },
      data: {
        batchName,
        batchType,
        breed,
        status,
        supplier,
        docCostPerBird: docCostPerBird ? parseFloat(docCostPerBird) : null,
        expectedSaleDate: expectedSaleDate ? new Date(expectedSaleDate) : null,
        actualHarvestDate: actualHarvestDate ? new Date(actualHarvestDate) : null,
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
    const serializedBatch = {
      ...updatedBatch,
      docCostPerBird: updatedBatch.docCostPerBird ? Number(updatedBatch.docCostPerBird) : null,
    };

    return NextResponse.json(serializedBatch);
  } catch (error: any) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a batch
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

    // Only managers can delete batches
    if (role !== 'Manager') {
      return NextResponse.json(
        { error: 'Unauthorized - Manager role required' },
        { status: 403 }
      );
    }

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id: params.id },
    });

    if (!existingBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    await prisma.batch.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Batch deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { error: 'Failed to delete batch' },
      { status: 500 }
    );
  }
}
