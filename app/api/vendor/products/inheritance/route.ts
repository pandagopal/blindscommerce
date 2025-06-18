import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';

// GET - Get product inheritance relationships for vendor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const inheritanceType = searchParams.get('type');

    const pool = await getPool();

    try {
      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      let query = `
        SELECT pi.*, 
               pp.name as parent_name, pp.slug as parent_slug, pp.base_price as parent_price,
               cp.name as child_name, cp.slug as child_slug, cp.base_price as child_price,
               vp.vendor_price, vp.status as vendor_status
        FROM product_inheritance pi
        JOIN products pp ON pi.parent_product_id = pp.product_id
        JOIN products cp ON pi.child_product_id = cp.product_id
        LEFT JOIN vendor_products vp ON pi.child_product_id = vp.product_id AND vp.vendor_id = ?
        WHERE pi.vendor_id = ?
      `;
      
      const queryParams = [vendorId, vendorId];

      if (productId) {
        query += ' AND (pi.parent_product_id = ? OR pi.child_product_id = ?)';
        queryParams.push(productId, productId);
      }

      if (inheritanceType) {
        query += ' AND pi.inheritance_type = ?';
        queryParams.push(inheritanceType);
      }

      query += ' ORDER BY pi.created_at DESC';

      const [rows] = await pool.execute(query, queryParams);

      const inheritanceRelationships = Array.isArray(rows) ? rows.map((row: any) => ({
        inheritanceId: row.inheritance_id,
        parentProduct: {
          productId: row.parent_product_id,
          name: row.parent_name,
          slug: row.parent_slug,
          price: row.parent_price
        },
        childProduct: {
          productId: row.child_product_id,
          name: row.child_name,
          slug: row.child_slug,
          price: row.child_price,
          vendorPrice: row.vendor_price,
          status: row.vendor_status
        },
        inheritanceType: row.inheritance_type,
        inheritedFields: row.inherited_fields ? JSON.parse(row.inherited_fields) : null,
        customFields: row.custom_fields ? JSON.parse(row.custom_fields) : null,
        syncEnabled: row.sync_enabled,
        lastSyncedAt: row.last_synced_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) : [];

      return NextResponse.json({
        inheritanceRelationships,
        vendorId
      });

    } finally {
      }

  } catch (error) {
    console.error('Get inheritance error:', error);
    return NextResponse.json(
      { error: 'Failed to get inheritance relationships' },
      { status: 500 }
    );
  }
}

