import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { clearSettingsCache } from '@/lib/settings';
import { 
  encryptSensitiveData, 
  decryptSensitiveData, 
  isSensitiveSetting,
  safeDecrypt 
} from '@/lib/security/encryption';

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

    // Build settings structure using only actual database values (no fallbacks)
    const settings = {
      general: {},
      notifications: {},
      payments: {},
      security: {},
      integrations: {}
    };

    // Populate with actual database values
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
            // Decrypt sensitive values when retrieving them
            if (isSensitiveSetting(config_key)) {
              try {
                parsedValue = safeDecrypt(config_value);
              } catch (error) {
                console.error(`Failed to decrypt ${config_key}:`, error);
                parsedValue = ''; // Return empty string for failed decryption
              }
            } else {
              parsedValue = config_value;
            }
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
        case 'stripe_secret_key':
          if (value && !value.startsWith('sk_')) {
            return { valid: false, error: 'Stripe secret key must start with sk_' };
          }
          break;
        case 'stripe_publishable_key':
          if (value && !value.startsWith('pk_')) {
            return { valid: false, error: 'Stripe publishable key must start with pk_' };
          }
          break;
        case 'stripe_webhook_secret':
          if (value && !value.startsWith('whsec_')) {
            return { valid: false, error: 'Stripe webhook secret must start with whsec_' };
          }
          break;
        case 'paypal_client_id':
          if (value && (typeof value !== 'string' || value.length < 10)) {
            return { valid: false, error: 'PayPal client ID must be at least 10 characters' };
          }
          break;
        case 'paypal_client_secret':
          if (value && (typeof value !== 'string' || value.length < 10)) {
            return { valid: false, error: 'PayPal client secret must be at least 10 characters' };
          }
          break;
        case 'braintree_merchant_id':
        case 'braintree_public_key':
        case 'braintree_private_key':
          if (value && (typeof value !== 'string' || value.length < 5)) {
            return { valid: false, error: 'Braintree credentials must be at least 5 characters' };
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
          let stringValue = String(value);
          
          // Encrypt sensitive values before storing
          if (isSensitiveSetting(dbKey) && stringValue) {
            try {
              dbValue = encryptSensitiveData(stringValue);
            } catch (error) {
              console.error(`Failed to encrypt ${dbKey}:`, error);
              throw new Error(`Failed to encrypt sensitive setting: ${key}`);
            }
          } else {
            dbValue = stringValue;
          }
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
              let stringValue = String(value);
              
              // Encrypt sensitive values before storing
              if (isSensitiveSetting(dbKey) && stringValue) {
                try {
                  dbValue = encryptSensitiveData(stringValue);
                } catch (error) {
                  console.error(`Failed to encrypt ${dbKey}:`, error);
                  throw new Error(`Failed to encrypt sensitive setting: ${key}`);
                }
              } else {
                dbValue = stringValue;
              }
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