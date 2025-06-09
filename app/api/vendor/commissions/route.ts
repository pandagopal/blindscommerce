import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface CommissionRow extends RowDataPacket {
  commission_id: number;
  vendor_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_name: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  commission_status: string;
  commission_date: string;
  payment_date: string | null;
  payment_reference: string | null;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_commission: number;
  commission_earned: number;
  commission_paid: number;
  commission_pending: number;
  payment_status: string;
  created_at: string;
  customer_name: string;
  order_date: string;
}

// GET: Fetch vendor commissions and earnings
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'current'; // current, last_month, last_quarter, year
    const status = searchParams.get('status'); // pending, paid, all
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const pool = await getPool();
    
    // Get vendor info
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id, commission_rate FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (vendorInfo.length === 0) {
      return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;
    const defaultCommissionRate = vendorInfo[0].commission_rate || 15.00;

    // Calculate period dates
    let periodFilter = '';
    const queryParams: any[] = [vendorId];
    
    switch (period) {
      case 'current':
        periodFilter = ' AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)';
        break;
      case 'last_month':
        periodFilter = ' AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH) AND o.created_at < DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)';
        break;
      case 'last_quarter':
        periodFilter = ' AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)';
        break;
      case 'year':
        periodFilter = ' AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)';
        break;
    }

    // Get commission summary
    const [summary] = await pool.execute<CommissionRow[]>(
      `SELECT 
        SUM(oi.total_price) as total_sales,
        SUM(oi.total_price * (? / 100)) as total_commission,
        SUM(CASE WHEN o.order_status IN ('completed', 'delivered') THEN oi.total_price * (? / 100) ELSE 0 END) as commission_earned,
        SUM(CASE WHEN vc.payment_status = 'paid' THEN vc.commission_amount ELSE 0 END) as commission_paid,
        SUM(CASE WHEN vc.commission_status = 'pending' AND o.order_status IN ('completed', 'delivered') THEN vc.commission_amount ELSE 0 END) as commission_pending
      FROM vendor_products vp
      JOIN order_items oi ON vp.product_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN vendor_commissions vc ON oi.order_item_id = vc.order_item_id
      WHERE vp.vendor_id = ?${periodFilter}`,
      [defaultCommissionRate, defaultCommissionRate, vendorId]
    );

    // Get detailed commission records
    let statusFilter = '';
    if (status && status !== 'all') {
      statusFilter = ' AND vc.commission_status = ?';
      queryParams.push(status);
    }

    const [commissions] = await pool.execute<CommissionRow[]>(
      `SELECT 
        vc.commission_id,
        vc.order_id,
        vc.order_item_id,
        vc.product_id,
        vc.sale_amount,
        vc.commission_rate,
        vc.commission_amount,
        vc.commission_status,
        vc.commission_date,
        vc.payment_date,
        vc.payment_reference,
        vc.created_at,
        p.name as product_name,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        o.created_at as order_date
      FROM vendor_commissions vc
      JOIN products p ON vc.product_id = p.product_id
      JOIN orders o ON vc.order_id = o.order_id
      JOIN users u ON o.user_id = u.user_id
      WHERE vc.vendor_id = ?${periodFilter}${statusFilter}
      ORDER BY vc.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get monthly earnings trend
    const [monthlyEarnings] = await pool.execute<CommissionRow[]>(
      `SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as period_start,
        SUM(oi.total_price) as total_sales,
        SUM(oi.total_price * (? / 100)) as commission_earned
      FROM vendor_products vp
      JOIN order_items oi ON vp.product_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE vp.vendor_id = ? 
        AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
        AND o.order_status IN ('completed', 'delivered')
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY period_start ASC`,
      [defaultCommissionRate, vendorId]
    );

    const summaryData = summary[0] || {
      total_sales: 0,
      total_commission: 0,
      commission_earned: 0,
      commission_paid: 0,
      commission_pending: 0
    };

    return NextResponse.json({
      success: true,
      commissions: {
        summary: {
          totalSales: Number(summaryData.total_sales || 0),
          totalCommission: Number(summaryData.total_commission || 0),
          commissionEarned: Number(summaryData.commission_earned || 0),
          commissionPaid: Number(summaryData.commission_paid || 0),
          commissionPending: Number(summaryData.commission_pending || 0),
          commissionRate: defaultCommissionRate
        },
        records: commissions.map(commission => ({
          commissionId: commission.commission_id,
          orderId: commission.order_id,
          orderItemId: commission.order_item_id,
          productId: commission.product_id,
          productName: commission.product_name,
          customerName: commission.customer_name,
          saleAmount: Number(commission.sale_amount),
          commissionRate: Number(commission.commission_rate),
          commissionAmount: Number(commission.commission_amount),
          commissionStatus: commission.commission_status,
          commissionDate: commission.commission_date,
          orderDate: commission.order_date,
          paymentDate: commission.payment_date,
          paymentReference: commission.payment_reference
        })),
        monthlyTrend: monthlyEarnings.map(earning => ({
          period: earning.period_start,
          totalSales: Number(earning.total_sales),
          commissionEarned: Number(earning.commission_earned)
        })),
        pagination: {
          limit,
          offset,
          total: commissions.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching vendor commissions:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor commissions' }, { status: 500 });
  }
}

// POST: Generate commission records for completed orders (admin function)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'vendor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, force_regenerate } = body;

    const pool = await getPool();

    let vendorId = null;
    if (user.role === 'vendor') {
      // Get vendor info for vendor users
      const [vendorInfo] = await pool.execute<RowDataPacket[]>(
        'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
        [user.userId]
      );

      if (vendorInfo.length === 0) {
        return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
      }
      vendorId = vendorInfo[0].vendor_info_id;
    }

    // Get orders to process
    let orderFilter = '';
    const queryParams: any[] = [];
    
    if (order_id) {
      orderFilter = ' AND o.order_id = ?';
      queryParams.push(order_id);
    }

    if (vendorId) {
      orderFilter += ' AND vp.vendor_id = ?';
      queryParams.push(vendorId);
    }

    // Get completed orders that need commission calculation
    const [orderItems] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        oi.order_item_id,
        oi.order_id,
        oi.product_id,
        oi.total_price,
        vp.vendor_id,
        vi.commission_rate
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN vendor_products vp ON oi.product_id = vp.product_id
      JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
      LEFT JOIN vendor_commissions vc ON oi.order_item_id = vc.order_item_id
      WHERE o.order_status IN ('completed', 'delivered')
        AND (vc.commission_id IS NULL OR ? = true)${orderFilter}`,
      [force_regenerate || false, ...queryParams]
    );

    let processedCount = 0;

    // Generate commission records
    for (const item of orderItems) {
      const commissionAmount = (item.total_price * item.commission_rate) / 100;

      // Delete existing record if force regenerate
      if (force_regenerate) {
        await pool.execute(
          'DELETE FROM vendor_commissions WHERE order_item_id = ?',
          [item.order_item_id]
        );
      }

      // Insert commission record
      await pool.execute(
        `INSERT INTO vendor_commissions (
          vendor_id, order_id, order_item_id, product_id,
          sale_amount, commission_rate, commission_amount,
          commission_status, commission_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          commission_amount = VALUES(commission_amount),
          commission_rate = VALUES(commission_rate)`,
        [
          item.vendor_id,
          item.order_id,
          item.order_item_id,
          item.product_id,
          item.total_price,
          item.commission_rate,
          commissionAmount
        ]
      );

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} commission records`,
      processedCount
    });

  } catch (error) {
    console.error('Error generating commission records:', error);
    return NextResponse.json({ error: 'Failed to generate commission records' }, { status: 500 });
  }
}