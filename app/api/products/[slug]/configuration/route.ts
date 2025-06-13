import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/products/[slug]/configuration - Get product configuration for frontend
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const width = searchParams.get('width');
    const height = searchParams.get('height');

    // Get product by slug
    const [products] = await db.execute(`
      SELECT p.*, b.name as brand_name, vi.vendor_info_id
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN vendor_info vi ON p.vendor_id = vi.vendor_info_id
      WHERE p.slug = ? AND p.is_active = 1
    `, [params.slug]);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = products[0];
    const productId = product.product_id;

    // Get configuration steps in order
    const [steps] = await db.execute(`
      SELECT * FROM product_configuration_steps
      WHERE product_id = ?
      ORDER BY step_order ASC
    `, [productId]);

    // Get all options with their step assignments
    const [allOptions] = await db.execute(`
      SELECT 
        po.*,
        pso.step_id,
        pso.display_order as step_display_order,
        pso.is_primary
      FROM product_options po
      LEFT JOIN product_step_options pso ON po.option_id = pso.option_id
      WHERE po.product_id = ?
      ORDER BY pso.step_id ASC, pso.display_order ASC, po.display_order ASC
    `, [productId]);

    // Group options by step and get their values
    const stepOptions = {};
    const stepsWithOptions = await Promise.all(
      (steps || []).map(async (step) => {
        const stepOptionsData = allOptions.filter(opt => opt.step_id === step.step_id);
        
        const optionsWithValues = await Promise.all(
          stepOptionsData.map(async (option) => {
            const [values] = await db.execute(`
              SELECT * FROM product_option_values
              WHERE option_id = ? AND is_available = 1
              ORDER BY display_order ASC
            `, [option.option_id]);

            return {
              ...option,
              values: values || []
            };
          })
        );

        return {
          ...step,
          options: optionsWithValues
        };
      })
    );

    // Get active configuration rules
    const [rules] = await db.execute(`
      SELECT * FROM product_configuration_rules
      WHERE product_id = ? AND is_active = 1
      ORDER BY priority DESC
    `, [productId]);

    // Get available colors
    const [colors] = await db.execute(`
      SELECT * FROM product_colors
      WHERE product_id = ? AND is_available = 1
      ORDER BY display_order ASC, color_family ASC
    `, [productId]);

    // Get available materials
    const [materials] = await db.execute(`
      SELECT * FROM product_materials
      WHERE product_id = ? AND is_available = 1
      ORDER BY material_name ASC
    `, [productId]);

    // Get applicable pricing (if dimensions provided)
    let pricing = null;
    if (width && height) {
      const widthNum = parseFloat(width);
      const heightNum = parseFloat(height);
      
      const [pricingRows] = await db.execute(`
        SELECT * FROM product_pricing_matrix
        WHERE product_id = ? 
        AND is_active = 1
        AND width_min <= ? AND width_max >= ?
        AND height_min <= ? AND height_max >= ?
        AND (effective_date IS NULL OR effective_date <= CURDATE())
        AND (expires_date IS NULL OR expires_date >= CURDATE())
        ORDER BY base_price ASC
        LIMIT 1
      `, [productId, widthNum, widthNum, heightNum, heightNum]);

      pricing = pricingRows && pricingRows.length > 0 ? pricingRows[0] : null;
    }

    // Get room recommendations
    const [roomRecommendations] = await db.execute(`
      SELECT * FROM product_rooms
      WHERE product_id = ?
      ORDER BY suitability_score DESC
    `, [productId]);

    // Get product specifications for the configurator
    const [specifications] = await db.execute(`
      SELECT * FROM product_specifications
      WHERE product_id = ?
      ORDER BY spec_category ASC, display_order ASC
    `, [productId]);

    // Get product images
    const [images] = await db.execute(`
      SELECT * FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC
    `, [productId]);

    // Get vendor-defined options for configurator
    let vendorOptions = null;
    if (product.vendor_info_id) {
      try {
        // Get dimensions configuration
        const [dimensionsConfig] = await db.execute(`
          SELECT * FROM product_dimensions_config
          WHERE product_id = ?
          LIMIT 1
        `, [productId]);

        // Get vendor options
        const [vendorOptionValues] = await db.execute(`
          SELECT 
            pov.value_id,
            pov.value_name,
            pov.price_modifier,
            pov.is_available,
            pov.is_default,
            pov.display_order,
            po.option_name,
            po.option_type
          FROM product_options po
          JOIN product_option_values pov ON po.option_id = pov.option_id
          WHERE po.product_id = ? AND pov.is_available = 1
          ORDER BY po.option_type, pov.display_order
        `, [productId]);

        // Group options for configurator
        const groupedVendorOptions = {
          dimensions: dimensionsConfig[0] || {
            min_width: 12,
            max_width: 96,
            min_height: 12,
            max_height: 120,
            width_increment: 0.125,
            height_increment: 0.125
          },
          mountTypes: [],
          controlTypes: [],
          headrailOptions: [],
          bottomRailOptions: []
        };

        // Process vendor options into configurator format
        vendorOptionValues.forEach((option: any) => {
          const optionData = {
            id: option.value_id,
            name: option.value_name,
            description: getOptionDescription(option.value_name),
            priceModifier: parseFloat(option.price_modifier),
            isDefault: Boolean(option.is_default)
          };

          // Map to configurator categories
          if (option.option_name.includes('mountTypes') || option.value_name.includes('Mount')) {
            groupedVendorOptions.mountTypes.push(optionData);
          } else if (option.option_name.includes('controlTypes') || 
                     option.value_name.includes('Cordless') || 
                     option.value_name.includes('Remote') ||
                     option.value_name.includes('Wand') ||
                     option.value_name.includes('String')) {
            groupedVendorOptions.controlTypes.push(optionData);
          } else if (option.option_name.includes('valanceOptions') || option.value_name.includes('Valance')) {
            groupedVendorOptions.headrailOptions.push(optionData);
          } else if (option.option_name.includes('bottomRailOptions') || option.value_name.includes('Rail')) {
            groupedVendorOptions.bottomRailOptions.push(optionData);
          }
        });

        vendorOptions = groupedVendorOptions;
      } catch (error) {
        console.warn('Failed to fetch vendor options:', error);
      }
    }

    return NextResponse.json({
      product: {
        ...product,
        images: images || []
      },
      configuration: {
        steps: stepsWithOptions,
        rules: rules || [],
        colors: colors || [],
        materials: materials || [],
        pricing: pricing,
        roomRecommendations: roomRecommendations || [],
        specifications: specifications || [],
        vendorOptions: vendorOptions // Add vendor options to response
      }
    });

