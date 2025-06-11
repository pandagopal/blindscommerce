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

export async function POST(request: NextRequest) {
  try {
    // Get session and verify user is vendor
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, customizations = {} } = await request.json();
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
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

      // Get original product details
      const [productRows] = await connection.execute(
        `SELECT * FROM products WHERE product_id = ? AND status = 'active'`,
        [productId]
      );

      if (!Array.isArray(productRows) || productRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Product not found or not active' }, { status: 404 });
      }

      const originalProduct = productRows[0] as any;

      // Check if vendor already has this product
      const [existingVendorProduct] = await connection.execute(
        'SELECT vendor_product_id FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
        [vendorId, productId]
      );

      if (Array.isArray(existingVendorProduct) && existingVendorProduct.length > 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Product already exists in your catalog' }, { status: 409 });
      }

      // Create new product (cloned)
      const newProductName = customizations.name || `${originalProduct.name} - Copy`;
      const newProductSlug = customizations.slug || `${originalProduct.slug}-vendor-${vendorId}-${Date.now()}`;
      const newProductPrice = customizations.price || originalProduct.base_price;
      const newProductDescription = customizations.description || originalProduct.full_description;

      const [cloneResult] = await connection.execute(
        `INSERT INTO products (
          brand_id, name, slug, short_description, full_description, 
          base_price, is_featured, is_active, status, stock_status, 
          sku, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 1, 'draft', 'in_stock', ?, NOW(), NOW())`,
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

      const newProductId = (cloneResult as any).insertId;

      // Create vendor-product relationship
      await connection.execute(
        `INSERT INTO vendor_products (
          vendor_id, product_id, vendor_sku, vendor_price, 
          quantity_available, minimum_order_qty, lead_time_days,
          is_active, status, vendor_description, vendor_notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 10, 1, 7, 1, 'draft', ?, 'Cloned product', NOW(), NOW())`,
        [
          vendorId,
          newProductId,
          `V${vendorId}-${newProductId}`,
          newProductPrice,
          customizations.vendorDescription || `${newProductName} - Available from our vendor`
        ]
      );

      // Copy product categories
      const [categoryRows] = await connection.execute(
        'SELECT category_id, is_primary FROM product_categories WHERE product_id = ?',
        [productId]
      );

      if (Array.isArray(categoryRows) && categoryRows.length > 0) {
        for (const category of categoryRows) {
          await connection.execute(
            'INSERT INTO product_categories (product_id, category_id, is_primary, created_at) VALUES (?, ?, ?, NOW())',
            [newProductId, (category as any).category_id, (category as any).is_primary]
          );
        }
      }

      // Copy product images (if any)
      const [imageRows] = await connection.execute(
        'SELECT image_url, alt_text, is_primary, display_order FROM product_images WHERE product_id = ?',
        [productId]
      );

      if (Array.isArray(imageRows) && imageRows.length > 0) {
        for (const image of imageRows) {
          await connection.execute(
            'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [newProductId, (image as any).image_url, (image as any).alt_text, (image as any).is_primary, (image as any).display_order]
          );
        }
      }

      // Copy product options (configurations)
      const [optionRows] = await connection.execute(
        'SELECT option_name, option_type, display_order, is_required FROM product_options WHERE product_id = ?',
        [productId]
      );

      if (Array.isArray(optionRows) && optionRows.length > 0) {
        for (const option of optionRows) {
          const [optionResult] = await connection.execute(
            'INSERT INTO product_options (product_id, option_name, option_type, display_order, is_required, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [newProductId, (option as any).option_name, (option as any).option_type, (option as any).display_order, (option as any).is_required]
          );

          const newOptionId = (optionResult as any).insertId;

          // Copy option values
          const [optionValueRows] = await connection.execute(
            'SELECT option_value, display_name, price_modifier, is_default FROM product_option_values WHERE option_id = ?',
            [(option as any).option_id]
          );

          if (Array.isArray(optionValueRows) && optionValueRows.length > 0) {
            for (const optionValue of optionValueRows) {
              await connection.execute(
                'INSERT INTO product_option_values (option_id, option_value, display_name, price_modifier, is_default, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [newOptionId, (optionValue as any).option_value, (optionValue as any).display_name, (optionValue as any).price_modifier, (optionValue as any).is_default]
              );
            }
          }
        }
      }

      // Copy product features
      const [featureRows] = await connection.execute(
        'SELECT feature_name, feature_value, description FROM product_features WHERE product_id = ?',
        [productId]
      );

      if (Array.isArray(featureRows) && featureRows.length > 0) {
        for (const feature of featureRows) {
          await connection.execute(
            'INSERT INTO product_features (product_id, feature_name, feature_value, description, created_at) VALUES (?, ?, ?, ?, NOW())',
            [newProductId, (feature as any).feature_name, (feature as any).feature_value, (feature as any).description]
          );
        }
      }

      // Create inheritance relationship
      await connection.execute(
        `INSERT INTO product_inheritance (
          parent_product_id, child_product_id, vendor_id, 
          inheritance_type, inherited_fields, custom_fields, 
          created_at, updated_at
        ) VALUES (?, ?, ?, 'clone', ?, ?, NOW(), NOW())`,
        [
          productId,
          newProductId,
          vendorId,
          JSON.stringify({
            name: false,
            slug: false,
            price: false,
            description: false,
            categories: true,
            options: true,
            features: true,
            images: true
          }),
          JSON.stringify(customizations)
        ]
      );

      // Log cloning activity
      await connection.execute(
        `INSERT INTO product_cloning_log (
          original_product_id, cloned_product_id, vendor_id, cloned_by,
          cloning_reason, customizations_made, cloning_status, created_at
        ) VALUES (?, ?, ?, ?, 'Product cloned for vendor catalog', ?, 'completed', NOW())`,
        [
          productId,
          newProductId,
          vendorId,
          session.user.id,
          JSON.stringify(customizations)
        ]
      );

      await connection.commit();

      // Return success response with new product details
      return NextResponse.json({
        success: true,
        message: 'Product cloned successfully',
        clonedProduct: {
          productId: newProductId,
          name: newProductName,
          slug: newProductSlug,
          price: newProductPrice,
          status: 'draft'
        },
        originalProduct: {
          productId: originalProduct.product_id,
          name: originalProduct.name
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Product cloning error:', error);
    return NextResponse.json(
      { error: 'Failed to clone product' },
      { status: 500 }
    );
  }
}