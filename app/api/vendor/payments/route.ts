import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface PaymentOverview extends RowDataPacket {
  total_earnings: number;
  pending_payments: number;
  paid_this_month: number;
  commission_rate: number;
}

interface Payment extends RowDataPacket {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  date: string;
  payout_date?: string;
  method: string;
  reference: string;
  orders_count: number;
}

interface Commission extends RowDataPacket {
  id: string;
  order_id: string;
  customer_name: string;
  product_name: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  date: string;
  status: 'pending' | 'paid';
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    const userId = user.userId;

    // Get vendor_id from vendor_info table
    const [vendorData] = await pool.execute<RowDataPacket[]>(
      `SELECT vendor_info_id as vendor_id, commission_rate FROM vendor_info WHERE user_id = ?`,
      [userId]
    );
    
    if (!vendorData[0]) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const vendorId = vendorData[0].vendor_id;
    const commissionRate = vendorData[0].commission_rate || 15.0;

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    // Calculate date filter
    let dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    switch(range) {
      case '7d':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case '90d':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
        break;
      case '1y':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
    }

    // Get payment overview
    const [overview] = await pool.execute<PaymentOverview[]>(
      `SELECT 
        COALESCE(SUM(CASE WHEN vp.payment_status = 'completed' THEN vp.amount ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN vp.payment_status IN ('pending', 'processing') THEN vp.amount ELSE 0 END), 0) as pending_payments,
        COALESCE(SUM(CASE 
          WHEN vp.payment_status = 'completed' AND MONTH(vp.payment_date) = MONTH(CURDATE()) 
          AND YEAR(vp.payment_date) = YEAR(CURDATE()) 
          THEN vp.amount ELSE 0 END), 0) as paid_this_month,
        ? as commission_rate
      FROM vendor_payments vp
      WHERE vp.vendor_id = ?`,
      [commissionRate, vendorId]
    );

    // Get recent payments
    const [recentPayments] = await pool.execute<Payment[]>(
      `SELECT 
        vp.payment_id as id,
        vp.amount,
        vp.payment_status as status,
        vp.created_at as date,
        vp.payment_date as payout_date,
        vp.payment_method as method,
        vp.reference_number as reference,
        COALESCE(JSON_LENGTH(vp.commission_ids), 0) as orders_count
      FROM vendor_payments vp
      WHERE vp.vendor_id = ?
      ORDER BY vp.created_at DESC
      LIMIT 10`,
      [vendorId]
    );

    // Get commission breakdown - detailed order items
    const [commissions] = await pool.execute<Commission[]>(
      `SELECT 
        CONCAT('COM-', oi.order_item_id) as id,
        o.order_id,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as customer_name,
        p.name as product_name,
        oi.total_price as order_amount,
        ? as commission_rate,
        (oi.total_price * ? / 100) as commission_amount,
        o.created_at as date,
        CASE 
          WHEN vp.payment_status = 'completed' THEN 'paid'
          ELSE 'pending'
        END as status
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN vendor_products vpr ON oi.product_id = vpr.product_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN vendor_payments vp ON vp.vendor_id = vpr.vendor_id 
        AND JSON_CONTAINS(vp.commission_ids, JSON_QUOTE(oi.order_item_id))
      WHERE vpr.vendor_id = ?
        AND o.created_at >= ${dateFilter}
        AND o.status IN ('delivered', 'completed')
      ORDER BY o.created_at DESC
      LIMIT 50`,
      [commissionRate, commissionRate / 100, vendorId]
    );

    // Get next payout date (15th of next month)
    const today = new Date();
    const nextMonth = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
    const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    const nextPayoutDate = new Date(nextYear, nextMonth, 15);

    // Get last payout amount
    const [lastPayout] = await pool.execute<RowDataPacket[]>(
      `SELECT amount 
      FROM vendor_payments 
      WHERE vendor_id = ? AND payment_status = 'completed' 
      ORDER BY payment_date DESC 
      LIMIT 1`,
      [vendorId]
    );

    const responseData = {
      overview: {
        total_earnings: overview[0]?.total_earnings || 0,
        pending_payments: overview[0]?.pending_payments || 0,
        paid_this_month: overview[0]?.paid_this_month || 0,
        commission_rate: commissionRate,
        next_payout_date: nextPayoutDate.toISOString().split('T')[0],
        last_payout_amount: lastPayout[0]?.amount || 0
      },
      recent_payments: recentPayments,
      payment_history: recentPayments, // Can be expanded to show more historical data
      commission_breakdown: commissions
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching vendor payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
}