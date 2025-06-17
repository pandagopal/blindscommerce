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
        p.mount_types,
        p.control_types,
        p.custom_width_min,
        p.custom_width_max,
        p.custom_height_min,
        p.custom_height_max,
        p.headrail_id,
        p.bottom_rail_id,
        vi.business_name as brand_name
      FROM products p
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
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
        p.mount_types,
        p.control_types,
        p.custom_width_min,
        p.custom_width_max,
        p.custom_height_min,
        p.custom_height_max,
        p.headrail_id,
        p.bottom_rail_id,
        vp.vendor_price,
        vp.quantity_available,
        vp.vendor_description,
        vp.is_active as vendor_active,
        vi.business_name as brand_name
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
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

    // Process dimension data from products table columns
    let dimensions = {
      minWidth: product.custom_width_min ? parseFloat(product.custom_width_min.toString()) : 12,
      maxWidth: product.custom_width_max ? parseFloat(product.custom_width_max.toString()) : 96,
      minHeight: product.custom_height_min ? parseFloat(product.custom_height_min.toString()) : 12,
      maxHeight: product.custom_height_max ? parseFloat(product.custom_height_max.toString()) : 120,
      widthIncrement: 0.125,
      heightIncrement: 0.125
    };

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
    // Parse mount types from comma-separated string
    if (product.mount_types) {
      const mountTypes = product.mount_types.split(',').filter(mt => mt.trim());
      formattedOptions.mountTypes = mountTypes.map(name => ({
        name: name.trim(),
        price_adjustment: 0,
        enabled: true,
        description: ''
      }));
    }

    // Parse control types from semicolon and colon separated string
    if (product.control_types) {
      const controlGroups = product.control_types.split(';').filter(cg => cg.trim());
      controlGroups.forEach(group => {
        const items = group.split(',').filter(item => item.trim());
        items.forEach(item => {
          if (item.includes(':')) {
            const [subcategory, name] = item.split(':');
            const cleanSubcategory = subcategory.trim();
            const cleanName = name.trim();
            
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

    // Get headrail options
    const [allHeadrailOptions] = await pool.query<RowDataPacket[]>(
      'SELECT headrail_id, name, description FROM headrail_options WHERE is_active = 1',
      []
    );

    // Get bottom rail options  
    const [allBottomRailOptions] = await pool.query<RowDataPacket[]>(
      'SELECT bottom_rail_id, name, description FROM bottom_rail_options WHERE is_active = 1',
      []
    );

    // Add valance and bottom rail options to formattedOptions
    formattedOptions.valanceOptions = allHeadrailOptions.map(option => ({
      id: option.headrail_id,
      name: option.name,
      price_adjustment: 0,
      enabled: product.headrail_id === option.headrail_id,
      description: option.description || ''
    }));

    formattedOptions.bottomRailOptions = allBottomRailOptions.map(option => ({
      id: option.bottom_rail_id,
      name: option.name,
      price_adjustment: 0,
      enabled: product.bottom_rail_id === option.bottom_rail_id,
      description: option.description || ''
    }));

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

    // Get product features (with error handling)
    let featureRows = [];
    try {
      console.log('Querying features for product ID:', productId);
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT f.feature_id, f.name, f.description, f.icon
         FROM product_features pf
         JOIN features f ON pf.feature_id = f.feature_id
         WHERE pf.product_id = ?
         ORDER BY f.display_order, f.created_at`,
        [productId]
      );
      featureRows = rows;
      console.log('Features query result:', featureRows);
    } catch (featuresError) {
      console.error('Features query error:', featuresError);
      featureRows = []; // Continue with empty array if query fails
    }

    // Get room recommendations (with error handling)
    let roomRows = [];
    try {
      console.log('Querying rooms for product ID:', productId);
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT room_type, suitability_score, special_considerations 
         FROM product_rooms 
         WHERE product_id = ? 
         ORDER BY suitability_score DESC`,
        [productId]
      );
      roomRows = rows;
      console.log('Rooms query result:', roomRows);
    } catch (roomsError) {
      console.error('Rooms query error:', roomsError);
      roomRows = []; // Continue with empty array if query fails
    }

    // Format categories data
    const allCategories = categoryRows.map(row => row.category_name);
    const primaryCategory = categoryRows.find(row => row.is_primary)?.category_name || 
                           (categoryRows.length > 0 ? categoryRows[0].category_name : '');

    // Format features data
    const formattedFeatures = featureRows.map(feature => ({
      id: feature.feature_id.toString(),
      title: feature.name, // Fixed: use 'name' column from database
      description: feature.description,
      icon: feature.icon || ''
    }));

    // Format room recommendations data
    const formattedRoomRecommendations = roomRows.map((room, index) => ({
      id: `room_${room.room_type}_${index}`,
      roomType: room.room_type,
      recommendation: room.special_considerations || '',
      priority: room.suitability_score || 5
    }));

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
      fabric_options: formatFabricData(),
      features: formattedFeatures,
      roomRecommendations: formattedRoomRecommendations
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
    
    // DEBUG: Log the entire request body
    console.log('=== PUT REQUEST DEBUG ===');
    console.log('Full request body:', JSON.stringify(body, null, 2));
    console.log('Features in body:', body.features);
    console.log('RoomRecommendations in body:', body.roomRecommendations);
    console.log('========================');
    
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
      fabric,
      features,
      roomRecommendations
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

    // Note: brand_id is now deprecated, using vendor's business_name as brand

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
        null, // brand_id
        is_active,
        is_featured,
        images && images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0].url || null) : null,
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
      // Prepare dimension data
      let dimensionUpdates = {};
      if (options.dimensions) {
        const dims = options.dimensions;
        dimensionUpdates = {
          custom_width_min: dims.minWidth || 12,
          custom_width_max: dims.maxWidth || 96,
          custom_height_min: dims.minHeight || 12,
          custom_height_max: dims.maxHeight || 120
        };
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

      // Prepare headrail and bottom rail data
      let headrailId = null;
      let bottomRailId = null;

      if (options.valanceOptions && Array.isArray(options.valanceOptions)) {
        const selectedHeadrail = options.valanceOptions.find(option => option.enabled);
        headrailId = selectedHeadrail ? selectedHeadrail.id : null;
      }

      if (options.bottomRailOptions && Array.isArray(options.bottomRailOptions)) {
        const selectedBottomRail = options.bottomRailOptions.find(option => option.enabled);
        bottomRailId = selectedBottomRail ? selectedBottomRail.id : null;
      }

      // Build the SET clause dynamically
      const updateFields = [];
      const updateValues = [];

      updateFields.push('mount_types = ?', 'control_types = ?');
      updateValues.push(mountTypesData, controlTypesData);

      // Add dimension updates if provided
      if (Object.keys(dimensionUpdates).length > 0) {
        Object.entries(dimensionUpdates).forEach(([field, value]) => {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        });
      }

      // Add headrail and bottom rail updates
      updateFields.push('headrail_id = ?', 'bottom_rail_id = ?');
      updateValues.push(headrailId, bottomRailId);

      updateFields.push('updated_at = NOW()');
      updateValues.push(productId);

      // Update products table with options data
      await pool.query(
        `UPDATE products SET ${updateFields.join(', ')} WHERE product_id = ?`,
        updateValues
      );
    }

    // Handle fabric data update if provided
    if (fabric && typeof fabric === 'object') {
      // Delete existing fabric data first
      await pool.query('DELETE FROM product_fabric_options WHERE product_id = ?', [productId]);
      
      // Save fabric options
      const fabricCategories = ['coloredFabric', 'sheerFabric', 'blackoutFabric'];
      
      for (const fabricType of fabricCategories) {
        if (fabric[fabricType] && Array.isArray(fabric[fabricType])) {
          for (const fabricOption of fabric[fabricType]) {
            if (fabricOption.enabled && fabricOption.name) {
              const [fabricResult] = await pool.query<ResultSetHeader>(
                `INSERT INTO product_fabric_options 
                 (product_id, vendor_id, fabric_type, fabric_name, is_enabled, description, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [productId, vendorId, fabricType, fabricOption.name, fabricOption.enabled, fabricOption.description || '']
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

    // Handle features data update if provided
    console.log('=== FEATURES PROCESSING ===');
    console.log('features variable:', features);
    console.log('features type:', typeof features);
    console.log('features is array:', Array.isArray(features));
    console.log('features length:', features?.length);
    
    if (features && Array.isArray(features)) {
      console.log('Processing features array...');
      // Delete existing product features first
      await pool.query('DELETE FROM product_features WHERE product_id = ?', [productId]);
      
      // Save product-specific features
      for (const feature of features) {
        console.log('Processing feature:', feature);
        if (feature.title && feature.description) {
          console.log('Inserting feature:', feature.title);
          // Insert feature into features table
          const [featureResult] = await pool.query<ResultSetHeader>(
            `INSERT INTO features (name, description, icon, category, is_active, display_order, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
              feature.title,
              feature.description,
              feature.icon || null,
              'product_specific', // Category to identify product-specific features
              1, // is_active
              0  // display_order
            ]
          );
          
          const featureId = featureResult.insertId;
          console.log('Inserted feature with ID:', featureId);
          
          // Link feature to product in product_features table
          await pool.query(
            `INSERT INTO product_features (product_id, feature_id, created_at)
             VALUES (?, ?, NOW())`,
            [productId, featureId]
          );
          console.log('Linked feature to product');
        } else {
          console.log('Skipping feature - missing title or description:', feature);
        }
      }
    } else {
      console.log('No features to process or not an array');
    }
    console.log('==========================')

    // Handle room recommendations data update if provided
    console.log('==== ROOMS RECOMMENDATIONS DEBUG ====');
    console.log('roomRecommendations variable:', roomRecommendations);
    console.log('roomRecommendations type:', typeof roomRecommendations);
    console.log('roomRecommendations is array:', Array.isArray(roomRecommendations));
    console.log('roomRecommendations length:', roomRecommendations?.length);
    
    if (roomRecommendations && Array.isArray(roomRecommendations)) {
      console.log('Processing room recommendations array...');
      // Delete existing room recommendations first
      await pool.query('DELETE FROM product_rooms WHERE product_id = ?', [productId]);
      console.log('Deleted existing room recommendations for product:', productId);
      
      // Save room recommendations
      for (const room of roomRecommendations) {
        console.log('Processing room:', room);
        if (room.roomType && room.roomType.trim()) {
          console.log('Inserting room recommendation:', room.roomType);
          await pool.query(
            `INSERT INTO product_rooms (product_id, room_type, suitability_score, special_considerations, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [
              productId,
              room.roomType,
              room.priority || 5,
              room.recommendation || ''
            ]
          );
          console.log('Successfully inserted room recommendation');
        } else {
          console.log('Skipping room - missing roomType:', room);
        }
      }
    } else {
      console.log('No room recommendations to process or not an array');
    }
    console.log('=====================================');

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