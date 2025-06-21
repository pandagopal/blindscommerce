import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { clearSettingsCache } from '@/lib/settings';

// GET /api/admin/settings - Retrieve all admin settings
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    
    // Get all settings from the upload_security_config table (which serves as our settings table)
    const [rows] = await pool.execute(
      'SELECT config_key, config_value, config_type FROM upload_security_config WHERE is_active = TRUE'
    );

    // Convert flat settings to nested structure that matches the frontend
    const settings = {
      general: {
        site_name: 'Smart Blinds Hub',
        site_description: 'Premium window treatments and smart home solutions',
        contact_email: 'support@smartblindshub.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business Ave, Austin, TX 78701',
        timezone: 'America/Chicago',
        currency: 'USD',
        tax_rate: '8.25',
        maintenance_mode: false
      },
      notifications: {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        order_notifications: true,
        inventory_alerts: true,
        vendor_notifications: true,
        customer_service_alerts: true,
        system_alerts: true
      },
      payments: {
        stripe_enabled: true,
        paypal_enabled: true,
        klarna_enabled: true,
        afterpay_enabled: true,
        affirm_enabled: true,
        payment_processing_fee: '2.9',
        minimum_order_amount: '25.00',
        free_shipping_threshold: '100.00',
        vendor_commission_rate: '15.0'
      },
      security: {
        two_factor_required: false,
        password_expiry_days: '90',
        login_attempts_limit: '5',
        session_timeout_minutes: '30',
        ip_whitelist_enabled: false,
        audit_logs_retention_days: '365'
      },
      integrations: {
        google_analytics_id: '',
        facebook_pixel_id: '',
        mailchimp_api_key: '',
        twilio_account_sid: '',
        aws_s3_bucket: '',
        smtp_server: 'smtp.smartblindshub.com',
        smtp_port: '587',
        smtp_username: 'notifications@smartblindshub.com',
        taxjar_api_key: '',
        taxjar_environment: 'production',
        use_taxjar_api: false
      }
    };

    // Override with actual database values
    if (Array.isArray(rows)) {
      rows.forEach((row: any) => {
        const { config_key, config_value, config_type } = row;
        
        let parsedValue;
        switch (config_type) {
          case 'boolean':
            parsedValue = config_value === 'true';
            break;
          case 'integer':
            parsedValue = config_value;
            break;
          case 'json':
            try {
              parsedValue = JSON.parse(config_value);
            } catch {
              parsedValue = config_value;
            }
            break;
          default:
            parsedValue = config_value;
        }

        // Map database keys to frontend structure
        if (config_key.startsWith('general_')) {
          settings.general[config_key.replace('general_', '') as keyof typeof settings.general] = parsedValue;
        } else if (config_key.startsWith('notification_')) {
          settings.notifications[config_key.replace('notification_', '') as keyof typeof settings.notifications] = parsedValue;
        } else if (config_key.startsWith('payment_')) {
          settings.payments[config_key.replace('payment_', '') as keyof typeof settings.payments] = parsedValue;
        } else if (config_key.startsWith('security_')) {
          settings.security[config_key.replace('security_', '') as keyof typeof settings.security] = parsedValue;
        } else if (config_key.startsWith('integrations_')) {
          settings.integrations[config_key.replace('integrations_', '') as keyof typeof settings.integrations] = parsedValue;
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Validation rules for different setting types
function validateSetting(category: string, key: string, value: any): { valid: boolean; error?: string } {
  switch (category) {
    case 'general':
      switch (key) {
        case 'site_name':
          if (!value || typeof value !== 'string' || value.length < 1 || value.length > 100) {
            return { valid: false, error: 'Site name must be between 1-100 characters' };
          }
          break;
        case 'contact_email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!value || !emailRegex.test(value)) {
            return { valid: false, error: 'Valid email address is required' };
          }
          break;
        case 'phone':
          const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
          if (value && !phoneRegex.test(value)) {
            return { valid: false, error: 'Valid phone number is required' };
          }
          break;
        case 'tax_rate':
          const taxRate = parseFloat(value);
          if (isNaN(taxRate) || taxRate < 0 || taxRate > 50) {
            return { valid: false, error: 'Tax rate must be between 0-50%' };
          }
          break;
      }
      break;
    case 'payments':
      switch (key) {
        case 'payment_processing_fee':
          const fee = parseFloat(value);
          if (isNaN(fee) || fee < 0 || fee > 10) {
            return { valid: false, error: 'Processing fee must be between 0-10%' };
          }
          break;
        case 'minimum_order_amount':
        case 'free_shipping_threshold':
          const amount = parseFloat(value);
          if (isNaN(amount) || amount < 0 || amount > 10000) {
            return { valid: false, error: 'Amount must be between $0-$10,000' };
          }
          break;
        case 'vendor_commission_rate':
          const commission = parseFloat(value);
          if (isNaN(commission) || commission < 0 || commission > 50) {
            return { valid: false, error: 'Commission rate must be between 0-50%' };
          }
          break;
      }
      break;
    case 'security':
      switch (key) {
        case 'password_expiry_days':
          const expiry = parseInt(value);
          if (isNaN(expiry) || expiry < 30 || expiry > 365) {
            return { valid: false, error: 'Password expiry must be between 30-365 days' };
          }
          break;
        case 'login_attempts_limit':
          const attempts = parseInt(value);
          if (isNaN(attempts) || attempts < 3 || attempts > 20) {
            return { valid: false, error: 'Login attempts limit must be between 3-20' };
          }
          break;
        case 'session_timeout_minutes':
          const timeout = parseInt(value);
          if (isNaN(timeout) || timeout < 15 || timeout > 480) {
            return { valid: false, error: 'Session timeout must be between 15-480 minutes' };
          }
          break;
        case 'audit_logs_retention_days':
          const retention = parseInt(value);
          if (isNaN(retention) || retention < 90 || retention > 2555) {
            return { valid: false, error: 'Audit log retention must be between 90-2555 days' };
          }
          break;
      }
      break;
    case 'integrations':
      switch (key) {
        case 'google_analytics_id':
          if (value && !/^(G-|UA-|GT-)[A-Z0-9\-]+$/i.test(value)) {
            return { valid: false, error: 'Invalid Google Analytics ID format' };
          }
          break;
        case 'facebook_pixel_id':
          if (value && !/^\d{15,16}$/.test(value)) {
            return { valid: false, error: 'Invalid Facebook Pixel ID format' };
          }
          break;
        case 'smtp_port':
          const port = parseInt(value);
          if (isNaN(port) || port < 1 || port > 65535) {
            return { valid: false, error: 'SMTP port must be between 1-65535' };
          }
          break;
        case 'smtp_username':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return { valid: false, error: 'SMTP username must be a valid email address' };
          }
          break;
      }
      break;
  }
  return { valid: true };
}

// PUT /api/admin/settings - Update admin settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, settings: categorySettings } = body;

    if (!category || !categorySettings) {
      return NextResponse.json({ error: 'Category and settings are required' }, { status: 400 });
    }

    // Validate all settings in the category
    const validationErrors: string[] = [];
    for (const [key, value] of Object.entries(categorySettings)) {
      const validation = validateSetting(category, key, value);
      if (!validation.valid) {
        validationErrors.push(`${key}: ${validation.error}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        validation_errors: validationErrors 
      }, { status: 400 });
    }

    const pool = await getPool();

    try {
      // Update or insert settings for the specified category
      for (const [key, value] of Object.entries(categorySettings)) {
        const dbKey = `${category}_${key}`;
        let dbValue: string;
        let dbType: string;

        // Determine type and serialize value
        if (typeof value === 'boolean') {
          dbType = 'boolean';
          dbValue = value.toString();
        } else if (typeof value === 'number') {
          dbType = 'integer';
          dbValue = value.toString();
        } else if (typeof value === 'object') {
          dbType = 'json';
          dbValue = JSON.stringify(value);
        } else {
          dbType = 'string';
          dbValue = String(value);
        }

        // Use INSERT ... ON DUPLICATE KEY UPDATE
        await pool.execute(`
          INSERT INTO upload_security_config (config_key, config_value, config_type, updated_by, description) 
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            config_value = VALUES(config_value),
            config_type = VALUES(config_type),
            updated_by = VALUES(updated_by),
            updated_at = CURRENT_TIMESTAMP
        `, [
          dbKey, 
          dbValue, 
          dbType, 
          user.userId,
          `${category.charAt(0).toUpperCase() + category.slice(1)} setting: ${key.replace(/_/g, ' ')}`
        ]);
      }

      // Clear settings cache to force reload
      clearSettingsCache();

      return NextResponse.json({ 
        success: true, 
        message: `${category.charAt(0).toUpperCase() + category.slice(1)} settings updated successfully` 
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// PUT /api/admin/settings/all - Update all settings at once
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    const pool = await getPool();

    try {
      // Process all categories
      for (const [category, categorySettings] of Object.entries(settings)) {
        if (typeof categorySettings === 'object' && categorySettings !== null) {
          for (const [key, value] of Object.entries(categorySettings)) {
            const dbKey = `${category}_${key}`;
            let dbValue: string;
            let dbType: string;

            if (typeof value === 'boolean') {
              dbType = 'boolean';
              dbValue = value.toString();
            } else if (typeof value === 'number') {
              dbType = 'integer';
              dbValue = value.toString();
            } else if (typeof value === 'object') {
              dbType = 'json';
              dbValue = JSON.stringify(value);
            } else {
              dbType = 'string';
              dbValue = String(value);
            }

            await pool.execute(`
              INSERT INTO upload_security_config (config_key, config_value, config_type, updated_by, description) 
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE 
                config_value = VALUES(config_value),
                config_type = VALUES(config_type),
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP
            `, [
              dbKey, 
              dbValue, 
              dbType, 
              user.userId,
              `${category.charAt(0).toUpperCase() + category.slice(1)} setting: ${key.replace(/_/g, ' ')}`
            ]);
          }
        }
      }

      // Clear settings cache to force reload
      clearSettingsCache();

      return NextResponse.json({ 
        success: true, 
        message: 'All settings updated successfully' 
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating all settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}