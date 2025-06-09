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
      SELECT p.*, b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.brand_id
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
        specifications: specifications || []
      }
    });

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