import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { getPool } from '@/lib/db';

interface Material {
  id: string;
  name: string;
  quantity: number;
  status: 'in stock' | 'low stock' | 'out of stock';
}

export async function GET(request: NextRequest) {
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

    const pool = await getPool();
    
    // Mock data for now - in a real app, this would come from the database
    const mockMaterials: Material[] = [
      {
        id: '1',
        name: 'Wood Blinds - 2 inch',
        quantity: 25,
        status: 'in stock'
      },
      {
        id: '2',
        name: 'Mounting Brackets',
        quantity: 50,
        status: 'in stock'
      },
      {
        id: '3',
        name: 'Cellular Shade Fabric',
        quantity: 8,
        status: 'low stock'
      },
      {
        id: '4',
        name: 'Motor Units',
        quantity: 0,
        status: 'out of stock'
      },
      {
        id: '5',
        name: 'Pull Cords',
        quantity: 30,
        status: 'in stock'
      },
      {
        id: '6',
        name: 'Roller Shade Fabric',
        quantity: 15,
        status: 'in stock'
      },
      {
        id: '7',
        name: 'Blackout Lining',
        quantity: 5,
        status: 'low stock'
      }
    ];

    return NextResponse.json(mockMaterials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // In a real app, this would save to the database
    const newMaterial: Material = {
      id: Date.now().toString(),
      name,
      quantity: parseInt(quantity.toString()),
      status
    };

    console.log('Creating new material:', newMaterial);

    return NextResponse.json({ 
      success: true, 
      material: newMaterial,
      message: 'Material created successfully' 
    });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}