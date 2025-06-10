import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/products/[id]/configuration - Get product configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'vendor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = parseInt(params.id);
    const pool = await getPool();

    // Get product with all configuration data
    const [product] = await pool.execute(`
      SELECT p.*, b.name as brand_name, v.vendor_info_id
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      LEFT JOIN vendor_info v ON vp.vendor_id = v.vendor_info_id
      WHERE p.product_id = ?
    `, [productId]);

    if (!product || product.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check vendor access
    if (user.role === 'vendor') {
      const [vendorCheck] = await pool.execute(`
        SELECT vp.vendor_product_id 
        FROM vendor_products vp
        JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
        WHERE vp.product_id = ? AND vi.user_id = ?
      `, [productId, user.userId]);

      if (!vendorCheck || vendorCheck.length === 0) {
        return NextResponse.json({ error: 'Not your product' }, { status: 403 });
      }
    }

    // Get configuration steps
    const [steps] = await pool.execute(`
      SELECT * FROM product_configuration_steps
      WHERE product_id = ?
      ORDER BY step_order ASC
    `, [productId]);

    // Get product options with their values
    const [options] = await pool.execute(`
      SELECT 
        po.*,
        pso.step_id,
        pso.display_order as step_display_order,
        pso.is_primary
      FROM product_options po
      LEFT JOIN product_step_options pso ON po.option_id = pso.option_id
      WHERE po.product_id = ?
      ORDER BY po.display_order ASC
    `, [productId]);

    // Get option values for each option
    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const [values] = await pool.execute(`
          SELECT * FROM product_option_values
          WHERE option_id = ?
          ORDER BY display_order ASC
        `, [option.option_id]);

        return {
          ...option,
          values: values || []
        };
      })
    );

    // Get configuration rules
    const [rules] = await pool.execute(`
      SELECT * FROM product_configuration_rules
      WHERE product_id = ? AND is_active = 1
      ORDER BY priority DESC
    `, [productId]);

    // Get colors and materials
    const [colors] = await pool.execute(`
      SELECT * FROM product_colors
      WHERE product_id = ? AND is_available = 1
      ORDER BY display_order ASC
    `, [productId]);

    const [materials] = await pool.execute(`
      SELECT * FROM product_materials
      WHERE product_id = ? AND is_available = 1
      ORDER BY material_name ASC
    `, [productId]);

    // Get pricing matrix
    const [pricingMatrix] = await pool.execute(`
      SELECT * FROM product_pricing_matrix
      WHERE product_id = ? AND is_active = 1
      ORDER BY width_min ASC, height_min ASC
    `, [productId]);

    return NextResponse.json({
      product: product[0],
      steps: steps || [],
      options: optionsWithValues || [],
      rules: rules || [],
      colors: colors || [],
      materials: materials || [],
      pricingMatrix: pricingMatrix || []
    });

  } catch (error) {
    console.error('Error fetching product configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id]/configuration - Update product configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'vendor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = parseInt(params.id);
    const body = await request.json();
    const pool = await getPool();

    // Check vendor access
    if (user.role === 'vendor') {
      const [vendorCheck] = await pool.execute(`
        SELECT vp.vendor_product_id 
        FROM vendor_products vp
        JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
        WHERE vp.product_id = ? AND vi.user_id = ?
      `, [productId, user.userId]);

      if (!vendorCheck || vendorCheck.length === 0) {
        return NextResponse.json({ error: 'Not your product' }, { status: 403 });
      }
    }

    // Start transaction
    await pool.execute('START TRANSACTION');

    try {
      // Update configuration steps
      if (body.steps) {
        // Delete existing steps
        await pool.execute('DELETE FROM product_configuration_steps WHERE product_id = ?', [productId]);
        
        // Insert new steps
        for (const step of body.steps) {
          await pool.execute(`
            INSERT INTO product_configuration_steps 
            (product_id, step_name, step_title, step_description, step_order, is_required, validation_rules, help_content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            step.step_name,
            step.step_title,
            step.step_description,
            step.step_order,
            step.is_required,
            JSON.stringify(step.validation_rules || {}),
            step.help_content
          ]);
        }
      }

      // Update product options
      if (body.options) {
        // Delete existing options and their values
        await pool.execute('DELETE FROM product_options WHERE product_id = ?', [productId]);
        
        // Insert new options
        for (const option of body.options) {
          const [result] = await pool.execute(`
            INSERT INTO product_options 
            (product_id, option_name, option_type, is_required, display_order, help_text, validation_rules)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            option.option_name,
            option.option_type,
            option.is_required,
            option.display_order,
            option.help_text,
            JSON.stringify(option.validation_rules || {})
          ]);

          const optionId = result.insertId;

          // Insert option values
          if (option.values) {
            for (const value of option.values) {
              await pool.execute(`
                INSERT INTO product_option_values 
                (option_id, value_name, value_data, price_modifier, display_order, is_default, is_available, image_url, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                optionId,
                value.value_name,
                value.value_data,
                value.price_modifier,
                value.display_order,
                value.is_default,
                value.is_available,
                value.image_url,
                value.description
              ]);
            }
          }

          // Link option to step if specified
          if (option.step_id) {
            await pool.execute(`
              INSERT INTO product_step_options (step_id, option_id, display_order, is_primary)
              VALUES (?, ?, ?, ?)
            `, [option.step_id, optionId, option.step_display_order || 0, option.is_primary || false]);
          }
        }
      }

      // Update configuration rules
      if (body.rules) {
        await pool.execute('DELETE FROM product_configuration_rules WHERE product_id = ?', [productId]);
        
        for (const rule of body.rules) {
          await pool.execute(`
            INSERT INTO product_configuration_rules 
            (product_id, rule_name, rule_type, condition_data, action_data, priority, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            rule.rule_name,
            rule.rule_type,
            JSON.stringify(rule.condition_data),
            JSON.stringify(rule.action_data),
            rule.priority,
            rule.is_active
          ]);
        }
      }

      // Update colors
      if (body.colors) {
        await pool.execute('DELETE FROM product_colors WHERE product_id = ?', [productId]);
        
        for (const color of body.colors) {
          await pool.execute(`
            INSERT INTO product_colors 
            (product_id, color_name, color_code, color_family, price_adjustment, is_available, swatch_image, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            color.color_name,
            color.color_code,
            color.color_family,
            color.price_adjustment,
            color.is_available,
            color.swatch_image,
            color.display_order
          ]);
        }
      }

      // Update materials
      if (body.materials) {
        await pool.execute('DELETE FROM product_materials WHERE product_id = ?', [productId]);
        
        for (const material of body.materials) {
          await pool.execute(`
            INSERT INTO product_materials 
            (product_id, material_name, material_type, description, price_adjustment, durability_rating, 
             maintenance_level, is_eco_friendly, is_available, sample_available, texture_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            material.material_name,
            material.material_type,
            material.description,
            material.price_adjustment,
            material.durability_rating,
            material.maintenance_level,
            material.is_eco_friendly,
            material.is_available,
            material.sample_available,
            material.texture_image
          ]);
        }
      }

      // Update pricing matrix
      if (body.pricingMatrix) {
        await pool.execute('DELETE FROM product_pricing_matrix WHERE product_id = ?', [productId]);
        
        for (const pricing of body.pricingMatrix) {
          await pool.execute(`
            INSERT INTO product_pricing_matrix 
            (product_id, width_min, width_max, height_min, height_max, base_price, price_per_sqft, effective_date, expires_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            productId,
            pricing.width_min,
            pricing.width_max,
            pricing.height_min,
            pricing.height_max,
            pricing.base_price,
            pricing.price_per_sqft,
            pricing.effective_date,
            pricing.expires_date,
            pricing.is_active
          ]);
        }
      }

      await pool.execute('COMMIT');

      return NextResponse.json({ 
        success: true,
        message: 'Product configuration updated successfully' 
      });

    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating product configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update product configuration' },
      { status: 500 }
    );
  }
}