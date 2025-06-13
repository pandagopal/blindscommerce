import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/vendor/products/[id] - Get single product for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const productId = parseInt(id);
    
    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const pool = await getPool();

    // Get vendor info
    const [vendorInfo] = await pool.query<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (!vendorInfo.length) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Get product data with vendor-specific info
    const [productRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.short_description,
        p.full_description,
        p.base_price,
        p.category_id,
        p.primary_image_url,
        p.status,
        vp.vendor_price,
        vp.quantity_available,
        vp.vendor_description,
        vp.is_active as vendor_active,
        c.name as category_name
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE vp.vendor_id = ? AND p.product_id = ?`,
      [vendorId, productId]
    );

    if (!productRows.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productRows[0];

    // Get product images
    const [imageRows] = await pool.query<RowDataPacket[]>(
      'SELECT image_url, display_order FROM product_images WHERE product_id = ? ORDER BY display_order',
      [productId]
    );

    // Get product options from the options API endpoint structure
    const [optionsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pov.value_id,
        pov.value_name,
        pov.value_data,
        pov.price_modifier,
        pov.is_default,
        pov.display_order,
        po.option_id,
        po.option_name,
        po.option_type,
        po.is_required
       FROM product_options po
       LEFT JOIN product_option_values pov ON po.option_id = pov.option_id
       WHERE po.product_id = ?
       ORDER BY po.option_id, pov.display_order`,
      [productId]
    );

    // Get pricing matrix data
    const [pricingRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM product_pricing_matrix WHERE product_id = ? AND is_active = 1 ORDER BY width_min, height_min',
      [productId]
    );

    // Get fabric options
    const [fabricRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM product_fabric_options WHERE product_id = ?',
      [productId]
    );

    // Get dimension data if exists
    const [dimensionRows] = await pool.query<RowDataPacket[]>(
      `SELECT pd.*, dt.name as dimension_name 
       FROM product_dimensions pd
       JOIN dimension_types dt ON pd.dimension_type_id = dt.dimension_type_id
       WHERE pd.product_id = ?`,
      [productId]
    );

    // Process dimension data
    let dimensions = {
      minWidth: 12,
      maxWidth: 96,
      minHeight: 12,
      maxHeight: 120,
      widthIncrement: 0.125,
      heightIncrement: 0.125
    };

    dimensionRows.forEach(row => {
      if (row.dimension_name === 'Width') {
        dimensions.minWidth = parseFloat(row.min_value) || 12;
        dimensions.maxWidth = parseFloat(row.max_value) || 96;
        dimensions.widthIncrement = parseFloat(row.increment_value) || 0.125;
      } else if (row.dimension_name === 'Height') {
        dimensions.minHeight = parseFloat(row.min_value) || 12;
        dimensions.maxHeight = parseFloat(row.max_value) || 120;
        dimensions.heightIncrement = parseFloat(row.increment_value) || 0.125;
      }
    });

    // Format options data from rows into the expected structure
    const formattedOptions = {
      dimensions: dimensions,
      mountTypes: [],
      controlTypes: {
        liftSystems: [],
        wandSystem: [],
        stringSystem: [],
        remoteControl: []
      },
      valanceOptions: [],
      bottomRailOptions: []
    };

    // Group options by type
    optionsRows.forEach(row => {
      if (!row.value_name) return; // Skip if no value_name (happens when no option values exist)
      
      const option = {
        name: row.value_name,
        price_adjustment: parseFloat(row.price_modifier) || 0,
        enabled: true, // Default to enabled since there's no is_available column
        description: ''
      };

      // Categorize based on option_name
      if (row.option_name === 'mountTypes') {
        formattedOptions.mountTypes.push(option);
      } else if (row.option_name === 'valanceOptions') {
        formattedOptions.valanceOptions.push(option);
      } else if (row.option_name === 'bottomRailOptions') {
        formattedOptions.bottomRailOptions.push(option);
      } else if (row.option_name.startsWith('controlTypes_')) {
        const subcategory = row.option_name.split('_')[1];
        if (formattedOptions.controlTypes[subcategory]) {
          formattedOptions.controlTypes[subcategory].push(option);
        }
      }
    });

    // Format response
    const formattedProduct = {
      product_id: product.product_id,
      name: product.name,
      slug: product.slug,
      short_description: product.short_description,
      full_description: product.full_description,
      base_price: parseFloat(product.base_price.toString()),
      vendor_price: parseFloat(product.vendor_price.toString()),
      category_id: product.category_id,
      category_name: product.category_name,
      primary_image_url: product.primary_image_url,
      status: product.status,
      vendor_active: Boolean(product.vendor_active),
      quantity_available: product.quantity_available,
      vendor_description: product.vendor_description,
      images: [
        ...(product.primary_image_url ? [product.primary_image_url] : []),
        ...imageRows.map(img => img.image_url)
      ],
      options: optionsRows.length > 0 ? formattedOptions : null,
      pricing_matrix: pricingRows,
      fabric_options: fabricRows
    };

    return NextResponse.json({ 
      success: true, 
      product: formattedProduct 
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/vendor/products/[id] - Update existing product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const productId = parseInt(id);
    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      base_price,
      category_id,
      images,
      options,
      pricing_matrix,
      fabric
    } = body;

    const pool = await getPool();

    // Get vendor info
    const [vendorInfo] = await pool.query<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (!vendorInfo.length) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Verify vendor owns this product
    const [ownershipCheck] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
      [vendorId, productId]
    );

    if (!ownershipCheck.length) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    // Update product
    await pool.query(
      `UPDATE products SET 
        name = ?, 
        full_description = ?, 
        base_price = ?, 
        category_id = ?,
        primary_image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?`,
      [
        name,
        description,
        base_price,
        category_id,
        images && images.length > 0 ? images[0] : null,
        productId
      ]
    );

    // Update vendor_products
    await pool.query(
      `UPDATE vendor_products SET 
        vendor_price = ?, 
        vendor_description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE vendor_id = ? AND product_id = ?`,
      [base_price, description, vendorId, productId]
    );

    // Update pricing matrix if provided
    if (pricing_matrix && Array.isArray(pricing_matrix)) {
      // Delete existing pricing matrix entries
      await pool.query(
        'DELETE FROM product_pricing_matrix WHERE product_id = ?',
        [productId]
      );

      // Insert new pricing matrix entries
      for (const entry of pricing_matrix) {
        if (entry && entry.base_price > 0) {
          await pool.query(
            `INSERT INTO product_pricing_matrix 
             (product_id, width_min, width_max, height_min, height_max, base_price, price_per_sqft, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              entry.width_min || entry.minWidth,
              entry.width_max || entry.maxWidth,
              entry.height_min || entry.minHeight,
              entry.height_max || entry.maxHeight,
              entry.base_price,
              entry.price_per_sqft || 0,
              entry.is_active !== undefined ? entry.is_active : 1
            ]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}