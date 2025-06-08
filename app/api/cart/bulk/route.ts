import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Perform bulk operations on cart items
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
      action, 
      cart_item_ids = [], 
      target_quantity, 
      target_cart_id,
      filters = {} 
    } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get user's active cart
    const [carts] = await pool.execute(
      'SELECT cart_id FROM carts WHERE user_id = ? AND status = "active" LIMIT 1',
      [user.userId]
    );

    if (!carts || (carts as any[]).length === 0) {
      return NextResponse.json(
        { error: 'No active cart found' },
        { status: 404 }
      );
    }

    const cart_id = (carts as any[])[0].cart_id;
    let affected_items = 0;
    let operation_results = [];

    switch (action) {
      case 'remove_selected':
        if (cart_item_ids.length === 0) {
          return NextResponse.json(
            { error: 'No items selected for removal' },
            { status: 400 }
          );
        }

        // Verify items belong to user's cart
        const [itemsToRemove] = await pool.execute(`
          SELECT ci.*, p.name as product_name
          FROM cart_items ci
          JOIN carts c ON ci.cart_id = c.cart_id
          JOIN products p ON ci.product_id = p.product_id
          WHERE ci.cart_item_id IN (${cart_item_ids.map(() => '?').join(',')})
            AND c.user_id = ? AND ci.saved_for_later = false
        `, [...cart_item_ids, user.userId]);

        if ((itemsToRemove as any[]).length === 0) {
          return NextResponse.json(
            { error: 'No valid items found for removal' },
            { status: 404 }
          );
        }

        // Remove items
        await pool.execute(`
          DELETE FROM cart_items 
          WHERE cart_item_id IN (${cart_item_ids.map(() => '?').join(',')})
        `, cart_item_ids);

        affected_items = (itemsToRemove as any[]).length;
        operation_results = (itemsToRemove as any[]).map(item => ({
          cart_item_id: item.cart_item_id,
          product_name: item.product_name,
          quantity: item.quantity,
          action: 'removed'
        }));

        break;

      case 'save_selected_for_later':
        if (cart_item_ids.length === 0) {
          return NextResponse.json(
            { error: 'No items selected to save for later' },
            { status: 400 }
          );
        }

        // Verify items belong to user's cart
        const [itemsToSave] = await pool.execute(`
          SELECT ci.*, p.name as product_name
          FROM cart_items ci
          JOIN carts c ON ci.cart_id = c.cart_id
          JOIN products p ON ci.product_id = p.product_id
          WHERE ci.cart_item_id IN (${cart_item_ids.map(() => '?').join(',')})
            AND c.user_id = ? AND ci.saved_for_later = false
        `, [...cart_item_ids, user.userId]);

        if ((itemsToSave as any[]).length === 0) {
          return NextResponse.json(
            { error: 'No valid items found to save for later' },
            { status: 404 }
          );
        }

        // Update items to saved for later
        await pool.execute(`
          UPDATE cart_items 
          SET saved_for_later = true, updated_at = NOW()
          WHERE cart_item_id IN (${cart_item_ids.map(() => '?').join(',')})
        `, cart_item_ids);

        affected_items = (itemsToSave as any[]).length;
        operation_results = (itemsToSave as any[]).map(item => ({
          cart_item_id: item.cart_item_id,
          product_name: item.product_name,
          quantity: item.quantity,
          action: 'saved_for_later'
        }));

        break;

      case 'move_to_cart':
        if (cart_item_ids.length === 0) {
          return NextResponse.json(
            { error: 'No items selected to move to cart' },
            { status: 400 }
          );
        }

        // Verify saved items belong to user
        const [savedItems] = await pool.execute(`
          SELECT ci.*, p.name as product_name, p.stock_quantity
          FROM cart_items ci
          JOIN carts c ON ci.cart_id = c.cart_id
          JOIN products p ON ci.product_id = p.product_id
          WHERE ci.cart_item_id IN (${cart_item_ids.map(() => '?').join(',')})
            AND c.user_id = ? AND ci.saved_for_later = true
        `, [...cart_item_ids, user.userId]);

        if ((savedItems as any[]).length === 0) {
          return NextResponse.json(
            { error: 'No valid saved items found' },
            { status: 404 }
          );
        }

        // Check stock availability and move items
        for (const item of (savedItems as any[])) {
          if (item.stock_quantity >= item.quantity) {
            await pool.execute(`
              UPDATE cart_items 
              SET saved_for_later = false, updated_at = NOW()
              WHERE cart_item_id = ?
            `, [item.cart_item_id]);

            operation_results.push({
              cart_item_id: item.cart_item_id,
              product_name: item.product_name,
              quantity: item.quantity,
              action: 'moved_to_cart'
            });
            affected_items++;
          } else {
            operation_results.push({
              cart_item_id: item.cart_item_id,
              product_name: item.product_name,
              quantity: item.quantity,
              action: 'insufficient_stock',
              available_stock: item.stock_quantity
            });
          }
        }

        break;

      case 'update_quantities':
        if (cart_item_ids.length === 0 || !target_quantity) {
          return NextResponse.json(
            { error: 'Items and target quantity required' },
            { status: 400 }
          );
        }

        if (target_quantity <= 0) {
          return NextResponse.json(
            { error: 'Target quantity must be greater than 0' },
            { status: 400 }
          );
        }

        // Verify items and update quantities
        const [itemsToUpdate] = await pool.execute(`
          SELECT ci.*, p.name as product_name, p.stock_quantity, p.max_quantity_per_order
          FROM cart_items ci
          JOIN carts c ON ci.cart_id = c.cart_id
          JOIN products p ON ci.product_id = p.product_id
          WHERE ci.cart_item_id IN (${cart_item_ids.map(() => '?').join(',')})
            AND c.user_id = ? AND ci.saved_for_later = false
        `, [...cart_item_ids, user.userId]);

        for (const item of (itemsToUpdate as any[])) {
          const maxQuantity = Math.min(
            item.stock_quantity,
            item.max_quantity_per_order || 999
          );

          if (target_quantity <= maxQuantity) {
            await pool.execute(`
              UPDATE cart_items 
              SET quantity = ?, updated_at = NOW()
              WHERE cart_item_id = ?
            `, [target_quantity, item.cart_item_id]);

            operation_results.push({
              cart_item_id: item.cart_item_id,
              product_name: item.product_name,
              old_quantity: item.quantity,
              new_quantity: target_quantity,
              action: 'quantity_updated'
            });
            affected_items++;
          } else {
            operation_results.push({
              cart_item_id: item.cart_item_id,
              product_name: item.product_name,
              requested_quantity: target_quantity,
              max_available: maxQuantity,
              action: 'quantity_limit_exceeded'
            });
          }
        }

        break;

      case 'clear_cart':
        // Remove all items from cart (not saved for later)
        const [allItems] = await pool.execute(`
          SELECT ci.cart_item_id, p.name as product_name, ci.quantity
          FROM cart_items ci
          JOIN carts c ON ci.cart_id = c.cart_id
          JOIN products p ON ci.product_id = p.product_id
          WHERE c.user_id = ? AND ci.saved_for_later = false
        `, [user.userId]);

        if ((allItems as any[]).length > 0) {
          await pool.execute(`
            DELETE ci FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.cart_id
            WHERE c.user_id = ? AND ci.saved_for_later = false
          `, [user.userId]);

          affected_items = (allItems as any[]).length;
          operation_results = (allItems as any[]).map(item => ({
            cart_item_id: item.cart_item_id,
            product_name: item.product_name,
            quantity: item.quantity,
            action: 'removed'
          }));
        }

        break;

      case 'apply_filter_action':
        // Apply action based on filters (e.g., remove out of stock items)
        let filterQuery = `
          SELECT ci.*, p.name as product_name, p.stock_quantity, p.status as product_status
          FROM cart_items ci
          JOIN carts c ON ci.cart_id = c.cart_id
          JOIN products p ON ci.product_id = p.product_id
          WHERE c.user_id = ? AND ci.saved_for_later = false
        `;
        const filterParams = [user.userId];

        if (filters.out_of_stock) {
          filterQuery += ' AND (p.stock_quantity <= 0 OR p.status != "active")';
        }
        if (filters.low_stock) {
          filterQuery += ' AND p.stock_quantity <= 5 AND p.stock_quantity > 0';
        }
        if (filters.price_changed) {
          filterQuery += ' AND ci.unit_price != p.price';
        }

        const [filteredItems] = await pool.execute(filterQuery, filterParams);

        if ((filteredItems as any[]).length > 0) {
          const filteredIds = (filteredItems as any[]).map(item => item.cart_item_id);
          
          if (filters.action === 'remove') {
            await pool.execute(`
              DELETE FROM cart_items 
              WHERE cart_item_id IN (${filteredIds.map(() => '?').join(',')})
            `, filteredIds);

            operation_results = (filteredItems as any[]).map(item => ({
              cart_item_id: item.cart_item_id,
              product_name: item.product_name,
              quantity: item.quantity,
              action: 'removed_by_filter'
            }));
          } else if (filters.action === 'save_for_later') {
            await pool.execute(`
              UPDATE cart_items 
              SET saved_for_later = true, updated_at = NOW()
              WHERE cart_item_id IN (${filteredIds.map(() => '?').join(',')})
            `, filteredIds);

            operation_results = (filteredItems as any[]).map(item => ({
              cart_item_id: item.cart_item_id,
              product_name: item.product_name,
              quantity: item.quantity,
              action: 'saved_for_later_by_filter'
            }));
          }

          affected_items = (filteredItems as any[]).length;
        }

        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

    // Update cart timestamp
    await pool.execute(
      'UPDATE carts SET updated_at = NOW() WHERE cart_id = ?',
      [cart_id]
    );

    // Log bulk operation analytics
    await pool.execute(`
      INSERT INTO cart_analytics (
        cart_id, user_id, action_type, 
        new_value, timestamp
      ) VALUES (?, ?, 'bulk_operation', ?, NOW())
    `, [
      cart_id,
      user.userId,
      JSON.stringify({
        action,
        affected_items,
        cart_item_ids: cart_item_ids.length > 0 ? cart_item_ids : 'all',
        filters: Object.keys(filters).length > 0 ? filters : null
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Bulk operation '${action}' completed successfully`,
      affected_items,
      operation_results,
      summary: {
        total_operations: operation_results.length,
        successful_operations: operation_results.filter(r => 
          !r.action.includes('exceeded') && !r.action.includes('insufficient')
        ).length
      }
    });

  } catch (error) {
    console.error('Bulk cart operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

// GET - Get bulk operation options and suggestions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const pool = await getPool();

    // Get cart analysis for bulk operation suggestions
    const [cartAnalysis] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN ci.saved_for_later = false THEN 1 END) as active_items,
        COUNT(CASE WHEN ci.saved_for_later = true THEN 1 END) as saved_items,
        COUNT(CASE WHEN p.stock_quantity <= 0 OR p.status != 'active' THEN 1 END) as unavailable_items,
        COUNT(CASE WHEN p.stock_quantity <= 5 AND p.stock_quantity > 0 THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN ci.unit_price != p.price THEN 1 END) as price_changed_items,
        SUM(CASE WHEN ci.saved_for_later = false THEN ci.quantity * ci.unit_price ELSE 0 END) as active_cart_value,
        SUM(CASE WHEN ci.saved_for_later = true THEN ci.quantity * ci.unit_price ELSE 0 END) as saved_cart_value
      FROM carts c
      JOIN cart_items ci ON c.cart_id = ci.cart_id
      JOIN products p ON ci.product_id = p.product_id
      WHERE c.user_id = ? AND c.status = 'active'
    `, [user.userId]);

    const analysis = (cartAnalysis as any[])[0] || {};

    // Generate bulk operation suggestions
    const suggestions = [];

    if (analysis.unavailable_items > 0) {
      suggestions.push({
        action: 'remove_unavailable',
        title: `Remove ${analysis.unavailable_items} unavailable item(s)`,
        description: 'Remove items that are out of stock or no longer available',
        priority: 'high',
        filter: { out_of_stock: true, action: 'remove' }
      });
    }

    if (analysis.low_stock_items > 0) {
      suggestions.push({
        action: 'save_low_stock',
        title: `Save ${analysis.low_stock_items} low stock item(s) for later`,
        description: 'Move low stock items to saved for later to secure them',
        priority: 'medium',
        filter: { low_stock: true, action: 'save_for_later' }
      });
    }

    if (analysis.price_changed_items > 0) {
      suggestions.push({
        action: 'review_price_changes',
        title: `Review ${analysis.price_changed_items} item(s) with price changes`,
        description: 'Items in your cart have different prices than when added',
        priority: 'medium',
        requires_review: true
      });
    }

    if (analysis.saved_items > 0) {
      suggestions.push({
        action: 'move_saved_to_cart',
        title: `Add ${analysis.saved_items} saved item(s) to cart`,
        description: 'Move your saved for later items back to cart',
        priority: 'low'
      });
    }

    // Available bulk actions
    const available_actions = [
      {
        action: 'remove_selected',
        title: 'Remove Selected Items',
        description: 'Remove selected items from cart',
        requires_selection: true
      },
      {
        action: 'save_selected_for_later',
        title: 'Save Selected for Later',
        description: 'Move selected items to saved for later',
        requires_selection: true
      },
      {
        action: 'move_to_cart',
        title: 'Move to Cart',
        description: 'Move saved items back to cart',
        applies_to: 'saved_items'
      },
      {
        action: 'update_quantities',
        title: 'Update Quantities',
        description: 'Set the same quantity for selected items',
        requires_selection: true,
        requires_input: 'quantity'
      },
      {
        action: 'clear_cart',
        title: 'Clear Cart',
        description: 'Remove all items from cart',
        requires_confirmation: true
      }
    ];

    return NextResponse.json({
      success: true,
      cart_analysis: {
        active_items: analysis.active_items || 0,
        saved_items: analysis.saved_items || 0,
        unavailable_items: analysis.unavailable_items || 0,
        low_stock_items: analysis.low_stock_items || 0,
        price_changed_items: analysis.price_changed_items || 0,
        active_cart_value: parseFloat(analysis.active_cart_value || 0),
        saved_cart_value: parseFloat(analysis.saved_cart_value || 0)
      },
      suggestions,
      available_actions
    });

  } catch (error) {
    console.error('Get bulk options error:', error);
    return NextResponse.json(
      { error: 'Failed to get bulk operation options' },
      { status: 500 }
    );
  }
}