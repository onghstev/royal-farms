import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Fetch all inventory categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.inventoryCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { categoryName: 'asc' }
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching inventory categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST: Create new inventory category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryName, description, isActive } = body;

    // Validate required fields
    if (!categoryName) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await prisma.inventoryCategory.create({
      data: {
        categoryName,
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory category:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT: Update inventory category
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, categoryName, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await prisma.inventoryCategory.update({
      where: { id },
      data: {
        categoryName,
        description,
        isActive
      }
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Error updating inventory category:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE: Delete inventory category
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category has items
    const itemCount = await prisma.generalInventory.count({
      where: { categoryId: id }
    });

    if (itemCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with existing items. Please deactivate instead.', 
        itemCount 
      }, { status: 400 });
    }

    await prisma.inventoryCategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}