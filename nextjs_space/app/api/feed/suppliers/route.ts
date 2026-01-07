import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch all feed suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const suppliers = await prisma.feedSupplier.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: {
        supplierName: 'asc',
      },
      include: {
        _count: {
          select: {
            purchases: true,
            inventory: true,
          },
        },
      },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// POST - Create new feed supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { supplierName, contactPerson, phone, email, address, notes } = body;

    if (!supplierName) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      );
    }

    // Check if supplier name already exists
    const existing = await prisma.feedSupplier.findUnique({
      where: { supplierName },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Supplier name already exists' },
        { status: 400 }
      );
    }

    const supplier = await prisma.feedSupplier.create({
      data: {
        supplierName,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      { supplier, message: 'Supplier created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}

// PUT - Update feed supplier
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, supplierName, contactPerson, phone, email, address, isActive, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    const supplier = await prisma.feedSupplier.update({
      where: { id },
      data: {
        supplierName,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        isActive,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      { supplier, message: 'Supplier updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feed supplier
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    // Check if supplier has associated purchases or inventory
    const supplier = await prisma.feedSupplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
            inventory: true,
          },
        },
      },
    });

    if (supplier && (supplier._count.purchases > 0 || supplier._count.inventory > 0)) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with associated purchases or inventory. Please deactivate instead.' },
        { status: 400 }
      );
    }

    await prisma.feedSupplier.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Supplier deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
