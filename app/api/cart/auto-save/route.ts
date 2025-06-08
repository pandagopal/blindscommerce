import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Auto-save cart configuration
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { 
      cart_item_id, 
      configuration, 
      save_type = 'partial',
      session_id 
    } = await request.json();

    if (!cart_item_id || !configuration) {
      return NextResponse.json(
        { error: 'Cart item ID and configuration are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.*, c.cart_id, p.name as product_name
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cart_item_id, user.userId]);

    if (!items || (items as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    const item = (items as any[])[0];
    const current_config = item.configuration ? JSON.parse(item.configuration) : {};

    // Merge configurations based on save type
    let updated_config;
    if (save_type === 'partial') {
      // Merge with existing configuration
      updated_config = { ...current_config, ...configuration };
    } else {
      // Replace entire configuration
      updated_config = configuration;
    }

    // Validate configuration structure
    const validation_result = validateConfiguration(updated_config);
    if (!validation_result.valid) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: validation_result.errors },
        { status: 400 }
      );
    }

    // Update cart item configuration
    await pool.execute(`
      UPDATE cart_items 
      SET configuration = ?, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [JSON.stringify(updated_config), cart_item_id]);

    // Save auto-save history
    await pool.execute(`
      INSERT INTO auto_save_history (
        user_id, cart_item_id, configuration_data, 
        save_type, session_id, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      user.userId,
      cart_item_id,
      JSON.stringify(updated_config),
      save_type,
      session_id || null
    ]);

    // Clean up old auto-save history (keep last 10 saves per item)
    await pool.execute(`
      DELETE FROM auto_save_history 
      WHERE cart_item_id = ? 
        AND history_id NOT IN (
          SELECT history_id FROM (
            SELECT history_id FROM auto_save_history 
            WHERE cart_item_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
          ) as recent_saves
        )
    `, [cart_item_id, cart_item_id]);

    // Log analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, product_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, ?, 'configuration_auto_saved', ?, NOW())
    `, [
      item.cart_id,
      user.userId,
      item.product_id,
      JSON.stringify({
        save_type,
        config_keys: Object.keys(configuration),
        session_id
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Configuration auto-saved successfully',
      cart_item_id,
      updated_configuration: updated_config,
      save_type,
      validation: validation_result
    });

  } catch (error) {
    console.error('Auto-save configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-save configuration' },
      { status: 500 }
    );
  }
}

// GET - Get auto-save history for cart item
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cart_item_id = searchParams.get('cart_item_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!cart_item_id) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.*, c.cart_id, p.name as product_name
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cart_item_id, user.userId]);

    if (!items || (items as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Get auto-save history
    const [history] = await pool.execute(`
      SELECT 
        history_id,
        configuration_data,
        save_type,
        session_id,
        created_at
      FROM auto_save_history
      WHERE cart_item_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [cart_item_id, limit]);

    const formatted_history = (history as any[]).map(record => ({
      history_id: record.history_id,
      configuration: JSON.parse(record.configuration_data),
      save_type: record.save_type,
      session_id: record.session_id,
      created_at: record.created_at,
      time_ago: getTimeAgo(record.created_at)
    }));

    return NextResponse.json({
      success: true,
      cart_item: {
        cart_item_id: (items as any[])[0].cart_item_id,
        product_name: (items as any[])[0].product_name,
        current_configuration: (items as any[])[0].configuration ? 
          JSON.parse((items as any[])[0].configuration) : null
      },
      auto_save_history: formatted_history,
      total_saves: formatted_history.length
    });

  } catch (error) {
    console.error('Get auto-save history error:', error);
    return NextResponse.json(
      { error: 'Failed to get auto-save history' },
      { status: 500 }
    );
  }
}

// PUT - Restore configuration from auto-save history
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { history_id, cart_item_id } = await request.json();

    if (!history_id || !cart_item_id) {
      return NextResponse.json(
        { error: 'History ID and cart item ID are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.*, c.cart_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cart_item_id, user.userId]);

    if (!items || (items as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Get auto-save record
    const [history] = await pool.execute(`
      SELECT configuration_data
      FROM auto_save_history
      WHERE history_id = ? AND cart_item_id = ?
    `, [history_id, cart_item_id]);

    if (!history || (history as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Auto-save history not found' },
        { status: 404 }
      );
    }

    const saved_configuration = JSON.parse((history as any[])[0].configuration_data);

    // Restore configuration
    await pool.execute(`
      UPDATE cart_items 
      SET configuration = ?, updated_at = NOW()
      WHERE cart_item_id = ?
    `, [JSON.stringify(saved_configuration), cart_item_id]);

    // Log restore analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, 'configuration_restored', ?, NOW())
    `, [
      (items as any[])[0].cart_id,
      user.userId,
      JSON.stringify({
        history_id,
        restored_config_keys: Object.keys(saved_configuration)
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Configuration restored successfully',
      cart_item_id,
      restored_configuration: saved_configuration
    });

  } catch (error) {
    console.error('Restore configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to restore configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Clear auto-save history for cart item
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cart_item_id = searchParams.get('cart_item_id');

    if (!cart_item_id) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Verify cart item belongs to user
    const [items] = await pool.execute(`
      SELECT ci.cart_item_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cart_item_id, user.userId]);

    if (!items || (items as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Delete auto-save history
    const [result] = await pool.execute(`
      DELETE FROM auto_save_history 
      WHERE cart_item_id = ?
    `, [cart_item_id]);

    return NextResponse.json({
      success: true,
      message: 'Auto-save history cleared successfully',
      deleted_records: (result as any).affectedRows
    });

  } catch (error) {
    console.error('Clear auto-save history error:', error);
    return NextResponse.json(
      { error: 'Failed to clear auto-save history' },
      { status: 500 }
    );
  }
}

// Helper function to validate configuration
function validateConfiguration(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object');
    return { valid: false, errors };
  }

  // Basic validation rules
  if (config.width && (typeof config.width !== 'number' || config.width <= 0)) {
    errors.push('Width must be a positive number');
  }

  if (config.height && (typeof config.height !== 'number' || config.height <= 0)) {
    errors.push('Height must be a positive number');
  }

  if (config.color && typeof config.color !== 'string') {
    errors.push('Color must be a string');
  }

  if (config.material && typeof config.material !== 'string') {
    errors.push('Material must be a string');
  }

  // Check for maximum configuration size
  const configString = JSON.stringify(config);
  if (configString.length > 10000) {
    errors.push('Configuration data is too large');
  }

  return { valid: errors.length === 0, errors };
}

// Helper function to calculate time ago
function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}