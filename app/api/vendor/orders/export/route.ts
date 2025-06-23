import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OrderExportRow extends RowDataPacket {
  order_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_status: string;
  order_date: string;
  updated_at: string;
  total_amount: number;
  vendor_total: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  configuration: string;
  shipping_address: string;
  billing_address: string;
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
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (vendorInfo.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      );
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Build query with filters
    let whereClause = 'WHERE vp.vendor_id = ?';
    const queryParams: any[] = [vendorId];

    if (statusFilter && statusFilter !== 'all') {
      whereClause += ' AND o.status = ?';
      queryParams.push(statusFilter);
    }

    if (startDate) {
      whereClause += ' AND o.created_at >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND o.created_at <= ?';
      queryParams.push(endDate + ' 23:59:59');
    }

    const query = `
      SELECT 
        o.order_id,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        o.status as order_status,
        o.created_at as order_date,
        o.updated_at,
        o.total_amount,
        oi.quantity * oi.unit_price as vendor_total,
        p.name as product_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        COALESCE(oi.configuration, '') as configuration,
        COALESCE(o.shipping_address, '') as shipping_address,
        COALESCE(o.billing_address, '') as billing_address
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN vendor_products vp ON oi.product_id = vp.product_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN users u ON o.user_id = u.user_id
      ${whereClause}
      ORDER BY o.created_at DESC
    `;

    const [orders] = await pool.execute<OrderExportRow[]>(query, queryParams);

    // Generate CSV
    let headers: string[];
    
    if (includeDetails) {
      headers = [
        'Order ID',
        'Customer Name', 
        'Customer Email',
        'Customer Phone',
        'Order Status',
        'Order Date',
        'Last Updated',
        'Order Total',
        'Vendor Total',
        'Product Name',
        'Quantity',
        'Unit Price',
        'Line Total',
        'Configuration',
        'Shipping Address',
        'Billing Address'
      ];
    } else {
      headers = [
        'Order ID',
        'Customer Name',
        'Customer Email', 
        'Order Status',
        'Order Date',
        'Order Total',
        'Vendor Total'
      ];
    }

    const csvRows = [headers.join(',')];

    // Process orders for CSV
    if (includeDetails) {
      // Include all line item details
      for (const order of orders) {
        const row = [
          order.order_id,
          escapeCsvValue(order.customer_name || ''),
          escapeCsvValue(order.customer_email || ''),
          escapeCsvValue(order.customer_phone || ''),
          escapeCsvValue(order.order_status),
          order.order_date,
          order.updated_at,
          order.total_amount,
          order.vendor_total,
          escapeCsvValue(order.product_name || ''),
          order.quantity,
          order.unit_price,
          order.total_price,
          escapeCsvValue(order.configuration || ''),
          escapeCsvValue(order.shipping_address || ''),
          escapeCsvValue(order.billing_address || '')
        ];
        csvRows.push(row.join(','));
      }
    } else {
      // Group by order and summarize
      const orderSummary = new Map();
      
      for (const order of orders) {
        const key = order.order_id;
        if (!orderSummary.has(key)) {
          orderSummary.set(key, {
            order_id: order.order_id,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            order_status: order.order_status,
            order_date: order.order_date,
            total_amount: order.total_amount,
            vendor_total: 0
          });
        }
        const summary = orderSummary.get(key);
        summary.vendor_total += order.total_price;
      }

      for (const [, summary] of orderSummary) {
        const row = [
          summary.order_id,
          escapeCsvValue(summary.customer_name || ''),
          escapeCsvValue(summary.customer_email || ''),
          escapeCsvValue(summary.order_status),
          summary.order_date,
          summary.total_amount,
          summary.vendor_total.toFixed(2)
        ];
        csvRows.push(row.join(','));
      }
    }

    const csvContent = csvRows.join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const detailLevel = includeDetails ? 'detailed' : 'summary';
    const filename = `vendor-orders-${detailLevel}-${timestamp}.csv`;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting vendor orders:', error);
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    );
  }
}

// Helper function to escape CSV values
function escapeCsvValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (!value) {
    return '';
  }

  const stringValue = value.toString();
  
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}