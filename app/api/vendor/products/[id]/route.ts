import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/vendor/products/[id] - Get single product for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 });
    }

    const productId = parseInt(id);
    
    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const pool = await getPool();

    let vendorId = null;
    
    // For vendors, get their vendor info
    if (user.role === 'vendor') {
      const [vendorInfo] = await pool.query<RowDataPacket[]>(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [user.userId]
      );

      if (!vendorInfo.length) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
      }

      vendorId = vendorInfo[0].vendor_info_id;
    }

    // Get product data (admin can see any product, vendor only their own)
    let productQuery, queryParams;
    
    if (user.role === 'admin') {
      // Admin can access any product
      productQuery = `SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.full_description,
        p.base_price,
        p.brand_id,
        p.primary_image_url,
        p.status,
        p.is_active,
        p.is_featured,
        b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      WHERE p.product_id = ?`;
      queryParams = [productId];
    } else {
      // Vendor can only access their own products
      productQuery = `SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.full_description,
        p.base_price,
        p.brand_id,
        p.primary_image_url,
        p.status,
        p.is_active,
        p.is_featured,
        vp.vendor_price,
        vp.quantity_available,
        vp.vendor_description,
        vp.is_active as vendor_active,
        b.name as brand_name
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      WHERE vp.vendor_id = ? AND p.product_id = ?`;
      queryParams = [vendorId, productId];
    }

    const [productRows] = await pool.query<RowDataPacket[]>(productQuery, queryParams);

    if (!productRows.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productRows[0];

    // Get all categories for this product from product_categories junction table
    const [categoryRows] = await pool.query<RowDataPacket[]>(
      `SELECT c.category_id, c.name as category_name, pc.is_primary
       FROM product_categories pc
       JOIN categories c ON pc.category_id = c.category_id
       WHERE pc.product_id = ?
       ORDER BY pc.is_primary DESC, c.name ASC`,
      [productId]
    );

    // Get product images
    const [imageRows] = await pool.query<RowDataPacket[]>(
      'SELECT image_url, display_order FROM product_images WHERE product_id = ? ORDER BY display_order',
      [productId]
    );

    // Get pricing matrix data
    const [pricingRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM product_pricing_matrix WHERE product_id = ? AND is_active = 1 ORDER BY width_min, height_min',
      [productId]
    );

    // Get fabric options with pricing and images
    const [fabricRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pfo.fabric_option_id,
        pfo.fabric_type,
        pfo.fabric_name,
        pfo.is_enabled,
        pfo.description
      FROM product_fabric_options pfo
      WHERE pfo.product_id = ?`,
      [productId]
    );

    // Get fabric pricing for each fabric option
    const [fabricPricingRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pfp.fabric_option_id,
        pfp.min_width,
        pfp.max_width,
        pfp.price_per_sqft
      FROM product_fabric_pricing pfp
      JOIN product_fabric_options pfo ON pfp.fabric_option_id = pfo.fabric_option_id
      WHERE pfo.product_id = ?
      ORDER BY pfp.min_width`,
      [productId]
    );

    // Get fabric images
    const [fabricImageRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pfi.fabric_option_id,
        pfi.image_url,
        pfi.display_order,
        pfi.is_primary
      FROM product_fabric_images pfi
      JOIN product_fabric_options pfo ON pfi.fabric_option_id = pfo.fabric_option_id
      WHERE pfo.product_id = ?
      ORDER BY pfi.fabric_option_id, pfi.display_order`,
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

    // Parse options from products table direct columns
    console.log('=== DEBUGGING OPTIONS PARSING ===');
    console.log('Raw product.mount_types:', product.mount_types);
    console.log('Raw product.control_types:', product.control_types);
    console.log('Type of mount_types:', typeof product.mount_types);
    console.log('Type of control_types:', typeof product.control_types);

    // Parse mount types from comma-separated string
    if (product.mount_types) {
      console.log('Processing mount_types...');
      const mountTypes = product.mount_types.split(',').filter(mt => mt.trim());
      console.log('Parsed mount types:', mountTypes);
      formattedOptions.mountTypes = mountTypes.map(name => ({
        name: name.trim(),
        price_adjustment: 0,
        enabled: true,
        description: ''
      }));
      console.log('Formatted mount types:', formattedOptions.mountTypes);
    }

    // Parse control types from semicolon and colon separated string
    if (product.control_types) {
      console.log('Processing control_types...');
      const controlGroups = product.control_types.split(';').filter(cg => cg.trim());
      console.log('Control groups:', controlGroups);
      controlGroups.forEach(group => {
        const items = group.split(',').filter(item => item.trim());
        console.log('Group items:', items);
        items.forEach(item => {
          if (item.includes(':')) {
            const [subcategory, name] = item.split(':');
            const cleanSubcategory = subcategory.trim();
            const cleanName = name.trim();
            console.log(`Adding to ${cleanSubcategory}: ${cleanName}`);
            
            if (formattedOptions.controlTypes[cleanSubcategory]) {
              formattedOptions.controlTypes[cleanSubcategory].push({
                name: cleanName,
                price_adjustment: 0,
                enabled: true,
                description: ''
              });
            }
          }
        });
      });
    }

    console.log('Final formatted options:', JSON.stringify(formattedOptions, null, 2));
    console.log('=== END DEBUGGING ===');

    // Format fabric data
    const formatFabricData = () => {
      const fabricData = {
        coloredFabric: [],
        sheerFabric: [],
        blackoutFabric: []
      };

      fabricRows.forEach(fabric => {
        // Get pricing matrix for this fabric
        const fabricPricing = fabricPricingRows.filter(p => p.fabric_option_id === fabric.fabric_option_id);
        const priceMatrix = fabricPricing.map(p => ({
          widthRange: `${p.min_width}" - ${p.max_width}"`,
          minWidth: parseFloat(p.min_width),
          maxWidth: parseFloat(p.max_width),
          pricePerSqft: parseFloat(p.price_per_sqft)
        }));

        // Get images for this fabric
        const fabricImages = fabricImageRows
          .filter(img => img.fabric_option_id === fabric.fabric_option_id)
          .map(img => ({
            id: `img_${img.fabric_option_id}_${img.display_order}`,
            url: img.image_url,
            name: `Image ${img.display_order}`
          }));

        const fabricOption = {
          id: `fabric_${fabric.fabric_option_id}`,
          name: fabric.fabric_name || '',
          images: fabricImages,
          enabled: Boolean(fabric.is_enabled),
          priceMatrix: priceMatrix.length > 0 ? priceMatrix : generateDefaultPriceMatrix(),
          description: fabric.description || ''
        };

        // Categorize by fabric type
        if (fabric.fabric_type === 'coloredFabric') {
          fabricData.coloredFabric.push(fabricOption);
        } else if (fabric.fabric_type === 'sheerFabric') {
          fabricData.sheerFabric.push(fabricOption);
        } else if (fabric.fabric_type === 'blackoutFabric') {
          fabricData.blackoutFabric.push(fabricOption);
        }
      });

      return fabricData;
    };

    // Generate default price matrix (matches Fabric component logic)
    const generateDefaultPriceMatrix = () => {
      const ranges = [];
      for (let i = 10; i <= 118; i += 10) {
        const minWidth = i - 9;
        const maxWidth = i;
        ranges.push({
          widthRange: `${minWidth}" - ${maxWidth}"`,
          minWidth,
          maxWidth,
          pricePerSqft: 0.00
        });
      }
      return ranges;
    };

    // Format categories data
    const allCategories = categoryRows.map(row => row.category_name);
    const primaryCategory = categoryRows.find(row => row.is_primary)?.category_name || 
                           (categoryRows.length > 0 ? categoryRows[0].category_name : '');

    // Format response
    const formattedProduct = {
      product_id: product.product_id,
      name: product.name,
      slug: product.slug,
      sku: product.sku || '',
      short_description: product.short_description,
      full_description: product.full_description,
      base_price: parseFloat(product.base_price.toString()),
      brand_id: product.brand_id,
      brand_name: product.brand_name,
      
      // Categories - properly formatted for form
      categories: allCategories,
      primary_category: primaryCategory,
      category_count: categoryRows.length,
      
      primary_image_url: product.primary_image_url,
      status: product.status,
      is_active: Boolean(product.is_active),
      is_featured: Boolean(product.is_featured),
      // Vendor-specific fields (only present for vendor queries)
      ...(user.role === 'vendor' && {
        vendor_id: vendorId.toString(),
      }),
      ...(product.vendor_price && {
        vendor_price: parseFloat(product.vendor_price.toString()),
        vendor_active: Boolean(product.vendor_active),
        quantity_available: product.quantity_available,
        vendor_description: product.vendor_description,
      }),
      images: [
        ...(product.primary_image_url ? [product.primary_image_url] : []),
        ...imageRows.map(img => img.image_url)
      ],
      options: formattedOptions,
      pricing_matrix: pricingRows,
      fabric_options: formatFabricData()
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
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 });
    }

    const productId = parseInt(id);
    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      sku,
      short_description,
      description,
      base_price,
      vendor_id,
      is_active,
      is_featured,
      categories,
      primary_category,
      brand,
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

    // Handle categories mapping - update product_categories junction table
    if (categories && Array.isArray(categories)) {
      // First, delete existing category relationships
      await pool.query(
        'DELETE FROM product_categories WHERE product_id = ?',
        [productId]
      );

      // Then, insert new category relationships
      for (const categoryName of categories) {
        const [categoryRows] = await pool.query<RowDataPacket[]>(
          'SELECT category_id FROM categories WHERE name = ?',
          [categoryName]
        );
        
        if (categoryRows.length > 0) {
          const categoryId = categoryRows[0].category_id;
          const isPrimary = categoryName === primary_category ? 1 : 0;
          
          await pool.query(
            'INSERT INTO product_categories (product_id, category_id, is_primary, created_at) VALUES (?, ?, ?, NOW())',
            [productId, categoryId, isPrimary]
          );
        }
      }
    }

    // Handle brand mapping - find or create brand
    let brandId = null;
    if (brand && brand.trim()) {
      const [brandRows] = await pool.query<RowDataPacket[]>(
        'SELECT brand_id FROM brands WHERE name = ?',
        [brand.trim()]
      );
      if (brandRows.length > 0) {
        brandId = brandRows[0].brand_id;
      } else {
        // Create new brand if it doesn't exist
        const brandSlug = brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const [brandResult] = await pool.query<ResultSetHeader>(
          'INSERT INTO brands (name, slug, is_active, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
          [brand.trim(), brandSlug]
        );
        brandId = brandResult.insertId;
      }
    }

    // Update product
    await pool.query(
      `UPDATE products SET 
        name = ?, 
        slug = ?,
        sku = ?,
        short_description = ?,
        full_description = ?, 
        base_price = ?, 
        brand_id = ?,
        is_active = ?,
        is_featured = ?,
        primary_image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?`,
      [
        name,
        slug,
        sku,
        short_description,
        description,
        base_price,
        brandId,
        is_active,
        is_featured,
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

    // Handle options data update - save directly to products table
    if (options && typeof options === 'object') {
      console.log('Saving options data:', JSON.stringify(options, null, 2));
      
      // Save dimensions if provided
      if (options.dimensions) {
        const dims = options.dimensions;
        
        // Delete existing dimensions first
        await pool.query(
          'DELETE FROM product_dimensions WHERE product_id = ?',
          [productId]
        );
        
        // Insert width dimension
        await pool.query(
          `INSERT INTO product_dimensions (product_id, dimension_type_id, min_value, max_value, increment_value, created_at)
           SELECT ?, dt.dimension_type_id, ?, ?, ?, NOW()
           FROM dimension_types dt WHERE dt.name = 'Width'`,
          [productId, dims.minWidth || 12, dims.maxWidth || 96, dims.widthIncrement || 0.125]
        );

        // Insert height dimension
        await pool.query(
          `INSERT INTO product_dimensions (product_id, dimension_type_id, min_value, max_value, increment_value, created_at)
           SELECT ?, dt.dimension_type_id, ?, ?, ?, NOW()
           FROM dimension_types dt WHERE dt.name = 'Height'`,
          [productId, dims.minHeight || 12, dims.maxHeight || 120, dims.heightIncrement || 0.125]
        );
      }

      // Prepare options data for direct storage in products table
      const mountTypesData = options.mountTypes ? 
        options.mountTypes.filter(mt => mt.enabled).map(mt => mt.name).join(',') : '';
      
      const controlTypesData = options.controlTypes ? 
        Object.entries(options.controlTypes)
          .filter(([key, values]) => Array.isArray(values) && values.length > 0)
          .map(([key, values]) => 
            values.filter(v => v.enabled).map(v => `${key}:${v.name}`).join(',')
          )
          .filter(str => str.length > 0)
          .join(';') : '';

      // Update products table with options data
      console.log('=== DEBUGGING OPTIONS SAVING ===');
      console.log('Original options object:', JSON.stringify(options, null, 2));
      console.log('Processed mount_types string:', mountTypesData);
      console.log('Processed control_types string:', controlTypesData);
      
      await pool.query(
        'UPDATE products SET mount_types = ?, control_types = ?, updated_at = NOW() WHERE product_id = ?',
        [mountTypesData, controlTypesData, productId]
      );
      
      console.log('Options data saved to products table');
    }

    // Handle fabric data update if provided
    if (fabric && typeof fabric === 'object') {
      console.log('Saving fabric data:', JSON.stringify(fabric, null, 2));
      
      // Delete existing fabric data
      await pool.query('DELETE FROM product_fabric_options WHERE product_id = ?', [productId]);
      
      // Save fabric options
      const fabricCategories = ['coloredFabric', 'sheerFabric', 'blackoutFabric'];
      
      for (const fabricType of fabricCategories) {
        if (fabric[fabricType] && Array.isArray(fabric[fabricType])) {
          for (const fabricOption of fabric[fabricType]) {
            if (fabricOption.enabled && fabricOption.name) {
              const [fabricResult] = await pool.query<ResultSetHeader>(
                `INSERT INTO product_fabric_options 
                 (product_id, fabric_type, fabric_name, is_enabled, description, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [productId, fabricType, fabricOption.name, fabricOption.enabled, fabricOption.description || '']
              );
              
              const fabricOptionId = fabricResult.insertId;
              
              // Save fabric images if any
              if (fabricOption.images && Array.isArray(fabricOption.images)) {
                for (let i = 0; i < fabricOption.images.length; i++) {
                  const image = fabricOption.images[i];
                  if (image.url) {
                    await pool.query(
                      `INSERT INTO product_fabric_images 
                       (fabric_option_id, product_id, image_url, image_name, display_order, created_at)
                       VALUES (?, ?, ?, ?, ?, NOW())`,
                      [fabricOptionId, productId, image.url, image.name || '', i]
                    );
                  }
                }
              }
              
              // Save fabric pricing if any
              if (fabricOption.priceMatrix && Array.isArray(fabricOption.priceMatrix)) {
                for (let i = 0; i < fabricOption.priceMatrix.length; i++) {
                  const priceRange = fabricOption.priceMatrix[i];
                  if (priceRange.minWidth && priceRange.maxWidth) {
                    await pool.query(
                      `INSERT INTO product_fabric_pricing 
                       (fabric_option_id, product_id, min_width, max_width, price_per_sqft, display_order, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                      [
                        fabricOptionId, 
                        productId, 
                        priceRange.minWidth, 
                        priceRange.maxWidth, 
                        priceRange.pricePerSqft || 0, 
                        i
                      ]
                    );
                  }
                }
              }
            }
          }
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

// PATCH /api/vendor/products/[id] - Toggle product status (activate/deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 });
    }

    const productId = parseInt(id);
    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean value' }, { status: 400 });
    }

    const pool = await getPool();

    // For vendors, check ownership first
    if (user.role === 'vendor') {
      // Get vendor info
      const [vendorInfo] = await pool.query<RowDataPacket[]>(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [user.userId]
      );

      if (!vendorInfo.length) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
      }

      const vendorId = vendorInfo[0].vendor_info_id;

      // Check if vendor owns this product
      const [ownershipCheck] = await pool.query<RowDataPacket[]>(
        'SELECT 1 FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
        [vendorId, productId]
      );

      if (!ownershipCheck.length) {
        return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
      }

      // Update vendor_products status
      await pool.query(
        'UPDATE vendor_products SET is_active = ?, updated_at = NOW() WHERE vendor_id = ? AND product_id = ?',
        [is_active, vendorId, productId]
      );
    }

    // Update main product status (for both admin and vendor)
    await pool.query(
      'UPDATE products SET is_active = ?, updated_at = NOW() WHERE product_id = ?',
      [is_active, productId]
    );

    return NextResponse.json({
      success: true,
      message: `Product ${is_active ? 'activated' : 'deactivated'} successfully`,
      is_active: is_active
    });

  } catch (error) {
    console.error('Error updating product status:', error);
    return NextResponse.json(
      { error: 'Failed to update product status' },
      { status: 500 }
    );
  }
}

// DELETE /api/vendor/products/[id] - Delete product (vendors can only delete if no transactions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser();
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 });
    }

    const productId = parseInt(id);
    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const pool = await getPool();

    // For vendors, check ownership and transactions
    if (user.role === 'vendor') {
      // Get vendor info
      const [vendorInfo] = await pool.query<RowDataPacket[]>(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [user.userId]
      );

      if (!vendorInfo.length) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
      }

      const vendorId = vendorInfo[0].vendor_info_id;

      // Check if vendor owns this product
      const [ownershipCheck] = await pool.query<RowDataPacket[]>(
        'SELECT 1 FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
        [vendorId, productId]
      );

      if (!ownershipCheck.length) {
        return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
      }

      // Check for transactions (orders containing this product)
      const [transactionCheck] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM order_items oi 
         JOIN orders o ON oi.order_id = o.order_id 
         WHERE oi.product_id = ? AND o.vendor_id = ? 
         LIMIT 1`,
        [productId, vendorId]
      );

      if (transactionCheck.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete product with existing transactions. You can deactivate it instead.' 
        }, { status: 400 });
      }

      // Delete vendor-product relationship first
      await pool.query(
        'DELETE FROM vendor_products WHERE vendor_id = ? AND product_id = ?',
        [vendorId, productId]
      );
    }

    // For admin or if no transactions, allow deletion
    // Delete related records first
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM product_pricing_matrix WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM product_fabric_options WHERE product_id = ?', [productId]);
    
    // Finally delete the product
    await pool.query('DELETE FROM products WHERE product_id = ?', [productId]);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}