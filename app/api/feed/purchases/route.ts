import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma, FeedPurchase } from '@prisma/client';

/* ----------------------------------
   GET – Fetch feed purchases
-----------------------------------*/
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

    const where: Prisma.FeedPurchaseWhereInput = {
      supplierId: supplierId || undefined,
      paymentStatus: paymentStatus || undefined,
      purchaseDate:
        startDate && endDate
          ? {
              gte: new Date(startDate),
              lte: new Date(endDate),
            }
          : undefined,
    };

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
      orderBy: { purchaseDate: 'desc' },
    });

    const serializedPurchases = purchases.map((p: FeedPurchase & any) => ({
      ...p,
      quantityBags: Number(p.quantityBags),
      pricePerBag: Number(p.pricePerBag),
      totalCost: Number(p.totalCost),
      receiver: p.receiver
        ? {
            fullName: `${p.receiver.firstName} ${p.receiver.lastName}`,
            email: p.receiver.email,
          }
        : null,
    }));

    const totalSpent = purchases.reduce(
      (sum: number, p: FeedPurchase) => sum + Number(p.totalCost),
      0
    );

    const pendingAmount = purchases
      .filter((p: FeedPurchase) => p.paymentStatus === 'Pending')
      .reduce((sum: number, p: FeedPurchase) => sum + Number(p.totalCost), 0);

    return NextResponse.json({
      purchases: serializedPurchases,
      summary: {
        totalPurchases: purchases.length,
        totalSpent: Number(totalSpent.toFixed(2)),
        pendingPayments: Number(pendingAmount.toFixed(2)),
        paidCount: purchases.filter(
          (p: FeedPurchase) => p.paymentStatus === 'Paid'
        ).length,
        pendingCount: purchases.filter(
          (p: FeedPurchase) => p.paymentStatus === 'Pending'
        ).length,
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

/* ----------------------------------
   POST – Create purchase
-----------------------------------*/
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      purchaseDate: string;
      supplierId: string;
      inventoryId: string;
      quantityBags: number;
      pricePerBag: number;
      paymentStatus?: string;
      paymentDate?: string;
      invoiceNumber?: string;
      deliveryDate?: string;
      notes?: string;
    };

    if (
      !body.purchaseDate ||
      !body.supplierId ||
      !body.inventoryId ||
      !body.quantityBags ||
      !body.pricePerBag
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const totalCost = Number(body.quantityBags) * Number(body.pricePerBag);

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const purchase = await tx.feedPurchase.create({
          data: {
            purchaseDate: new Date(body.purchaseDate),
            supplierId: body.supplierId,
            inventoryId: body.inventoryId,
            quantityBags: body.quantityBags,
            pricePerBag: body.pricePerBag,
            totalCost,
            paymentStatus: body.paymentStatus || 'Pending',
            paymentDate: body.paymentDate
              ? new Date(body.paymentDate)
              : null,
            invoiceNumber: body.invoiceNumber || null,
            deliveryDate: body.deliveryDate
              ? new Date(body.deliveryDate)
              : null,
            receivedBy: currentUser.id,
            notes: body.notes || null,
          },
          include: {
            supplier: true,
            inventory: true,
            receiver: {
              select: { firstName: true, lastName: true },
            },
          },
        });

        await tx.feedInventory.update({
          where: { id: body.inventoryId },
          data: {
            currentStockBags: { increment: Number(body.quantityBags) },
            lastRestockDate: new Date(body.purchaseDate),
            unitCostPerBag: body.pricePerBag,
          },
        });

        return purchase;
      }
    );

    return NextResponse.json(
      {
        purchase: result,
        message: 'Purchase recorded and inventory updated successfully',
      },
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

/* ----------------------------------
   PUT – Update purchase
-----------------------------------*/
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      id: string;
      purchaseDate: string;
      supplierId: string;
      inventoryId: string;
      quantityBags: number;
      pricePerBag: number;
      paymentStatus?: string;
      paymentDate?: string;
      invoiceNumber?: string;
      deliveryDate?: string;
      notes?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    const oldPurchase = await prisma.feedPurchase.findUnique({
      where: { id: body.id },
    });

    if (!oldPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const totalCost = Number(body.quantityBags) * Number(body.pricePerBag);

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const purchase = await tx.feedPurchase.update({
          where: { id: body.id },
          data: {
            purchaseDate: new Date(body.purchaseDate),
            supplierId: body.supplierId,
            inventoryId: body.inventoryId,
            quantityBags: body.quantityBags,
            pricePerBag: body.pricePerBag,
            totalCost,
            paymentStatus: body.paymentStatus,
            paymentDate: body.paymentDate
              ? new Date(body.paymentDate)
              : null,
            invoiceNumber: body.invoiceNumber || null,
            deliveryDate: body.deliveryDate
              ? new Date(body.deliveryDate)
              : null,
            notes: body.notes || null,
          },
          include: { supplier: true, inventory: true },
        });

        const quantityDiff =
          Number(body.quantityBags) - Number(oldPurchase.quantityBags);

        if (quantityDiff !== 0) {
          await tx.feedInventory.update({
            where: { id: body.inventoryId },
            data: { currentStockBags: { increment: quantityDiff } },
          });
        }

        return purchase;
      }
    );

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

/* ----------------------------------
   DELETE – Delete purchase
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
        { error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    const purchase = await prisma.feedPurchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.feedPurchase.delete({ where: { id } });

        await tx.feedInventory.update({
          where: { id: purchase.inventoryId },
          data: {
            currentStockBags: {
              decrement: Number(purchase.quantityBags),
            },
          },
        });
      }
    );

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
