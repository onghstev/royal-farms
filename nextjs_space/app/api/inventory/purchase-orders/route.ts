import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Generate PO number
function generatePONumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PO-${dateStr}-${randomStr}`;
}

// GET: Fetch all purchase orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');

    const orders = await prisma.purchaseOrder.findMany({
      where: {
        ...(status && { status }),
        ...(supplierId && { supplierId })
      },
      include: {
        supplier: true,
        items: {
          include: {
            inventory: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { orderDate: 'desc' }
    });

    // Calculate summary statistics
    const summary = {
      totalOrders: orders.length,
      draftOrders: orders.filter((o: any) => o.status === 'draft').length,
      pendingOrders: orders.filter((o: any) => o.status === 'submitted' || o.status === 'approved').length,
      receivedOrders: orders.filter((o: any) => o.status === 'received').length,
      totalValue: orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0),
      totalPaid: orders.reduce((sum: number, o: any) => sum + Number(o.paidAmount), 0)
    };

    return NextResponse.json({ success: true, data: orders, summary });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST: Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      supplierId,
      orderDate,
      expectedDelivery,
      status,
      items,
      shippingAddress,
      notes
    } = body;

    // Validate required fields
    if (!supplierId || !orderDate || !items || items.length === 0) {
      return NextResponse.json({ 
        error: 'Supplier, order date, and at least one item are required' 
      }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (Number(item.quantityOrdered) * Number(item.unitPrice)), 0
    );

    // Create purchase order with items in a transaction
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const po = await tx.purchaseOrder.create({
        data: {
          orderNumber: generatePONumber(),
          orderDate: new Date(orderDate),
          supplierId,
          expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
          status: status || 'draft',
          totalAmount,
          shippingAddress,
          notes,
          items: {
            create: items.map((item: any) => ({
              inventoryId: item.inventoryId,
              quantityOrdered: item.quantityOrdered,
              unitPrice: item.unitPrice,
              totalPrice: Number(item.quantityOrdered) * Number(item.unitPrice),
              notes: item.notes
            }))
          }
        },
        include: {
          supplier: true,
          items: {
            include: {
              inventory: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      return po;
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}

// PUT: Update purchase order
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      status,
      actualDelivery,
      paymentStatus,
      paidAmount,
      paymentDate,
      paymentMethod,
      invoiceNumber,
      approvedBy,
      receivedBy,
      items,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Purchase order ID is required' }, { status: 400 });
    }

    // Update purchase order in a transaction
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If status is changing to 'received', update inventory
      const existingOrder = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true }
      });

      if (existingOrder && status === 'received' && existingOrder.status !== 'received') {
        // Update inventory for each item
        for (const item of existingOrder.items) {
          await tx.generalInventory.update({
            where: { id: item.inventoryId },
            data: {
              currentStock: {
                increment: item.quantityReceived || item.quantityOrdered
              },
              lastRestockDate: new Date(actualDelivery || new Date())
            }
          });

          // Create stock movement record
          const inventory = await tx.generalInventory.findUnique({
            where: { id: item.inventoryId }
          });

          if (inventory) {
            await tx.stockMovement.create({
              data: {
                inventoryId: item.inventoryId,
                movementDate: new Date(actualDelivery || new Date()),
                movementType: 'purchase',
                quantity: item.quantityReceived || item.quantityOrdered,
                balanceAfter: Number(inventory.currentStock) + Number(item.quantityReceived || item.quantityOrdered),
                referenceNumber: existingOrder.orderNumber,
                reason: `Purchase order received: ${existingOrder.orderNumber}`,
                performedBy: receivedBy || session.user?.email || 'system',
                notes: `Auto-generated from PO ${existingOrder.orderNumber}`
              }
            });
          }
        }
      }

      // Update the purchase order
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status,
          actualDelivery: actualDelivery ? new Date(actualDelivery) : null,
          paymentStatus,
          paidAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          paymentMethod,
          invoiceNumber,
          approvedBy,
          receivedBy,
          notes
        },
        include: {
          supplier: true,
          items: {
            include: {
              inventory: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      // Update PO items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          if (item.id) {
            await tx.purchaseOrderItem.update({
              where: { id: item.id },
              data: {
                quantityReceived: item.quantityReceived,
                notes: item.notes
              }
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 });
  }
}

// DELETE: Delete purchase order
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Purchase order ID is required' }, { status: 400 });
    }

    // Check if order is already received
    const order = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (order && order.status === 'received') {
      return NextResponse.json({ 
        error: 'Cannot delete received purchase orders. Please cancel instead.' 
      }, { status: 400 });
    }

    await prisma.purchaseOrder.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 });
  }
}