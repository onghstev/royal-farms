import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Fetch all inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const showInactive = searchParams.get('showInactive') === 'true';

    const items = await prisma.generalInventory.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(showInactive ? {} : { isActive: true })
      },
      include: {
        category: true,
        supplier: true,
        _count: {
          select: { 
            purchaseOrderItems: true,
            stockMovements: true 
          }
        }
      },
      orderBy: { itemName: 'asc' }
    });

    // Calculate low stock items
    const lowStockItems = items.filter(item => 
      Number(item.currentStock) <= Number(item.reorderLevel)
    );

    // Calculate total inventory value
    const totalValue = items.reduce((sum, item) => 
      sum + (Number(item.currentStock) * Number(item.unitCost)), 
      0
    );

    return NextResponse.json({ 
      success: true, 
      data: items,
      summary: {
        totalItems: items.length,
        lowStockCount: lowStockItems.length,
        totalValue: totalValue.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}

// POST: Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      itemName,
      itemCode,
      categoryId,
      description,
      unit,
      currentStock,
      reorderLevel,
      maxStockLevel,
      unitCost,
      supplierId,
      storageLocation,
      expiryDate,
      lastRestockDate,
      isActive,
      notes
    } = body;

    // Validate required fields
    if (!itemName || !categoryId || !unit || !reorderLevel || !unitCost) {
      return NextResponse.json({ 
        error: 'Item name, category, unit, reorder level, and unit cost are required' 
      }, { status: 400 });
    }

    const item = await prisma.generalInventory.create({
      data: {
        itemName,
        itemCode,
        categoryId,
        description,
        unit,
        currentStock: currentStock || 0,
        reorderLevel,
        maxStockLevel,
        unitCost,
        supplierId,
        storageLocation,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        lastRestockDate: lastRestockDate ? new Date(lastRestockDate) : null,
        isActive: isActive !== undefined ? isActive : true,
        notes
      },
      include: {
        category: true,
        supplier: true
      }
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Item code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}

// PUT: Update inventory item
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      itemName,
      itemCode,
      categoryId,
      description,
      unit,
      currentStock,
      reorderLevel,
      maxStockLevel,
      unitCost,
      supplierId,
      storageLocation,
      expiryDate,
      lastRestockDate,
      isActive,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const item = await prisma.generalInventory.update({
      where: { id },
      data: {
        itemName,
        itemCode,
        categoryId,
        description,
        unit,
        currentStock,
        reorderLevel,
        maxStockLevel,
        unitCost,
        supplierId,
        storageLocation,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        lastRestockDate: lastRestockDate ? new Date(lastRestockDate) : null,
        isActive,
        notes
      },
      include: {
        category: true,
        supplier: true
      }
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Item code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

// DELETE: Delete inventory item
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Check if item has stock movements
    const movementCount = await prisma.stockMovement.count({
      where: { inventoryId: id }
    });

    if (movementCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete item with stock movement history. Please deactivate instead.', 
        movementCount 
      }, { status: 400 });
    }

    await prisma.generalInventory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}