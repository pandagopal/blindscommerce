import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { verifyJWT } from '@/lib/auth/jwt';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
};

let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      competitorName,
      competitorUrl,
      competitorPrice,
      productId,
      currentPrice,
      additionalInfo
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !competitorName || !competitorUrl || !competitorPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(competitorUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid competitor URL format' },
        { status: 400 }
      );
    }

    // Validate price
    const parsedCompetitorPrice = parseFloat(competitorPrice);
    if (isNaN(parsedCompetitorPrice) || parsedCompetitorPrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid competitor price' },
        { status: 400 }
      );
    }

    // Check if we can potentially match this price (competitor price should be lower)
    if (currentPrice && parsedCompetitorPrice >= currentPrice) {
      return NextResponse.json(
        { error: 'Competitor price must be lower than our current price to qualify for price match' },
        { status: 400 }
      );
    }

    // Optional: Get user information from token if logged in
    let userId = null;
    try {
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        const decoded = await verifyJWT(token);
        userId = decoded.userId;
      }
    } catch (error) {
      // User not logged in, continue as guest
    }

    const db = getPool();
    
    // Insert price match request
    const [result] = await db.execute(
      `INSERT INTO price_match_requests (
        user_id,
        product_id,
        customer_name,
        customer_email,
        customer_phone,
        competitor_name,
        competitor_url,
        competitor_price,
        current_price,
        additional_info,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        userId,
        productId || null,
        name,
        email,
        phone,
        competitorName,
        competitorUrl,
        parsedCompetitorPrice,
        currentPrice || null,
        additionalInfo || null
      ]
    );

    const requestId = (result as mysql.ResultSetHeader).insertId;

    // Send notification email to admin (optional - implement email service)
    try {
      // You can integrate with your email service here
      // await sendPriceMatchNotification(requestId, body);
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Price match request submitted successfully. We will review and contact you within 24 hours.'
    });

  } catch (error) {
    console.error('Error processing price match request:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve price match requests (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    
    // Check if user is admin or super admin
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const db = getPool();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        pmr.*,
        p.name as product_name,
        p.slug as product_slug,
        u.email as user_email
      FROM price_match_requests pmr
      LEFT JOIN products p ON pmr.product_id = p.id
      LEFT JOIN users u ON pmr.user_id = u.id
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE pmr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY pmr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [requests] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM price_match_requests';
    const countParams: any[] = [];
    
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    return NextResponse.json({
      requests,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching price match requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}