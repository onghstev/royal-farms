import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface ExpenseTransactionType {
  id: string;
  transactionDate: Date;
  category: string;
  amount: number;
  quantity?: number | null;
  unitCost?: number | null;
  vendorName?: string | null;
  vendorPhone?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  receiptNumber?: string | null;
  feedPurchaseId?: string | null;
  employeeName?: string | null;
  employeeRole?: string | null;
  utilityType?: string | null;
  description: string;
  notes?: string | null;
  feedPurchase?: {
    id: string;
    invoiceNumber: string;
    supplier?: { supplierName: string };
    inventory?: { feedBrand: string; feedType: string };
  } | null;
}

interface CategorySummary {
  count: number;
  total: number;
}

// GET - Fetch all expense transactions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (category && category !== 'all') where.category = category;
    if (paymentStatus && paymentStatus !== 'all') where.paymentStatus = paymentStatus;
    if (startDate) where.transactionDate = { ...where.transactionDate, gte: new Date(startDate) };
    if (endDate) where.transactionDate = { ...where.transactionDate, lte: new Date(endDate) };

    const expenseTransactions = await prisma.expenseTransaction.findMany({
      where,
      include: {
        feedPurchase: {
          select: {
            id: true,
            invoiceNumber: true,
            supplier: { select: { supplierName: true } },
            inventory: { select: { feedBrand: true, feedType: true } },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    // Cast to typed array
    const transactions: ExpenseTransactionType[] = expenseTransactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      quantity: t.quantity ? Number(t.quantity) : null,
      unitCost: t.unitCost ? Number(t.unitCost) : null,
    }));

    // Summary calculations
    const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);
    const paidExpense = transactions
      .filter((t) => t.paymentStatus === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingExpense = transactions
      .filter((t) => t.paymentStatus === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const byCategory: Record<string, CategorySummary> = transactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { count: 0, total: 0 };
      }
      acc[t.category].count += 1;
      acc[t.category].total += t.amount;
      return acc;
    }, {} as Record<string, CategorySummary>);

    return NextResponse.json({
      transactions,
      summary: {
        total: totalExpense,
        paid: paidExpense,
        pending: pendingExpense,
        transactionCount: transactions.length,
        byCategory,
      },
    });
  } catch (error: any) {
    console.error('Error fetching expense transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense transactions', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new expense transaction
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      transactionDate,
      category,
      amount,
      quantity,
      unitCost,
      vendorName,
      vendorPhone,
      paymentMethod,
      paymentStatus,
      receiptNumber,
      feedPurchaseId,
      employeeName,
      employeeRole,
      utilityType,
      description,
      notes,
    } = body;

    if (!transactionDate || !category || !amount || !paymentMethod || !paymentStatus || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expenseTransaction = await prisma.expenseTransaction.create({
      data: {
        transactionDate: new Date(transactionDate),
        category,
        amount: Number(amount),
        quantity: quantity ? Number(quantity) : null,
        unitCost: unitCost ? Number(unitCost) : null,
        vendorName,
        vendorPhone,
        paymentMethod,
        paymentStatus,
        receiptNumber,
        feedPurchaseId: feedPurchaseId || null,
        employeeName,
        employeeRole,
        utilityType,
        description,
        notes,
        recordedBy: (session.user as any).id,
      },
      include: {
        feedPurchase: {
          select: {
            id: true,
            invoiceNumber: true,
            supplier: { select: { supplierName: true } },
            inventory: { select: { feedBrand: true, feedType: true } },
          },
        },
      },
    });

    return NextResponse.json(expenseTransaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create expense transaction', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update expense transaction
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });

    if (updateData.transactionDate) updateData.transactionDate = new Date(updateData.transactionDate);
    if (updateData.amount) updateData.amount = Number(updateData.amount);
    if (updateData.quantity) updateData.quantity = Number(updateData.quantity);
    if (updateData.unitCost) updateData.unitCost = Number(updateData.unitCost);

    const updatedTransaction = await prisma.expenseTransaction.update({
      where: { id },
      data: updateData,
      include: {
        feedPurchase: {
          select: {
            id: true,
            invoiceNumber: true,
            supplier: { select: { supplierName: true } },
            inventory: { select: { feedBrand: true, feedType: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error: any) {
    console.error('Error updating expense transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update expense transaction', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense transaction
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = (session.user as any).role?.name;
    if (userRole !== 'Farm Manager') {
      return NextResponse.json({ error: 'Only Farm Managers can delete expense transactions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });

    await prisma.expenseTransaction.delete({ where: { id } });
    return NextResponse.json({ message: 'Expense transaction deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting expense transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense transaction', details: error.message },
      { status: 500 }
    );
  }
}
