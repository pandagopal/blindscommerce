import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { getPool } from '@/lib/db';

interface Material {
  id: string;
  name: string;
  quantity: number;
  status: 'in stock' | 'low stock' | 'out of stock';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has installer or admin role
    if (!hasRole(user, ['installer', 'admin'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Mock data - in a real app, fetch from database
    const material: Material = {
      id,
      name: 'Wood Blinds - 2 inch',
      quantity: 25,
      status: 'in stock'
    };

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has installer or admin role
    if (!hasRole(user, ['installer', 'admin'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, quantity, status } = body;

    // Validate required fields
    if (!name || quantity === undefined || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['in stock', 'low stock', 'out of stock'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // In a real app, this would update the database
    console.log(`Updating material ${id}:`, { name, quantity, status });

    const updatedMaterial: Material = {
      id,
      name,
      quantity: parseInt(quantity.toString()),
      status
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Material updated successfully',
      material: updatedMaterial
    });
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has installer or admin role
    if (!hasRole(user, ['installer', 'admin'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // In a real app, this would delete from the database
    console.log(`Deleting material ${id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Material deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    );
  }
}