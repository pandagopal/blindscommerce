/**
 * Settings Handler for V2 API
 * Handles platform settings operations
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { safeDecrypt, isSensitiveSetting } from '@/lib/security/encryption';

export class SettingsHandler extends BaseHandler {
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      '': () => this.getAllSettings(user),
      'category': () => this.getSettingsByCategory(req, user),
    };

    return this.routeAction(action, routes);
  }

  private async getAllSettings(user: any) {
    // Only admins can access settings
    this.requireRole(user, 'ADMIN');

    try {
      const pool = await getPool();
      
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT config_key, config_value, config_type FROM upload_security_config WHERE is_active = TRUE'
      );

      // Default settings structure
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

      // Override with database values
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

          // Decrypt sensitive values when loading from database
          if (typeof parsedValue === 'string' && isSensitiveSetting(config_key)) {
            try {
              parsedValue = safeDecrypt(parsedValue);
            } catch (error) {
              console.error(`Failed to decrypt ${config_key}:`, error);
              parsedValue = ''; // Return empty string for failed decryption
            }
          }

          // Map database keys to settings structure
          if (config_key.startsWith('general_')) {
            const key = config_key.replace('general_', '') as keyof typeof settings.general;
            (settings.general as any)[key] = parsedValue;
          } else if (config_key.startsWith('notification_')) {
            const key = config_key.replace('notification_', '') as keyof typeof settings.notifications;
            (settings.notifications as any)[key] = parsedValue;
          } else if (config_key.startsWith('payments_')) {
            const key = config_key.replace('payments_', '') as keyof typeof settings.payments;
            (settings.payments as any)[key] = parsedValue;
          } else if (config_key.startsWith('security_')) {
            const key = config_key.replace('security_', '') as keyof typeof settings.security;
            (settings.security as any)[key] = parsedValue;
          } else if (config_key.startsWith('integrations_')) {
            const key = config_key.replace('integrations_', '') as keyof typeof settings.integrations;
            (settings.integrations as any)[key] = parsedValue;
          }
        });
      }

      return settings;
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      throw new ApiError('Failed to fetch settings', 500);
    }
  }

  private async getSettingsByCategory(req: NextRequest, user: any) {
    this.requireRole(user, 'ADMIN');
    
    const searchParams = this.getSearchParams(req);
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    if (!category) {
      throw new ApiError('Category parameter is required', 400);
    }

    const settings = await this.getAllSettings(user);
    const categorySettings = (settings as any)[category];

    if (!categorySettings) {
      throw new ApiError('Invalid category', 400);
    }

    if (key) {
      return { [key]: categorySettings[key] };
    }

    return categorySettings;
  }
}