import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch all feed consumption records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const consumptionType = searchParams.get('consumptionType');
    const flockId = searchParams.get('flockId');
    const batchId = searchParams.get('batchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (consumptionType) where.consumptionType = consumptionType;
    if (flockId) where.flockId = flockId;
    if (batchId) where.batchId = batchId;
    if (startDate && endDate) {
      where.consumptionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const consumptions = await prisma.dailyFeedConsumption.findMany({
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
        inventory: {
          select: {
            feedType: true,
            feedBrand: true,
            unitCostPerBag: true,
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
        consumptionDate: 'desc',
      },
    });

    // Serialize consumptions with proper number conversion
    const serializedConsumptions = consumptions.map((c: any) => ({
      ...c,
      feedQuantityBags: Number(c.feedQuantityBags),
      inventory: c.inventory ? {
        ...c.inventory,
        unitCostPerBag: Number(c.inventory.unitCostPerBag),
      } : null,
      recorder: {
        fullName: `${c.recorder.firstName} ${c.recorder.lastName}`,
      },
    }));

    // Calculate summary
    const totalFeedUsed = consumptions.reduce(
      (sum: number, c: any) => sum + Number(c.feedQuantityBags),
      0
    );
    const totalCost = consumptions.reduce(
      (sum: number, c: any) => sum + (Number(c.feedQuantityBags) * (c.inventory ? Number(c.inventory.unitCostPerBag) : 0)),
      0
    );

    return NextResponse.json({
      consumptions: serializedConsumptions,
      summary: {
        totalRecords: consumptions.length,
        totalFeedUsed: Number(totalFeedUsed.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        averageDailyCost: consumptions.length > 0 ? Number((totalCost / consumptions.length).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching consumptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consumption records' },
      { status: 500 }
    );
  }
}

// POST - Create new feed consumption record (with automatic inventory deduction)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      consumptionType,
      flockId,
      batchId,
      inventoryId,
      consumptionDate,
      feedQuantityBags,
      feedPricePerBag,
      feedType,
      notes,
    } = body;

    // Validation
    if (!consumptionType || !consumptionDate || !feedQuantityBags || !feedPricePerBag) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (consumptionType === 'flock' && !flockId) {
      return NextResponse.json(
        { error: 'Flock ID is required for flock consumption' },
        { status: 400 }
      );
    }

    if (consumptionType === 'batch' && !batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required for batch consumption' },
        { status: 400 }
      );
    }

    const totalFeedCost = Number(feedQuantityBags) * Number(feedPricePerBag);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if inventory has enough stock (if inventoryId provided)
      if (inventoryId) {
        const inventory = await tx.feedInventory.findUnique({
          where: { id: inventoryId },
        });

        if (!inventory) {
          throw new Error('Inventory not found');
        }

        if (Number(inventory.currentStockBags) < Number(feedQuantityBags)) {
          throw new Error(
            `Insufficient stock. Available: ${inventory.currentStockBags} bags, Requested: ${feedQuantityBags} bags`
          );
        }

        // Deduct from inventory
        await tx.feedInventory.update({
          where: { id: inventoryId },
          data: {
            currentStockBags: {
              decrement: Number(feedQuantityBags),
            },
          },
        });
      }

      // Create consumption record
      const consumption = await tx.dailyFeedConsumption.create({
        data: {
          consumptionType,
          flockId: consumptionType === 'flock' ? flockId : null,
          batchId: consumptionType === 'batch' ? batchId : null,
          inventoryId: inventoryId || null,
          consumptionDate: new Date(consumptionDate),
          feedQuantityBags,
          feedPricePerBag,
          totalFeedCost,
          feedType: feedType || null,
          recordedBy: currentUser.id,
          notes: notes || null,
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
          inventory: {
            select: {
              feedType: true,
            },
          },
        },
      });

      return consumption;
    });

    return NextResponse.json(
      { consumption: result, message: 'Consumption recorded and inventory updated successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating consumption:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create consumption record' },
      { status: 500 }
    );
  }
}

// PUT - Update feed consumption
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      consumptionType,
      flockId,
      batchId,
      inventoryId,
      consumptionDate,
      feedQuantityBags,
      feedPricePerBag,
      feedType,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Consumption ID is required' },
        { status: 400 }
      );
    }

    const totalFeedCost = Number(feedQuantityBags) * Number(feedPricePerBag);

    // Get old consumption for inventory adjustment
    const oldConsumption = await prisma.dailyFeedConsumption.findUnique({
      where: { id },
    });

    if (!oldConsumption) {
      return NextResponse.json(
        { error: 'Consumption record not found' },
        { status: 404 }
      );
    }

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Adjust inventory if quantity changed and inventory is tracked
      if (inventoryId) {
        const quantityDiff = Number(feedQuantityBags) - Number(oldConsumption.feedQuantityBags);
        
        if (quantityDiff !== 0) {
          const inventory = await tx.feedInventory.findUnique({
            where: { id: inventoryId },
          });

          if (inventory) {
            const newStock = Number(inventory.currentStockBags) - quantityDiff;
            if (newStock < 0) {
              throw new Error('Insufficient stock for this adjustment');
            }

            await tx.feedInventory.update({
              where: { id: inventoryId },
              data: {
                currentStockBags: newStock,
              },
            });
          }
        }
      }

      // Update consumption record
      const consumption = await tx.dailyFeedConsumption.update({
        where: { id },
        data: {
          consumptionType,
          flockId: consumptionType === 'flock' ? flockId : null,
          batchId: consumptionType === 'batch' ? batchId : null,
          inventoryId: inventoryId || null,
          consumptionDate: new Date(consumptionDate),
          feedQuantityBags,
          feedPricePerBag,
          totalFeedCost,
          feedType: feedType || null,
          notes: notes || null,
        },
        include: {
          flock: true,
          batch: true,
          inventory: true,
        },
      });

      return consumption;
    });

    return NextResponse.json(
      { consumption: result, message: 'Consumption updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating consumption:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update consumption record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feed consumption
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Consumption ID is required' },
        { status: 400 }
      );
    }

    // Get consumption details before deleting
    const consumption = await prisma.dailyFeedConsumption.findUnique({
      where: { id },
    });

    if (!consumption) {
      return NextResponse.json(
        { error: 'Consumption record not found' },
        { status: 404 }
      );
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Delete consumption
      await tx.dailyFeedConsumption.delete({
        where: { id },
      });

      // Restore inventory (reverse the consumption) if inventory was tracked
      if (consumption.inventoryId) {
        await tx.feedInventory.update({
          where: { id: consumption.inventoryId },
          data: {
            currentStockBags: {
              increment: Number(consumption.feedQuantityBags),
            },
          },
        });
      }
    });

    return NextResponse.json(
      { message: 'Consumption deleted and inventory adjusted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting consumption:', error);
    return NextResponse.json(
      { error: 'Failed to delete consumption record' },
      { status: 500 }
    );
  }
}
