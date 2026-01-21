import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface IncomeTransactionType {
  id: string;
  transactionDate: Date;
  category: string;
  amount: number;
  quantity?: number | null;
  unitPrice?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  invoiceNumber?: string | null;
  flockId?: string | null;
  batchId?: string | null;
  description: string;
  notes?: string | null;
  flock?: { id: string; flockName: string } | null;
  batch?: { id: string; batchName: string } | null;
}

interface CategorySummary {
  count: number;
  total: number;
}

// GET - Fetch all income transactions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const incomeTransactions = await prisma.incomeTransaction.findMany({
      where,
      include: {
        flock: { select: { id: true, flockName: true } },
        batch: { select: { id: true, batchName: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    const transactions = incomeTransactions.map((t: any) => ({
      ...t,
      amount: Number(t.amount),
      quantity: t.quantity ? Number(t.quantity) : null,
      unitPrice: t.unitPrice ? Number(t.unitPrice) : null,
    }));

    // Summary calculations
    const totalIncome = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    const paidIncome = transactions.filter((t: any) => t.paymentStatus === 'paid').reduce((sum: number, t: any) => sum + t.amount, 0);
    const pendingIncome = transactions.filter((t: any) => t.paymentStatus === 'pending').reduce((sum: number, t: any) => sum + t.amount, 0);

    // Category breakdown
    const byCategory: Record<string, CategorySummary> = transactions.reduce((acc: any, t: any) => {
      if (!acc[t.category]) acc[t.category] = { count: 0, total: 0 };
      acc[t.category].count += 1;
      acc[t.category].total += t.amount;
      return acc;
    }, {} as Record<string, CategorySummary>);

    return NextResponse.json({
      transactions,
      summary: {
        total: totalIncome,
        paid: paidIncome,
        pending: pendingIncome,
        transactionCount: transactions.length,
        byCategory,
      },
    });
  } catch (error: any) {
    console.error('Error fetching income transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch income transactions', details: error.message }, { status: 500 });
  }
}

// POST - Create new income transaction
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
      unitPrice,
      customerName,
      customerPhone,
      paymentMethod,
      paymentStatus,
      invoiceNumber,
      flockId,
      batchId,
      description,
      notes,
    } = body;

    if (!transactionDate || !category || !amount || !paymentMethod || !paymentStatus || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if invoice number exists
    if (invoiceNumber) {
      const existing = await prisma.incomeTransaction.findUnique({ where: { invoiceNumber } });
      if (existing) return NextResponse.json({ error: 'Invoice number already exists' }, { status: 400 });
    }

    const incomeTransaction = await prisma.incomeTransaction.create({
      data: {
        transactionDate: new Date(transactionDate),
        category,
        amount: Number(amount),
        quantity: quantity ? Number(quantity) : null,
        unitPrice: unitPrice ? Number(unitPrice) : null,
        customerName,
        customerPhone,
        paymentMethod,
        paymentStatus,
        invoiceNumber,
        flockId: flockId || null,
        batchId: batchId || null,
        description,
        notes,
        recordedBy: (session.user as any).id,
      },
      include: {
        flock: { select: { id: true, flockName: true } },
        batch: { select: { id: true, batchName: true } },
      },
    });

    return NextResponse.json(incomeTransaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating income transaction:', error);
    return NextResponse.json({ error: 'Failed to create income transaction', details: error.message }, { status: 500 });
  }
}

// PUT - Update income transaction
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });

    if (updateData.invoiceNumber) {
      const existing = await prisma.incomeTransaction.findFirst({
        where: { invoiceNumber: updateData.invoiceNumber, NOT: { id } },
      });
      if (existing) return NextResponse.json({ error: 'Invoice number already exists' }, { status: 400 });
    }

    if (updateData.transactionDate) updateData.transactionDate = new Date(updateData.transactionDate);
    if (updateData.amount) updateData.amount = Number(updateData.amount);
    if (updateData.quantity) updateData.quantity = Number(updateData.quantity);
    if (updateData.unitPrice) updateData.unitPrice = Number(updateData.unitPrice);

    const updatedTransaction = await prisma.incomeTransaction.update({
      where: { id },
      data: updateData,
      include: {
        flock: { select: { id: true, flockName: true } },
        batch: { select: { id: true, batchName: true } },
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error: any) {
    console.error('Error updating income transaction:', error);
    return NextResponse.json({ error: 'Failed to update income transaction', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete income transaction
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = (session.user as any).role?.name;
    if (userRole !== 'Farm Manager') return NextResponse.json({ error: 'Only Farm Managers can delete income transactions' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });

    await prisma.incomeTransaction.delete({ where: { id } });
    return NextResponse.json({ message: 'Income transaction deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting income transaction:', error);
    return NextResponse.json({ error: 'Failed to delete income transaction', details: error.message }, { status: 500 });
  }
}
