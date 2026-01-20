import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch all feed inventory
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const feedType = searchParams.get('feedType');

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (feedType) {
      where.feedType = feedType;
    }

    const inventory = await prisma.feedInventory.findMany({
      where,
      include: {
        supplier: true,
        _count: {
          select: {
            purchases: true,
            consumptions: true,
          },
        },
      },
      orderBy: {
        feedType: 'asc',
      },
    });

    // Calculate total value and low stock items
    const totalValue = inventory.reduce((sum: number, item: any) => {
      const itemValue = Number(item.currentStockBags) * Number(item.unitCostPerBag);
      return sum + itemValue;
    }, 0);

    const lowStockItems = inventory.filter((item: any) => 
      Number(item.currentStockBags) <= Number(item.reorderLevel)
    );

    return NextResponse.json({
      inventory,
      summary: {
        totalItems: inventory.length,
        totalValue: totalValue.toFixed(2),
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((item) => ({
          id: item.id,
          feedType: item.feedType,
          currentStock: item.currentStockBags,
          reorderLevel: item.reorderLevel,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Create new feed inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      feedType,
      feedBrand,
      supplierId,
      currentStockBags,
      reorderLevel,
      unitCostPerBag,
      bagWeightKg,
      lastRestockDate,
      expiryDate,
      storageLocation,
    } = body;

    if (!feedType || !unitCostPerBag) {
      return NextResponse.json(
        { error: 'Feed type and unit cost are required' },
        { status: 400 }
      );
    }

    const inventory = await prisma.feedInventory.create({
      data: {
        feedType,
        feedBrand: feedBrand || null,
        supplierId: supplierId || null,
        currentStockBags: currentStockBags || 0,
        reorderLevel: reorderLevel || 50,
        unitCostPerBag,
        bagWeightKg: bagWeightKg || 25,
        lastRestockDate: lastRestockDate ? new Date(lastRestockDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        storageLocation: storageLocation || null,
        isActive: true,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(
      { inventory, message: 'Inventory item created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}

// PUT - Update feed inventory
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      feedType,
      feedBrand,
      supplierId,
      currentStockBags,
      reorderLevel,
      unitCostPerBag,
      bagWeightKg,
      lastRestockDate,
      expiryDate,
      storageLocation,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    const inventory = await prisma.feedInventory.update({
      where: { id },
      data: {
        feedType,
        feedBrand: feedBrand || null,
        supplierId: supplierId || null,
        currentStockBags,
        reorderLevel,
        unitCostPerBag,
        bagWeightKg,
        lastRestockDate: lastRestockDate ? new Date(lastRestockDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        storageLocation: storageLocation || null,
        isActive,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(
      { inventory, message: 'Inventory updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feed inventory
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
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    // Check if inventory has associated records
    const inventory = await prisma.feedInventory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
            consumptions: true,
          },
        },
      },
    });

    if (inventory && (inventory._count.purchases > 0 || inventory._count.consumptions > 0)) {
      return NextResponse.json(
        { error: 'Cannot delete inventory with associated records. Please deactivate instead.' },
        { status: 400 }
      );
    }

    await prisma.feedInventory.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Inventory deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting inventory:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory' },
      { status: 500 }
    );
  }
}
