import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch all banking records
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (status && status !== 'all') where.status = status;
    if (startDate) where.recordDate = { ...where.recordDate, gte: new Date(startDate) };
    if (endDate) where.recordDate = { ...where.recordDate, lte: new Date(endDate) };

    const bankingRecords = await prisma.dailyBankingRecord.findMany({
      where,
      orderBy: { recordDate: 'desc' },
    });

    // Serialize Decimal to Number
    const records = bankingRecords.map((r: any) => ({
      ...r,
      totalCashSales: Number(r.totalCashSales),
      totalBanked: Number(r.totalBanked),
      variance: Number(r.variance),
      cashOnHand: r.cashOnHand ? Number(r.cashOnHand) : null,
    }));

    // Summary calculations
    const totalCashSales = records.reduce((sum: number, r: any) => sum + r.totalCashSales, 0);
    const totalBanked = records.reduce((sum: number, r: any) => sum + r.totalBanked, 0);
    const totalVariance = records.reduce((sum: number, r: any) => sum + r.variance, 0);
    const totalCashOnHand = records.reduce((sum: number, r: any) => sum + (r.cashOnHand || 0), 0);

    // Status breakdown
    const pendingCount = records.filter((r: any) => r.status === 'pending').length;
    const bankedCount = records.filter((r: any) => r.status === 'banked').length;
    const verifiedCount = records.filter((r: any) => r.status === 'verified').length;

    return NextResponse.json({
      records,
      summary: {
        totalCashSales,
        totalBanked,
        totalVariance,
        totalCashOnHand,
        recordCount: records.length,
        pendingCount,
        bankedCount,
        verifiedCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching banking records:', error);
    return NextResponse.json({ error: 'Failed to fetch banking records', details: error.message }, { status: 500 });
  }
}

// POST - Create new banking record
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      recordDate,
      totalCashSales,
      totalBanked,
      bankName,
      accountNumber,
      depositSlipNumber,
      depositedBy,
      cashOnHand,
      status,
      notes,
    } = body;

    // Validation
    if (!recordDate || totalCashSales === undefined || totalBanked === undefined) {
      return NextResponse.json({ error: 'Record date, total cash sales, and total banked are required' }, { status: 400 });
    }

    // Check for existing record on same date
    const existingRecord = await prisma.dailyBankingRecord.findUnique({
      where: { recordDate: new Date(recordDate) },
    });

    if (existingRecord) {
      return NextResponse.json({ error: 'A banking record already exists for this date. Please edit the existing record.' }, { status: 400 });
    }

    // Calculate variance
    const variance = parseFloat(totalCashSales) - parseFloat(totalBanked);

    const newRecord = await prisma.dailyBankingRecord.create({
      data: {
        recordDate: new Date(recordDate),
        totalCashSales: parseFloat(totalCashSales),
        totalBanked: parseFloat(totalBanked),
        variance,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        depositSlipNumber: depositSlipNumber || null,
        depositedBy: depositedBy || null,
        cashOnHand: cashOnHand ? parseFloat(cashOnHand) : variance > 0 ? variance : null,
        status: status || 'pending',
        notes: notes || null,
        recordedBy: session.user?.email || 'unknown',
      },
    });

    return NextResponse.json({
      ...newRecord,
      totalCashSales: Number(newRecord.totalCashSales),
      totalBanked: Number(newRecord.totalBanked),
      variance: Number(newRecord.variance),
      cashOnHand: newRecord.cashOnHand ? Number(newRecord.cashOnHand) : null,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating banking record:', error);
    return NextResponse.json({ error: 'Failed to create banking record', details: error.message }, { status: 500 });
  }
}

// PUT - Update banking record
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      id,
      totalCashSales,
      totalBanked,
      bankName,
      accountNumber,
      depositSlipNumber,
      depositedBy,
      cashOnHand,
      status,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const existingRecord = await prisma.dailyBankingRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Banking record not found' }, { status: 404 });
    }

    // Calculate variance if amounts are provided
    const newTotalCashSales = totalCashSales !== undefined ? parseFloat(totalCashSales) : Number(existingRecord.totalCashSales);
    const newTotalBanked = totalBanked !== undefined ? parseFloat(totalBanked) : Number(existingRecord.totalBanked);
    const variance = newTotalCashSales - newTotalBanked;

    const updateData: any = {
      totalCashSales: newTotalCashSales,
      totalBanked: newTotalBanked,
      variance,
      bankName: bankName !== undefined ? bankName : existingRecord.bankName,
      accountNumber: accountNumber !== undefined ? accountNumber : existingRecord.accountNumber,
      depositSlipNumber: depositSlipNumber !== undefined ? depositSlipNumber : existingRecord.depositSlipNumber,
      depositedBy: depositedBy !== undefined ? depositedBy : existingRecord.depositedBy,
      cashOnHand: cashOnHand !== undefined ? (cashOnHand ? parseFloat(cashOnHand) : null) : existingRecord.cashOnHand,
      status: status || existingRecord.status,
      notes: notes !== undefined ? notes : existingRecord.notes,
    };

    // If status is being set to 'verified', add verification info
    if (status === 'verified' && existingRecord.status !== 'verified') {
      updateData.verifiedBy = session.user?.email || 'unknown';
      updateData.verifiedAt = new Date();
    }

    const updatedRecord = await prisma.dailyBankingRecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updatedRecord,
      totalCashSales: Number(updatedRecord.totalCashSales),
      totalBanked: Number(updatedRecord.totalBanked),
      variance: Number(updatedRecord.variance),
      cashOnHand: updatedRecord.cashOnHand ? Number(updatedRecord.cashOnHand) : null,
    });
  } catch (error: any) {
    console.error('Error updating banking record:', error);
    return NextResponse.json({ error: 'Failed to update banking record', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete banking record
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    await prisma.dailyBankingRecord.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Banking record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting banking record:', error);
    return NextResponse.json({ error: 'Failed to delete banking record', details: error.message }, { status: 500 });
  }
}
