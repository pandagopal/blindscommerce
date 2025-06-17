import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface RecentlyViewedRow extends RowDataPacket {
  product_id: number;
  name: string;
  slug: string;
  short_description: string;
  base_price: number;
  sale_price: number | null;
  rating: number;
  review_count: number;
  primary_image: string | null;
  category_name: string;
  brand_name: string | null;
  viewed_at: string;
  is_active: number; // MySQL TINYINT(1) returns 0/1
}

// GET /api/recently-viewed - Get recently viewed products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const sessionId = searchParams.get('sessionId') || req.headers.get('x-session-id');
    
    const user = await getCurrentUser();
    const pool = await getPool();

    // Check if there are any recently viewed records first
    let countQuery = '';
    let countParams: any[] = [];
    
    if (user) {
      countQuery = 'SELECT COUNT(*) as count FROM recently_viewed WHERE user_id = ?';
      countParams = [parseInt(user.userId)];
    } else if (sessionId) {
      countQuery = 'SELECT COUNT(*) as count FROM recently_viewed WHERE session_id = ? AND user_id IS NULL';
      countParams = [sessionId];
    } else {
      return NextResponse.json({
        success: true,
        products: [],
        total: 0
      });
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const count = (countResult as any[])[0]?.count || 0;
    
    if (count === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        total: 0
      });
    }

    let query = `
      SELECT 
        rv.product_id,
        rv.viewed_at,
        p.name,
        p.slug,
        p.short_description,
        p.base_price,
        NULL as sale_price,
        p.rating,
        p.review_count,
        p.is_active,
        c.name as category_name,
        vi.business_name as brand_name,
        (
          SELECT image_url
          FROM product_images
          WHERE product_id = p.product_id AND is_primary = 1
          LIMIT 1
        ) as primary_image
      FROM recently_viewed rv
      JOIN products p ON rv.product_id = p.product_id
      LEFT JOIN product_categories pc ON p.product_id = pc.product_id AND pc.is_primary = 1
      LEFT JOIN categories c ON pc.category_id = c.category_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
      WHERE p.is_active = 1
    `;

    const queryParams: any[] = [];

    if (user) {
      query += ' AND rv.user_id = ?';
      queryParams.push(parseInt(user.userId));
    } else if (sessionId) {
      query += ' AND rv.session_id = ? AND rv.user_id IS NULL';
      queryParams.push(sessionId);
    }

    query += ' ORDER BY rv.viewed_at DESC LIMIT ?';
    queryParams.push(limit);

    const [products] = await pool.execute<RecentlyViewedRow[]>(query, queryParams);

    // Format response
    const formattedProducts = products.map(product => ({
      id: product.product_id,
      name: product.name,
      slug: product.slug,
      description: product.short_description,
      basePrice: product.base_price,
      salePrice: product.sale_price,
      rating: product.rating,
      reviewCount: product.review_count,
      primaryImage: product.primary_image,
      categoryName: product.category_name,
      brandName: product.brand_name,
      viewedAt: product.viewed_at,
      isActive: Boolean(product.is_active) // Convert 0/1 to false/true
    }));

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      total: products.length
    });

  } catch (error) {
    console.error('Error fetching recently viewed products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recently viewed products' },
      { status: 500 }
    );
  }
}

// POST /api/recently-viewed - Track a viewed product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, sessionId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const pool = await getPool();

    // For guest users, require session ID
    if (!user && !sessionId) {
      return NextResponse.json(
        { error: 'Session ID required for guest users' },
        { status: 400 }
      );
    }

    // Verify product exists and is active
    const [productCheck] = await pool.execute<RowDataPacket[]>(
      'SELECT product_id FROM products WHERE product_id = ? AND is_active = 1',
      [productId]
    );

    if (productCheck.length === 0) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // Get client IP and user agent
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check if already viewed recently (within last hour)
    let existingViewQuery = '';
    let existingViewParams: any[] = [productId];

    if (user) {
      existingViewQuery = `
        SELECT id FROM recently_viewed 
        WHERE user_id = ? AND product_id = ? 
        AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        LIMIT 1
      `;
      existingViewParams = [parseInt(user.userId), productId];
    } else {
      existingViewQuery = `
        SELECT id FROM recently_viewed 
        WHERE session_id = ? AND product_id = ? AND user_id IS NULL
        AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        LIMIT 1
      `;
      existingViewParams = [sessionId, productId];
    }

    const [existingViews] = await pool.execute<RowDataPacket[]>(
      existingViewQuery, 
      existingViewParams
    );

    if (existingViews.length > 0) {
      // Update timestamp of existing view
      await pool.execute(
        'UPDATE recently_viewed SET viewed_at = NOW() WHERE id = ?',
        [existingViews[0].id]
      );
    } else {
      // Insert new view record
      await pool.execute(
        `INSERT INTO recently_viewed (
          user_id, 
          session_id, 
          product_id, 
          ip_address, 
          user_agent,
          viewed_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          user ? parseInt(user.userId) : null,
          user ? null : sessionId,
          productId,
          clientIp,
          userAgent
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product view tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking product view:', error);
    return NextResponse.json(
      { error: 'Failed to track product view' },
      { status: 500 }
    );
  }
}

// DELETE /api/recently-viewed - Clear recently viewed history
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const sessionId = searchParams.get('sessionId') || req.headers.get('x-session-id');
    
    const user = await getCurrentUser();
    const pool = await getPool();

    if (!user && !sessionId) {
      return NextResponse.json(
        { error: 'Authentication or session ID required' },
        { status: 400 }
      );
    }

    let deleteQuery = '';
    let deleteParams: any[] = [];

    if (productId) {
      // Delete specific product
      if (user) {
        deleteQuery = 'DELETE FROM recently_viewed WHERE user_id = ? AND product_id = ?';
        deleteParams = [parseInt(user.userId), productId];
      } else {
        deleteQuery = 'DELETE FROM recently_viewed WHERE session_id = ? AND product_id = ? AND user_id IS NULL';
        deleteParams = [sessionId, productId];
      }
    } else {
      // Clear all for user/session
      if (user) {
        deleteQuery = 'DELETE FROM recently_viewed WHERE user_id = ?';
        deleteParams = [parseInt(user.userId)];
      } else {
        deleteQuery = 'DELETE FROM recently_viewed WHERE session_id = ? AND user_id IS NULL';
        deleteParams = [sessionId];
      }
    }

    const [result] = await pool.execute(deleteQuery, deleteParams);
    const deletedCount = (result as any).affectedRows;

    return NextResponse.json({
      success: true,
      message: productId 
        ? `Product removed from recently viewed` 
        : `Cleared ${deletedCount} recently viewed products`,
      deletedCount
    });

  } catch (error) {
    console.error('Error clearing recently viewed:', error);
    return NextResponse.json(
      { error: 'Failed to clear recently viewed products' },
      { status: 500 }
    );
  }
}