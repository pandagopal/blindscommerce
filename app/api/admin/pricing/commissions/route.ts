import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CommissionRuleRequest {
  rule_name: string;
  applies_to: 'vendor' | 'sales_staff' | 'category' | 'product' | 'global';
  target_id?: number;
  commission_type: 'percentage' | 'fixed_amount' | 'tiered';
  commission_value: number;
  minimum_sale_amount?: number;
  maximum_commission_amount?: number;
  is_default?: boolean;
  valid_from?: string;
  valid_until?: string;
  tiers?: Array<{
    min_amount: number;
    max_amount?: number;
    commission_percent?: number;
    commission_amount?: number;
  }>;
}

interface CommissionPaymentRequest {
  vendor_id?: number;
  sales_staff_id?: number;
  period_start: string;
  period_end: string;
  payment_method: 'bank_transfer' | 'check' | 'paypal' | 'stripe';
  payment_reference?: string;
  notes?: string;
}

// GET /api/admin/pricing/commissions - Get commission rules and payments
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'rules'; // 'rules' | 'payments' | 'summary'

    const pool = await getPool();

    if (type === 'rules') {
      const [rules] = await pool.execute<RowDataPacket[]>(
        `SELECT cr.*, 
                CASE 
                  WHEN cr.applies_to = 'vendor' THEN v.business_name
                  WHEN cr.applies_to = 'sales_staff' THEN CONCAT(u.first_name, ' ', u.last_name)
                  WHEN cr.applies_to = 'category' THEN c.name
                  WHEN cr.applies_to = 'product' THEN p.name
                  ELSE 'Global Rule'
                END as target_name
         FROM commission_rules cr
         LEFT JOIN vendor_info v ON cr.applies_to = 'vendor' AND cr.target_id = v.vendor_info_id
         LEFT JOIN sales_staff ss ON cr.applies_to = 'sales_staff' AND cr.target_id = ss.sales_staff_id
         LEFT JOIN users u ON ss.user_id = u.user_id
         LEFT JOIN categories c ON cr.applies_to = 'category' AND cr.target_id = c.category_id
         LEFT JOIN products p ON cr.applies_to = 'product' AND cr.target_id = p.product_id
         ORDER BY cr.is_default DESC, cr.created_at DESC`
      );

      return NextResponse.json({
        rules: rules.map(rule => ({
          ...rule,
          tiers: rule.tiers ? JSON.parse(rule.tiers) : null
        }))
      });
    }

    if (type === 'payments') {
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');

      const [payments] = await pool.execute<RowDataPacket[]>(
        `SELECT cp.*, 
                v.business_name as vendor_name,
                CONCAT(u1.first_name, ' ', u1.last_name) as sales_staff_name,
                CONCAT(u2.first_name, ' ', u2.last_name) as processed_by_name
         FROM commission_payments cp
         LEFT JOIN vendor_info v ON cp.vendor_id = v.vendor_id
         LEFT JOIN sales_staff ss ON cp.sales_staff_id = ss.staff_id
         LEFT JOIN users u1 ON ss.user_id = u1.user_id
         LEFT JOIN users u2 ON cp.processed_by = u2.user_id
         ORDER BY cp.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return NextResponse.json({ payments });
    }

    if (type === 'summary') {
      // Get commission summary by vendor/sales staff
      const [vendorSummary] = await pool.execute<RowDataPacket[]>(
        `SELECT v.vendor_info_id as vendor_id, v.business_name,
                SUM(o.total_amount * IFNULL(cr.commission_value, 0) / 100) as total_commission_earned,
                COUNT(o.order_id) as total_orders,
                SUM(CASE WHEN cp.payment_id IS NOT NULL THEN o.total_amount * IFNULL(cr.commission_value, 0) / 100 ELSE 0 END) as commission_paid,
                SUM(CASE WHEN cp.payment_id IS NULL THEN o.total_amount * IFNULL(cr.commission_value, 0) / 100 ELSE 0 END) as commission_pending
         FROM vendor_info v
         LEFT JOIN orders o ON v.vendor_info_id = o.vendor_id AND o.status = 'completed'
         LEFT JOIN commission_rules cr ON (cr.applies_to = 'vendor' AND cr.target_id = v.vendor_info_id) OR cr.is_default = TRUE
         LEFT JOIN commission_payments cp ON cp.vendor_id = v.vendor_info_id 
           AND DATE(o.created_at) BETWEEN cp.period_start AND cp.period_end
         WHERE v.is_active = TRUE
         GROUP BY v.vendor_info_id, v.business_name
         ORDER BY total_commission_earned DESC`
      );

      const [salesSummary] = await pool.execute<RowDataPacket[]>(
        `SELECT ss.sales_staff_id as staff_id, CONCAT(u.first_name, ' ', u.last_name) as staff_name,
                SUM(o.total_amount * IFNULL(cr.commission_value, 0) / 100) as total_commission_earned,
                COUNT(o.order_id) as total_orders,
                SUM(CASE WHEN cp.payment_id IS NOT NULL THEN o.total_amount * IFNULL(cr.commission_value, 0) / 100 ELSE 0 END) as commission_paid,
                SUM(CASE WHEN cp.payment_id IS NULL THEN o.total_amount * IFNULL(cr.commission_value, 0) / 100 ELSE 0 END) as commission_pending
         FROM sales_staff ss
         JOIN users u ON ss.user_id = u.user_id
         LEFT JOIN orders o ON ss.sales_staff_id = o.sales_staff_id AND o.status = 'completed'
         LEFT JOIN commission_rules cr ON (cr.applies_to = 'sales_staff' AND cr.target_id = ss.sales_staff_id) OR cr.is_default = TRUE
         LEFT JOIN commission_payments cp ON cp.sales_staff_id = ss.sales_staff_id 
           AND DATE(o.created_at) BETWEEN cp.period_start AND cp.period_end
         WHERE ss.is_active = TRUE
         GROUP BY ss.sales_staff_id, u.first_name, u.last_name
         ORDER BY total_commission_earned DESC`
      );

      return NextResponse.json({
        vendor_summary: vendorSummary,
        sales_summary: salesSummary
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching commission data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing/commissions - Create commission rule or process payment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action; // 'create_rule' | 'process_payment'

    const pool = await getPool();

    if (action === 'create_rule') {
      const ruleData: CommissionRuleRequest = body.data;

      if (!ruleData.rule_name || !ruleData.applies_to || !ruleData.commission_type) {
        return NextResponse.json(
          { error: 'Rule name, applies_to, and commission_type are required' },
          { status: 400 }
        );
      }

      // If this is a default rule, unset other default rules
      if (ruleData.is_default) {
        await pool.execute(
          'UPDATE commission_rules SET is_default = FALSE WHERE is_default = TRUE'
        );
      }

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO commission_rules (
          rule_name, applies_to, target_id, commission_type, commission_value,
          minimum_sale_amount, maximum_commission_amount, is_default,
          valid_from, valid_until, tiers, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ruleData.rule_name,
          ruleData.applies_to,
          ruleData.target_id || null,
          ruleData.commission_type,
          ruleData.commission_value,
          ruleData.minimum_sale_amount || 0,
          ruleData.maximum_commission_amount || null,
          ruleData.is_default || false,
          ruleData.valid_from || new Date().toISOString(),
          ruleData.valid_until || null,
          ruleData.tiers ? JSON.stringify(ruleData.tiers) : null,
          user.userId
        ]
      );

      return NextResponse.json({
        success: true,
        rule_id: result.insertId,
        message: 'Commission rule created successfully'
      });
    }

    if (action === 'process_payment') {
      const paymentData: CommissionPaymentRequest = body.data;

      if (!paymentData.period_start || !paymentData.period_end || !paymentData.payment_method) {
        return NextResponse.json(
          { error: 'Period dates and payment method are required' },
          { status: 400 }
        );
      }

      if (!paymentData.vendor_id && !paymentData.sales_staff_id) {
        return NextResponse.json(
          { error: 'Either vendor_id or sales_staff_id is required' },
          { status: 400 }
        );
      }

      // Calculate commission amount for the period
      let commissionQuery;
      let queryParams;

      if (paymentData.vendor_id) {
        commissionQuery = `
          SELECT SUM(o.total_amount * IFNULL(cr.commission_value, 0) / 100) as commission_amount,
                 COUNT(o.order_id) as order_count
          FROM orders o
          LEFT JOIN commission_rules cr ON (cr.applies_to = 'vendor' AND cr.target_id = ?) OR cr.is_default = TRUE
          WHERE o.vendor_id = ? AND o.status = 'completed'
          AND DATE(o.created_at) BETWEEN ? AND ?
          AND NOT EXISTS (
            SELECT 1 FROM commission_payments cp 
            WHERE cp.vendor_id = ? 
            AND DATE(o.created_at) BETWEEN cp.period_start AND cp.period_end
          )`;
        queryParams = [
          paymentData.vendor_id, paymentData.vendor_id,
          paymentData.period_start, paymentData.period_end,
          paymentData.vendor_id
        ];
      } else {
        commissionQuery = `
          SELECT SUM(o.total_amount * IFNULL(cr.commission_value, 0) / 100) as commission_amount,
                 COUNT(o.order_id) as order_count
          FROM orders o
          LEFT JOIN commission_rules cr ON (cr.applies_to = 'sales_staff' AND cr.target_id = ?) OR cr.is_default = TRUE
          WHERE o.sales_staff_id = ? AND o.status = 'completed'
          AND DATE(o.created_at) BETWEEN ? AND ?
          AND NOT EXISTS (
            SELECT 1 FROM commission_payments cp 
            WHERE cp.sales_staff_id = ? 
            AND DATE(o.created_at) BETWEEN cp.period_start AND cp.period_end
          )`;
        queryParams = [
          paymentData.sales_staff_id, paymentData.sales_staff_id,
          paymentData.period_start, paymentData.period_end,
          paymentData.sales_staff_id
        ];
      }

      const [commissionResult] = await pool.execute<RowDataPacket[]>(commissionQuery, queryParams);
      const commissionAmount = commissionResult[0].commission_amount || 0;
      const orderCount = commissionResult[0].order_count || 0;

      if (commissionAmount === 0) {
        return NextResponse.json(
          { error: 'No commission amount found for the specified period' },
          { status: 400 }
        );
      }

      // Create commission payment record
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO commission_payments (
          vendor_id, sales_staff_id, period_start, period_end,
          commission_amount, order_count, payment_method, payment_reference,
          notes, processed_by, processed_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'completed')`,
        [
          paymentData.vendor_id || null,
          paymentData.sales_staff_id || null,
          paymentData.period_start,
          paymentData.period_end,
          commissionAmount,
          orderCount,
          paymentData.payment_method,
          paymentData.payment_reference || null,
          paymentData.notes || null,
          user.userId
        ]
      );

      return NextResponse.json({
        success: true,
        payment_id: result.insertId,
        commission_amount: commissionAmount,
        order_count: orderCount,
        message: 'Commission payment processed successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error processing commission request:', error);
    return NextResponse.json(
      { error: 'Failed to process commission request' },
      { status: 500 }
    );
  }
}