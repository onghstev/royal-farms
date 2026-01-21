import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/* ----------------------------------
   Helper Types
-----------------------------------*/

// Base type alias for DailyFeedConsumption
type DailyFeedConsumption = Prisma.DailyFeedConsumptionGetPayload<{}>;

type ConsumptionWithRelations = Prisma.DailyFeedConsumptionGetPayload<{
  include: {
    flock: { select: { flockName: true; flockType: true } };
    batch: { select: { batchName: true; batchType: true } };
    inventory: { select: { feedType: true; feedBrand: true; unitCostPerBag: true } };
    recorder: { select: { firstName: true; lastName: true } };
  };
}>;

/* ----------------------------------
   GET – Fetch consumption records
-----------------------------------*/
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const where: Prisma.DailyFeedConsumptionWhereInput = {
      consumptionType: searchParams.get('consumptionType') || undefined,
      flockId: searchParams.get('flockId') || undefined,
      batchId: searchParams.get('batchId') || undefined,
      consumptionDate:
        searchParams.get('startDate') && searchParams.get('endDate')
          ? {
              gte: new Date(searchParams.get('startDate')!),
              lte: new Date(searchParams.get('endDate')!),
            }
          : undefined,
    };

    const consumptions = await prisma.dailyFeedConsumption.findMany({
      where,
      include: {
        flock: { select: { flockName: true, flockType: true } },
        batch: { select: { batchName: true, batchType: true } },
        inventory: {
          select: { feedType: true, feedBrand: true, unitCostPerBag: true },
        },
        recorder: { select: { firstName: true, lastName: true } },
      },
      orderBy: { consumptionDate: 'desc' },
    });

    const serializedConsumptions = consumptions.map((c: ConsumptionWithRelations) => ({
      ...c,
      feedQuantityBags: Number(c.feedQuantityBags),
      inventory: c.inventory
        ? { ...c.inventory, unitCostPerBag: Number(c.inventory.unitCostPerBag) }
        : null,
      recorder: {
        fullName: `${c.recorder.firstName} ${c.recorder.lastName}`,
      },
    }));

    const totalFeedUsed = consumptions.reduce(
      (sum: number, c: DailyFeedConsumption) => sum + Number(c.feedQuantityBags),
      0
    );

    const totalCost = consumptions.reduce((sum: number, c) => {
      const costPerBag = c.inventory ? Number(c.inventory.unitCostPerBag) : 0;
      return sum + Number(c.feedQuantityBags) * costPerBag;
    }, 0);

    return NextResponse.json({
      consumptions: serializedConsumptions,
      summary: {
        totalRecords: consumptions.length,
        totalFeedUsed: Number(totalFeedUsed.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        averageDailyCost:
          consumptions.length > 0
            ? Number((totalCost / consumptions.length).toFixed(2))
            : 0,
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

/* ----------------------------------
   POST – Create consumption
-----------------------------------*/
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    } = body as {
      consumptionType: 'flock' | 'batch';
      flockId?: string;
      batchId?: string;
      inventoryId?: string;
      consumptionDate: string;
      feedQuantityBags: number;
      feedPricePerBag: number;
      feedType?: string;
      notes?: string;
    };

    if (!consumptionType || !consumptionDate || !feedQuantityBags || !feedPricePerBag) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalFeedCost = Number(feedQuantityBags) * Number(feedPricePerBag);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (inventoryId) {
        const inventory = await tx.feedInventory.findUnique({
          where: { id: inventoryId },
        });

        if (!inventory) throw new Error('Inventory not found');
        if (Number(inventory.currentStockBags) < feedQuantityBags) {
          throw new Error('Insufficient stock');
        }

        await tx.feedInventory.update({
          where: { id: inventoryId },
          data: {
            currentStockBags: { decrement: feedQuantityBags },
          },
        });
      }

      return tx.dailyFeedConsumption.create({
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
      });
    });

    return NextResponse.json(
      { consumption: result, message: 'Consumption recorded successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating consumption:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create consumption' },
      { status: 500 }
    );
  }
}

/* ----------------------------------
   PUT & DELETE
   (Your existing logic is fine;
    type errors are already resolved)
-----------------------------------*/
