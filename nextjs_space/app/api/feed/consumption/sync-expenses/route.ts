import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Sync existing feed consumption records to expense transactions
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all feed consumption records
    const consumptions = await prisma.dailyFeedConsumption.findMany({
      include: {
        inventory: {
          include: { supplier: true },
        },
        flock: { select: { flockName: true } },
        batch: { select: { batchName: true } },
      },
      orderBy: { consumptionDate: 'asc' },
    });

    // Get all existing expense transactions for feed category
    const existingExpenses = await prisma.expenseTransaction.findMany({
      where: { category: 'feed' },
      select: {
        transactionDate: true,
        amount: true,
        quantity: true,
        description: true,
      },
    });

    let createdCount = 0;
    let skippedCount = 0;
    let totalAmount = 0;

    for (const consumption of consumptions) {
      const consumptionDate = new Date(consumption.consumptionDate);
      const feedQuantity = Number(consumption.feedQuantityBags);
      const feedPrice = Number(consumption.feedPricePerBag);
      const totalCost = feedQuantity * feedPrice;

      // Check if an expense already exists for this consumption
      // Match by date, amount, and quantity
      const matchingExpense = existingExpenses.find((exp: any) => {
        const expDate = new Date(exp.transactionDate);
        const sameDate = expDate.toDateString() === consumptionDate.toDateString();
        const sameAmount = Math.abs(Number(exp.amount) - totalCost) < 0.01;
        const sameQuantity = exp.quantity && Math.abs(Number(exp.quantity) - feedQuantity) < 0.01;
        return sameDate && sameAmount && sameQuantity;
      });

      if (matchingExpense) {
        skippedCount++;
        continue;
      }

      // Create expense transaction
      const targetName = consumption.flock?.flockName || consumption.batch?.batchName || 'Unknown';
      const consumptionType = consumption.consumptionType || 'flock';

      await prisma.expenseTransaction.create({
        data: {
          transactionDate: consumptionDate,
          category: 'feed',
          amount: totalCost,
          quantity: feedQuantity,
          unitCost: feedPrice,
          vendorName: consumption.inventory?.supplier?.supplierName || null,
          vendorPhone: consumption.inventory?.supplier?.phone || null,
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          description: `Feed consumption: ${feedQuantity} bags @ ₦${feedPrice}/bag for ${consumptionType} (${targetName})`,
          notes: `Synced from existing feed consumption record. ${consumption.notes || ''}`.trim(),
          recordedBy: consumption.recordedBy,
        },
      });

      createdCount++;
      totalAmount += totalCost;
    }

    return NextResponse.json({
      success: true,
      message: `Synced feed consumption to expenses`,
      summary: {
        totalConsumptionRecords: consumptions.length,
        expensesCreated: createdCount,
        expensesSkipped: skippedCount,
        totalAmountSynced: totalAmount,
      },
    });
  } catch (error: any) {
    console.error('Error syncing feed consumption to expenses:', error);
    return NextResponse.json(
      { error: 'Failed to sync expenses', details: error.message },
      { status: 500 }
    );
  }
}
