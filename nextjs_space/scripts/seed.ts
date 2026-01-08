import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================
  // 1. Create Roles
  // ============================================
  console.log('📋 Creating roles...');
  
  const farmManagerRole = await prisma.role.upsert({
    where: { name: 'Farm Manager' },
    update: {},
    create: {
      name: 'Farm Manager',
      description: 'Full access to all features - create, read, update, delete',
    },
  });

  const supervisorRole = await prisma.role.upsert({
    where: { name: 'Supervisor' },
    update: {},
    create: {
      name: 'Supervisor',
      description: 'View all data + edit production records (no delete, no user management)',
    },
  });

  const workerRole = await prisma.role.upsert({
    where: { name: 'Farm Worker' },
    update: {},
    create: {
      name: 'Farm Worker',
      description: 'Data entry only - add egg collection, mortality records',
    },
  });

  console.log('✅ Roles created');

  // ============================================
  // 2. Create Test Users
  // ============================================
  console.log('👥 Creating test users...');
  
  // Farm Manager (main test account for users)
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@royalfarms.com' },
    update: {},
    create: {
      email: 'manager@royalfarms.com',
      passwordHash: await bcrypt.hash('manager123', 10),
      firstName: 'Michael',
      lastName: 'Adeyemi',
      phone: '+234 803 123 4567',
      roleId: farmManagerRole.id,
      isActive: true,
    },
  });
  
  // Additional Farm Manager (internal test account)
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      passwordHash: await bcrypt.hash('johndoe123', 10),
      firstName: 'John',
      lastName: 'Doe',
      phone: '+234 803 999 8888',
      roleId: farmManagerRole.id,
      isActive: true,
    },
  });

  // Supervisor
  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@royalfarms.com' },
    update: {},
    create: {
      email: 'supervisor@royalfarms.com',
      passwordHash: await bcrypt.hash('supervisor123', 10),
      firstName: 'Sarah',
      lastName: 'Okonkwo',
      phone: '+234 803 234 5678',
      roleId: supervisorRole.id,
      isActive: true,
    },
  });

  // Farm Worker
  const workerUser = await prisma.user.upsert({
    where: { email: 'worker@royalfarms.com' },
    update: {},
    create: {
      email: 'worker@royalfarms.com',
      passwordHash: await bcrypt.hash('worker123', 10),
      firstName: 'Chidi',
      lastName: 'Eze',
      phone: '+234 803 345 6789',
      roleId: workerRole.id,
      isActive: true,
    },
  });

  console.log('✅ Test users created');

  // ============================================
  // 3. Create Sites
  // ============================================
  console.log('🏢 Creating sites...');
  
  const mainSite = await prisma.site.upsert({
    where: { id: 'main-site' },
    update: {},
    create: {
      id: 'main-site',
      name: 'Main Farm - Umunede',
      location: 'Umunede, Delta State, Nigeria',
      description: 'Primary production facility with layer houses and broiler pens',
      isActive: true,
    },
  });

  const annexSite = await prisma.site.upsert({
    where: { id: 'annex-site' },
    update: {},
    create: {
      id: 'annex-site',
      name: 'Annex Farm - Site B',
      location: 'Umunede Extension, Delta State',
      description: 'Secondary facility for overflow capacity',
      isActive: true,
    },
  });

  console.log('✅ Sites created');

  // ============================================
  // 4. Create Flocks (Layers)
  // ============================================
  console.log('🐔 Creating layer flocks...');
  
  const flock1 = await prisma.flock.upsert({
    where: { flockName: 'L-2024-H1-15K' },
    update: {},
    create: {
      flockName: 'L-2024-H1-15K',
      flockType: 'layers',
      breed: 'ISA Brown',
      siteId: mainSite.id,
      arrivalDate: new Date('2024-03-15'),
      openingStock: 15000,
      currentStock: 14850, // After mortality
      status: 'active',
      supplier: 'Chi Farms Nigeria Ltd',
      costPerBird: 800.00,
      managedBy: adminUser.id,
      notes: 'High-performing flock with excellent egg production',
    },
  });

  const flock2 = await prisma.flock.upsert({
    where: { flockName: 'L-2024-H2-20K' },
    update: {},
    create: {
      flockName: 'L-2024-H2-20K',
      flockType: 'layers',
      breed: 'Lohmann Brown',
      siteId: mainSite.id,
      arrivalDate: new Date('2024-05-20'),
      openingStock: 20000,
      currentStock: 19780,
      status: 'active',
      supplier: 'Obasanjo Farms',
      costPerBird: 850.00,
      managedBy: supervisorUser.id,
      notes: 'Excellent feed conversion and egg quality',
    },
  });

  const flock3 = await prisma.flock.upsert({
    where: { flockName: 'L-2024-H3-10K' },
    update: {},
    create: {
      flockName: 'L-2024-H3-10K',
      flockType: 'layers',
      breed: 'Hy-Line Brown',
      siteId: annexSite.id,
      arrivalDate: new Date('2024-08-10'),
      openingStock: 10000,
      currentStock: 9920,
      status: 'active',
      supplier: 'CHI Farms Nigeria Ltd',
      costPerBird: 820.00,
      managedBy: adminUser.id,
      notes: 'Newer flock with steady growth',
    },
  });

  console.log('✅ Layer flocks created');

  // ============================================
  // 5. Create Batches (Broilers)
  // ============================================
  console.log('🍗 Creating broiler batches...');
  
  const batch1 = await prisma.batch.upsert({
    where: { batchName: 'B-2025-01-5K' },
    update: {},
    create: {
      batchName: 'B-2025-01-5K',
      batchType: 'broilers',
      breed: 'Cobb 500',
      siteId: mainSite.id,
      docArrivalDate: new Date('2024-12-01'),
      quantityOrdered: 5000,
      quantityReceived: 5000,
      currentStock: 4920, // After mortality
      status: 'growing',
      supplier: 'Zartech Hatcheries',
      docCostPerBird: 250.00,
      expectedSaleDate: new Date('2025-02-15'),
      managedBy: adminUser.id,
      notes: 'Fast-growing batch, good health status',
    },
  });

  const batch2 = await prisma.batch.upsert({
    where: { batchName: 'B-2024-12-4.5K' },
    update: {},
    create: {
      batchName: 'B-2024-12-4.5K',
      batchType: 'broilers',
      breed: 'Ross 308',
      siteId: annexSite.id,
      docArrivalDate: new Date('2024-11-15'),
      quantityOrdered: 4500,
      quantityReceived: 4500,
      currentStock: 4420,
      status: 'ready',
      supplier: 'Zartech Hatcheries',
      docCostPerBird: 240.00,
      expectedSaleDate: new Date('2025-01-30'),
      managedBy: supervisorUser.id,
      notes: 'Ready for market, excellent body weight',
    },
  });

  console.log('✅ Broiler batches created');

  // ============================================
  // 6. Create Daily Egg Collection Records
  // ============================================
  console.log('🥚 Creating egg collection records...');
  
  // Helper function to generate dates for the last N days
  const generateDates = (days: number) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  // Generate 30 days of egg collection for flock1
  const last30Days = generateDates(30);
  for (const date of last30Days) {
    const baseProduction = 10800; // ~72% production for 15K birds
    const variance = Math.floor(Math.random() * 1000) - 500; // ±500 eggs
    const goodEggs = baseProduction + variance;
    const brokenEggs = Math.floor(Math.random() * 200) + 100; // 100-300 broken eggs
    const productionPercentage = ((goodEggs + brokenEggs) / flock1.currentStock) * 100;

    await prisma.dailyEggCollection.upsert({
      where: {
        flockId_collectionDate: {
          flockId: flock1.id,
          collectionDate: date,
        },
      },
      update: {},
      create: {
        flockId: flock1.id,
        collectionDate: date,
        goodEggsCount: goodEggs,
        brokenEggsCount: brokenEggs,
        totalEggsCount: goodEggs + brokenEggs,
        collectionTime: '08:30',
        productionPercentage: parseFloat(productionPercentage.toFixed(2)),
        recordedBy: workerUser.id,
        notes: Math.random() > 0.8 ? 'Normal collection, good quality eggs' : null,
      },
    });
  }

  // Generate 30 days of egg collection for flock2
  for (const date of last30Days) {
    const baseProduction = 14400; // ~72% production for 20K birds
    const variance = Math.floor(Math.random() * 1200) - 600;
    const goodEggs = baseProduction + variance;
    const brokenEggs = Math.floor(Math.random() * 250) + 150;
    const productionPercentage = ((goodEggs + brokenEggs) / flock2.currentStock) * 100;

    await prisma.dailyEggCollection.upsert({
      where: {
        flockId_collectionDate: {
          flockId: flock2.id,
          collectionDate: date,
        },
      },
      update: {},
      create: {
        flockId: flock2.id,
        collectionDate: date,
        goodEggsCount: goodEggs,
        brokenEggsCount: brokenEggs,
        totalEggsCount: goodEggs + brokenEggs,
        collectionTime: '09:00',
        productionPercentage: parseFloat(productionPercentage.toFixed(2)),
        recordedBy: workerUser.id,
      },
    });
  }

  // Generate 20 days for flock3 (newer flock)
  const last20Days = generateDates(20);
  for (const date of last20Days) {
    const baseProduction = 7200; // ~72% production for 10K birds
    const variance = Math.floor(Math.random() * 600) - 300;
    const goodEggs = baseProduction + variance;
    const brokenEggs = Math.floor(Math.random() * 150) + 80;
    const productionPercentage = ((goodEggs + brokenEggs) / flock3.currentStock) * 100;

    await prisma.dailyEggCollection.upsert({
      where: {
        flockId_collectionDate: {
          flockId: flock3.id,
          collectionDate: date,
        },
      },
      update: {},
      create: {
        flockId: flock3.id,
        collectionDate: date,
        goodEggsCount: goodEggs,
        brokenEggsCount: brokenEggs,
        totalEggsCount: goodEggs + brokenEggs,
        collectionTime: '08:45',
        productionPercentage: parseFloat(productionPercentage.toFixed(2)),
        recordedBy: workerUser.id,
      },
    });
  }

  console.log('✅ Egg collection records created');

  // ============================================
  // 7. Create Mortality Records
  // ============================================
  console.log('💀 Creating mortality records...');
  
  // Mortality for flock1 over last 30 days
  const mortalityCauses = ['Disease', 'Heat Stress', 'Unknown', 'Predator', 'Other'];
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const mortalityCount = Math.floor(Math.random() * 15) + 5; // 5-20 deaths
    const mortalityRate = (mortalityCount / flock1.currentStock) * 100;

    await prisma.mortalityRecord.create({
      data: {
        recordType: 'flock',
        flockId: flock1.id,
        mortalityDate: date,
        mortalityCount,
        cause: mortalityCauses[Math.floor(Math.random() * mortalityCauses.length)],
        mortalityRate: parseFloat(mortalityRate.toFixed(2)),
        recordedBy: workerUser.id,
        notes: Math.random() > 0.7 ? 'Post-mortem conducted' : null,
      },
    });
  }

  // Mortality for flock2
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const mortalityCount = Math.floor(Math.random() * 20) + 8;
    const mortalityRate = (mortalityCount / flock2.currentStock) * 100;

    await prisma.mortalityRecord.create({
      data: {
        recordType: 'flock',
        flockId: flock2.id,
        mortalityDate: date,
        mortalityCount,
        cause: mortalityCauses[Math.floor(Math.random() * mortalityCauses.length)],
        mortalityRate: parseFloat(mortalityRate.toFixed(2)),
        recordedBy: supervisorUser.id,
      },
    });
  }

  // Mortality for batch1
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 40));
    const mortalityCount = Math.floor(Math.random() * 12) + 3;
    const mortalityRate = (mortalityCount / batch1.currentStock) * 100;

    await prisma.mortalityRecord.create({
      data: {
        recordType: 'batch',
        batchId: batch1.id,
        mortalityDate: date,
        mortalityCount,
        cause: mortalityCauses[Math.floor(Math.random() * mortalityCauses.length)],
        mortalityRate: parseFloat(mortalityRate.toFixed(2)),
        recordedBy: workerUser.id,
      },
    });
  }

  // Mortality for batch2
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 50));
    const mortalityCount = Math.floor(Math.random() * 10) + 2;
    const mortalityRate = (mortalityCount / batch2.currentStock) * 100;

    await prisma.mortalityRecord.create({
      data: {
        recordType: 'batch',
        batchId: batch2.id,
        mortalityDate: date,
        mortalityCount,
        cause: mortalityCauses[Math.floor(Math.random() * mortalityCauses.length)],
        mortalityRate: parseFloat(mortalityRate.toFixed(2)),
        recordedBy: supervisorUser.id,
      },
    });
  }

  console.log('✅ Mortality records created');

  // ============================================
  // 8. Create Feed Consumption Records
  // ============================================
  console.log('🌾 Creating feed consumption records...');
  
  const feedTypes = ['Layers Mash', 'Growers Feed', 'Finisher Feed', 'Broiler Starter'];
  
  // Feed for flock1 (last 30 days)
  for (const date of last30Days) {
    const feedBags = parseFloat((Math.random() * 20 + 60).toFixed(2)); // 60-80 bags
    const pricePerBag = 8500;
    const totalCost = feedBags * pricePerBag;

    await prisma.dailyFeedConsumption.create({
      data: {
        consumptionType: 'flock',
        flockId: flock1.id,
        consumptionDate: date,
        feedQuantityBags: feedBags,
        feedPricePerBag: pricePerBag,
        totalFeedCost: totalCost,
        feedType: 'Layers Mash',
        recordedBy: workerUser.id,
      },
    });
  }

  // Feed for batch1 (last 40 days)
  const last40Days = generateDates(40);
  for (const date of last40Days) {
    const feedBags = parseFloat((Math.random() * 15 + 35).toFixed(2)); // 35-50 bags
    const pricePerBag = 9200;
    const totalCost = feedBags * pricePerBag;

    await prisma.dailyFeedConsumption.create({
      data: {
        consumptionType: 'batch',
        batchId: batch1.id,
        consumptionDate: date,
        feedQuantityBags: feedBags,
        feedPricePerBag: pricePerBag,
        totalFeedCost: totalCost,
        feedType: 'Broiler Starter',
        recordedBy: workerUser.id,
      },
    });
  }

  console.log('✅ Feed consumption records created');

  // ============================================
  // 9. Create Production Alerts
  // ============================================
  console.log('⚠️ Creating production alerts...');
  
  // High mortality alert
  await prisma.productionAlert.create({
    data: {
      alertType: 'high_mortality',
      severity: 'high',
      flockId: flock1.id,
      alertDate: new Date(),
      message: 'Daily mortality rate exceeds 0.5% threshold (15 deaths recorded)',
      isResolved: false,
    },
  });

  // Low production alert
  await prisma.productionAlert.create({
    data: {
      alertType: 'low_production',
      severity: 'medium',
      flockId: flock2.id,
      alertDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      message: 'Egg production dropped below 65% (13,500 eggs vs. expected 14,400)',
      isResolved: true,
      resolvedBy: adminUser.id,
      resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  // Aging batch alert
  await prisma.productionAlert.create({
    data: {
      alertType: 'aging_batch',
      severity: 'critical',
      batchId: batch2.id,
      alertDate: new Date(),
      message: 'Batch B-2024-12-4.5K has reached 52 days old - market immediately',
      isResolved: false,
    },
  });

  console.log('✅ Production alerts created');

  // ============================================
  // 9. Create Feed Suppliers
  // ============================================
  console.log('🏭 Creating feed suppliers...');

  const vitalFeedSupplier = await prisma.feedSupplier.upsert({
    where: { supplierName: 'Vital Feed Mills Limited' },
    update: {},
    create: {
      supplierName: 'Vital Feed Mills Limited',
      contactPerson: 'Mr. Emeka Okoli',
      phone: '+234 803 456 7890',
      email: 'sales@vitalfeed.com',
      address: '45 Industrial Road, Warri, Delta State',
      isActive: true,
    },
  });

  const topFeedsSupplier = await prisma.feedSupplier.upsert({
    where: { supplierName: 'Top Feeds Nigeria Ltd' },
    update: {},
    create: {
      supplierName: 'Top Feeds Nigeria Ltd',
      contactPerson: 'Mrs. Ngozi Eze',
      phone: '+234 806 123 4567',
      email: 'info@topfeeds.ng',
      address: '23 Sapele Road, Benin City, Edo State',
      isActive: true,
    },
  });

  const agriProSupplier = await prisma.feedSupplier.upsert({
    where: { supplierName: 'AgriPro Feed Solutions' },
    update: {},
    create: {
      supplierName: 'AgriPro Feed Solutions',
      contactPerson: 'Alhaji Musa Ibrahim',
      phone: '+234 809 876 5432',
      email: 'contact@agriprofeed.com',
      address: '78 Market Road, Asaba, Delta State',
      isActive: true,
    },
  });

  console.log('✅ Feed suppliers created');

  // ============================================
  // 10. Create Feed Inventory
  // ============================================
  console.log('📦 Creating feed inventory items...');

  const layerFeed1 = await prisma.feedInventory.create({
    data: {
      feedType: 'Layer',
      feedBrand: 'Vital Layer Premium',
      currentStockBags: 450,
      reorderLevel: 100,
      unitCostPerBag: 12500,
      lastRestockDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
      supplierId: vitalFeedSupplier.id,
      isActive: true,
    },
  });

  const layerFeed2 = await prisma.feedInventory.create({
    data: {
      feedType: 'Layer',
      feedBrand: 'Top Layer Gold',
      currentStockBags: 280,
      reorderLevel: 80,
      unitCostPerBag: 11800,
      lastRestockDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
      supplierId: topFeedsSupplier.id,
      isActive: true,
    },
  });

  const starterFeed = await prisma.feedInventory.create({
    data: {
      feedType: 'Starter',
      feedBrand: 'AgriPro Chick Starter',
      currentStockBags: 150,
      reorderLevel: 50,
      unitCostPerBag: 15200,
      lastRestockDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      supplierId: agriProSupplier.id,
      isActive: true,
    },
  });

  const growerFeed = await prisma.feedInventory.create({
    data: {
      feedType: 'Grower',
      feedBrand: 'Vital Grower Plus',
      currentStockBags: 180,
      reorderLevel: 60,
      unitCostPerBag: 13500,
      lastRestockDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000),
      supplierId: vitalFeedSupplier.id,
      isActive: true,
    },
  });

  const finisherFeed = await prisma.feedInventory.create({
    data: {
      feedType: 'Finisher',
      feedBrand: 'Top Broiler Finisher',
      currentStockBags: 220,
      reorderLevel: 70,
      unitCostPerBag: 12800,
      lastRestockDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000),
      supplierId: topFeedsSupplier.id,
      isActive: true,
    },
  });

  const lowStockFeed = await prisma.feedInventory.create({
    data: {
      feedType: 'Grower',
      feedBrand: 'AgriPro Growth Formula',
      currentStockBags: 35, // Low stock for testing alerts
      reorderLevel: 50,
      unitCostPerBag: 13200,
      lastRestockDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
      supplierId: agriProSupplier.id,
      isActive: true,
    },
  });

  console.log('✅ Feed inventory items created');

  // ============================================
  // 11. Create Feed Purchases
  // ============================================
  console.log('💰 Creating feed purchase records...');

  // Purchase 1: Layer feed from Vital Feed (30 days ago)
  await prisma.feedPurchase.create({
    data: {
      supplierId: vitalFeedSupplier.id,
      inventoryId: layerFeed1.id,
      quantityBags: 200,
      pricePerBag: 12500,
      totalCost: 200 * 12500,
      purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-VF-2024-001',
      paymentStatus: 'Paid',
      receivedBy: managerUser.id,
      notes: 'Initial stock purchase for layer flocks',
    },
  });

  // Purchase 2: Broiler starter (25 days ago)
  await prisma.feedPurchase.create({
    data: {
      supplierId: agriProSupplier.id,
      inventoryId: starterFeed.id,
      quantityBags: 100,
      pricePerBag: 15200,
      totalCost: 100 * 15200,
      purchaseDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-AP-2024-012',
      paymentStatus: 'Paid',
      receivedBy: supervisorUser.id,
      notes: 'For new broiler batch',
    },
  });

  // Purchase 3: Layer feed restock (14 days ago)
  await prisma.feedPurchase.create({
    data: {
      supplierId: topFeedsSupplier.id,
      inventoryId: layerFeed2.id,
      quantityBags: 150,
      pricePerBag: 11800,
      totalCost: 150 * 11800,
      purchaseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-TF-2024-045',
      paymentStatus: 'Paid',
      receivedBy: managerUser.id,
    },
  });

  // Purchase 4: Grower feed (12 days ago)
  await prisma.feedPurchase.create({
    data: {
      supplierId: vitalFeedSupplier.id,
      inventoryId: growerFeed.id,
      quantityBags: 120,
      pricePerBag: 13500,
      totalCost: 120 * 13500,
      purchaseDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-VF-2024-023',
      paymentStatus: 'Paid',
      receivedBy: managerUser.id,
    },
  });

  // Purchase 5: Finisher feed (5 days ago)
  await prisma.feedPurchase.create({
    data: {
      supplierId: topFeedsSupplier.id,
      inventoryId: finisherFeed.id,
      quantityBags: 150,
      pricePerBag: 12800,
      totalCost: 150 * 12800,
      purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-TF-2024-067',
      paymentStatus: 'Paid',
      receivedBy: supervisorUser.id,
    },
  });

  // Purchase 6: Recent layer feed restock (2 days ago) - Pending payment
  await prisma.feedPurchase.create({
    data: {
      supplierId: vitalFeedSupplier.id,
      inventoryId: layerFeed1.id,
      quantityBags: 250,
      pricePerBag: 12500,
      totalCost: 250 * 12500,
      purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-VF-2024-089',
      paymentStatus: 'Pending',
      receivedBy: managerUser.id,
      notes: 'Payment due by end of week',
    },
  });

  console.log('✅ Feed purchase records created');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('  - Roles: 3 (Farm Manager, Supervisor, Farm Worker)');
  console.log('  - Users: 3 test users');
  console.log('  - Sites: 2 farm locations');
  console.log('  - Flocks: 3 layer flocks (45,550 total birds)');
  console.log('  - Batches: 2 broiler batches (9,340 total birds)');
  console.log('  - Egg Collections: ~80 records (last 30 days)');
  console.log('  - Mortality Records: 45 records');
  console.log('  - Feed Consumption: 70 records');
  console.log('  - Alerts: 3 production alerts');
  console.log('  - Feed Suppliers: 3 suppliers');
  console.log('  - Feed Inventory: 6 items (1 with low stock alert)');
  console.log('  - Feed Purchases: 6 purchase records\n');

  // ============================================
  // PHASE 4: INVENTORY MANAGEMENT SEED DATA
  // ============================================
  console.log('📦 Seeding Phase 4: Inventory Management data...');

  // Create Inventory Categories
  const categories = await Promise.all([
    prisma.inventoryCategory.upsert({
      where: { categoryName: 'Equipment' },
      update: {},
      create: {
        categoryName: 'Equipment',
        description: 'Farm equipment and machinery (feeders, drinkers, cages, etc.)',
        isActive: true
      }
    }),
    prisma.inventoryCategory.upsert({
      where: { categoryName: 'Consumables' },
      update: {},
      create: {
        categoryName: 'Consumables',
        description: 'Consumable items (disinfectants, cleaning supplies, etc.)',
        isActive: true
      }
    }),
    prisma.inventoryCategory.upsert({
      where: { categoryName: 'Spare Parts' },
      update: {},
      create: {
        categoryName: 'Spare Parts',
        description: 'Spare parts and maintenance items',
        isActive: true
      }
    }),
    prisma.inventoryCategory.upsert({
      where: { categoryName: 'Medical Supplies' },
      update: {},
      create: {
        categoryName: 'Medical Supplies',
        description: 'Veterinary and medical supplies',
        isActive: true
      }
    })
  ]);
  console.log(`✓ Created ${categories.length} inventory categories`);

  // Create Inventory Suppliers
  const inventorySuppliers = await Promise.all([
    prisma.generalInventorySupplier.upsert({
      where: { supplierName: 'FarmTech Equipment Ltd' },
      update: {},
      create: {
        supplierName: 'FarmTech Equipment Ltd',
        supplierType: 'Equipment',
        contactPerson: 'David Okonkwo',
        phone: '+234-801-555-0101',
        email: 'sales@farmtech.ng',
        address: 'Industrial Area, Lagos, Nigeria',
        taxIdNumber: 'TIN-12345678',
        paymentTerms: 'Net 30',
        rating: 4.5,
        isActive: true
      }
    }),
    prisma.generalInventorySupplier.upsert({
      where: { supplierName: 'AgriChem Supplies' },
      update: {},
      create: {
        supplierName: 'AgriChem Supplies',
        supplierType: 'Consumables',
        contactPerson: 'Grace Eze',
        phone: '+234-802-555-0202',
        email: 'info@agrichem.ng',
        address: 'Benin City, Edo State, Nigeria',
        taxIdNumber: 'TIN-87654321',
        paymentTerms: 'COD',
        rating: 4.2,
        isActive: true
      }
    }),
    prisma.generalInventorySupplier.upsert({
      where: { supplierName: 'VetCare Pharmaceuticals' },
      update: {},
      create: {
        supplierName: 'VetCare Pharmaceuticals',
        supplierType: 'Medical',
        contactPerson: 'Dr. Samuel Adewale',
        phone: '+234-803-555-0303',
        email: 'orders@vetcare.ng',
        address: 'Asaba, Delta State, Nigeria',
        taxIdNumber: 'TIN-11223344',
        paymentTerms: 'Net 15',
        rating: 4.8,
        isActive: true
      }
    })
  ]);
  console.log(`✓ Created ${inventorySuppliers.length} inventory suppliers`);

  // Create General Inventory Items
  const inventoryItems = await Promise.all([
    // Equipment
    prisma.generalInventory.upsert({
      where: { itemCode: 'EQ-FEEDER-001' },
      update: {},
      create: {
        itemName: 'Automatic Feeder System',
        itemCode: 'EQ-FEEDER-001',
        categoryId: categories[0].id,
        description: 'Automatic feeding system for broilers',
        unit: 'pieces',
        currentStock: 15,
        reorderLevel: 5,
        maxStockLevel: 30,
        unitCost: 45000,
        supplierId: inventorySuppliers[0].id,
        storageLocation: 'Warehouse A',
        isActive: true
      }
    }),
    prisma.generalInventory.upsert({
      where: { itemCode: 'EQ-DRINKER-001' },
      update: {},
      create: {
        itemName: 'Nipple Drinkers',
        itemCode: 'EQ-DRINKER-001',
        categoryId: categories[0].id,
        description: 'Nipple drinking system',
        unit: 'pieces',
        currentStock: 200,
        reorderLevel: 50,
        maxStockLevel: 500,
        unitCost: 1500,
        supplierId: inventorySuppliers[0].id,
        storageLocation: 'Warehouse A',
        isActive: true
      }
    }),
    // Consumables
    prisma.generalInventory.upsert({
      where: { itemCode: 'CS-DISINFECT-001' },
      update: {},
      create: {
        itemName: 'Farm Disinfectant (Virkon S)',
        itemCode: 'CS-DISINFECT-001',
        categoryId: categories[1].id,
        description: 'Broad spectrum disinfectant for farm sanitation',
        unit: 'liters',
        currentStock: 25,
        reorderLevel: 10,
        maxStockLevel: 100,
        unitCost: 8500,
        supplierId: inventorySuppliers[1].id,
        storageLocation: 'Storage Room B',
        isActive: true
      }
    }),
    prisma.generalInventory.upsert({
      where: { itemCode: 'CS-SAWDUST-001' },
      update: {},
      create: {
        itemName: 'Sawdust Bedding',
        itemCode: 'CS-SAWDUST-001',
        categoryId: categories[1].id,
        description: 'Clean sawdust for broiler bedding',
        unit: 'bags',
        currentStock: 8,
        reorderLevel: 20,
        maxStockLevel: 200,
        unitCost: 2000,
        supplierId: inventorySuppliers[1].id,
        storageLocation: 'Outdoor Storage',
        isActive: true,
        notes: 'LOW STOCK - Reorder urgently'
      }
    }),
    // Medical Supplies
    prisma.generalInventory.upsert({
      where: { itemCode: 'MED-ANTIBIOTIC-001' },
      update: {},
      create: {
        itemName: 'Oxytetracycline (Antibiotic)',
        itemCode: 'MED-ANTIBIOTIC-001',
        categoryId: categories[3].id,
        description: 'Broad spectrum antibiotic for poultry',
        unit: 'bottles',
        currentStock: 12,
        reorderLevel: 5,
        maxStockLevel: 30,
        unitCost: 6500,
        supplierId: inventorySuppliers[2].id,
        storageLocation: 'Medical Cabinet',
        expiryDate: new Date('2025-12-31'),
        isActive: true
      }
    }),
    prisma.generalInventory.upsert({
      where: { itemCode: 'MED-VITAMIN-001' },
      update: {},
      create: {
        itemName: 'Multivitamin Supplement',
        itemCode: 'MED-VITAMIN-001',
        categoryId: categories[3].id,
        description: 'Vitamin supplement for stress management',
        unit: 'bottles',
        currentStock: 20,
        reorderLevel: 8,
        maxStockLevel: 50,
        unitCost: 3500,
        supplierId: inventorySuppliers[2].id,
        storageLocation: 'Medical Cabinet',
        expiryDate: new Date('2026-06-30'),
        isActive: true
      }
    })
  ]);
  console.log(`✓ Created ${inventoryItems.length} inventory items`);

  // Create Sample Purchase Orders  
  const purchaseOrders = await Promise.all([
    prisma.purchaseOrder.create({
      data: {
        orderNumber: 'PO-20250101-ABC',
        orderDate: new Date('2025-01-01'),
        supplierId: inventorySuppliers[0].id,
        expectedDelivery: new Date('2025-01-15'),
        actualDelivery: new Date('2025-01-14'),
        status: 'received',
        totalAmount: 135000,
        paidAmount: 135000,
        paymentStatus: 'paid',
        paymentDate: new Date('2025-01-20'),
        paymentMethod: 'Bank Transfer',
        invoiceNumber: 'INV-2025-001',
        receivedBy: managerUser.id,
        items: {
          create: [
            {
              inventoryId: inventoryItems[0].id,
              quantityOrdered: 3,
              quantityReceived: 3,
              unitPrice: 45000,
              totalPrice: 135000
            }
          ]
        }
      }
    }),
    prisma.purchaseOrder.create({
      data: {
        orderNumber: 'PO-20250105-DEF',
        orderDate: new Date('2025-01-05'),
        supplierId: inventorySuppliers[1].id,
        expectedDelivery: new Date('2025-01-12'),
        status: 'approved',
        totalAmount: 85000,
        paidAmount: 0,
        paymentStatus: 'pending',
        items: {
          create: [
            {
              inventoryId: inventoryItems[2].id,
              quantityOrdered: 10,
              quantityReceived: 0,
              unitPrice: 8500,
              totalPrice: 85000
            }
          ]
        }
      }
    })
  ]);
  console.log(`✓ Created ${purchaseOrders.length} purchase orders`);

  console.log('✅ Phase 4: Inventory Management data seeded successfully!');

  // ============================================
  // PHASE 5: FINANCIAL MANAGEMENT DATA
  // ============================================
  console.log('\n📊 Seeding Phase 5: Financial Management data...');

  // Create Sample Income Transactions (last 30 days)
  const incomeTransactions = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Egg Sales (3-4 times per week)
    if (i % 2 === 0) {
      const quantity = Math.floor(Math.random() * 2000) + 8000; // 8000-10000 eggs
      const unitPrice = 50 + Math.random() * 10; // ₦50-60 per egg
      const amount = quantity * unitPrice;

      incomeTransactions.push(
        prisma.incomeTransaction.create({
          data: {
            transactionDate: date,
            category: 'egg_sales',
            amount: amount,
            quantity: quantity,
            unitPrice: unitPrice,
            customerName: ['ABC Stores', 'XYZ Mart', 'Fresh Foods Ltd', 'Royal Market'][Math.floor(Math.random() * 4)],
            customerPhone: '080' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
            paymentMethod: ['cash', 'bank_transfer', 'mobile_money'][Math.floor(Math.random() * 3)],
            paymentStatus: Math.random() > 0.1 ? 'paid' : 'pending',
            invoiceNumber: `INV-EGG-${date.toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000)}`,
            flockId: flock1.id,
            description: `Egg sales - ${quantity} pieces`,
            recordedBy: managerUser.id
          }
        })
      );
    }

    // Bird Sales (once per week for broilers)
    if (i % 7 === 0 && i < 21) {
      const quantity = Math.floor(Math.random() * 50) + 150; // 150-200 birds
      const unitPrice = 3500 + Math.random() * 500; // ₦3500-4000 per bird
      const amount = quantity * unitPrice;

      incomeTransactions.push(
        prisma.incomeTransaction.create({
          data: {
            transactionDate: date,
            category: 'bird_sales',
            amount: amount,
            quantity: quantity,
            unitPrice: unitPrice,
            customerName: ['City Butchery', 'Premium Poultry', 'Farm Fresh Foods'][Math.floor(Math.random() * 3)],
            customerPhone: '080' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
            paymentMethod: ['cash', 'bank_transfer'][Math.floor(Math.random() * 2)],
            paymentStatus: 'paid',
            invoiceNumber: `INV-BIRD-${date.toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000)}`,
            batchId: batch1.id,
            description: `Broiler sales - ${quantity} birds`,
            recordedBy: managerUser.id
          }
        })
      );
    }

    // Other Income (occasional - manure sales, etc.)
    if (i === 5 || i === 20) {
      incomeTransactions.push(
        prisma.incomeTransaction.create({
          data: {
            transactionDate: date,
            category: i === 5 ? 'manure_sales' : 'other',
            amount: i === 5 ? 25000 : 15000,
            quantity: i === 5 ? 500 : null,
            unitPrice: i === 5 ? 50 : null,
            customerName: i === 5 ? 'Green Farms Fertilizers' : 'Government Subsidy',
            paymentMethod: 'bank_transfer',
            paymentStatus: 'paid',
            description: i === 5 ? 'Poultry manure sale - 500kg' : 'Agricultural support grant',
            recordedBy: managerUser.id
          }
        })
      );
    }
  }
  await Promise.all(incomeTransactions);
  console.log(`✓ Created ${incomeTransactions.length} income transactions`);

  // Create Sample Expense Transactions
  const expenseTransactions = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Feed Expenses (daily)
    expenseTransactions.push(
      prisma.expenseTransaction.create({
        data: {
          transactionDate: date,
          category: 'feed',
          amount: 45000 + Math.random() * 10000, // ₦45,000-55,000 daily
          quantity: 50 + Math.random() * 20,
          unitCost: 900,
          vendorName: topFeedsSupplier.supplierName,
          vendorPhone: topFeedsSupplier.phone || '',
          paymentMethod: 'bank_transfer',
          paymentStatus: 'paid',
          receiptNumber: `REC-FEED-${date.toISOString().split('T')[0]}`,
          description: 'Daily feed purchase',
          recordedBy: managerUser.id
        }
      })
    );

    // Labor Expenses (every 15 days - salary payments)
    if (i === 1 || i === 15) {
      const employees = [
        { name: 'Farm Worker 1', role: 'Farm Worker', amount: 45000 },
        { name: 'Farm Worker 2', role: 'Farm Worker', amount: 45000 },
        { name: 'Farm Worker 3', role: 'Farm Worker', amount: 45000 },
        { name: 'Supervisor', role: 'Supervisor', amount: 75000 }
      ];

      employees.forEach(emp => {
        expenseTransactions.push(
          prisma.expenseTransaction.create({
            data: {
              transactionDate: date,
              category: 'labor',
              amount: emp.amount,
              employeeName: emp.name,
              employeeRole: emp.role,
              paymentMethod: 'bank_transfer',
              paymentStatus: 'paid',
              description: `Salary payment - ${emp.role}`,
              recordedBy: managerUser.id
            }
          })
        );
      });
    }

    // Utilities (electricity, water - every 5 days)
    if (i % 5 === 0) {
      expenseTransactions.push(
        prisma.expenseTransaction.create({
          data: {
            transactionDate: date,
            category: 'utilities',
            amount: 15000 + Math.random() * 5000,
            utilityType: ['electricity', 'water', 'diesel'][Math.floor(Math.random() * 3)],
            vendorName: 'Utility Company',
            paymentMethod: 'bank_transfer',
            paymentStatus: 'paid',
            description: 'Utility bill payment',
            recordedBy: managerUser.id
          }
        })
      );
    }

    // Veterinary Expenses (occasional)
    if (i === 7 || i === 21) {
      expenseTransactions.push(
        prisma.expenseTransaction.create({
          data: {
            transactionDate: date,
            category: 'veterinary',
            amount: 35000 + Math.random() * 15000,
            vendorName: 'Vet Clinic',
            vendorPhone: '08012345678',
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            description: 'Vaccination and medication supplies',
            recordedBy: managerUser.id
          }
        })
      );
    }

    // Maintenance (occasional)
    if (i === 10 || i === 25) {
      expenseTransactions.push(
        prisma.expenseTransaction.create({
          data: {
            transactionDate: date,
            category: 'maintenance',
            amount: 25000 + Math.random() * 20000,
            vendorName: 'Equipment Repairs Ltd',
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            description: 'Equipment maintenance and repairs',
            recordedBy: managerUser.id
          }
        })
      );
    }

    // Transport (occasional)
    if (i % 4 === 0) {
      expenseTransactions.push(
        prisma.expenseTransaction.create({
          data: {
            transactionDate: date,
            category: 'transport',
            amount: 8000 + Math.random() * 7000,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            description: 'Transport and logistics',
            recordedBy: managerUser.id
          }
        })
      );
    }
  }
  await Promise.all(expenseTransactions);
  console.log(`✓ Created ${expenseTransactions.length} expense transactions`);

  console.log('✅ Phase 5: Financial Management data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
