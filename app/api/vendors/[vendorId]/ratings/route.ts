import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface VendorRating extends RowDataPacket {
  rating_id: number;
  vendor_id: number;
  user_id: number;
  order_id: number;
  overall_rating: number;
  service_quality: number;
  communication: number;
  delivery: number;
  review_title: string;
  review_text: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user_first_name: string;
  user_last_name: string;
  order_number: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const approved = searchParams.get('approved') !== 'false';

    const pool = await getPool();

    // Get vendor ratings with user information
    let query = `
      SELECT 
        vr.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        o.order_number
      FROM vendor_ratings vr
      LEFT JOIN users u ON vr.user_id = u.user_id
      LEFT JOIN orders o ON vr.order_id = o.order_id
      WHERE vr.vendor_id = ?
    `;

    const queryParams: any[] = [vendorId];

    if (approved) {
      query += ' AND vr.is_approved = 1';
    }

    query += ' ORDER BY vr.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [ratings] = await pool.execute<VendorRating[]>(query, queryParams);

    // Get summary statistics
    const [stats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_rating) as avg_overall_rating,
        AVG(service_quality) as avg_service_quality,
        AVG(communication) as avg_communication,
        AVG(delivery) as avg_delivery,
        SUM(CASE WHEN overall_rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN overall_rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN overall_rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN overall_rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN overall_rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM vendor_ratings 
      WHERE vendor_id = ? AND is_approved = 1`,
      [vendorId]
    );

    return NextResponse.json({
      ratings: ratings.map(rating => ({
        ...rating,
        // Hide sensitive user information for privacy
        user_name: rating.user_first_name ? 
          `${rating.user_first_name} ${rating.user_last_name?.[0] || ''}.` : 
          'Anonymous',
      })),
      stats: stats[0] || {
        total_reviews: 0,
        avg_overall_rating: 0,
        avg_service_quality: 0,
        avg_communication: 0,
        avg_delivery: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
      },
      pagination: {
        limit,
        offset,
        total: ratings.length,
      },
    });

  } catch (error) {
    console.error('Error fetching vendor ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor ratings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const {
      user_id,
      order_id,
      overall_rating,
      service_quality,
      communication,
      delivery,
      review_title,
      review_text,
    } = await request.json();

    // Validate required fields
    if (!user_id || !overall_rating || overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating data' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Check if user has already reviewed this vendor for this order
    if (order_id) {
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT rating_id FROM vendor_ratings WHERE vendor_id = ? AND user_id = ? AND order_id = ?',
        [vendorId, user_id, order_id]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'You have already reviewed this vendor for this order' },
          { status: 409 }
        );
      }
    }

    // Verify that the order belongs to this user and vendor (if order_id provided)
    if (order_id) {
      const [orderCheck] = await pool.execute<RowDataPacket[]>(
        `SELECT o.order_id 
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN vendor_products vp ON oi.product_id = vp.product_id
         WHERE o.order_id = ? AND o.user_id = ? AND vp.vendor_id = ?`,
        [order_id, user_id, vendorId]
      );

      if (orderCheck.length === 0) {
        return NextResponse.json(
          { error: 'Invalid order for this vendor and user' },
          { status: 403 }
        );
      }
    }

    // Insert the rating
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO vendor_ratings (
        vendor_id, user_id, order_id, overall_rating, service_quality, 
        communication, delivery, review_title, review_text, 
        is_verified_purchase, is_approved, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [
        vendorId,
        user_id,
        order_id || null,
        overall_rating,
        service_quality || overall_rating,
        communication || overall_rating,
        delivery || overall_rating,
        review_title || '',
        review_text || '',
        order_id ? 1 : 0, // Verified purchase if order_id provided
      ]
    );

    // Update vendor performance metrics
    await updateVendorPerformance(parseInt(vendorId));

    return NextResponse.json({
      message: 'Rating submitted successfully',
      rating_id: result.insertId,
    });

  } catch (error) {
    console.error('Error creating vendor rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

// Helper function to update vendor performance metrics
async function updateVendorPerformance(vendorId: number) {
  try {
    const pool = await getPool();

    // Calculate average ratings and update performance table
    const [metrics] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(overall_rating) as avg_rating,
        AVG(service_quality) as avg_service,
        AVG(communication) as avg_communication,
        AVG(delivery) as avg_delivery,
        COUNT(*) as total_reviews
      FROM vendor_ratings 
      WHERE vendor_id = ? AND is_approved = 1`,
      [vendorId]
    );

    if (metrics.length > 0) {
      const metric = metrics[0];
      
      // Update or insert vendor performance record
      await pool.execute(
        `INSERT INTO vendor_performance (
          vendor_id, avg_rating, service_rating, communication_rating, 
          delivery_rating, total_reviews, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          avg_rating = VALUES(avg_rating),
          service_rating = VALUES(service_rating),
          communication_rating = VALUES(communication_rating),
          delivery_rating = VALUES(delivery_rating),
          total_reviews = VALUES(total_reviews),
          last_updated = NOW()`,
        [
          vendorId,
          parseFloat(metric.avg_rating || 0).toFixed(2),
          parseFloat(metric.avg_service || 0).toFixed(2),
          parseFloat(metric.avg_communication || 0).toFixed(2),
          parseFloat(metric.avg_delivery || 0).toFixed(2),
          metric.total_reviews,
        ]
      );
    }
  } catch (error) {
    console.error('Error updating vendor performance:', error);
  }
}