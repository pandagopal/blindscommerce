import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// GET /api/account/configurations - Get all saved configurations for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if we're in mock mode
    if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH === 'true') {
      // Return mock data for testing
      return NextResponse.json({
        success: true,
        configurations: [
          {
            id: 1,
            name: 'Living Room Blinds',
            product_id: 1,
            product_name: 'Premium Faux Wood Blinds',
            created_at: new Date().toISOString(),
            config: {
              width: 36.5,
              height: 48.25,
              colorId: 5,
              colorName: 'White',
              materialId: 1,
              materialName: 'Premium PVC',
              mountType: 1,
              mountTypeName: 'Inside Mount',
              controlType: 'Standard Cord',
              image: '/images/products/premium-faux-wood-blinds-main.jpg'
            }
          },
          {
            id: 2,
            name: 'Kitchen Window',
            product_id: 2,
            product_name: 'Premium 2.5-inch Faux Wood Blinds',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            config: {
              width: 42,
              height: 36,
              colorId: 8,
              colorName: 'Beige',
              materialId: 1,
              materialName: 'Premium PVC',
              mountType: 2,
              mountTypeName: 'Outside Mount',
              controlType: 'Cordless',
              image: '/images/products/premium-2-5-inch-faux-wood-blinds-main.jpg'
            }
          }
        ]
      });
    }

    // Query to get all saved configurations for the user
    const query = `
      SELECT
        sc.configuration_id as id,
        sc.name,
        sc.product_id,
        p.name as product_name,
        sc.created_at,
        sc.configuration_data as config
      FROM
        saved_configurations sc
      JOIN
        products p ON sc.product_id = p.product_id
      WHERE
        sc.user_id = ?
      ORDER BY
        sc.created_at DESC
    `;

    const pool = await getPool();
    const result = await pool.query(query, [user.userId]);

    return NextResponse.json({
      success: true,
      configurations: result.rows
    });
  } catch (error) {
    console.error('Error fetching saved configurations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve configurations' },
      { status: 500 }
    );
  }
}

// POST /api/account/configurations - Save a new configuration
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, name, configuration } = body;

    if (!productId || !name || !configuration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if we're in mock mode
    if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH === 'true') {
      // Return mock response for testing
      return NextResponse.json({
        success: true,
        configuration: {
          id: Math.floor(Math.random() * 1000) + 1,
          name,
          product_id: productId,
          product_name: 'Product Name', // This would be fetched from the database in reality
          created_at: new Date().toISOString(),
          config: configuration
        }
      });
    }

    // Insert the configuration into the database
    const query = `
      INSERT INTO saved_configurations (
        user_id,
        product_id,
        name,
        configuration_data
      )
      VALUES (?, ?, ?, ?)
      RETURNING
        configuration_id as id,
        name,
        product_id,
        created_at
    `;

    const values = [
      user.userId,
      productId,
      name,
      configuration
    ];

    const pool = await getPool();
    const result = await pool.query(query, values);

    // Get product name
    const productQuery = `SELECT name FROM products WHERE product_id = ?`;
    const productResult = await pool.query(productQuery, [productId]);
    const productName = productResult.rows[0]?.name || 'Unknown Product';

    const savedConfig = {
      ...result.rows[0],
      product_name: productName,
      config: configuration
    };

    return NextResponse.json({
      success: true,
      configuration: savedConfig
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/account/configurations?id=X - Delete a saved configuration
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const configId = searchParams.get('id');

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Check if we're in mock mode
    if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH === 'true') {
      // Return mock response for testing
      return NextResponse.json({
        success: true,
        message: 'Configuration deleted successfully'
      });
    }

    // Delete the configuration
    const deleteQuery = `DELETE FROM saved_configurations WHERE configuration_id = ? AND user_id = ?`;

    const pool = await getPool();
    const result = await pool.query(deleteQuery, [configId, user.userId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Configuration not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
}

