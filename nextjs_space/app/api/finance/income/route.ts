import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch all income transactions
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

    if (category && category !== 'all') {
      where.category = category;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus;
    }

    if (startDate) {
      where.transactionDate = {
        ...where.transactionDate,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      where.transactionDate = {
        ...where.transactionDate,
        lte: new Date(endDate)
      };
    }

    const incomeTransactions = await prisma.incomeTransaction.findMany({
      where,
      include: {
        flock: { select: { id: true, flockName: true } },
        batch: { select: { id: true, batchName: true } }
      },
      orderBy: { transactionDate: 'desc' }
    });

    // Calculate summary statistics
    const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const paidIncome = incomeTransactions
      .filter((t: any) => t.paymentStatus === 'paid')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const pendingIncome = incomeTransactions
      .filter((t: any) => t.paymentStatus === 'pending')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    // Category breakdown
    const byCategory = incomeTransactions.reduce((acc: any, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { count: 0, total: 0 };
      }
      acc[t.category].count++;
      acc[t.category].total += Number(t.amount);
      return acc;
    }, {});

    return NextResponse.json({
      transactions: incomeTransactions,
      summary: {
        total: totalIncome,
        paid: paidIncome,
        pending: pendingIncome,
        transactionCount: incomeTransactions.length,
        byCategory
      }
    });
  } catch (error: any) {
    console.error('Error fetching income transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income transactions', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new income transaction
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      notes
    } = body;

    // Validation
    if (!transactionDate || !category || !amount || !paymentMethod || !paymentStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if invoice number already exists
    if (invoiceNumber) {
      const existing = await prisma.incomeTransaction.findUnique({
        where: { invoiceNumber }
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Invoice number already exists' },
          { status: 400 }
        );
      }
    }

    // Create income transaction
    const incomeTransaction = await prisma.incomeTransaction.create({
      data: {
        transactionDate: new Date(transactionDate),
        category,
        amount: parseFloat(amount),
        quantity: quantity ? parseFloat(quantity) : null,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        customerName,
        customerPhone,
        paymentMethod,
        paymentStatus,
        invoiceNumber,
        flockId: flockId || null,
        batchId: batchId || null,
        description,
        notes,
        recordedBy: (session.user as any).id
      },
      include: {
        flock: { select: { id: true, flockName: true } },
        batch: { select: { id: true, batchName: true } }
      }
    });

    return NextResponse.json(incomeTransaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating income transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create income transaction', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update income transaction
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check if invoice number already exists (excluding current transaction)
    if (updateData.invoiceNumber) {
      const existing = await prisma.incomeTransaction.findFirst({
        where: {
          invoiceNumber: updateData.invoiceNumber,
          NOT: { id }
        }
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Invoice number already exists' },
          { status: 400 }
        );
      }
    }

    // Convert date fields
    if (updateData.transactionDate) {
      updateData.transactionDate = new Date(updateData.transactionDate);
    }

    // Convert numeric fields
    if (updateData.amount) updateData.amount = parseFloat(updateData.amount);
    if (updateData.quantity) updateData.quantity = parseFloat(updateData.quantity);
    if (updateData.unitPrice) updateData.unitPrice = parseFloat(updateData.unitPrice);

    const updatedTransaction = await prisma.incomeTransaction.update({
      where: { id },
      data: updateData,
      include: {
        flock: { select: { id: true, flockName: true } },
        batch: { select: { id: true, batchName: true } }
      }
    });

    return NextResponse.json(updatedTransaction);
  } catch (error: any) {
    console.error('Error updating income transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update income transaction', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete income transaction
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Farm Manager
    const userRole = (session.user as any).role?.name;
    if (userRole !== 'Farm Manager') {
      return NextResponse.json(
        { error: 'Only Farm Managers can delete income transactions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    await prisma.incomeTransaction.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Income transaction deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting income transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete income transaction', details: error.message },
      { status: 500 }
    );
  }
}
