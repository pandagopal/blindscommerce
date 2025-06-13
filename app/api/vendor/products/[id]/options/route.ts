import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ProductOption extends RowDataPacket {
  option_id: number;
  option_name: string;
  option_type: string;
  subcategory?: string;
  price_modifier: number;
  is_enabled: boolean;
  is_default: boolean;
  display_order: number;
}

// GET /api/vendor/products/[id]/options - Get product options
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const productId = parseInt(params.id);
    const pool = await getPool();

    // Get vendor info
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (!vendorInfo.length) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Verify product belongs to vendor
    const [productCheck] = await pool.execute<RowDataPacket[]>(
      'SELECT product_id FROM products WHERE product_id = ? AND vendor_id = ?',
      [productId, vendorId]
    );

    if (!productCheck.length) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    // Get existing product options
    const [existingOptions] = await pool.execute<ProductOption[]>(
      `SELECT 
        pov.value_id as option_id,
        pov.value_name as option_name,
        po.option_type,
        CASE 
          WHEN po.option_name LIKE '%Lift%' THEN 'liftSystems'
          WHEN po.option_name LIKE '%Wand%' THEN 'wandSystem'
          WHEN po.option_name LIKE '%String%' THEN 'stringSystem'
          WHEN po.option_name LIKE '%Remote%' THEN 'remoteControl'
          ELSE NULL
        END as subcategory,
        pov.price_modifier,
        pov.is_available as is_enabled,
        pov.is_default,
        pov.display_order
       FROM product_options po
       JOIN product_option_values pov ON po.option_id = pov.option_id
       WHERE po.product_id = ?
       ORDER BY po.option_type, pov.display_order`,
      [productId]
    );

    // Group options by type
    const groupedOptions = {
      dimensions: {
        minWidth: 12,
        maxWidth: 96,
        minHeight: 12,
        maxHeight: 120,
        widthIncrement: 0.125,
        heightIncrement: 0.125,
      },
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

    // Get fabric options
    const [fabricOptions] = await pool.execute(`
      SELECT 
        pfo.*,
        pfi.image_url,
        pfi.image_name,
        pfi.display_order as image_order,
        pfp.min_width,
        pfp.max_width,
        pfp.price_per_sqft,
        pfp.display_order as price_order
      FROM product_fabric_options pfo
      LEFT JOIN product_fabric_images pfi ON pfo.fabric_option_id = pfi.fabric_option_id
      LEFT JOIN product_fabric_pricing pfp ON pfo.fabric_option_id = pfp.fabric_option_id
      WHERE pfo.product_id = ?
      ORDER BY pfo.fabric_type, pfo.fabric_name, pfi.display_order, pfp.display_order
    `, [productId]);

    // Group fabric data
    const fabricData = {
      coloredFabric: [],
      sheerFabric: [],
      blackoutFabric: []
    };

    // Process fabric options
    const fabricMap = new Map();
    fabricOptions.forEach((row: any) => {
      const key = `${row.fabric_type}_${row.fabric_option_id}`;
      
      if (!fabricMap.has(key)) {
        fabricMap.set(key, {
          id: row.fabric_option_id.toString(),
          name: row.fabric_name,
          enabled: row.is_enabled,
          description: row.description || '',
          images: [],
          priceMatrix: []
        });
      }

      const fabric = fabricMap.get(key);

      // Add image if exists
      if (row.image_url && !fabric.images.find((img: any) => img.url === row.image_url)) {
        fabric.images.push({
          id: `${row.fabric_option_id}_${row.image_order}`,
          url: row.image_url,
          name: row.image_name
        });
      }

      // Add price range if exists
      if (row.min_width && !fabric.priceMatrix.find((price: any) => price.minWidth === row.min_width)) {
        fabric.priceMatrix.push({
          widthRange: `${row.min_width}" - ${row.max_width}"`,
          minWidth: row.min_width,
          maxWidth: row.max_width,
          pricePerSqft: parseFloat(row.price_per_sqft) || 0
        });
      }
    });

    // Sort fabrics into categories
    fabricMap.forEach((fabric, key) => {
      const fabricType = key.split('_')[0];
      if ((fabricData as any)[fabricType]) {
        (fabricData as any)[fabricType].push(fabric);
      }
    });

    // If no options exist, return defaults
    if (existingOptions.length === 0 && fabricOptions.length === 0) {
      return NextResponse.json({
        success: true,
        options: getDefaultOptions(),
        fabric: {
          coloredFabric: [],
          sheerFabric: [],
          blackoutFabric: []
        }
      });
    }

    // Process existing options
    existingOptions.forEach((option: ProductOption) => {
      const optionData = {
        name: option.option_name,
        price_adjustment: parseFloat(option.price_modifier.toString()),
        enabled: option.is_enabled,
        description: getOptionDescription(option.option_name, option.option_type)
      };

      switch (option.option_type) {
        case 'dropdown':
          if (option.option_name.includes('Mount')) {
            (groupedOptions.mountTypes as any[]).push(optionData);
          } else if (option.option_name.includes('Valance') || option.option_name.includes('Head')) {
            (groupedOptions.valanceOptions as any[]).push(optionData);
          } else if (option.option_name.includes('Bottom') || option.option_name.includes('Rail')) {
            (groupedOptions.bottomRailOptions as any[]).push(optionData);
          }
          break;
        case 'radio':
          if (option.subcategory && (groupedOptions.controlTypes as any)[option.subcategory]) {
            ((groupedOptions.controlTypes as any)[option.subcategory] as any[]).push(optionData);
          }
          break;
      }
    });

    // Fill in missing defaults
    const finalOptions = fillMissingDefaults(groupedOptions);

    return NextResponse.json({
      success: true,
      options: finalOptions,
      fabric: fabricData
    });

  } catch (error) {
    console.error('Error fetching product options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product options' },
      { status: 500 }
    );
  }
}

