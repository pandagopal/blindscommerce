/**
 * Settings Service
 * Handles all settings-related database operations
 */

import { getPool } from '@/lib/db';
import { decryptSensitiveData, encryptSensitiveData, isEncrypted, safeDecrypt } from '@/lib/security/encryption';

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
    paypal_api_key: string;
    paypal_username: string;
    paypal_password: string;
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
    contact_email: 'sales@smartblindshub.com',
    phone: '+1 (316) 530-2635',
    address: '15326 Old Redmond Rd, Redmond, WA 98052',
    timezone: 'America/Los_Angeles',
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
    payment_processing_fee: '',
    minimum_order_amount: '',
    free_shipping_threshold: '',
    vendor_commission_rate: '',
    stripe_secret_key: '',
    stripe_publishable_key: '',
    stripe_webhook_secret: '',
    paypal_client_id: '',
    paypal_client_secret: '',
    paypal_api_key: '',
    paypal_username: '',
    paypal_password: '',
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
  private settingsCache: PlatformSettings | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  clearCache(): void {
    this.settingsCache = null;
    this.cacheTimestamp = 0;
  }

  async getAllSettings(skipCache = false): Promise<PlatformSettings> {
    const now = Date.now();
    
    // Return cached settings if still valid and not skipping cache
    if (!skipCache && this.settingsCache && this.cacheTimestamp > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.settingsCache;
    }

    const pool = await getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT category, setting_key, setting_value FROM company_settings'
      );
      
     
      // Debug: Show payment-related settings
      const paymentRows = (rows as any[]).filter(r => 
        r.category === 'payments' || 
        r.setting_key.includes('stripe') || 
        r.setting_key.includes('paypal')
      );

      
      // Start with default settings
      const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      
      // Map database categories to our expected structure
      const categoryMapping: { [key: string]: keyof PlatformSettings } = {
        'company': 'general',
        'contact': 'general',
        'financial': 'payments',
        'payments': 'payments',
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
        
        if (row.setting_key.includes('stripe') || row.setting_key.includes('paypal')) {
          //console.log(`Processing ${row.setting_key}: DB category='${row.category}', mapped to='${mappedCategory}'`);
        }
        
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
            'timezone': 'timezone',
            // Payment provider keys
            'stripe_secret_key': 'stripe_secret_key',
            'stripe_publishable_key': 'stripe_publishable_key',
            'stripe_webhook_secret': 'stripe_webhook_secret',
            'stripe_enabled': 'stripe_enabled',
            'paypal_client_id': 'paypal_client_id',
            'paypal_client_secret': 'paypal_client_secret',
            'paypal_api_key': 'paypal_api_key',
            'paypal_username': 'paypal_username',
            'paypal_password': 'paypal_password',
            'paypal_enabled': 'paypal_enabled',
            'braintree_merchant_id': 'braintree_merchant_id',
            'braintree_public_key': 'braintree_public_key',
            'braintree_private_key': 'braintree_private_key',
            'braintree_enabled': 'braintree_enabled',
            'klarna_api_key': 'klarna_api_key',
            'klarna_username': 'klarna_username',
            'klarna_password': 'klarna_password',
            'klarna_enabled': 'klarna_enabled',
            'afterpay_merchant_id': 'afterpay_merchant_id',
            'afterpay_secret_key': 'afterpay_secret_key',
            'afterpay_enabled': 'afterpay_enabled',
            'affirm_public_api_key': 'affirm_public_api_key',
            'affirm_private_api_key': 'affirm_private_api_key',
            'affirm_enabled': 'affirm_enabled'
          };
          
          const mappedKey = keyMapping[row.setting_key] || row.setting_key;
          
          // Try to parse JSON, but if it fails use raw value
          let value = row.setting_value;
          
          // Handle NULL values
          if (value === null) {
            value = '';
            //console.log(`${row.setting_key} has NULL value, defaulting to empty string`);
          } else if (typeof value === 'string') {
            // For string values, only try to parse if it looks like JSON
            if (value.startsWith('{') || value.startsWith('[') || value === 'true' || value === 'false' || 
                (value.startsWith('"') && value.endsWith('"')) || !isNaN(Number(value))) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Keep raw value if not valid JSON
              }
            }
            // If it's a plain string (like API keys), keep it as is
          }
          
          // For boolean fields in our settings, convert string to boolean
          if (mappedKey.includes('enabled') || mappedKey.includes('required') || mappedKey === 'maintenance_mode') {
            if (value === '1' || value === 1 || value === 'true' || value === true) {
              value = true;
            } else if (value === '0' || value === 0 || value === 'false' || value === false) {
              value = false;
            }
            //console.log(`${mappedKey} boolean conversion: ${row.setting_value} -> ${value}`);
          }
          
          // Decrypt sensitive payment fields if they are encrypted
          if (mappedCategory === 'payments' && typeof value === 'string' && value !== '') {
            const sensitiveKeys = [
              'stripe_secret_key',
              'stripe_publishable_key',
              'stripe_webhook_secret',
              'paypal_client_id',
              'paypal_client_secret',
              'paypal_api_key',
              'paypal_username',
              'paypal_password',
              'braintree_merchant_id',
              'braintree_public_key',
              'braintree_private_key',
              'klarna_api_key',
              'klarna_username',
              'klarna_password',
              'afterpay_merchant_id',
              'afterpay_secret_key',
              'affirm_public_api_key',
              'affirm_private_api_key'
            ];
            
            if (sensitiveKeys.includes(mappedKey)) {
              //console.log(`Checking if ${mappedKey} needs decryption. Value starts with: ${typeof value === 'string' ? value.substring(0, 10) : value}...`);
              if (isEncrypted(value)) {
                try {
                  value = safeDecrypt(value);
                  //console.log(`Successfully decrypted ${mappedKey}`);
                } catch (error) {
                  console.warn(`Failed to decrypt ${mappedKey}, using original value`);
                  // Keep the original value if decryption fails
                }
              }
            }
          }
          
          // Store the value
          // if (mappedKey.includes('stripe') || mappedKey.includes('paypal')) {
          //   console.log(`Storing ${mappedKey} in ${mappedCategory}: ${typeof value === 'string' && value.length > 20 ? value.substring(0, 20) + '...' : value}`);
          // }
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

      
      // Cache the results
      this.settingsCache = settings;
      this.cacheTimestamp = now;
      
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
           
      // Encrypt sensitive payment fields before storing
      let valueToStore = value;
      
      if (category === 'payments' && typeof value === 'string' && value !== '') {
        const sensitiveKeys = [
          'stripe_secret_key',
          'stripe_publishable_key',
          'stripe_webhook_secret',
          'paypal_client_id',
          'paypal_client_secret',
          'paypal_api_key',
          'paypal_username',
          'paypal_password',
          'braintree_merchant_id',
          'braintree_public_key',
          'braintree_private_key',
          'klarna_api_key',
          'klarna_username',
          'klarna_password',
          'afterpay_merchant_id',
          'afterpay_secret_key',
          'affirm_public_api_key',
          'affirm_private_api_key'
        ];
        
        if (sensitiveKeys.includes(key)) {
          // Only encrypt if not already encrypted
          if (!isEncrypted(value)) {
            try {
              valueToStore = encryptSensitiveData(value);
            } catch (error) {
              console.error(`Failed to encrypt ${key}:`, error);
              // Continue with unencrypted value if encryption fails
            }
          }
        }
      }
      
      // Check if setting exists (setting_key is unique across all categories)
      const [existing] = await pool.execute(
        'SELECT setting_id, category FROM company_settings WHERE setting_key = ?',
        [key]
      );
      
      // For string values, store them directly without JSON.stringify to avoid double encoding
      const finalValue = typeof valueToStore === 'string' ? valueToStore : JSON.stringify(valueToStore);
      
      if ((existing as any[]).length > 0) {
        // Update existing setting - update both value and category
        await pool.execute(
          'UPDATE company_settings SET setting_value = ?, category = ?, updated_at = NOW() WHERE setting_key = ?',
          [finalValue, category, key]
        );
        //console.log(`Successfully updated ${key}`);
      } else {
        // Insert new setting
        //console.log(`Inserting new setting ${key} in category ${category}`);
        await pool.execute(
          'INSERT INTO company_settings (category, setting_key, setting_value, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [category, key, finalValue]
        );
        //console.log(`Successfully inserted ${key}`);
      }
    }
    
    // Clear cache after updates
    this.clearCache();
    
    // Also clear any old cache that might exist
    try {
      const { clearSettingsCache } = await import('@/lib/settings');
      clearSettingsCache();
    } catch (e) {
      // Ignore if the old cache doesn't exist
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