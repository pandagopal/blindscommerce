import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    // Get current user and verify user is vendor
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized - Vendor access required' }, { status: 401 });
    }

    const { productId, customizations = {} } = await request.json();
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get vendor ID for current user
      const [vendorRows] = await connection.execute<RowDataPacket[]>(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [user.userId]
      );

      if (vendorRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = vendorRows[0].vendor_info_id;

      // Get original product details
      const [productRows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM products WHERE product_id = ? AND is_active = 1`,
        [productId]
      );

      if (productRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Product not found or not active' }, { status: 404 });
      }

      const originalProduct = productRows[0];

      // Check if vendor already has this product
      const [existingVendorProduct] = await connection.execute<RowDataPacket[]>(
        'SELECT vendor_product_id FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
        [vendorId, productId]
      );

      if (existingVendorProduct.length > 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Product already exists in your catalog' }, { status: 409 });
      }

      // Create new product (cloned)
      const newProductName = customizations.name || `${originalProduct.name} - Copy`;
      const newProductSlug = customizations.slug || `${originalProduct.slug}-vendor-${vendorId}-${Date.now()}`;
      const newProductPrice = customizations.price || originalProduct.base_price;
      const newProductDescription = customizations.description || originalProduct.full_description;

      const [cloneResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO products (
          brand_id, name, slug, short_description, full_description, 
          base_price, is_featured, is_active, sku, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, NOW(), NOW())`,
        [
          originalProduct.brand_id,
          newProductName,
          newProductSlug,
          originalProduct.short_description,
          newProductDescription,
          newProductPrice,
          `${originalProduct.sku}-V${vendorId}-${Date.now()}`
        ]
      );

      const newProductId = cloneResult.insertId;

      // Create vendor-product relationship - also inactive by default
      await connection.execute(
        `INSERT INTO vendor_products (
          vendor_id, product_id, vendor_sku, vendor_price, 
          quantity_available, minimum_order_qty, lead_time_days,
          is_active, vendor_description, vendor_notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 10, 1, 7, 0, ?, 'Cloned product', NOW(), NOW())`,
        [
          vendorId,
          newProductId,
          `V${vendorId}-${newProductId}`,
          newProductPrice,
          customizations.vendorDescription || `${newProductName} - Available from our vendor`
        ]
      );

      // Copy product categories if they exist
      const [categoryRows] = await connection.execute<RowDataPacket[]>(
        'SELECT category_id FROM products WHERE product_id = ? AND category_id IS NOT NULL',
        [productId]
      );

      if (categoryRows.length > 0 && categoryRows[0].category_id) {
        await connection.execute(
          'UPDATE products SET category_id = ? WHERE product_id = ?',
          [categoryRows[0].category_id, newProductId]
        );
      }

      // Copy product images (if any)
      const [imageRows] = await connection.execute<RowDataPacket[]>(
        'SELECT image_url, display_order FROM product_images WHERE product_id = ?',
        [productId]
      );

      if (imageRows.length > 0) {
        for (const image of imageRows) {
          await connection.execute(
            'INSERT INTO product_images (product_id, image_url, display_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [newProductId, image.image_url, image.display_order]
          );
        }
      }

      // Copy pricing matrix if it exists
      const [pricingRows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM product_pricing_matrix WHERE product_id = ? AND is_active = 1',
        [productId]
      );

      if (pricingRows.length > 0) {
        for (const pricing of pricingRows) {
          await connection.execute(
            `INSERT INTO product_pricing_matrix 
             (product_id, width_min, width_max, height_min, height_max, base_price, price_per_sqft, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
              newProductId,
              pricing.width_min,
              pricing.width_max,
              pricing.height_min,
              pricing.height_max,
              pricing.base_price,
              pricing.price_per_sqft
            ]
          );
        }
      }

      await connection.commit();

      // Return success response with new product details
      return NextResponse.json({
        success: true,
        message: 'Product cloned successfully. The cloned product is inactive and can be activated once ready.',
        clonedProduct: {
          productId: newProductId,
          name: newProductName,
          slug: newProductSlug,
          price: newProductPrice,
          status: 'inactive'
        },
        originalProduct: {
          productId: originalProduct.product_id,
          name: originalProduct.name
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Product cloning error:', error);
    return NextResponse.json(
      { error: 'Failed to clone product' },
      { status: 500 }
    );
  }
}