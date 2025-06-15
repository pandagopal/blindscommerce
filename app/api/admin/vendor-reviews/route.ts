import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface VendorReview extends RowDataPacket {
  rating_id: number;
  vendor_id: number;
  user_id: number;
  overall_rating: number;
  service_quality: number;
  communication: number;
  delivery: number;
  review_title: string;
  review_text: string;
  is_approved: boolean;
  created_at: string;
  user_name: string;
  vendor_name: string;
  business_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected'
    const vendorId = searchParams.get('vendorId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const pool = await getPool();

    let query = `
      SELECT 
        vr.rating_id,
        vr.vendor_id,
        vr.user_id,
        vr.overall_rating,
        vr.service_quality,
        vr.communication,
        vr.delivery,
        vr.review_title,
        vr.review_text,
        vr.is_approved,
        vr.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        vi.company_name as vendor_name,
        vi.business_name
      FROM vendor_ratings vr
      LEFT JOIN users u ON vr.user_id = u.user_id
      LEFT JOIN vendor_info vi ON vr.vendor_id = vi.vendor_info_id
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (status === 'pending') {
      query += ' AND vr.is_approved = 0';
    } else if (status === 'approved') {
      query += ' AND vr.is_approved = 1';
    }

    if (vendorId) {
      query += ' AND vr.vendor_id = ?';
      queryParams.push(vendorId);
    }

    query += ' ORDER BY vr.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [reviews] = await pool.execute<VendorReview[]>(query, queryParams);

    // Get counts for dashboard
    const [counts] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved
      FROM vendor_ratings`,
      []
    );

    return NextResponse.json({
      reviews,
      counts: counts[0] || { total: 0, pending: 0, approved: 0 },
      pagination: {
        limit,
        offset,
        total: reviews.length,
      },
    });

  } catch (error) {
    console.error('Error fetching vendor reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor reviews' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { reviewIds, action, adminId } = await request.json();

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { error: 'Review IDs are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const isApproved = action === 'approve' ? 1 : 0;
    const placeholders = reviewIds.map(() => '?').join(',');

    // Update review status
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE vendor_ratings 
       SET is_approved = ?, updated_at = NOW() 
       WHERE rating_id IN (${placeholders})`,
      [isApproved, ...reviewIds]
    );

    if (action === 'approve') {
      // Update vendor performance metrics for approved reviews
      const [affectedVendors] = await pool.execute<RowDataPacket[]>(
        `SELECT DISTINCT vendor_id FROM vendor_ratings WHERE rating_id IN (${placeholders})`,
        reviewIds
      );

      // Update performance metrics for each affected vendor
      for (const vendor of affectedVendors) {
        await updateVendorPerformanceMetrics(vendor.vendor_id);
      }
    }

    // Log the action (optional - for audit trail)
    if (adminId) {
      await pool.execute(
        `INSERT INTO admin_actions (admin_id, action_type, target_type, target_ids, created_at)
         VALUES (?, ?, 'vendor_review', ?, NOW())`,
        [adminId, `${action}_vendor_reviews`, JSON.stringify(reviewIds)]
      );
    }

    return NextResponse.json({
      message: `Successfully ${action}ed ${result.affectedRows} review(s)`,
      affected: result.affectedRows,
    });

  } catch (error) {
    console.error('Error updating vendor reviews:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor reviews' },
      { status: 500 }
    );
  }
}

// Helper function to update vendor performance metrics
async function updateVendorPerformanceMetrics(vendorId: number) {
  try {
    const pool = await getPool();

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
    console.error('Error updating vendor performance metrics:', error);
  }
}