import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { settingsService } from '@/lib/services/singletons';

export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    
    // Get raw data from database
    const [rows] = await pool.execute(
      `SELECT category, setting_key, setting_value 
       FROM company_settings 
       WHERE setting_key LIKE '%stripe%' OR setting_key LIKE '%paypal%'
       ORDER BY category, setting_key`
    );
    
    // Also check specific keys
    const [specificRows] = await pool.execute(
      `SELECT category, setting_key, 
              CASE WHEN setting_key LIKE '%secret%' OR setting_key LIKE '%private%' 
                   THEN CONCAT(LEFT(setting_value, 20), '...')
                   ELSE setting_value 
              END as display_value,
              LENGTH(setting_value) as value_length
       FROM company_settings 
       WHERE setting_key IN (
         'stripe_enabled',
         'stripe_secret_key',
         'stripe_publishable_key',
         'paypal_enabled',
         'paypal_client_id',
         'paypal_client_secret'
       )
       ORDER BY setting_key`
    );
    
    // Get processed settings from service
    const settings = await settingsService.getAllSettings();
    
    return NextResponse.json({
      raw_db_settings: rows,
      specific_keys: specificRows,
      processed_payments: settings.payments,
      stripe_check: {
        enabled: settings.payments.stripe_enabled,
        has_secret: !!settings.payments.stripe_secret_key,
        has_publishable: !!settings.payments.stripe_publishable_key,
        secret_length: settings.payments.stripe_secret_key?.length || 0,
        publishable_length: settings.payments.stripe_publishable_key?.length || 0
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}