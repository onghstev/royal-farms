import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Fetch all inventory suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suppliers = await prisma.generalInventorySupplier.findMany({
      include: {
        _count: {
          select: { 
            purchaseOrders: true,
            inventory: true 
          }
        }
      },
      orderBy: { supplierName: 'asc' }
    });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Error fetching inventory suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

// POST: Create new inventory supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      supplierName, 
      supplierType, 
      contactPerson, 
      phone, 
      email, 
      address,
      taxIdNumber,
      paymentTerms,
      bankDetails,
      rating,
      isActive, 
      notes 
    } = body;

    // Validate required fields
    if (!supplierName || !supplierType) {
      return NextResponse.json({ error: 'Supplier name and type are required' }, { status: 400 });
    }

    const supplier = await prisma.generalInventorySupplier.create({
      data: {
        supplierName,
        supplierType,
        contactPerson,
        phone,
        email,
        address,
        taxIdNumber,
        paymentTerms,
        bankDetails,
        rating,
        isActive: isActive !== undefined ? isActive : true,
        notes
      }
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory supplier:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Supplier name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}

// PUT: Update inventory supplier
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      supplierName, 
      supplierType, 
      contactPerson, 
      phone, 
      email, 
      address,
      taxIdNumber,
      paymentTerms,
      bankDetails,
      rating,
      isActive, 
      notes 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    const supplier = await prisma.generalInventorySupplier.update({
      where: { id },
      data: {
        supplierName,
        supplierType,
        contactPerson,
        phone,
        email,
        address,
        taxIdNumber,
        paymentTerms,
        bankDetails,
        rating,
        isActive,
        notes
      }
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    console.error('Error updating inventory supplier:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Supplier name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

// DELETE: Delete inventory supplier
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    // Check if supplier has purchase orders
    const orderCount = await prisma.purchaseOrder.count({
      where: { supplierId: id }
    });

    if (orderCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete supplier with existing purchase orders. Please deactivate instead.', 
        orderCount 
      }, { status: 400 });
    }

    await prisma.generalInventorySupplier.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}