// PUT /api/vendor/products/[id]/options - Update product options
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const productId = parseInt(params.id);
    const body = await request.json();
    const { options, fabric } = body;

    const pool = await getPool();

    // Get vendor info
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (!vendorInfo.length) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Verify product belongs to vendor
    const [productCheck] = await pool.execute<RowDataPacket[]>(
      'SELECT product_id FROM products WHERE product_id = ? AND vendor_id = ?',
      [productId, vendorId]
    );

    if (!productCheck.length) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    // Start transaction
    await pool.execute('START TRANSACTION');

    try {
      // Update dimensions if provided
      if (options.dimensions) {
        await pool.execute(
          `INSERT INTO product_dimensions_config 
           (product_id, vendor_id, min_width, max_width, min_height, max_height, width_increment, height_increment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           min_width = VALUES(min_width),
           max_width = VALUES(max_width),
           min_height = VALUES(min_height),
           max_height = VALUES(max_height),
           width_increment = VALUES(width_increment),
           height_increment = VALUES(height_increment)`,
          [
            productId,
            vendorId,
            options.dimensions.minWidth,
            options.dimensions.maxWidth,
            options.dimensions.minHeight,
            options.dimensions.maxHeight,
            options.dimensions.widthIncrement,
            options.dimensions.heightIncrement
          ]
        );
      }

      // Process each option category
      const categories = [
        { key: 'mountTypes', type: 'dropdown' },
        { key: 'valanceOptions', type: 'dropdown' },
        { key: 'bottomRailOptions', type: 'dropdown' }
      ];

      for (const category of categories) {
        if (options[category.key]) {
          await saveOptionCategory(pool, productId, category.key, category.type, options[category.key]);
        }
      }

      // Process control types (nested)
      if (options.controlTypes) {
        const controlCategories = ['liftSystems', 'wandSystem', 'stringSystem', 'remoteControl'];
        for (const subcategory of controlCategories) {
          if (options.controlTypes[subcategory]) {
            await saveOptionCategory(pool, productId, 'controlTypes', 'radio', options.controlTypes[subcategory], subcategory);
          }
        }
      }

      // Process fabric options
      if (fabric) {
        const fabricCategories = ['coloredFabric', 'sheerFabric', 'blackoutFabric'];
        for (const fabricType of fabricCategories) {
          if (fabric[fabricType] && fabric[fabricType].length > 0) {
            await saveFabricCategory(pool, productId, vendorId, fabricType, fabric[fabricType]);
          }
        }
      }

      await pool.execute('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Product options updated successfully'
      });

    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating product options:', error);
    return NextResponse.json(
      { error: 'Failed to update product options' },
      { status: 500 }
    );
  }
}

