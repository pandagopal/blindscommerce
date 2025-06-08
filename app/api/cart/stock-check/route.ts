import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST - Check stock availability for cart items
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { product_ids, cart_id } = await request.json();

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get stock information for requested products
    const [stockInfo] = await pool.execute(`
      SELECT 
        p.product_id,
        p.name,
        p.price,
        p.stock_quantity,
        p.status,
        p.low_stock_threshold,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status,
        p.restocking_date,
        p.max_quantity_per_order
      FROM products p
      WHERE p.product_id IN (${product_ids.map(() => '?').join(',')})
    `, product_ids);

    // Get current cart quantities if cart_id provided
    let cartQuantities = {};
    if (cart_id) {
      const [cartItems] = await pool.execute(`
        SELECT product_id, quantity 
        FROM cart_items 
        WHERE cart_id = ? AND saved_for_later = false
      `, [cart_id]);

      cartQuantities = (cartItems as any[]).reduce((acc, item) => {
        acc[item.product_id] = item.quantity;
        return acc;
      }, {});
    }

    // Process stock information
    const stockResults = (stockInfo as any[]).map(product => {
      const cartQty = cartQuantities[product.product_id] || 0;
      const availableQty = Math.max(0, product.stock_quantity - cartQty);
      
      let availability_message = '';
      let can_add_to_cart = true;
      let max_addable_quantity = product.stock_quantity;

      switch (product.stock_status) {
        case 'out_of_stock':
          availability_message = product.restocking_date 
            ? `Out of stock. Expected back in stock: ${product.restocking_date}`
            : 'Out of stock';
          can_add_to_cart = false;
          max_addable_quantity = 0;
          break;
        
        case 'low_stock':
          availability_message = `Only ${product.stock_quantity} left in stock`;
          max_addable_quantity = Math.min(
            product.stock_quantity, 
            product.max_quantity_per_order || 999
          );
          break;
        
        default:
          availability_message = 'In stock';
          max_addable_quantity = Math.min(
            product.stock_quantity, 
            product.max_quantity_per_order || 999
          );
      }

      // Check if current cart quantity exceeds available stock
      let quantity_issues = [];
      if (cartQty > product.stock_quantity) {
        quantity_issues.push({
          type: 'exceeds_stock',
          message: `Cart quantity (${cartQty}) exceeds available stock (${product.stock_quantity})`,
          suggested_quantity: product.stock_quantity
        });
        can_add_to_cart = false;
      }

      if (cartQty > (product.max_quantity_per_order || 999)) {
        quantity_issues.push({
          type: 'exceeds_max_order',
          message: `Cart quantity (${cartQty}) exceeds maximum order quantity (${product.max_quantity_per_order})`,
          suggested_quantity: product.max_quantity_per_order
        });
      }

      return {
        product_id: product.product_id,
        product_name: product.name,
        current_price: parseFloat(product.price),
        stock_quantity: product.stock_quantity,
        stock_status: product.stock_status,
        cart_quantity: cartQty,
        available_quantity: availableQty,
        availability_message,
        can_add_to_cart,
        max_addable_quantity,
        low_stock_threshold: product.low_stock_threshold,
        restocking_date: product.restocking_date,
        max_quantity_per_order: product.max_quantity_per_order,
        quantity_issues,
        last_checked: new Date().toISOString()
      };
    });

    // Calculate overall cart stock status
    const overall_status = {
      all_items_available: stockResults.every(item => item.can_add_to_cart && item.stock_status !== 'out_of_stock'),
      out_of_stock_count: stockResults.filter(item => item.stock_status === 'out_of_stock').length,
      low_stock_count: stockResults.filter(item => item.stock_status === 'low_stock').length,
      quantity_issues_count: stockResults.filter(item => item.quantity_issues.length > 0).length,
      total_cart_value: stockResults.reduce((sum, item) => 
        sum + (item.current_price * item.cart_quantity), 0
      )
    };

    // Log stock check analytics
    if (cart_id) {
      await pool.execute(`
        INSERT INTO cart_analytics (
          cart_id, user_id, action_type, 
          new_value, timestamp
        ) VALUES (?, ?, 'stock_checked', ?, NOW())
      `, [
        cart_id,
        user.userId,
        JSON.stringify({
          products_checked: product_ids.length,
          out_of_stock: overall_status.out_of_stock_count,
          low_stock: overall_status.low_stock_count,
          issues: overall_status.quantity_issues_count
        })
      ]);
    }

    return NextResponse.json({
      success: true,
      stock_results: stockResults,
      overall_status,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock check error:', error);
    return NextResponse.json(
      { error: 'Failed to check stock availability' },
      { status: 500 }
    );
  }
}

// GET - Get real-time stock status for specific products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const product_ids = searchParams.get('product_ids')?.split(',') || [];
    const include_alternatives = searchParams.get('alternatives') === 'true';

    if (product_ids.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get current stock levels
    const [stockLevels] = await pool.execute(`
      SELECT 
        p.product_id,
        p.name,
        p.slug,
        p.price,
        p.stock_quantity,
        p.status,
        p.low_stock_threshold,
        p.restocking_date,
        p.supplier_id,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status,
        pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.product_id IN (${product_ids.map(() => '?').join(',')})
    `, product_ids);

    let alternatives = [];
    if (include_alternatives) {
      // Get alternative products for out of stock items
      const outOfStockIds = (stockLevels as any[])
        .filter(p => p.stock_status === 'out_of_stock')
        .map(p => p.product_id);

      if (outOfStockIds.length > 0) {
        const [alternativeProducts] = await pool.execute(`
          SELECT DISTINCT
            p2.product_id,
            p2.name,
            p2.slug,
            p2.price,
            p2.stock_quantity,
            p2.stock_quantity > 0 as in_stock,
            pi2.image_url,
            'category_match' as match_type
          FROM products p1
          JOIN product_categories pc1 ON p1.product_id = pc1.product_id
          JOIN product_categories pc2 ON pc1.category_id = pc2.category_id
          JOIN products p2 ON pc2.product_id = p2.product_id
          LEFT JOIN product_images pi2 ON p2.product_id = pi2.product_id AND pi2.is_primary = 1
          WHERE p1.product_id IN (${outOfStockIds.map(() => '?').join(',')})
            AND p2.product_id NOT IN (${outOfStockIds.map(() => '?').join(',')})
            AND p2.status = 'active'
            AND p2.stock_quantity > 0
          ORDER BY p2.stock_quantity DESC, p2.price ASC
          LIMIT 20
        `, [...outOfStockIds, ...outOfStockIds]);

        alternatives = alternativeProducts;
      }
    }

    const formattedStock = (stockLevels as any[]).map(product => ({
      product_id: product.product_id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      stock_quantity: product.stock_quantity,
      stock_status: product.stock_status,
      low_stock_threshold: product.low_stock_threshold,
      restocking_date: product.restocking_date,
      image_url: product.image_url,
      availability_text: product.stock_status === 'out_of_stock' 
        ? 'Out of Stock'
        : product.stock_status === 'low_stock'
        ? `Only ${product.stock_quantity} left`
        : 'In Stock'
    }));

    return NextResponse.json({
      success: true,
      stock_levels: formattedStock,
      alternatives: alternatives || [],
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get stock levels error:', error);
    return NextResponse.json(
      { error: 'Failed to get stock levels' },
      { status: 500 }
    );
  }
}