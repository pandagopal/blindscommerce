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
    // Define ALL available options with their default state
    const allMountTypes = [
      { name: 'Inside Mount', price_adjustment: 0, enabled: false },
      { name: 'Outside Mount', price_adjustment: 0, enabled: false },
    ];

    const allControlTypes = {
      liftSystems: [
        { name: 'Cordless', price_adjustment: 0, enabled: false },
        { name: 'Continuous Loop', price_adjustment: 25, enabled: false },
      ],
      wandSystem: [
        { name: 'Standard Wand', price_adjustment: 15, enabled: false },
        { name: 'Extended Wand', price_adjustment: 30, enabled: false },
      ],
      stringSystem: [
        { name: 'String Lift', price_adjustment: 10, enabled: false },
        { name: 'Chain System', price_adjustment: 20, enabled: false },
      ],
      remoteControl: [
        { name: 'Basic Remote', price_adjustment: 150, enabled: false },
        { name: 'Smart Home Compatible', price_adjustment: 250, enabled: false },
      ],
    };

    // Parse saved mount types and mark them as enabled
    if (product.mount_types) {
      const savedMountTypes = product.mount_types.split(',').filter(mt => mt.trim());
      savedMountTypes.forEach(savedType => {
        const option = allMountTypes.find(mt => mt.name === savedType.trim());
        if (option) {
          option.enabled = true;
        }
      });
    }
    formattedOptions.mountTypes = allMountTypes;

    // Parse saved control types and mark them as enabled
    if (product.control_types) {
      const controlGroups = product.control_types.split(';').filter(cg => cg.trim());
      controlGroups.forEach(group => {
        const items = group.split(',').filter(item => item.trim());
        items.forEach(item => {
          if (item.includes(':')) {
            const [subcategory, name] = item.split(':');
            const cleanSubcategory = subcategory.trim();
            const cleanName = name.trim();
            
            if (allControlTypes[cleanSubcategory]) {
              const option = allControlTypes[cleanSubcategory].find(ct => ct.name === cleanName);
              if (option) {
                option.enabled = true;
              }
            }
          }
        });
      });
    }
    formattedOptions.controlTypes = allControlTypes;

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

    // Define ALL valance options with default prices
    const allValanceOptions = [
      { name: 'Circular (With Fabric Insert)', price_adjustment: 45, enabled: false },
      { name: 'Square (Without Fabric)', price_adjustment: 35, enabled: false },
      { name: 'Fabric Wrapped', price_adjustment: 55, enabled: false },
    ];

    // Define ALL bottom rail options with default prices
    const allBottomRailOptionsData = [
      { name: 'Fabric Wrapped', price_adjustment: 25, enabled: false },
      { name: 'Just a Rail', price_adjustment: 0, enabled: false },
    ];

    // Mark the selected valance option as enabled
    if (product.headrail_id && allHeadrailOptions.length > 0) {
      const selectedHeadrail = allHeadrailOptions.find(opt => opt.headrail_id === product.headrail_id);
      if (selectedHeadrail) {
        const valanceOption = allValanceOptions.find(opt => opt.name === selectedHeadrail.name);
        if (valanceOption) {
          valanceOption.enabled = true;
        }
      }
    }

    // Mark the selected bottom rail option as enabled
    if (product.bottom_rail_id && allBottomRailOptions.length > 0) {
      const selectedBottomRail = allBottomRailOptions.find(opt => opt.bottom_rail_id === product.bottom_rail_id);
      if (selectedBottomRail) {
        const bottomRailOption = allBottomRailOptionsData.find(opt => opt.name === selectedBottomRail.name);
        if (bottomRailOption) {
          bottomRailOption.enabled = true;
        }
      }
    }

    formattedOptions.valanceOptions = allValanceOptions;
    formattedOptions.bottomRailOptions = allBottomRailOptionsData;

    // Format fabric data to new format
    const formatFabricData = () => {
      const fabrics = [];

      fabricRows.forEach(fabric => {
        // Get pricing for this fabric (use first price entry for simplicity)
        const fabricPricing = fabricPricingRows.filter(p => p.fabric_option_id === fabric.fabric_option_id);
        const price = fabricPricing.length > 0 ? parseFloat(fabricPricing[0].price_per_sqft) : 0;

        // Get the first image for this fabric
        const fabricImageRow = fabricImageRows
          .filter(img => img.fabric_option_id === fabric.fabric_option_id)
          .sort((a, b) => a.display_order - b.display_order)[0];

        // Filter out stale blob URLs - they should never be stored in database
        const fabricImage = (fabricImageRow && !fabricImageRow.image_url?.startsWith('blob:')) ? {
          id: `img_${fabricImageRow.fabric_option_id}_${fabricImageRow.display_order}`,
          url: fabricImageRow.image_url,
          name: fabricImageRow.image_name || `Image ${fabricImageRow.display_order}`
        } : null;

        const fabricOption = {
          id: `fabric_${fabric.fabric_option_id}`,
          name: fabric.fabric_name || '',
          image: fabricImage,
          price: price,
          fabricType: fabric.fabric_type || 'colored',
          enabled: Boolean(fabric.is_enabled)
        };

        fabrics.push(fabricOption);
      });

      return { fabrics };
    };


    // Get product features (with error handling)
    let featureRows = [];
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT f.feature_id, f.name, f.description, f.icon
         FROM product_features pf
         JOIN features f ON pf.feature_id = f.feature_id
         WHERE pf.product_id = ?
         ORDER BY f.display_order, f.created_at`,
        [productId]
      );
      featureRows = rows;
    } catch (featuresError) {
      console.error('Features query error:', featuresError);
      featureRows = []; // Continue with empty array if query fails
    }

    // Get room recommendations (with error handling)
    let roomRows = [];
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, room_type, suitability_score, special_considerations 
         FROM product_rooms 
         WHERE product_id = ? 
         ORDER BY suitability_score DESC`,
        [productId]
      );
      roomRows = rows;
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
    const formattedRoomRecommendations = roomRows.map((room) => ({
      id: room.id.toString(),
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
        ...(product.primary_image_url ? [{
          id: `${productId}_primary_image`,
          url: product.primary_image_url,
          alt: `${product.name} primary image`,
          is_primary: true
        }] : []),
        ...imageRows.map((img, index) => ({
          id: `${productId}_image_${index}`,
          url: img.image_url,
          alt: `${product.name} image ${index + 1}`,
          is_primary: false
        }))
      ],
      options: formattedOptions,
      pricing_matrix: pricingRows,
      fabric: formatFabricData(),
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

    // Handle images update if provided
    if (images && Array.isArray(images) && images.length > 0) {
      // Delete existing product images first
      await pool.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      
      // Insert new images
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.url) {
          await pool.query(
            `INSERT INTO product_images 
             (product_id, image_url, display_order, created_at)
             VALUES (?, ?, ?, NOW())`,
            [productId, image.url, i]
          );
        }
      }
    }

    // Handle fabric data update if provided
    if (fabric && typeof fabric === 'object' && fabric.fabrics && Array.isArray(fabric.fabrics)) {
      // Delete existing fabric data first
      await pool.query('DELETE FROM product_fabric_options WHERE product_id = ?', [productId]);
      
      for (const fabricOption of fabric.fabrics) {
        if (fabricOption.enabled && fabricOption.name && fabricOption.fabricType) {
          
          const [fabricResult] = await pool.query<ResultSetHeader>(
            `INSERT INTO product_fabric_options 
             (product_id, vendor_id, fabric_type, fabric_name, is_enabled, description, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [productId, vendorId, fabricOption.fabricType, fabricOption.name, fabricOption.enabled, '']
          );
          
          const fabricOptionId = fabricResult.insertId;
          
          // Save fabric image if any
          if (fabricOption.image && fabricOption.image.url) {
            await pool.query(
              `INSERT INTO product_fabric_images 
               (fabric_option_id, product_id, image_url, image_name, display_order, created_at)
               VALUES (?, ?, ?, ?, ?, NOW())`,
              [fabricOptionId, productId, fabricOption.image.url, fabricOption.image.name || '', 0]
            );
          }
          
          // Save fabric pricing (simple price per sqft)
          if (fabricOption.price && fabricOption.price > 0) {
            // Create a default pricing entry for the fabric
            await pool.query(
              `INSERT INTO product_fabric_pricing 
               (fabric_option_id, product_id, min_width, max_width, price_per_sqft, display_order, created_at)
               VALUES (?, ?, ?, ?, ?, ?, NOW())`,
              [
                fabricOptionId, 
                productId, 
                1,  // min_width 
                120, // max_width (default range)
                fabricOption.price, 
                0
              ]
            );
          }
        }
      }
    }

    // Handle features data update if provided
    if (features && Array.isArray(features)) {
      // Delete existing product features first
      await pool.query('DELETE FROM product_features WHERE product_id = ?', [productId]);
      
      // Save product-specific features
      for (const feature of features) {
        if (feature.title && feature.description) {
          // First check if the feature already exists
          const [existingFeature] = await pool.query<RowDataPacket[]>(
            'SELECT feature_id FROM features WHERE name = ?',
            [feature.title]
          );
          
          let featureId;
          
          if (existingFeature.length > 0) {
            // Update existing feature
            featureId = existingFeature[0].feature_id;
            await pool.query(
              `UPDATE features SET 
                description = ?, 
                icon = ?, 
                updated_at = NOW() 
               WHERE feature_id = ?`,
              [feature.description, feature.icon || null, featureId]
            );
          } else {
            // Insert new feature
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
            featureId = featureResult.insertId;
          }
          
          // Link feature to product in product_features table
          await pool.query(
            `INSERT INTO product_features (product_id, feature_id, created_at)
             VALUES (?, ?, NOW())
             ON DUPLICATE KEY UPDATE created_at = created_at`, // Do nothing if already linked
            [productId, featureId]
          );
        }
      }
    }

    // Handle room recommendations data update if provided
    if (roomRecommendations && Array.isArray(roomRecommendations)) {
      // Delete existing room recommendations first
      await pool.query('DELETE FROM product_rooms WHERE product_id = ?', [productId]);
      
      // Save room recommendations
      for (const room of roomRecommendations) {
        if (room.roomType && room.roomType.trim()) {
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