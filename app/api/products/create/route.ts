import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  let connection;
  try {
    const user = await getCurrentUser();
    if (!user || !['admin', 'vendor'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { basicInfo, options, images = [], features = [] } = body;
    
    const {
      name,
      slug,
      shortDescription,
      fullDescription,
      sku,
      basePrice,
      vendorId, // Only used when admin creates product
      isActive = true,
      isFeatured = false,
      categories = [],
      primaryCategory
    } = basicInfo;

    const pool = await getPool();
    connection = await pool.getConnection();
    await connection.query('START TRANSACTION');

    try {
      // Use provided slug or generate from name as fallback
      let finalSlug = slug ;// || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Check if slug exists and make it unique
      let slugCounter = 0;
      let originalSlug = finalSlug;
      while (true) {
        const [existingProduct] = await connection.query(
          'SELECT product_id FROM products WHERE slug = ? LIMIT 1',
          [finalSlug]
        );
        
        if (existingProduct.length === 0) {
          break; // Slug is unique
        }
        
        slugCounter++;
        finalSlug = `${originalSlug}-${slugCounter}`;
      }

      // Insert the product
      const [productResult] = await connection.query(
        `INSERT INTO products (
          name,
          slug,
          short_description,
          full_description,
          sku,
          base_price,
          stock_status,
          status,
          is_active,
          is_featured,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'in_stock', 'active', ?, ?, NOW(), NOW())`,
        [name, finalSlug, shortDescription, fullDescription || '', sku, basePrice, isActive, isFeatured]
      );

      const productId = productResult.insertId;

      // Handle multiple categories
      if (categories && categories.length > 0) {
        // Fetch category IDs for all selected categories
        const placeholders = categories.map(() => '?').join(',');
        const [categoryRows] = await connection.query(
          `SELECT category_id, name FROM categories WHERE name IN (${placeholders})`,
          categories
        );

        // Create a map of category names to IDs
        const categoryMap = new Map();
        categoryRows.forEach(row => {
          categoryMap.set(row.name, row.category_id);
        });

        // Insert product-category relationships
        for (const categoryName of categories) {
          const categoryId = categoryMap.get(categoryName);
          if (categoryId) {
            const isPrimary = categoryName === primaryCategory ? 1 : 0;
            await connection.query(
              `INSERT INTO product_categories (
                product_id,
                category_id,
                is_primary,
                created_at
              ) VALUES (?, ?, ?, NOW())`,
              [productId, categoryId, isPrimary]
            );
          }
        }
      }

      // Handle vendor assignment based on user role
      let finalVendorId = null;
      
      if (user.role === 'admin') {
        // Admin can assign to specific vendor or leave as marketplace product
        if (vendorId && vendorId !== 'marketplace') {
          finalVendorId = vendorId;
        }
      } else if (user.role === 'vendor') {
        // Vendor always assigns to themselves - get their vendor_info_id
        const [vendorRows] = await connection.query(
          'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
          [user.id]
        );
        if (vendorRows.length > 0) {
          finalVendorId = vendorRows[0].vendor_info_id;
        }
      }

      // Create vendor-product relationship if vendor is assigned
      if (finalVendorId) {
        await connection.query(
          `INSERT INTO vendor_products (
            vendor_id,
            product_id,
            vendor_sku,
            vendor_price,
            quantity_available,
            minimum_order_qty,
            lead_time_days,
            is_active,
            status,
            vendor_description,
            vendor_notes,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, 100, 1, 7, 1, 'active', ?, ?, NOW(), NOW())`,
          [
            finalVendorId,
            productId,
            `V${finalVendorId}-${sku}`,
            basePrice,
            `${name} - Available from vendor`,
            user.role === 'admin' ? 'Product created by admin' : 'Product created by vendor'
          ]
        );
      }

      // Insert product images if provided
      if (images.length > 0) {
        const imageQuery = `
          INSERT INTO product_images (
            product_id,
            image_url,
            alt_text,
            is_primary,
            display_order,
            created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `;

        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          await connection.query(imageQuery, [
            productId,
            image.url || image.image_url,
            image.alt || image.alt_text || name,
            i === 0 || image.isPrimary || image.is_primary, // First image is primary by default
            i + 1
          ]);
        }
      }

      // Insert product features if provided
      if (features.length > 0) {
        const featureQuery = `
          INSERT INTO product_features (
            product_id,
            feature_name,
            feature_value,
            description,
            created_at
          ) VALUES (?, ?, ?, ?, NOW())
        `;

        for (const feature of features) {
          await connection.query(featureQuery, [
            productId,
            feature.name || feature.feature_name,
            feature.value || feature.feature_value || '',
            feature.description || ''
          ]);
        }
      }

      await connection.query('COMMIT');

      // Determine success message
      let message = 'Product created successfully';
      let vendorAssigned = false;
      
      if (user.role === 'admin' && finalVendorId) {
        message = 'Product created and assigned to vendor successfully';
        vendorAssigned = true;
      } else if (user.role === 'vendor') {
        message = 'Product created and added to your catalog successfully';
        vendorAssigned = true;
      }

      return NextResponse.json({
        message,
        product_id: productId,
        vendor_assigned: vendorAssigned,
        created_by: user.role
      });

    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}