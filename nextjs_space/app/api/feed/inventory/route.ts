import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Type alias for any


/* ----------------------------------
   Helper Types
-----------------------------------*/
type InventoryWithRelations = any & {
  supplier?: unknown | null;
  _count: {
    purchases: number;
    consumptions: number;
  };
};

/* ----------------------------------
   GET – Fetch inventory
-----------------------------------*/
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const feedType = searchParams.get('feedType');

    const where: any = {
      isActive: includeInactive ? undefined : true,
      feedType: feedType || undefined,
    };

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
      orderBy: { feedType: 'asc' },
    });

    const totalValue = inventory.reduce(
      (sum: number, item: any) =>
        sum + Number(item.currentStockBags) * Number(item.unitCostPerBag),
      0
    );

    const lowStockItems = inventory.filter(
      (item: any) =>
        Number(item.currentStockBags) <= Number(item.reorderLevel)
    );

    return NextResponse.json({
      inventory,
      summary: {
        totalItems: inventory.length,
        totalValue: Number(totalValue.toFixed(2)),
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((item: any) => ({
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

/* ----------------------------------
   POST – Create inventory item
-----------------------------------*/
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      feedType: string;
      feedBrand?: string;
      supplierId?: string;
      currentStockBags?: number;
      reorderLevel?: number;
      unitCostPerBag: number;
      bagWeightKg?: number;
      lastRestockDate?: string;
      expiryDate?: string;
      storageLocation?: string;
    };

    if (!body.feedType || !body.unitCostPerBag) {
      return NextResponse.json(
        { error: 'Feed type and unit cost are required' },
        { status: 400 }
      );
    }

    const inventory = await prisma.feedInventory.create({
      data: {
        feedType: body.feedType,
        feedBrand: body.feedBrand || null,
        supplierId: body.supplierId || null,
        currentStockBags: body.currentStockBags ?? 0,
        reorderLevel: body.reorderLevel ?? 50,
        unitCostPerBag: body.unitCostPerBag,
        bagWeightKg: body.bagWeightKg ?? 25,
        lastRestockDate: body.lastRestockDate
          ? new Date(body.lastRestockDate)
          : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        storageLocation: body.storageLocation || null,
        isActive: true,
      },
      include: { supplier: true },
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

/* ----------------------------------
   PUT – Update inventory
-----------------------------------*/
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<any> & {
      id: string;
      lastRestockDate?: string;
      expiryDate?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    const inventory = await prisma.feedInventory.update({
      where: { id: body.id },
      data: {
        feedType: body.feedType,
        feedBrand: body.feedBrand || null,
        supplierId: body.supplierId || null,
        currentStockBags: body.currentStockBags,
        reorderLevel: body.reorderLevel,
        unitCostPerBag: body.unitCostPerBag,
        bagWeightKg: body.bagWeightKg,
        lastRestockDate: body.lastRestockDate
          ? new Date(body.lastRestockDate)
          : null,
        expiryDate: body.expiryDate
          ? new Date(body.expiryDate)
          : null,
        storageLocation: body.storageLocation || null,
        isActive: body.isActive,
      },
      include: { supplier: true },
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

/* ----------------------------------
   DELETE – Delete inventory
-----------------------------------*/
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

    const inventory = await prisma.feedInventory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchases: true, consumptions: true },
        },
      },
    });

    if (
      inventory &&
      (inventory._count.purchases > 0 ||
        inventory._count.consumptions > 0)
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot delete inventory with associated records. Please deactivate instead.',
        },
        { status: 400 }
      );
    }

    await prisma.feedInventory.delete({ where: { id } });

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
