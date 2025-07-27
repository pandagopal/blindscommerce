// Settings cache
let settingsCache: { [key: string]: any } = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface PlatformSettings {
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
    // Payment Provider Credentials
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
    payment_processing_fee: '2.9',
    minimum_order_amount: '25.00',
    free_shipping_threshold: '100.00',
    vendor_commission_rate: '15.0',
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

// Get all platform settings with caching
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cacheTimestamp > 0 && (now - cacheTimestamp) < CACHE_DURATION && Object.keys(settingsCache).length > 0) {
    return settingsCache as PlatformSettings;
  }

  // Simply return defaults - settings should be fetched via API only
  return DEFAULT_SETTINGS;
}

// Get specific setting value
export async function getSetting(category: keyof PlatformSettings, key: string): Promise<any> {
  const settings = await getPlatformSettings();
  return (settings[category] as any)?.[key];
}

// Clear settings cache (call after updates)
export function clearSettingsCache(): void {
  settingsCache = {};
  cacheTimestamp = 0;
}

// Convenience functions for common settings
export async function isMaintenanceMode(): Promise<boolean> {
  return await getSetting('general', 'maintenance_mode') || false;
}

export async function getTaxRate(): Promise<number> {
  const rate = await getSetting('general', 'tax_rate');
  return parseFloat(rate) || 8.25;
}

export async function getFreeShippingThreshold(): Promise<number> {
  const threshold = await getSetting('payments', 'free_shipping_threshold');
  return parseFloat(threshold) || 100.00;
}

export async function getMinimumOrderAmount(): Promise<number> {
  const minimum = await getSetting('payments', 'minimum_order_amount');
  return parseFloat(minimum) || 25.00;
}

export async function getVendorCommissionRate(): Promise<number> {
  const rate = await getSetting('payments', 'vendor_commission_rate');
  return parseFloat(rate) || 15.0;
}

export async function isPaymentMethodEnabled(method: string): Promise<boolean> {
  return await getSetting('payments', `${method}_enabled`) || false;
}

export async function areEmailNotificationsEnabled(): Promise<boolean> {
  return await getSetting('notifications', 'email_notifications') || false;
}

export async function areSMSNotificationsEnabled(): Promise<boolean> {
  return await getSetting('notifications', 'sms_notifications') || false;
}

// Payment Provider Credential Functions
export async function getStripeCredentials(): Promise<{
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  enabled: boolean;
}> {
  const settings = await getPlatformSettings();
  return {
    secretKey: settings.payments.stripe_secret_key || '',
    publishableKey: settings.payments.stripe_publishable_key || '',
    webhookSecret: settings.payments.stripe_webhook_secret || '',
    enabled: settings.payments.stripe_enabled || false
  };
}

export async function getPayPalCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}> {
  const settings = await getPlatformSettings();
  return {
    clientId: settings.payments.paypal_client_id || '',
    clientSecret: settings.payments.paypal_client_secret || '',
    enabled: settings.payments.paypal_enabled || false
  };
}

export async function getBraintreeCredentials(): Promise<{
  merchantId: string;
  publicKey: string;
  privateKey: string;
  enabled: boolean;
}> {
  const settings = await getPlatformSettings();
  return {
    merchantId: settings.payments.braintree_merchant_id || '',
    publicKey: settings.payments.braintree_public_key || '',
    privateKey: settings.payments.braintree_private_key || '',
    enabled: settings.payments.braintree_enabled || false
  };
}