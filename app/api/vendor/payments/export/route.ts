import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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
      `SELECT vendor_info_id as vendor_id FROM vendor_info WHERE user_id = ?`,
      [userId]
    );
    
    if (!vendorData[0]) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const vendorId = vendorData[0].vendor_id;

    // Get parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
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

    let csvContent = '';
    let filename = '';

    if (type === 'overview' || type === 'history') {
      // Export payment history
      const [payments] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          vp.payment_id,
          vp.reference_number,
          vp.amount,
          vp.payment_status as status,
          vp.payment_method,
          vp.created_at,
          vp.payment_date as payout_date,
          COALESCE(JSON_LENGTH(vp.commission_ids), 0) as orders_count,
          vp.payment_type,
          vp.notes
        FROM vendor_payments vp
        WHERE vp.vendor_id = ?
          AND vp.created_at >= ${dateFilter}
        ORDER BY vp.created_at DESC`,
        [vendorId]
      );

      // Create CSV
      csvContent = 'Payment ID,Reference,Amount,Status,Method,Type,Created Date,Payout Date,Orders Count,Notes\n';
      payments.forEach(payment => {
        csvContent += `${payment.payment_id},${payment.reference_number || ''},${payment.amount},${payment.status},${payment.payment_method},${payment.payment_type},${payment.created_at},${payment.payout_date || ''},${payment.orders_count || 0},${payment.notes || ''}\n`;
      });
      
      filename = `vendor-payments-${type}-${range}.csv`;

    } else if (type === 'commissions') {
      // Export commission breakdown - get commission rate
      const [commissionData] = await pool.execute<RowDataPacket[]>(
        `SELECT commission_rate FROM vendor_info WHERE vendor_info_id = ?`,
        [vendorId]
      );
      
      const commissionRate = commissionData[0]?.commission_rate || 15.0;

      const [commissions] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          o.order_id,
          oi.order_item_id,
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as customer_name,
          p.name as product_name,
          oi.quantity,
          oi.unit_price,
          oi.total_price as order_amount,
          ? as commission_rate,
          (oi.total_price * ? / 100) as commission_amount,
          o.created_at as order_date,
          o.status as order_status,
          CASE 
            WHEN vp.payment_status = 'completed' THEN 'paid'
            ELSE 'pending'
          END as payment_status
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
        ORDER BY o.created_at DESC`,
        [commissionRate, commissionRate / 100, vendorId]
      );

      // Create CSV
      csvContent = 'Order ID,Item ID,Customer,Product,Quantity,Unit Price,Order Amount,Commission Rate,Commission Amount,Order Date,Order Status,Payment Status\n';
      commissions.forEach(commission => {
        csvContent += `${commission.order_id},${commission.order_item_id},${commission.customer_name},${commission.product_name},${commission.quantity},${commission.unit_price},${commission.order_amount},${commission.commission_rate}%,${commission.commission_amount},${commission.order_date},${commission.order_status},${commission.payment_status}\n`;
      });
      
      filename = `vendor-commissions-${range}.csv`;
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting payment data:', error);
    return NextResponse.json(
      { error: 'Failed to export payment data' },
      { status: 500 }
    );
  }
}