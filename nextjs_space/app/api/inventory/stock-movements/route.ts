import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Fetch stock movements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get('inventoryId');
    const movementType = searchParams.get('movementType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const movements = await prisma.stockMovement.findMany({
      where: {
        ...(inventoryId && { inventoryId }),
        ...(movementType && { movementType }),
        ...(startDate && endDate && {
          movementDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      include: {
        inventory: {
          include: {
            category: true,
            supplier: true
          }
        }
      },
      orderBy: { movementDate: 'desc' }
    });

    // Calculate summary statistics
    const summary = {
      totalMovements: movements.length,
      purchases: movements.filter((m: any) => m.movementType === 'purchase').length,
      consumptions: movements.filter((m: any) => m.movementType === 'consumption').length,
      adjustments: movements.filter((m: any) => m.movementType === 'adjustment').length,
      returns: movements.filter((m: any) => m.movementType === 'return').length,
      damages: movements.filter((m: any) => m.movementType === 'damage').length
    };

    return NextResponse.json({ success: true, data: movements, summary });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 });
  }
}

// POST: Create stock movement (manual adjustment)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      inventoryId,
      movementDate,
      movementType,
      quantity,
      referenceNumber,
      reason,
      notes
    } = body;

    // Validate required fields
    if (!inventoryId || !movementDate || !movementType || !quantity) {
      return NextResponse.json({ 
        error: 'Inventory, date, movement type, and quantity are required' 
      }, { status: 400 });
    }

    // Create movement and update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current inventory
      const inventory = await tx.generalInventory.findUnique({
        where: { id: inventoryId }
      });

      if (!inventory) {
        throw new Error('Inventory item not found');
      }

      // Calculate new stock based on movement type
      let stockChange = Number(quantity);
      if (['consumption', 'damage', 'return'].includes(movementType)) {
        stockChange = -stockChange;
      }

      const newStock = Number(inventory.currentStock) + stockChange;

      // Check for negative stock
      if (newStock < 0) {
        throw new Error('Insufficient stock for this operation');
      }

      // Update inventory
      await tx.generalInventory.update({
        where: { id: inventoryId },
        data: {
          currentStock: newStock
        }
      });

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          inventoryId,
          movementDate: new Date(movementDate),
          movementType,
          quantity: Math.abs(Number(quantity)),
          balanceAfter: newStock,
          referenceNumber,
          reason,
          performedBy: session.user?.email || 'system',
          notes
        },
        include: {
          inventory: {
            include: {
              category: true,
              supplier: true
            }
          }
        }
      });

      return movement;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create stock movement' 
    }, { status: 500 });
  }
}

// DELETE: Delete stock movement (and reverse inventory changes)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Movement ID is required' }, { status: 400 });
    }

    // Delete movement and reverse inventory changes in a transaction
    await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findUnique({
        where: { id },
        include: { inventory: true }
      });

      if (!movement) {
        throw new Error('Stock movement not found');
      }

      // Calculate reverse stock change
      let stockChange = Number(movement.quantity);
      if (['consumption', 'damage', 'return'].includes(movement.movementType)) {
        stockChange = stockChange; // Reverse the deduction
      } else {
        stockChange = -stockChange; // Reverse the addition
      }

      const newStock = Number(movement.inventory.currentStock) + stockChange;

      // Check for negative stock
      if (newStock < 0) {
        throw new Error('Cannot delete movement: would result in negative stock');
      }

      // Update inventory
      await tx.generalInventory.update({
        where: { id: movement.inventoryId },
        data: {
          currentStock: newStock
        }
      });

      // Delete movement
      await tx.stockMovement.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: 'Stock movement deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting stock movement:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete stock movement' 
    }, { status: 500 });
  }
}