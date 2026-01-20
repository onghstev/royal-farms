import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Generate financial reports
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary'; // summary, profit_loss, cash_flow, cost_analysis
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const flockId = searchParams.get('flockId');
    const batchId = searchParams.get('batchId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    if (reportType === 'summary') {
      // Financial Summary Report
      const [incomeData, expenseData] = await Promise.all([
        prisma.incomeTransaction.findMany({
          where: { transactionDate: dateFilter },
          select: { amount: true, category: true, paymentStatus: true }
        }),
        prisma.expenseTransaction.findMany({
          where: { transactionDate: dateFilter },
          select: { amount: true, category: true, paymentStatus: true }
        })
      ]);

      const totalIncome = incomeData.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const totalExpense = expenseData.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const netProfit = totalIncome - totalExpense;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      // Income by category
      const incomeByCategory = incomeData.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {});

      // Expense by category
      const expenseByCategory = expenseData.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {});

      // Payment status summary
      const incomePaid = incomeData
        .filter(t => t.paymentStatus === 'paid')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const incomePending = incomeData
        .filter(t => t.paymentStatus === 'pending' || t.paymentStatus === 'partial')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const expensePaid = expenseData
        .filter(t => t.paymentStatus === 'paid')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const expensePending = expenseData
        .filter(t => t.paymentStatus === 'pending' || t.paymentStatus === 'partial')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      return NextResponse.json({
        summary: {
          totalIncome,
          totalExpense,
          netProfit,
          profitMargin: profitMargin.toFixed(2)
        },
        incomeByCategory,
        expenseByCategory,
        paymentStatus: {
          income: { paid: incomePaid, pending: incomePending },
          expense: { paid: expensePaid, pending: expensePending }
        }
      });
    }

    if (reportType === 'profit_loss') {
      // Profit & Loss Statement
      const [incomeTransactions, expenseTransactions] = await Promise.all([
        prisma.incomeTransaction.findMany({
          where: { transactionDate: dateFilter },
          orderBy: { transactionDate: 'asc' }
        }),
        prisma.expenseTransaction.findMany({
          where: { transactionDate: dateFilter },
          orderBy: { transactionDate: 'asc' }
        })
      ]);

      // Group by category
      const incomeByCategory = incomeTransactions.reduce((acc: any, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { transactions: [], total: 0 };
        }
        acc[t.category].transactions.push(t);
        acc[t.category].total += Number(t.amount);
        return acc;
      }, {});

      const expenseByCategory = expenseTransactions.reduce((acc: any, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { transactions: [], total: 0 };
        }
        acc[t.category].transactions.push(t);
        acc[t.category].total += Number(t.amount);
        return acc;
      }, {});

      const totalIncome = Object.values(incomeByCategory).reduce(
        (sum: number, cat: any) => sum + cat.total,
        0
      );
      const totalExpense = Object.values(expenseByCategory).reduce(
        (sum: number, cat: any) => sum + cat.total,
        0
      );
      const netProfit = totalIncome - totalExpense;

      return NextResponse.json({
        reportType: 'Profit & Loss Statement',
        period: { startDate, endDate },
        income: {
          categories: incomeByCategory,
          total: totalIncome
        },
        expenses: {
          categories: expenseByCategory,
          total: totalExpense
        },
        netProfit,
        profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : '0.00'
      });
    }

    if (reportType === 'cash_flow') {
      // Cash Flow Analysis
      const [incomeTransactions, expenseTransactions] = await Promise.all([
        prisma.incomeTransaction.findMany({
          where: {
            transactionDate: dateFilter,
            paymentStatus: 'paid'
          },
          orderBy: { transactionDate: 'asc' }
        }),
        prisma.expenseTransaction.findMany({
          where: {
            transactionDate: dateFilter,
            paymentStatus: 'paid'
          },
          orderBy: { transactionDate: 'asc' }
        })
      ]);

      // Group by month
      const monthlyData: any = {};

      incomeTransactions.forEach(t => {
        const monthKey = t.transactionDate.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expense: 0, netCashFlow: 0 };
        }
        monthlyData[monthKey].income += Number(t.amount);
      });

      expenseTransactions.forEach(t => {
        const monthKey = t.transactionDate.toISOString().slice(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expense: 0, netCashFlow: 0 };
        }
        monthlyData[monthKey].expense += Number(t.amount);
      });

      // Calculate net cash flow
      Object.keys(monthlyData).forEach(month => {
        monthlyData[month].netCashFlow =
          monthlyData[month].income - monthlyData[month].expense;
      });

      const totalCashIn = incomeTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const totalCashOut = expenseTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const netCashFlow = totalCashIn - totalCashOut;

      return NextResponse.json({
        reportType: 'Cash Flow Analysis',
        period: { startDate, endDate },
        summary: {
          totalCashIn,
          totalCashOut,
          netCashFlow
        },
        monthlyData
      });
    }

    if (reportType === 'cost_analysis') {
      // Cost Analysis by Flock/Batch
      const filter: any = {};
      if (flockId) filter.flockId = flockId;
      if (batchId) filter.batchId = batchId;

      // Get income for the flock/batch
      const incomeFilter: any = { transactionDate: dateFilter };
      if (flockId) incomeFilter.flockId = flockId;
      if (batchId) incomeFilter.batchId = batchId;

      const [incomeData, flocks, batches] = await Promise.all([
        prisma.incomeTransaction.findMany({
          where: incomeFilter,
          include: {
            flock: { select: { id: true, flockName: true, currentStock: true } },
            batch: { select: { id: true, batchName: true, currentStock: true } }
          }
        }),
        flockId
          ? prisma.flock.findUnique({
              where: { id: flockId },
              include: {
                eggCollections: {
                  where: { collectionDate: dateFilter },
                  select: { totalEggsCount: true }
                }
              }
            })
          : Promise.resolve(null),
        batchId
          ? prisma.batch.findUnique({
              where: { id: batchId },
              select: {
                id: true,
                batchName: true,
                currentStock: true,
                quantityReceived: true
              }
            })
          : Promise.resolve(null)
      ]);

      // Get all expenses (we'll estimate allocation)
      const expenseData = await prisma.expenseTransaction.findMany({
        where: { transactionDate: dateFilter }
      });

      const totalIncome = incomeData.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      // Expense breakdown
      const expenseByCategory = expenseData.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {});

      const totalExpense = Object.values(expenseByCategory).reduce(
        (sum: number, val: any) => sum + val,
        0
      );
      const netProfit = totalIncome - totalExpense;

      // Calculate cost per bird/egg
      let costPerBird = null;
      let costPerEgg = null;

      if (flocks && flocks.currentStock > 0) {
        costPerBird = totalExpense / flocks.currentStock;
        const totalEggs = (flocks.eggCollections || []).reduce(
          (sum: number, ec: any) => sum + (ec.totalEggsCount || 0),
          0
        );
        if (totalEggs > 0) {
          costPerEgg = totalExpense / totalEggs;
        }
      }

      if (batches && batches.currentStock > 0) {
        costPerBird = totalExpense / batches.currentStock;
      }

      return NextResponse.json({
        reportType: 'Cost Analysis',
        period: { startDate, endDate },
        flock: flocks ? { id: flocks.id, name: flocks.flockName } : null,
        batch: batches ? { id: batches.id, name: batches.batchName } : null,
        financials: {
          totalIncome,
          totalExpense,
          netProfit,
          profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : '0.00'
        },
        expenseBreakdown: expenseByCategory,
        metrics: {
          costPerBird: costPerBird ? costPerBird.toFixed(2) : null,
          costPerEgg: costPerEgg ? costPerEgg.toFixed(4) : null,
          roi: totalExpense > 0 ? ((netProfit / totalExpense) * 100).toFixed(2) : null
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid report type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error generating financial report:', error);
    return NextResponse.json(
      { error: 'Failed to generate financial report', details: error.message },
      { status: 500 }
    );
  }
}
