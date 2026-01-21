import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Fetch all batches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batches = await prisma.batch.findMany({
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
    const serializedBatches = batches.map((batch: any) => ({
      ...batch,
      docCostPerBird: batch.docCostPerBird ? Number(batch.docCostPerBird) : null,
    }));

    return NextResponse.json(serializedBatches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

// POST - Create a new batch
export async function POST(request: NextRequest) {
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
      siteId,
      docArrivalDate,
      quantityOrdered,
      quantityReceived,
      supplier,
      docCostPerBird,
      expectedSaleDate,
      notes,
    } = body;

    // Validation
    if (!batchName || !siteId || !docArrivalDate || !quantityOrdered || !quantityReceived) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if batch name already exists
    const existingBatch = await prisma.batch.findUnique({
      where: { batchName },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch name already exists' },
        { status: 409 }
      );
    }

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        batchName,
        batchType: batchType || 'broilers',
        breed,
        siteId,
        docArrivalDate: new Date(docArrivalDate),
        quantityOrdered: parseInt(quantityOrdered),
        quantityReceived: parseInt(quantityReceived),
        currentStock: parseInt(quantityReceived),
        status: 'active',
        supplier,
        docCostPerBird: docCostPerBird ? parseFloat(docCostPerBird) : null,
        expectedSaleDate: expectedSaleDate ? new Date(expectedSaleDate) : null,
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
    const serializedBatch = {
      ...batch,
      docCostPerBird: batch.docCostPerBird ? Number(batch.docCostPerBird) : null,
    };

    return NextResponse.json(serializedBatch, { status: 201 });
  } catch (error: any) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
