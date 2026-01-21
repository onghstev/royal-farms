import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface Transaction {
  amount: number;
  category: string;
  paymentStatus: string;
  transactionDate?: Date;
}

interface ExpenseCategorySummary {
  [category: string]: number;
}

interface ProfitLossCategory {
  transactions: Transaction[];
  total: number;
}

interface MonthlyCashFlow {
  income: number;
  expense: number;
  netCashFlow: number;
}

// GET - Generate financial reports
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // -------------------- SUMMARY REPORT --------------------
    if (reportType === 'summary') {
      const [incomeDataRaw, expenseDataRaw] = await Promise.all([
        prisma.incomeTransaction.findMany({
          where: { transactionDate: dateFilter },
          select: { amount: true, category: true, paymentStatus: true }
        }),
        prisma.expenseTransaction.findMany({
          where: { transactionDate: dateFilter },
          select: { amount: true, category: true, paymentStatus: true }
        })
      ]);

      const incomeData: Transaction[] = incomeDataRaw.map((t: any) => ({
        amount: Number(t.amount),
        category: t.category,
        paymentStatus: t.paymentStatus
      }));

      const expenseData: Transaction[] = expenseDataRaw.map((t: any) => ({
        amount: Number(t.amount),
        category: t.category,
        paymentStatus: t.paymentStatus
      }));

      const totalIncome = incomeData.reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalExpense = expenseData.reduce((sum: number, t: any) => sum + t.amount, 0);
      const netProfit = totalIncome - totalExpense;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      const incomeByCategory: ExpenseCategorySummary = incomeData.reduce((acc: any, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as ExpenseCategorySummary);

      const expenseByCategory: ExpenseCategorySummary = expenseData.reduce((acc: any, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as ExpenseCategorySummary);

      const incomePaid = incomeData.filter((t: any) => t.paymentStatus === 'paid').reduce((sum: number, t: any) => sum + t.amount, 0);
      const incomePending = incomeData.filter((t: any) => t.paymentStatus === 'pending' || t.paymentStatus === 'partial').reduce((sum: number, t: any) => sum + t.amount, 0);

      const expensePaid = expenseData.filter((t: any) => t.paymentStatus === 'paid').reduce((sum: number, t: any) => sum + t.amount, 0);
      const expensePending = expenseData.filter((t: any) => t.paymentStatus === 'pending' || t.paymentStatus === 'partial').reduce((sum: number, t: any) => sum + t.amount, 0);

      return NextResponse.json({
        summary: { totalIncome, totalExpense, netProfit, profitMargin: profitMargin.toFixed(2) },
        incomeByCategory,
        expenseByCategory,
        paymentStatus: {
          income: { paid: incomePaid, pending: incomePending },
          expense: { paid: expensePaid, pending: expensePending }
        }
      });
    }

    // -------------------- PROFIT & LOSS --------------------
    if (reportType === 'profit_loss') {
      const [incomeTransactionsRaw, expenseTransactionsRaw] = await Promise.all([
        prisma.incomeTransaction.findMany({ where: { transactionDate: dateFilter }, orderBy: { transactionDate: 'asc' } }),
        prisma.expenseTransaction.findMany({ where: { transactionDate: dateFilter }, orderBy: { transactionDate: 'asc' } })
      ]);

      const incomeTransactions: Transaction[] = incomeTransactionsRaw.map((t: any) => ({
        amount: Number(t.amount),
        category: t.category,
        paymentStatus: t.paymentStatus
      }));

      const expenseTransactions: Transaction[] = expenseTransactionsRaw.map((t: any) => ({
        amount: Number(t.amount),
        category: t.category,
        paymentStatus: t.paymentStatus
      }));

      const incomeByCategory: Record<string, ProfitLossCategory> = incomeTransactions.reduce((acc: any, t: any) => {
        if (!acc[t.category]) acc[t.category] = { transactions: [], total: 0 };
        acc[t.category].transactions.push(t);
        acc[t.category].total += t.amount;
        return acc;
      }, {} as Record<string, ProfitLossCategory>);

      const expenseByCategory: Record<string, ProfitLossCategory> = expenseTransactions.reduce((acc: any, t: any) => {
        if (!acc[t.category]) acc[t.category] = { transactions: [], total: 0 };
        acc[t.category].transactions.push(t);
        acc[t.category].total += t.amount;
        return acc;
      }, {} as Record<string, ProfitLossCategory>);

      const totalIncome = Object.values(incomeByCategory).reduce((sum: number, cat: any) => sum + cat.total, 0);
      const totalExpense = Object.values(expenseByCategory).reduce((sum: number, cat: any) => sum + cat.total, 0);
      const netProfit = totalIncome - totalExpense;

      return NextResponse.json({
        reportType: 'Profit & Loss Statement',
        period: { startDate, endDate },
        income: { categories: incomeByCategory, total: totalIncome },
        expenses: { categories: expenseByCategory, total: totalExpense },
        netProfit,
        profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : '0.00'
      });
    }

    // -------------------- CASH FLOW --------------------
    if (reportType === 'cash_flow') {
      const [incomeTransactionsRaw, expenseTransactionsRaw] = await Promise.all([
        prisma.incomeTransaction.findMany({ where: { transactionDate: dateFilter, paymentStatus: 'paid' }, orderBy: { transactionDate: 'asc' } }),
        prisma.expenseTransaction.findMany({ where: { transactionDate: dateFilter, paymentStatus: 'paid' }, orderBy: { transactionDate: 'asc' } })
      ]);

      const incomeTransactions: Transaction[] = incomeTransactionsRaw.map((t: any) => ({ amount: Number(t.amount), category: t.category, paymentStatus: t.paymentStatus, transactionDate: t.transactionDate }));
      const expenseTransactions: Transaction[] = expenseTransactionsRaw.map((t: any) => ({ amount: Number(t.amount), category: t.category, paymentStatus: t.paymentStatus, transactionDate: t.transactionDate }));

      const monthlyData: Record<string, MonthlyCashFlow> = {};

      incomeTransactions.forEach(t => {
        const monthKey = t.transactionDate!.toISOString().slice(0, 7);
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0, netCashFlow: 0 };
        monthlyData[monthKey].income += t.amount;
      });

      expenseTransactions.forEach(t => {
        const monthKey = t.transactionDate!.toISOString().slice(0, 7);
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0, netCashFlow: 0 };
        monthlyData[monthKey].expense += t.amount;
      });

      Object.keys(monthlyData).forEach(month => {
        monthlyData[month].netCashFlow = monthlyData[month].income - monthlyData[month].expense;
      });

      const totalCashIn = incomeTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalCashOut = expenseTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      const netCashFlow = totalCashIn - totalCashOut;

      return NextResponse.json({
        reportType: 'Cash Flow Analysis',
        period: { startDate, endDate },
        summary: { totalCashIn, totalCashOut, netCashFlow },
        monthlyData
      });
    }

    // -------------------- COST ANALYSIS --------------------
    if (reportType === 'cost_analysis') {
      const filter: any = {};
      if (flockId) filter.flockId = flockId;
      if (batchId) filter.batchId = batchId;

      const incomeFilter: any = { transactionDate: dateFilter };
      if (flockId) incomeFilter.flockId = flockId;
      if (batchId) incomeFilter.batchId = batchId;

      const [incomeDataRaw, flocks, batches] = await Promise.all([
        prisma.incomeTransaction.findMany({
          where: incomeFilter,
          include: { flock: true, batch: true }
        }),
        flockId ? prisma.flock.findUnique({ where: { id: flockId } }) : Promise.resolve(null),
        batchId ? prisma.batch.findUnique({ where: { id: batchId } }) : Promise.resolve(null)
      ]);

      const incomeData: Transaction[] = incomeDataRaw.map((t: any) => ({ amount: Number(t.amount), category: t.category, paymentStatus: t.paymentStatus }));

      const expenseDataRaw = await prisma.expenseTransaction.findMany({ where: { transactionDate: dateFilter } });
      const expenseData: Transaction[] = expenseDataRaw.map((t: any) => ({ amount: Number(t.amount), category: t.category, paymentStatus: t.paymentStatus }));

      const totalIncome = incomeData.reduce((sum: number, t: any) => sum + t.amount, 0);

      const expenseByCategory: ExpenseCategorySummary = expenseData.reduce((acc: any, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as ExpenseCategorySummary);

      const totalExpense = Object.values(expenseByCategory).reduce((sum: number, val: any) => sum + val, 0);
      const netProfit = totalIncome - totalExpense;

      let costPerBird: number | null = null;
      let costPerEgg: number | null = null;

      if (flocks && flocks.currentStock > 0) {
        costPerBird = totalExpense / flocks.currentStock;
        // Calculate cost per egg if egg production data is available
        if (startDate && endDate) {
          const totalEggs = await prisma.dailyEggCollection.aggregate({
            where: {
              flockId: flocks.id,
              collectionDate: { gte: new Date(startDate), lte: new Date(endDate) }
            },
            _sum: { goodEggsCount: true }
          });
          if (totalEggs._sum.goodEggsCount && totalEggs._sum.goodEggsCount > 0) {
            costPerEgg = totalExpense / totalEggs._sum.goodEggsCount;
          }
        }
      }

      return NextResponse.json({
        reportType: 'Cost Analysis',
        period: { startDate, endDate },
        flock: flocks ? { id: flocks.id, name: flocks.flockName } : null,
        batch: batches ? { id: batches.id, name: batches.batchName } : null,
        financials: { totalIncome, totalExpense, netProfit, profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : '0.00' },
        expenseBreakdown: expenseByCategory,
        metrics: {
          costPerBird: costPerBird !== null ? costPerBird.toFixed(2) : null,
          costPerEgg: costPerEgg !== null ? costPerEgg.toFixed(4) : null,
          roi: totalExpense > 0 ? ((netProfit / totalExpense) * 100).toFixed(2) : null
        }
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error generating financial report:', error);
    return NextResponse.json({ error: 'Failed to generate financial report', details: error.message }, { status: 500 });
  }
}
