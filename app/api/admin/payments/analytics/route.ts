import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    
    // Convert timeframe to days
    const days = parseInt(timeframe.replace('d', ''));
    
    const pool = await getPool();

    // Get payment analytics
    const [analytics] = await pool.execute(`
      SELECT 
        date,
        payment_method,
        provider,
        total_transactions,
        total_amount,
        successful_transactions,
        failed_transactions,
        average_amount,
        conversion_rate
      FROM payment_analytics 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY date DESC, total_amount DESC
    `, [days]);

    // Get summary statistics
    const [summary] = await pool.execute(`
      SELECT 
        SUM(total_transactions) as total_transactions,
        SUM(total_amount) as total_amount,
        SUM(successful_transactions) as successful_transactions,
        SUM(failed_transactions) as failed_transactions,
        AVG(conversion_rate) as avg_conversion_rate
      FROM payment_analytics 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [days]);

    // Get top performing payment methods
    const [topMethods] = await pool.execute(`
      SELECT 
        payment_method,
        provider,
        SUM(total_transactions) as total_transactions,
        SUM(total_amount) as total_amount,
        AVG(conversion_rate) as avg_conversion_rate
      FROM payment_analytics 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY payment_method, provider
      ORDER BY total_amount DESC
      LIMIT 10
    `, [days]);

    // Get recent payment intents
    const [recentPayments] = await pool.execute(`
      SELECT 
        pi.*,
        p.payment_id,
        p.order_id
      FROM payment_intents pi
      LEFT JOIN payments p ON pi.transaction_id = p.transaction_id
      WHERE pi.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY pi.created_at DESC
      LIMIT 50
    `, [days]);

    // Get dispute and refund statistics
    const [disputes] = await pool.execute(`
      SELECT 
        COUNT(*) as total_disputes,
        SUM(amount) as total_dispute_amount,
        AVG(amount) as avg_dispute_amount
      FROM payment_disputes 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    const [refunds] = await pool.execute(`
      SELECT 
        COUNT(*) as total_refunds,
        SUM(amount) as total_refund_amount,
        AVG(amount) as avg_refund_amount
      FROM payment_refunds 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    const summaryData = (summary as any[])[0] || {};
    const disputeData = (disputes as any[])[0] || {};
    const refundData = (refunds as any[])[0] || {};

    return NextResponse.json({
      success: true,
      timeframe: `${days} days`,
      analytics: analytics,
      summary: {
        total_transactions: summaryData.total_transactions || 0,
        total_amount: parseFloat(summaryData.total_amount || 0),
        successful_transactions: summaryData.successful_transactions || 0,
        failed_transactions: summaryData.failed_transactions || 0,
        success_rate: summaryData.total_transactions > 0 
          ? (summaryData.successful_transactions / summaryData.total_transactions * 100)
          : 0,
        avg_conversion_rate: parseFloat(summaryData.avg_conversion_rate || 0) * 100
      },
      top_methods: topMethods,
      recent_payments: (recentPayments as any[]).map(payment => ({
        id: payment.id,
        provider: payment.provider,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        status: payment.status,
        created_at: payment.created_at,
        order_id: payment.order_id
      })),
      disputes: {
        total_disputes: disputeData.total_disputes || 0,
        total_amount: parseFloat(disputeData.total_dispute_amount || 0),
        avg_amount: parseFloat(disputeData.avg_dispute_amount || 0)
      },
      refunds: {
        total_refunds: refundData.total_refunds || 0,
        total_amount: parseFloat(refundData.total_refund_amount || 0),
        avg_amount: parseFloat(refundData.avg_refund_amount || 0)
      }
    });

  } catch (error) {
    console.error('Get payment analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment analytics' },
      { status: 500 }
    );
  }
}