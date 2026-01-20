import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 5 Financial Management data seeding...');

  // Get existing users, flocks, batches, and feed suppliers
  const managerUser = await prisma.user.findFirst({
    where: { email: 'manager@royalfarms.com' }
  });

  if (!managerUser) {
    throw new Error('Manager user not found. Please run the main seed script first.');
  }

  const flocks = await prisma.flock.findMany({ take: 3 });
  const batches = await prisma.batch.findMany({ take: 2 });
  const feedSuppliers = await prisma.feedSupplier.findMany({ take: 1 });

  if (flocks.length === 0 || batches.length === 0 || feedSuppliers.length === 0) {
    throw new Error('Required data not found. Please run the main seed script first.');
  }

  console.log('✅ Found required data, proceeding with financial data seeding...');

  // Delete existing financial data to avoid duplicates
  console.log('🗑️  Cleaning existing financial data...');
  await prisma.incomeTransaction.deleteMany({});
  await prisma.expenseTransaction.deleteMany({});
  console.log('✅ Cleaned existing financial data');

  // Create Sample Income Transactions (last 30 days)
  console.log('💰 Creating income transactions...');
  let incomeCount = 0;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Egg Sales (3-4 times per week)
    if (i % 2 === 0) {
      const quantity = Math.floor(Math.random() * 2000) + 8000;
      const unitPrice = 50 + Math.random() * 10;
      const amount = quantity * unitPrice;

      await prisma.incomeTransaction.create({
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
          flockId: flocks[0].id,
          description: `Egg sales - ${quantity} pieces`,
          recordedBy: managerUser.id
        }
      });
      incomeCount++;
    }

    // Bird Sales (once per week)
    if (i % 7 === 0 && i < 21) {
      const quantity = Math.floor(Math.random() * 50) + 150;
      const unitPrice = 3500 + Math.random() * 500;
      const amount = quantity * unitPrice;

      await prisma.incomeTransaction.create({
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
          batchId: batches[0].id,
          description: `Broiler sales - ${quantity} birds`,
          recordedBy: managerUser.id
        }
      });
      incomeCount++;
    }

    // Other Income (occasional)
    if (i === 5 || i === 20) {
      await prisma.incomeTransaction.create({
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
      });
      incomeCount++;
    }
  }
  console.log(`✓ Created ${incomeCount} income transactions`);

  // Create Sample Expense Transactions
  console.log('💸 Creating expense transactions...');
  let expenseCount = 0;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Feed Expenses (daily)
    await prisma.expenseTransaction.create({
      data: {
        transactionDate: date,
        category: 'feed',
        amount: 45000 + Math.random() * 10000,
        quantity: 50 + Math.random() * 20,
        unitCost: 900,
        vendorName: feedSuppliers[0].supplierName,
        vendorPhone: feedSuppliers[0].phone,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        receiptNumber: `REC-FEED-${date.toISOString().split('T')[0]}`,
        description: 'Daily feed purchase',
        recordedBy: managerUser.id
      }
    });
    expenseCount++;

    // Labor Expenses (every 15 days)
    if (i === 1 || i === 15) {
      const employees = [
        { name: 'Farm Worker 1', role: 'Farm Worker', amount: 45000 },
        { name: 'Farm Worker 2', role: 'Farm Worker', amount: 45000 },
        { name: 'Farm Worker 3', role: 'Farm Worker', amount: 45000 },
        { name: 'Supervisor', role: 'Supervisor', amount: 75000 }
      ];

      for (const emp of employees) {
        await prisma.expenseTransaction.create({
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
        });
        expenseCount++;
      }
    }

    // Utilities (every 5 days)
    if (i % 5 === 0) {
      await prisma.expenseTransaction.create({
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
      });
      expenseCount++;
    }

    // Veterinary Expenses (occasional)
    if (i === 7 || i === 21) {
      await prisma.expenseTransaction.create({
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
      });
      expenseCount++;
    }

    // Maintenance (occasional)
    if (i === 10 || i === 25) {
      await prisma.expenseTransaction.create({
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
      });
      expenseCount++;
    }

    // Transport (occasional)
    if (i % 4 === 0) {
      await prisma.expenseTransaction.create({
        data: {
          transactionDate: date,
          category: 'transport',
          amount: 8000 + Math.random() * 7000,
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          description: 'Transport and logistics',
          recordedBy: managerUser.id
        }
      });
      expenseCount++;
    }
  }
  console.log(`✓ Created ${expenseCount} expense transactions`);

  console.log('\n✅ Phase 5: Financial Management data seeded successfully!');
  
  // Calculate and display summary
  const totalIncome = await prisma.incomeTransaction.aggregate({
    _sum: { amount: true }
  });
  const totalExpense = await prisma.expenseTransaction.aggregate({
    _sum: { amount: true }
  });

  console.log('\n📊 Financial Summary:');
  console.log(`  - Total Income Transactions: ${incomeCount}`);
  console.log(`  - Total Expense Transactions: ${expenseCount}`);
  console.log(`  - Total Income Amount: ₦${totalIncome._sum.amount?.toLocaleString() || 0}`);
  console.log(`  - Total Expense Amount: ₦${totalExpense._sum.amount?.toLocaleString() || 0}`);
  const netProfit = Number(totalIncome._sum.amount || 0) - Number(totalExpense._sum.amount || 0);
  console.log(`  - Net Profit: ₦${netProfit.toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding financial data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
