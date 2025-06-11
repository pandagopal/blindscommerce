import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
};

interface ActivateParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: ActivateParams) {
  try {
    // Get session and verify user is vendor
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    const { status, notes = '' } = await request.json();
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!['draft', 'inactive', 'active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      await connection.beginTransaction();

      // Get vendor ID for current user
      const [vendorRows] = await connection.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Check if vendor owns this product
      const [vendorProductRows] = await connection.execute(
        'SELECT vp.*, p.name, p.slug FROM vendor_products vp JOIN products p ON vp.product_id = p.product_id WHERE vp.vendor_id = ? AND p.product_id = ?',
        [vendorId, productId]
      );

      if (!Array.isArray(vendorProductRows) || vendorProductRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Product not found in your catalog' }, { status: 404 });
      }

      const vendorProduct = vendorProductRows[0] as any;

      // Validate product status change
      const validTransitions: Record<string, string[]> = {
        'draft': ['active', 'inactive'],
        'inactive': ['active', 'suspended'],
        'active': ['inactive', 'suspended'],
        'suspended': ['inactive']
      };

      const currentStatus = vendorProduct.status;
      if (!validTransitions[currentStatus]?.includes(status)) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Cannot change status from ${currentStatus} to ${status}` },
          { status: 400 }
        );
      }

      // Additional validation for activation
      if (status === 'active') {
        // Check if product has required fields
        const validationErrors = [];

        if (!vendorProduct.vendor_price || vendorProduct.vendor_price <= 0) {
          validationErrors.push('Product must have a valid price');
        }

        if (!vendorProduct.vendor_description || vendorProduct.vendor_description.trim() === '') {
          validationErrors.push('Product must have a description');
        }

        // Check if product has at least one image
        const [imageRows] = await connection.execute(
          'SELECT COUNT(*) as image_count FROM product_images WHERE product_id = ?',
          [productId]
        );

        if (Array.isArray(imageRows) && (imageRows[0] as any).image_count === 0) {
          validationErrors.push('Product must have at least one image');
        }

        if (validationErrors.length > 0) {
          await connection.rollback();
          return NextResponse.json(
            { 
              error: 'Product validation failed', 
              validationErrors 
            },
            { status: 400 }
          );
        }
      }

      // Update vendor product status
      await connection.execute(
        'UPDATE vendor_products SET status = ?, updated_at = NOW() WHERE vendor_id = ? AND product_id = ?',
        [status, vendorId, productId]
      );

      // Update main product status if needed
      if (status === 'active') {
        await connection.execute(
          'UPDATE products SET status = ?, is_active = 1, updated_at = NOW() WHERE product_id = ?',
          [status, productId]
        );
      } else if (status === 'inactive' || status === 'suspended') {
        // Check if any other vendors have this product active
        const [activeVendorRows] = await connection.execute(
          'SELECT COUNT(*) as active_count FROM vendor_products WHERE product_id = ? AND status = "active" AND vendor_id != ?',
          [productId, vendorId]
        );

        if (Array.isArray(activeVendorRows) && (activeVendorRows[0] as any).active_count === 0) {
          // No other vendors have it active, so deactivate main product
          await connection.execute(
            'UPDATE products SET status = ?, is_active = 0, updated_at = NOW() WHERE product_id = ?',
            [status, productId]
          );
        }
      }

      // Log status change activity
      await connection.execute(
        `INSERT INTO product_status_log (
          product_id, vendor_id, changed_by, old_status, new_status, 
          change_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [productId, vendorId, session.user.id, currentStatus, status, notes]
      );

      await connection.commit();

      // Return success response
      return NextResponse.json({
        success: true,
        message: `Product status changed to ${status}`,
        product: {
          productId: productId,
          name: vendorProduct.name,
          slug: vendorProduct.slug,
          oldStatus: currentStatus,
          newStatus: status,
          updatedAt: new Date().toISOString()
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Product activation error:', error);
    return NextResponse.json(
      { error: 'Failed to update product status' },
      { status: 500 }
    );
  }
}

// Get product status and activation history
export async function GET(request: NextRequest, { params }: ActivateParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    const connection = await mysql.createConnection(dbConfig);

    try {
      // Get vendor ID for current user
      const [vendorRows] = await connection.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Get current product status
      const [productRows] = await connection.execute(
        `SELECT vp.status, vp.vendor_price, vp.vendor_description, 
                p.name, p.slug, p.base_price, vp.updated_at,
                (SELECT COUNT(*) FROM product_images WHERE product_id = p.product_id) as image_count
         FROM vendor_products vp 
         JOIN products p ON vp.product_id = p.product_id 
         WHERE vp.vendor_id = ? AND p.product_id = ?`,
        [vendorId, productId]
      );

      if (!Array.isArray(productRows) || productRows.length === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const product = productRows[0] as any;

      // Get status change history
      const [historyRows] = await connection.execute(
        `SELECT psl.*, u.username as changed_by_username
         FROM product_status_log psl
         LEFT JOIN users u ON psl.changed_by = u.user_id
         WHERE psl.product_id = ? AND psl.vendor_id = ?
         ORDER BY psl.created_at DESC
         LIMIT 10`,
        [productId, vendorId]
      );

      // Calculate validation status for activation
      const validationChecks = {
        hasPrice: product.vendor_price && product.vendor_price > 0,
        hasDescription: product.vendor_description && product.vendor_description.trim() !== '',
        hasImages: product.image_count > 0
      };

      const canActivate = Object.values(validationChecks).every(check => check === true);

      return NextResponse.json({
        product: {
          productId: productId,
          name: product.name,
          slug: product.slug,
          status: product.status,
          price: product.vendor_price,
          description: product.vendor_description,
          imageCount: product.image_count,
          updatedAt: product.updated_at
        },
        validation: {
          canActivate,
          checks: validationChecks
        },
        statusHistory: historyRows
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Get product status error:', error);
    return NextResponse.json(
      { error: 'Failed to get product status' },
      { status: 500 }
    );
  }
}