// POST - Create or update product inheritance relationship
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      parentProductId,
      childProductId,
      inheritanceType = 'clone',
      inheritedFields = {},
      customFields = {},
      syncEnabled = false
    } = await request.json();

    if (!parentProductId || !childProductId) {
      return NextResponse.json({ 
        error: 'Parent and child product IDs are required' 
      }, { status: 400 });
    }

    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Verify vendor owns the child product
      const [vendorProductRows] = await pool.execute(
        'SELECT vendor_product_id FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
        [vendorId, childProductId]
      );

      if (!Array.isArray(vendorProductRows) || vendorProductRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ 
          error: 'Child product not found in vendor catalog' 
        }, { status: 404 });
      }

      // Check if inheritance relationship already exists
      const [existingRows] = await pool.execute(
        'SELECT inheritance_id FROM product_inheritance WHERE child_product_id = ?',
        [childProductId]
      );

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        // Update existing relationship
        await pool.execute(
          `UPDATE product_inheritance SET
           parent_product_id = ?, inheritance_type = ?, inherited_fields = ?,
           custom_fields = ?, sync_enabled = ?, updated_at = NOW()
           WHERE child_product_id = ? AND vendor_id = ?`,
          [
            parentProductId,
            inheritanceType,
            JSON.stringify(inheritedFields),
            JSON.stringify(customFields),
            syncEnabled,
            childProductId,
            vendorId
          ]
        );

        // Commit handling needs review with pool

        return NextResponse.json({
          success: true,
          message: 'Inheritance relationship updated successfully',
          action: 'updated'
        });
      } else {
        // Create new inheritance relationship
        const [result] = await pool.execute(
          `INSERT INTO product_inheritance (
            parent_product_id, child_product_id, vendor_id,
            inheritance_type, inherited_fields, custom_fields,
            sync_enabled, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            parentProductId,
            childProductId,
            vendorId,
            inheritanceType,
            JSON.stringify(inheritedFields),
            JSON.stringify(customFields),
            syncEnabled
          ]
        );

        // Commit handling needs review with pool

        return NextResponse.json({
          success: true,
          message: 'Inheritance relationship created successfully',
          inheritanceId: (result as any).insertId,
          action: 'created'
        });
      }

    } finally {
      }

  } catch (error) {
    console.error('Create inheritance error:', error);
    return NextResponse.json(
      { error: 'Failed to create inheritance relationship' },
      { status: 500 }
    );
  }
}

// PUT - Sync child product with parent
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inheritanceId, fieldsToSync = [] } = await request.json();

    if (!inheritanceId) {
      return NextResponse.json({ 
        error: 'Inheritance ID is required' 
      }, { status: 400 });
    }

    const pool = await getPool();

    try {
      // Transaction handling with pool - consider using connection from pool

      // Get vendor ID for current user
      const [vendorRows] = await pool.execute(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [session.user.id]
      );

      if (!Array.isArray(vendorRows) || vendorRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ error: 'Vendor not found' }, { status: 403 });
      }

      const vendorId = (vendorRows[0] as any).vendor_info_id;

      // Get inheritance relationship
      const [inheritanceRows] = await pool.execute(
        `SELECT pi.*, pp.*, cp.product_id as child_id
         FROM product_inheritance pi
         JOIN products pp ON pi.parent_product_id = pp.product_id
         JOIN products cp ON pi.child_product_id = cp.product_id
         WHERE pi.inheritance_id = ? AND pi.vendor_id = ?`,
        [inheritanceId, vendorId]
      );

      if (!Array.isArray(inheritanceRows) || inheritanceRows.length === 0) {
        // Rollback handling needs review with pool
        return NextResponse.json({ 
          error: 'Inheritance relationship not found' 
        }, { status: 404 });
      }

      const inheritance = inheritanceRows[0] as any;
      const parentProduct = inheritance;
      const childProductId = inheritance.child_id;

      // Sync specific fields or all inherited fields
      const inheritedFields = inheritance.inherited_fields ? JSON.parse(inheritance.inherited_fields) : {};
      const syncFields = fieldsToSync.length > 0 ? fieldsToSync : Object.keys(inheritedFields).filter(key => inheritedFields[key]);

      const syncActions = [];

      for (const field of syncFields) {
        switch (field) {
          case 'name':
            if (inheritedFields.name) {
              await pool.execute(
                'UPDATE products SET name = ?, updated_at = NOW() WHERE product_id = ?',
                [parentProduct.name, childProductId]
              );
              syncActions.push('Updated product name');
            }
            break;

          case 'description':
            if (inheritedFields.description) {
              await pool.execute(
                'UPDATE products SET full_description = ?, short_description = ?, updated_at = NOW() WHERE product_id = ?',
                [parentProduct.full_description, parentProduct.short_description, childProductId]
              );
              syncActions.push('Updated product description');
            }
            break;

          case 'features':
            if (inheritedFields.features) {
              // Delete existing features
              await pool.execute(
                'DELETE FROM product_features WHERE product_id = ?',
                [childProductId]
              );
              
              // Copy features from parent
              const [featureRows] = await pool.execute(
                'SELECT feature_name, feature_value, description FROM product_features WHERE product_id = ?',
                [inheritance.parent_product_id]
              );

              if (Array.isArray(featureRows) && featureRows.length > 0) {
                for (const feature of featureRows) {
                  await pool.execute(
                    'INSERT INTO product_features (product_id, feature_name, feature_value, description, created_at) VALUES (?, ?, ?, ?, NOW())',
                    [childProductId, (feature as any).feature_name, (feature as any).feature_value, (feature as any).description]
                  );
                }
              }
              syncActions.push('Updated product features');
            }
            break;

          case 'categories':
            if (inheritedFields.categories) {
              // Delete existing categories
              await pool.execute(
                'DELETE FROM product_categories WHERE product_id = ?',
                [childProductId]
              );
              
              // Copy categories from parent
              const [categoryRows] = await pool.execute(
                'SELECT category_id, is_primary FROM product_categories WHERE product_id = ?',
                [inheritance.parent_product_id]
              );

              if (Array.isArray(categoryRows) && categoryRows.length > 0) {
                for (const category of categoryRows) {
                  await pool.execute(
                    'INSERT INTO product_categories (product_id, category_id, is_primary, created_at) VALUES (?, ?, ?, NOW())',
                    [childProductId, (category as any).category_id, (category as any).is_primary]
                  );
                }
              }
              syncActions.push('Updated product categories');
            }
            break;

          case 'specifications':
            if (inheritedFields.specifications) {
              // Delete existing specifications
              await pool.execute(
                'DELETE FROM product_specifications WHERE product_id = ?',
                [childProductId]
              );
              
              // Copy specifications from parent
              const [specRows] = await pool.execute(
                'SELECT spec_name, spec_value, spec_group FROM product_specifications WHERE product_id = ?',
                [inheritance.parent_product_id]
              );

              if (Array.isArray(specRows) && specRows.length > 0) {
                for (const spec of specRows) {
                  await pool.execute(
                    'INSERT INTO product_specifications (product_id, spec_name, spec_value, spec_group, created_at) VALUES (?, ?, ?, ?, NOW())',
                    [childProductId, (spec as any).spec_name, (spec as any).spec_value, (spec as any).spec_group]
                  );
                }
              }
              syncActions.push('Updated product specifications');
            }
            break;
        }
      }

      // Update last synced timestamp
      await pool.execute(
        'UPDATE product_inheritance SET last_synced_at = NOW(), updated_at = NOW() WHERE inheritance_id = ?',
        [inheritanceId]
      );

      // Commit handling needs review with pool

      return NextResponse.json({
        success: true,
        message: 'Product synced successfully',
        syncActions,
        syncedFields: syncFields,
        lastSyncedAt: new Date().toISOString()
      });

    } finally {
      }

  } catch (error) {
    console.error('Sync inheritance error:', error);
    return NextResponse.json(
      { error: 'Failed to sync product inheritance' },
      { status: 500 }
    );
  }
}