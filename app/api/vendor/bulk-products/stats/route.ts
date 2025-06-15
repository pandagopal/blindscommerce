import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface StatsRow extends RowDataPacket {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_categories: number;
  recent_jobs: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    // Get vendor info
    const pool = await getPool();
    const [vendors] = await pool.execute(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ? AND is_active = 1',
      [user.userId]
    );

    if (!Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      );
    }

    const vendorId = (vendors[0] as any).vendor_info_id;

    // Get product statistics
    const [productStats] = await pool.execute<StatsRow[]>(
      `SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_products
      FROM products 
      WHERE vendor_id = ?`,
      [vendorId]
    );

    // Get category count
    const [categoryStats] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT category_id) as total_categories
      FROM products 
      WHERE vendor_id = ? AND category_id IS NOT NULL`,
      [vendorId]
    );

    // Get recent jobs count (last 30 days)
    const [jobStats] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as recent_jobs
      FROM bulk_product_jobs 
      WHERE vendor_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [vendorId]
    );

    const stats = {
      totalProducts: productStats[0]?.total_products || 0,
      activeProducts: productStats[0]?.active_products || 0,
      inactiveProducts: productStats[0]?.inactive_products || 0,
      totalCategories: categoryStats[0]?.total_categories || 0,
      recentJobs: jobStats[0]?.recent_jobs || 0,
    };

    return NextResponse.json({
      stats,
    });

  } catch (error) {
    console.error('Error fetching bulk product stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}