function getOptionDescription(name: string): string {
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

  } catch (error) {
    console.error('Error fetching product configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product configuration' },
      { status: 500 }
    );
  }
}

// POST /api/products/[slug]/configuration/calculate - Calculate price for configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const { configuration, width, height } = body;

    // Get product by slug
    const [products] = await db.execute(`
      SELECT * FROM products
      WHERE slug = ? AND is_active = 1
    `, [params.slug]);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = products[0];
    const productId = product.product_id;

    // Calculate base price from pricing matrix
    let basePrice = product.base_price;
    
    if (width && height) {
      const [pricingRows] = await db.execute(`
        SELECT * FROM product_pricing_matrix
        WHERE product_id = ? 
        AND is_active = 1
        AND width_min <= ? AND width_max >= ?
        AND height_min <= ? AND height_max >= ?
        AND (effective_date IS NULL OR effective_date <= CURDATE())
        AND (expires_date IS NULL OR expires_date >= CURDATE())
        ORDER BY base_price ASC
        LIMIT 1
      `, [productId, width, width, height, height]);

      if (pricingRows && pricingRows.length > 0) {
        const pricing = pricingRows[0];
        basePrice = pricing.base_price;
        
        // Add per square foot pricing if applicable
        if (pricing.price_per_sqft > 0) {
          const sqft = (width * height) / 144; // Convert square inches to square feet
          basePrice += pricing.price_per_sqft * sqft;
        }
      }
    }

    // Calculate option modifiers
    let totalModifiers = 0;
    const appliedOptions = [];

    if (configuration) {
      for (const [optionId, valueId] of Object.entries(configuration)) {
        const [optionValues] = await db.execute(`
          SELECT pov.*, po.option_name
          FROM product_option_values pov
          JOIN product_options po ON pov.option_id = po.option_id
          WHERE pov.option_id = ? AND pov.value_id = ? AND pov.is_available = 1
        `, [optionId, valueId]);

        if (optionValues && optionValues.length > 0) {
          const optionValue = optionValues[0];
          totalModifiers += parseFloat(optionValue.price_modifier || 0);
          appliedOptions.push({
            optionId: optionId,
            valueId: valueId,
            optionName: optionValue.option_name,
            valueName: optionValue.value_name,
            priceModifier: optionValue.price_modifier
          });
        }
      }
    }

    // Apply configuration rules for additional pricing
    const [rules] = await db.execute(`
      SELECT * FROM product_configuration_rules
      WHERE product_id = ? AND is_active = 1 AND rule_type = 'price_modifier'
      ORDER BY priority DESC
    `, [productId]);

    let ruleModifiers = 0;
    const appliedRules = [];

    for (const rule of rules || []) {
      try {
        const conditions = JSON.parse(rule.condition_data);
        const actions = JSON.parse(rule.action_data);
        
        // Simple rule evaluation - check if all conditions are met
        let allConditionsMet = true;
        
        for (const condition of conditions) {
          if (condition.type === 'option_selected') {
            const selectedValue = configuration[condition.option_id];
            if (!condition.values.includes(selectedValue)) {
              allConditionsMet = false;
              break;
            }
          }
          // Add more condition types as needed
        }

        if (allConditionsMet) {
          for (const action of actions) {
            if (action.type === 'add_price') {
              ruleModifiers += parseFloat(action.amount || 0);
              appliedRules.push({
                ruleName: rule.rule_name,
                modifier: action.amount
              });
            } else if (action.type === 'multiply_price') {
              basePrice *= parseFloat(action.multiplier || 1);
              appliedRules.push({
                ruleName: rule.rule_name,
                multiplier: action.multiplier
              });
            }
          }
        }
      } catch (error) {
        console.warn('Error processing rule:', rule.rule_name, error);
      }
    }

    const finalPrice = basePrice + totalModifiers + ruleModifiers;

    return NextResponse.json({
      basePrice: basePrice,
      optionModifiers: totalModifiers,
      ruleModifiers: ruleModifiers,
      totalPrice: finalPrice,
      appliedOptions: appliedOptions,
      appliedRules: appliedRules,
      calculation: {
        width: width,
        height: height,
        squareFeet: width && height ? (width * height) / 144 : null
      }
    });

  } catch (error) {
    console.error('Error calculating configuration price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate price' },
      { status: 500 }
    );
  }
}