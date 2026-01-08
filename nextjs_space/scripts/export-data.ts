import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportData() {
  const data: any = {};
  
  data.users = await prisma.user.findMany();
  data.roles = await prisma.role.findMany();
  data.sites = await prisma.site.findMany();
  data.flocks = await prisma.flock.findMany();
  data.batches = await prisma.batch.findMany();
  data.eggCollections = await prisma.dailyEggCollection.findMany();
  data.mortalityRecords = await prisma.mortalityRecord.findMany();
  data.weightRecords = await prisma.weightRecord.findMany();
  data.feedSuppliers = await prisma.feedSupplier.findMany();
  data.feedInventory = await prisma.feedInventory.findMany();
  data.feedPurchases = await prisma.feedPurchase.findMany();
  data.feedConsumption = await prisma.dailyFeedConsumption.findMany();
  data.inventoryCategories = await prisma.inventoryCategory.findMany();
  data.inventorySuppliers = await prisma.generalInventorySupplier.findMany();
  data.inventoryItems = await prisma.generalInventory.findMany();
  data.purchaseOrders = await prisma.purchaseOrder.findMany();
  data.purchaseOrderItems = await prisma.purchaseOrderItem.findMany();
  data.stockMovements = await prisma.stockMovement.findMany();
  data.incomeTransactions = await prisma.incomeTransaction.findMany();
  data.expenseTransactions = await prisma.expenseTransaction.findMany();
  data.vaccinationRecords = await prisma.vaccinationRecord.findMany();
  
  fs.writeFileSync('/home/ubuntu/royal_farms_backup/database_export.json', JSON.stringify(data, null, 2));
  console.log('Data exported successfully!');
  
  await prisma.$disconnect();
}

exportData().catch(console.error);
