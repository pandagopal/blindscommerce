/**
 * Settings Service
 * Handles all settings-related database operations
 */

import { getPool } from '@/lib/db';

interface PlatformSettings {
  general: {
    site_name: string;
    site_description: string;
    contact_email: string;
    phone: string;
    address: string;
    timezone: string;
    currency: string;
    tax_rate: string;
    maintenance_mode: boolean;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    order_notifications: boolean;
    inventory_alerts: boolean;
    vendor_notifications: boolean;
    customer_service_alerts: boolean;
    system_alerts: boolean;
  };
  payments: {
    stripe_enabled: boolean;
    paypal_enabled: boolean;
    klarna_enabled: boolean;
    afterpay_enabled: boolean;
    affirm_enabled: boolean;
    braintree_enabled: boolean;
    payment_processing_fee: string;
    minimum_order_amount: string;
    free_shipping_threshold: string;
    vendor_commission_rate: string;
    stripe_secret_key: string;
    stripe_publishable_key: string;
    stripe_webhook_secret: string;
    paypal_client_id: string;
    paypal_client_secret: string;
    braintree_merchant_id: string;
    braintree_public_key: string;
    braintree_private_key: string;
    klarna_api_key: string;
    klarna_username: string;
    klarna_password: string;
    afterpay_merchant_id: string;
    afterpay_secret_key: string;
    affirm_public_api_key: string;
    affirm_private_api_key: string;
  };
  security: {
    two_factor_required: boolean;
    password_expiry_days: string;
    login_attempts_limit: string;
    session_timeout_minutes: string;
    ip_whitelist_enabled: boolean;
    audit_logs_retention_days: string;
  };
  integrations: {
    google_analytics_id: string;
    facebook_pixel_id: string;
    mailchimp_api_key: string;
    twilio_account_sid: string;
    aws_s3_bucket: string;
    smtp_server: string;
    smtp_port: string;
    smtp_username: string;
    taxjar_api_key: string;
    taxjar_environment: string;
    use_taxjar_api: boolean;
  };
}

// Default settings structure
const DEFAULT_SETTINGS: PlatformSettings = {
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
    stripe_enabled: false,
    paypal_enabled: false,
    klarna_enabled: false,
    afterpay_enabled: false,
    affirm_enabled: false,
    braintree_enabled: false,
    payment_processing_fee: '2.9',
    minimum_order_amount: '25.00',
    free_shipping_threshold: '100.00',
    vendor_commission_rate: '15.0',
    stripe_secret_key: '',
    stripe_publishable_key: '',
    stripe_webhook_secret: '',
    paypal_client_id: '',
    paypal_client_secret: '',
    braintree_merchant_id: '',
    braintree_public_key: '',
    braintree_private_key: '',
    klarna_api_key: '',
    klarna_username: '',
    klarna_password: '',
    afterpay_merchant_id: '',
    afterpay_secret_key: '',
    affirm_public_api_key: '',
    affirm_private_api_key: ''
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

export class SettingsService {
  async getAllSettings(): Promise<PlatformSettings> {
    const pool = await getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT category, setting_key, setting_value FROM company_settings'
      );
      
      // Start with default settings
      const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      
      // Map database categories to our expected structure
      const categoryMapping: { [key: string]: keyof PlatformSettings } = {
        'company': 'general',
        'contact': 'general',
        'financial': 'payments',
        'homepage': 'general',
        'promotions': 'general',
        'shipping': 'payments',
        'notifications': 'notifications',
        'security': 'security',
        'integrations': 'integrations'
      };

      // Override with database values
      for (const row of rows as any[]) {
        const mappedCategory = categoryMapping[row.category] || row.category;
        
        if (settings[mappedCategory as keyof PlatformSettings]) {
          // Map specific keys based on database structure
          const keyMapping: { [key: string]: string } = {
            'company_name': 'site_name',
            'company_email': 'contact_email', 
            'contact_email': 'contact_email',
            'contact_phone': 'phone',
            'company_phone': 'phone',
            'company_address': 'address',
            'tax_rate': 'tax_rate',
            'default_tax_rate': 'tax_rate',
            'commission_rate': 'vendor_commission_rate',
            'payment_processing_fee': 'payment_processing_fee',
            'minimum_order': 'minimum_order_amount',
            'free_shipping_threshold': 'free_shipping_threshold',
            'currency': 'currency',
            'timezone': 'timezone'
          };
          
          const mappedKey = keyMapping[row.setting_key] || row.setting_key;
          
          // Try to parse JSON, but if it fails use raw value
          let value = row.setting_value;
          try {
            // Only try to parse if it looks like JSON
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('[') || value === 'true' || value === 'false')) {
              value = JSON.parse(value);
            }
          } catch (e) {
            // Keep raw value
          }
          
          // For boolean fields in our settings, convert string to boolean
          if (mappedKey.includes('enabled') || mappedKey.includes('required') || mappedKey === 'maintenance_mode') {
            if (value === '1' || value === 1 || value === 'true') {
              value = true;
            } else if (value === '0' || value === 0 || value === 'false') {
              value = false;
            }
          }
          
          // Store the value
          (settings[mappedCategory as keyof PlatformSettings] as any)[mappedKey] = value;
          
        }
      }
      
      // Ensure all categories have at least empty objects to prevent UI errors
      const allCategories: (keyof PlatformSettings)[] = ['general', 'notifications', 'payments', 'security', 'integrations'];
      for (const category of allCategories) {
        if (!settings[category]) {
          settings[category] = DEFAULT_SETTINGS[category];
        }
      }
      
      return settings;
    } catch (error) {
      console.error('Error fetching settings from database:', error);
      // Return defaults if database fails
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(category: string, settings: any): Promise<void> {
    const pool = await getPool();
    
    for (const [key, value] of Object.entries(settings)) {
      // Check if setting exists
      const [existing] = await pool.execute(
        'SELECT setting_id FROM company_settings WHERE category = ? AND setting_key = ?',
        [category, key]
      );
      
      if ((existing as any[]).length > 0) {
        // Update existing setting
        await pool.execute(
          'UPDATE company_settings SET setting_value = ?, updated_at = NOW() WHERE category = ? AND setting_key = ?',
          [JSON.stringify(value), category, key]
        );
      } else {
        // Insert new setting
        await pool.execute(
          'INSERT INTO company_settings (category, setting_key, setting_value, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [category, key, JSON.stringify(value)]
        );
      }
    }
  }

  async getSetting(category: string, key: string): Promise<any> {
    const pool = await getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT setting_value FROM company_settings WHERE category = ? AND setting_key = ?',
        [category, key]
      );
      
      if ((rows as any[]).length > 0) {
        try {
          return JSON.parse((rows as any[])[0].setting_value);
        } catch {
          return (rows as any[])[0].setting_value;
        }
      }
      
      // Return default value if not found
      const defaults = DEFAULT_SETTINGS[category as keyof PlatformSettings] as any;
      return defaults?.[key];
    } catch (error) {
      console.error('Error fetching setting:', error);
      const defaults = DEFAULT_SETTINGS[category as keyof PlatformSettings] as any;
      return defaults?.[key];
    }
  }
}