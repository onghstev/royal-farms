import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch all feed purchases
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (startDate && endDate) {
      where.purchaseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const purchases = await prisma.feedPurchase.findMany({
      where,
      include: {
        supplier: true,
        inventory: {
          select: {
            feedType: true,
            feedBrand: true,
          },
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    // Serialize purchases with proper number conversion
    const serializedPurchases = purchases.map((p: any) => ({
      ...p,
      quantityBags: Number(p.quantityBags),
      pricePerBag: Number(p.pricePerBag),
      totalCost: Number(p.totalCost),
      receiver: {
        fullName: `${p.receiver.firstName} ${p.receiver.lastName}`,
        email: p.receiver.email,
      },
    }));

    // Calculate summary statistics
    const totalSpent = purchases.reduce((sum: number, p: any) => sum + Number(p.totalCost), 0);
    const pendingAmount = purchases
      .filter((p: any) => p.paymentStatus === 'Pending')
      .reduce((sum: number, p: any) => sum + Number(p.totalCost), 0);

    return NextResponse.json({
      purchases: serializedPurchases,
      summary: {
        totalPurchases: purchases.length,
        totalSpent: Number(totalSpent.toFixed(2)),
        pendingPayments: Number(pendingAmount.toFixed(2)),
        paidCount: purchases.filter((p: any) => p.paymentStatus === 'Paid').length,
        pendingCount: purchases.filter((p: any) => p.paymentStatus === 'Pending').length,
      },
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}

// POST - Create new feed purchase (with automatic inventory update)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      purchaseDate,
      supplierId,
      inventoryId,
      quantityBags,
      pricePerBag,
      paymentStatus,
      paymentDate,
      invoiceNumber,
      deliveryDate,
      notes,
    } = body;

    if (!purchaseDate || !supplierId || !inventoryId || !quantityBags || !pricePerBag) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const totalCost = Number(quantityBags) * Number(pricePerBag);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // Create purchase record
      const purchase = await tx.feedPurchase.create({
        data: {
          purchaseDate: new Date(purchaseDate),
          supplierId,
          inventoryId,
          quantityBags,
          pricePerBag,
          totalCost,
          paymentStatus: paymentStatus || 'pending',
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          invoiceNumber: invoiceNumber || null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          receivedBy: currentUser.id,
          notes: notes || null,
        },
        include: {
          supplier: true,
          inventory: true,
          receiver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update inventory stock automatically
      const inventory = await tx.feedInventory.findUnique({
        where: { id: inventoryId },
      });

      if (inventory) {
        await tx.feedInventory.update({
          where: { id: inventoryId },
          data: {
            currentStockBags: {
              increment: Number(quantityBags),
            },
            lastRestockDate: new Date(purchaseDate),
            unitCostPerBag: pricePerBag, // Update to latest price
          },
        });
      }

      return purchase;
    });

    return NextResponse.json(
      { purchase: result, message: 'Purchase recorded and inventory updated successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    );
  }
}

// PUT - Update feed purchase
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      purchaseDate,
      supplierId,
      inventoryId,
      quantityBags,
      pricePerBag,
      paymentStatus,
      paymentDate,
      invoiceNumber,
      deliveryDate,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    const totalCost = Number(quantityBags) * Number(pricePerBag);

    // Get old purchase to calculate inventory adjustment
    const oldPurchase = await prisma.feedPurchase.findUnique({
      where: { id },
    });

    if (!oldPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // Update purchase
      const purchase = await tx.feedPurchase.update({
        where: { id },
        data: {
          purchaseDate: new Date(purchaseDate),
          supplierId,
          inventoryId,
          quantityBags,
          pricePerBag,
          totalCost,
          paymentStatus,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          invoiceNumber: invoiceNumber || null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          notes: notes || null,
        },
        include: {
          supplier: true,
          inventory: true,
        },
      });

      // Adjust inventory if quantity changed
      const quantityDiff = Number(quantityBags) - Number(oldPurchase.quantityBags);
      if (quantityDiff !== 0) {
        await tx.feedInventory.update({
          where: { id: inventoryId },
          data: {
            currentStockBags: {
              increment: quantityDiff,
            },
          },
        });
      }

      return purchase;
    });

    return NextResponse.json(
      { purchase: result, message: 'Purchase updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      { error: 'Failed to update purchase' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feed purchase
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
        { error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    // Get purchase details before deleting
    const purchase = await prisma.feedPurchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx: any) => {
      // Delete purchase
      await tx.feedPurchase.delete({
        where: { id },
      });

      // Adjust inventory (reverse the purchase)
      await tx.feedInventory.update({
        where: { id: purchase.inventoryId },
        data: {
          currentStockBags: {
            decrement: Number(purchase.quantityBags),
          },
        },
      });
    });

    return NextResponse.json(
      { message: 'Purchase deleted and inventory adjusted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json(
      { error: 'Failed to delete purchase' },
      { status: 500 }
    );
  }
}
