import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      // Fetch all relevant dashboard data
      const [orders] = await connection.execute(`
        SELECT 
          o.*,
          u.email as customer_email,
          p.name as product_name,
          op.quantity,
          op.price
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        JOIN order_products op ON o.order_id = op.order_id
        JOIN products p ON op.product_id = p.product_id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY o.created_at DESC
      `);

      const [products] = await connection.execute(`
        SELECT 
          p.*,
          c.name as category_name,
          (
            SELECT COUNT(*) 
            FROM order_products op 
            WHERE op.product_id = p.product_id
          ) as total_orders
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
      `);

      const [customers] = await connection.execute(`
        SELECT 
          u.*,
          COUNT(o.order_id) as total_orders,
          SUM(o.total_amount) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.user_id = o.user_id
        WHERE u.role = 'CUSTOMER'
        GROUP BY u.user_id
      `);

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Orders sheet
      const ordersSheet = XLSX.utils.json_to_sheet(orders.map((order: any) => ({
        'Order ID': order.order_id,
        'Date': new Date(order.created_at).toLocaleDateString(),
        'Customer': order.customer_email,
        'Product': order.product_name,
        'Quantity': order.quantity,
        'Price': order.price,
        'Total': order.total_amount,
        'Status': order.status
      })));
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');

      // Products sheet
      const productsSheet = XLSX.utils.json_to_sheet(products.map((product: any) => ({
        'ID': product.product_id,
        'Name': product.name,
        'Category': product.category_name,
        'Price': product.base_price,
        'Stock': product.stock_quantity,
        'Total Orders': product.total_orders
      })));
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

      // Customers sheet
      const customersSheet = XLSX.utils.json_to_sheet(customers.map((customer: any) => ({
        'ID': customer.user_id,
        'Email': customer.email,
        'Name': `${customer.first_name} ${customer.last_name}`,
        'Total Orders': customer.total_orders,
        'Total Spent': customer.total_spent,
        'Joined': new Date(customer.created_at).toLocaleDateString()
      })));
      XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');

      // Write to buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="dashboard-report-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