async function saveOptionCategory(
  pool: any,
  productId: number,
  categoryName: string,
  optionType: string,
  options: any[],
  subcategory?: string
) {
  // Create or get option group
  const optionName = subcategory ? `${categoryName}_${subcategory}` : categoryName;
  
  const [existingOption] = await pool.execute<RowDataPacket[]>(
    'SELECT option_id FROM product_options WHERE product_id = ? AND option_name = ?',
    [productId, optionName]
  );

  let optionId;
  if (existingOption.length > 0) {
    optionId = existingOption[0].option_id;
    // Delete existing values
    await pool.execute(
      'DELETE FROM product_option_values WHERE option_id = ?',
      [optionId]
    );
  } else {
    // Create new option
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO product_options (product_id, option_name, option_type) VALUES (?, ?, ?)',
      [productId, optionName, optionType]
    );
    optionId = result.insertId;
  }

  // Insert option values
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    await pool.execute(
      `INSERT INTO product_option_values 
       (option_id, value_name, price_modifier, display_order, is_default, is_available)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        optionId,
        option.name,
        option.price_adjustment || 0,
        i,
        option.is_default || false,
        option.enabled || false
      ]
    );
  }
}

async function saveFabricCategory(
  pool: any,
  productId: number,
  vendorId: number,
  fabricType: string,
  fabricOptions: any[]
) {
  // Clear existing fabric data for this type and product
  await pool.execute(
    'DELETE FROM product_fabric_options WHERE product_id = ? AND fabric_type = ?',
    [productId, fabricType]
  );

  // Insert new fabric options
  for (const fabricOption of fabricOptions) {
    if (!fabricOption.name || !fabricOption.enabled) continue;

    const [fabricResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO product_fabric_options 
       (product_id, vendor_id, fabric_type, fabric_name, is_enabled, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        productId,
        vendorId,
        fabricType,
        fabricOption.name,
        fabricOption.enabled,
        fabricOption.description || ''
      ]
    );

    const fabricOptionId = fabricResult.insertId;

    // Save fabric images
    if (fabricOption.images && fabricOption.images.length > 0) {
      for (let i = 0; i < fabricOption.images.length; i++) {
        const image = fabricOption.images[i];
        if (image.file) {
          // For now, we'll store the image name/URL
          // In production, you'd upload to cloud storage first
          await pool.execute(
            `INSERT INTO product_fabric_images 
             (fabric_option_id, product_id, image_url, image_name, display_order)
             VALUES (?, ?, ?, ?, ?)`,
            [fabricOptionId, productId, image.url, image.name, i]
          );
        }
      }
    }

    // Save price matrix
    if (fabricOption.priceMatrix && fabricOption.priceMatrix.length > 0) {
      for (let i = 0; i < fabricOption.priceMatrix.length; i++) {
        const priceRange = fabricOption.priceMatrix[i];
        await pool.execute(
          `INSERT INTO product_fabric_pricing 
           (fabric_option_id, product_id, min_width, max_width, price_per_sqft, display_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            fabricOptionId,
            productId,
            priceRange.minWidth,
            priceRange.maxWidth,
            priceRange.pricePerSqft,
            i
          ]
        );
      }
    }
  }
}

function getDefaultOptions() {
  return {
    dimensions: {
      minWidth: 12,
      maxWidth: 96,
      minHeight: 12,
      maxHeight: 120,
      widthIncrement: 0.125,
      heightIncrement: 0.125,
    },
    mountTypes: [
      { name: 'Inside Mount', price_adjustment: 0, enabled: false },
      { name: 'Outside Mount', price_adjustment: 0, enabled: false },
    ],
    controlTypes: {
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
      ]
    },
    valanceOptions: [
      { name: 'Circular (With Fabric Insert)', price_adjustment: 45, enabled: false },
      { name: 'Square (Without Fabric)', price_adjustment: 35, enabled: false },
      { name: 'Fabric Wrapped', price_adjustment: 55, enabled: false },
    ],
    bottomRailOptions: [
      { name: 'Fabric Wrapped', price_adjustment: 25, enabled: false },
      { name: 'Just a Rail', price_adjustment: 0, enabled: false },
    ]
  };
}

function getOptionDescription(name: string, type: string): string {
  const descriptions: { [key: string]: string } = {
    'Inside Mount': 'Fits inside the window frame for a clean look',
    'Outside Mount': 'Mounts outside the window frame',
    'Cordless': 'Safe for homes with children and pets',
    'Continuous Loop': 'Chain-operated lifting system',
    'Standard Wand': 'Standard tilting wand',
    'Extended Wand': 'Longer wand for hard-to-reach windows',
    'String Lift': 'Traditional string lifting',
    'Chain System': 'Chain-operated system',
    'Basic Remote': 'Simple remote control operation',
    'Smart Home Compatible': 'Works with smart home systems',
    'Circular (With Fabric Insert)': 'Rounded valance with fabric',
    'Square (Without Fabric)': 'Simple square valance',
    'Fabric Wrapped': 'Completely fabric-wrapped',
    'Just a Rail': 'Standard rail without wrapping'
  };
  
  return descriptions[name] || `${name} option`;
}

function fillMissingDefaults(options: any) {
  const defaults = getDefaultOptions();
  
  // Fill missing mount types
  if (options.mountTypes.length === 0) {
    options.mountTypes = defaults.mountTypes;
  }
  
  // Fill missing control types
  Object.keys(defaults.controlTypes).forEach(key => {
    if (options.controlTypes[key].length === 0) {
      options.controlTypes[key] = (defaults.controlTypes as any)[key];
    }
  });
  
  // Fill missing valance options
  if (options.valanceOptions.length === 0) {
    options.valanceOptions = defaults.valanceOptions;
  }
  
  // Fill missing bottom rail options
  if (options.bottomRailOptions.length === 0) {
    options.bottomRailOptions = defaults.bottomRailOptions;
  }
  
  return options;
}