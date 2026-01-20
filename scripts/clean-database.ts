import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup for production...');
  console.log('⚠️  This will remove ALL test data!\n');

  try {
    // Delete in correct order (child tables first)
    console.log('Deleting transaction records...');
    await prisma.stockMovement.deleteMany({});
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    
    console.log('Deleting production records...');
    await prisma.dailyFeedConsumption.deleteMany({});
    await prisma.weightRecord.deleteMany({});
    await prisma.mortalityRecord.deleteMany({});
    await prisma.dailyEggCollection.deleteMany({});
    
    console.log('Deleting health records...');
    await prisma.diseaseOutbreak.deleteMany({});
    await prisma.healthCheck.deleteMany({});
    await prisma.medicationRecord.deleteMany({});
    await prisma.vaccinationRecord.deleteMany({});
    await prisma.vaccinationSchedule.deleteMany({});
    
    console.log('Deleting financial records...');
    await prisma.costAnalysis.deleteMany({});
    await prisma.budget.deleteMany({});
    await prisma.incomeTransaction.deleteMany({});
    await prisma.expenseTransaction.deleteMany({});
    await prisma.productionAlert.deleteMany({});
    
    console.log('Deleting feed records...');
    await prisma.feedPurchase.deleteMany({});
    await prisma.feedInventory.deleteMany({});
    await prisma.feedSupplier.deleteMany({});
    
    console.log('Deleting inventory records...');
    await prisma.generalInventory.deleteMany({});
    await prisma.generalInventorySupplier.deleteMany({});
    await prisma.inventoryCategory.deleteMany({});
    
    console.log('Deleting livestock records...');
    await prisma.batch.deleteMany({});
    await prisma.flock.deleteMany({});
    
    console.log('Deleting sites...');
    await prisma.site.deleteMany({});
    
    console.log('Deleting test users (keeping system roles)...');
    await prisma.user.deleteMany({});
    
    // Keep livestock types - they are configuration data
    console.log('✅ Livestock types preserved (configuration data)');
    
    // Keep roles - they are system configuration
    console.log('✅ System roles preserved');

    console.log('\n✅ Database cleaned successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create your production admin user');
    console.log('   2. Add your farm sites');
    console.log('   3. Add your actual livestock data');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createProductionAdmin() {
  console.log('\n👤 Creating production admin user...');
  
  // Get Farm Manager role
  const managerRole = await prisma.role.findFirst({
    where: { name: 'Farm Manager' }
  });
  
  if (!managerRole) {
    console.log('Creating Farm Manager role...');
    await prisma.role.create({
      data: {
        name: 'Farm Manager',
        description: 'Full access to all features'
      }
    });
  }
  
  const role = await prisma.role.findFirst({ where: { name: 'Farm Manager' } });
  
  // Create production admin
  const adminEmail = 'admin@royalfarms.com';
  const adminPassword = 'RoyalFarms2026!'; // User should change this immediately
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      firstName: 'Farm',
      lastName: 'Administrator',
      phone: '',
      roleId: role!.id,
      isActive: true,
    }
  });
  
  console.log('✅ Production admin created:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean-only')) {
    await cleanDatabase();
  } else if (args.includes('--create-admin')) {
    await createProductionAdmin();
  } else {
    // Default: clean and create admin
    await cleanDatabase();
    await createProductionAdmin();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
