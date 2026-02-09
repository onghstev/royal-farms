import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncFeedConsumptionToExpenses() {
  console.log('Starting feed consumption to expense sync...\n');

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

  console.log(`Found ${consumptions.length} feed consumption records\n`);

  const existingExpenses = await prisma.expenseTransaction.findMany({
    where: { category: 'feed' },
    select: {
      transactionDate: true,
      amount: true,
      quantity: true,
      description: true,
    },
  });

  console.log(`Found ${existingExpenses.length} existing feed expenses\n`);

  let createdCount = 0;
  let skippedCount = 0;
  let totalAmount = 0;

  for (const consumption of consumptions) {
    const consumptionDate = new Date(consumption.consumptionDate);
    const feedQuantity = Number(consumption.feedQuantityBags);
    const feedPrice = Number(consumption.feedPricePerBag);
    const totalCost = feedQuantity * feedPrice;

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
        description: `Feed consumption: ${feedQuantity} bags @ N${feedPrice}/bag for ${consumptionType} (${targetName})`,
        notes: `Synced from existing feed consumption record. ${consumption.notes || ''}`.trim(),
        recordedBy: consumption.recordedBy,
      },
    });

    console.log(`Created expense: ${consumptionDate.toLocaleDateString()} - ${feedQuantity} bags - N${totalCost}`);
    createdCount++;
    totalAmount += totalCost;
  }

  console.log('\n========== SYNC COMPLETE ==========');
  console.log(`Total consumption records: ${consumptions.length}`);
  console.log(`Expenses created: ${createdCount}`);
  console.log(`Expenses skipped (already exist): ${skippedCount}`);
  console.log(`Total amount synced: N${totalAmount.toLocaleString()}`);

  await prisma.$disconnect();
}

syncFeedConsumptionToExpenses().catch(console.error);
