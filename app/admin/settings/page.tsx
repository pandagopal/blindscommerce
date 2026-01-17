'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, Shield, Bell, Mail, DollarSign, Globe, 
  Database, Key, AlertTriangle, Save, Upload, CreditCard, Truck 
} from 'lucide-react';
import PhoneInput from '@/components/ui/PhoneInput';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<{[key: string]: string[]}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [testingTaxJar, setTestingTaxJar] = useState(false);
  const [taxJarTestResult, setTaxJarTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [testingShipping, setTestingShipping] = useState<{ups: boolean; dhl: boolean}>({ups: false, dhl: false});
  const [shippingTestResults, setShippingTestResults] = useState<{ups: any; dhl: any}>({ups: null, dhl: null});


  const [settings, setSettings] = useState({
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
      stripe_enabled: true,
      paypal_enabled: true,
      klarna_enabled: true,
      afterpay_enabled: true,
      affirm_enabled: true,
      braintree_enabled: true,
      google_pay_enabled: true,
      apple_pay_enabled: true,
      payment_processing_fee: '2.9',
      minimum_order_amount: '25.00',
      free_shipping_threshold: '100.00',
      vendor_commission_rate: '15.0',
      // Stripe Configuration
      stripe_secret_key: '',
      stripe_publishable_key: '',
      stripe_webhook_secret: '',
      // PayPal Configuration
      paypal_client_id: '',
      paypal_client_secret: '',
      paypal_api_key: '',
      paypal_username: '',
      paypal_password: '',
      // Braintree Configuration
      braintree_merchant_id: '',
      braintree_public_key: '',
      braintree_private_key: '',
      // Klarna Configuration
      klarna_api_key: '',
      klarna_username: '',
      klarna_password: '',
      // Afterpay Configuration
      afterpay_merchant_id: '',
      afterpay_secret_key: '',
      // Affirm Configuration
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
      smtp_server: 'mail.spacemail.com',
      smtp_port: '465',
      smtp_username: 'sales@smartblindshub.com',
      smtp_password: '',
      taxjar_api_key: '',
      taxjar_environment: 'production',
      use_taxjar_api: false,
      // Shipping Integrations
      shipping_ups_enabled: false,
      shipping_ups_api_key: '',
      shipping_ups_account_number: '',
      shipping_ups_environment: 'production',
      shipping_dhl_enabled: false,
      shipping_dhl_api_key: '',
      shipping_dhl_account_number: '',
      shipping_dhl_environment: 'production'
    }
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/admin/settings');
          return;
        }
        const result = await res.json();
        const data = result.data || result;if (data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
        
        // Load settings from API
        await loadSettings();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/admin/settings');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/v2/admin/settings', {
        credentials: 'include' // Include cookies for authentication
      });
      if (!res.ok) {
        throw new Error('Failed to load settings');
      }
      const data = await res.json();
      
      // Handle V2 API response format
      const settings = data.data?.settings || data.settings;
      
      if (settings) {
        setSettings(settings);
      } else {
        console.error('No settings returned from API. Response was:', data);
        // Keep default settings
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      alert('Failed to load settings. Using defaults.');
    }
  };

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => {
      // Ensure prev has the expected structure
      if (!prev || typeof prev !== 'object') {
        console.error('Settings state is invalid:', prev);
        return prev;
      }
      
      return {
        ...prev,
        [category]: {
          ...(prev[category as keyof typeof prev] || {}),
          [key]: value
        }
      };
    });
  };

  const saveSettings = async (category?: string) => {
    setSaving(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      let response;
      
      if (category) {
        // Save specific category
        response = await fetch('/api/v2/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            category,
            settings: settings[category as keyof typeof settings]
          }),
        });
      } else {
        // Save all settings
        response = await fetch('/api/v2/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            settings
          }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        if (result.validation_errors) {
          // Handle validation errors
          const errorsByCategory: {[key: string]: string[]} = {};
          result.validation_errors.forEach((error: string) => {
            const currentCategory = category || 'notifications';
            if (!errorsByCategory[currentCategory]) {
              errorsByCategory[currentCategory] = [];
            }
            errorsByCategory[currentCategory].push(error);
          });
          setErrors(errorsByCategory);
        } else {
          setErrors({ notifications: [result.error || 'Failed to save settings'] });
        }
        return;
      }

      setSuccessMessage(result.message || 'Settings saved successfully!');
      
      // Dispatch event to notify other components (like Navbar) to refresh
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Reload settings for payment category to ensure we get encrypted values back
      if (category === 'payments') {
        setTimeout(() => {
          loadSettings();
        }, 500);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrors({ 
        notifications: [`Failed to save settings: ${error instanceof Error ? error.message : 'Please try again.'}`] 
      });
    } finally {
      setSaving(false);
    }
  };

  const testTaxJarConnection = async () => {
    setTestingTaxJar(true);
    setTaxJarTestResult(null);
    
    try {
      // Test with current form values instead of database values
      const response = await fetch('/api/v2/admin/settings/test-taxjar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          taxjar_api_key: safeSettings.integrations?.taxjar_api_key || '',
          taxjar_environment: safeSettings.integrations?.taxjar_environment || 'production'
        }),
      });
      
      const result = await response.json();
      setTaxJarTestResult(result);
    } catch (error) {
      setTaxJarTestResult({
        success: false,
        message: 'Failed to test connection'
      });
    } finally {
      setTestingTaxJar(false);
    }
  };

  const testShippingConnection = async (provider: 'ups' | 'dhl') => {
    setTestingShipping(prev => ({ ...prev, [provider]: true }));
    setShippingTestResults(prev => ({ ...prev, [provider]: null }));
    
    try {
      const response = await fetch('/api/v2/admin/settings/test-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          provider,
          api_key: safeSettings.integrations?.[`shipping_${provider}_api_key`] || '',
          account_number: safeSettings.integrations?.[`shipping_${provider}_account_number`] || '',
          environment: safeSettings.integrations?.[`shipping_${provider}_environment`] || 'production'
        }),
      });
      
      const result = await response.json();
      setShippingTestResults(prev => ({ ...prev, [provider]: result }));
    } catch (error) {
      setShippingTestResults(prev => ({ 
        ...prev, 
        [provider]: {
          success: false,
          message: 'Failed to test connection'
        }
      }));
    } finally {
      setTestingShipping(prev => ({ ...prev, [provider]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Ensure settings has the expected structure
  const safeSettings = settings && typeof settings === 'object' ? settings : {
    general: {},
    notifications: {},
    payments: {},
    security: {},
    integrations: {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
              System Settings
            </h1>
            <p className="text-gray-600">Configure system-wide settings and preferences</p>
          </div>
          
          <Button
            onClick={() => saveSettings()}
            disabled={saving}
            className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="h-5 w-5 text-green-600 mr-2">✓</div>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                {Object.entries(errors).map(([category, categoryErrors]) => (
                  <div key={category} className="mb-2">
                    <p className="font-medium text-red-700 capitalize">{category} Settings:</p>
                    <ul className="list-disc list-inside ml-4 text-red-600">
                      {categoryErrors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-red-100">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Globe className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site Name
                      </label>
                      <Input
                        value={safeSettings.general?.site_name || ''}
                        onChange={(e) => handleSettingChange('general', 'site_name', e.target.value)}
                        placeholder="Enter site name"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Email
                      </label>
                      <Input
                        type="email"
                        value={safeSettings.general?.contact_email || ''}
                        onChange={(e) => handleSettingChange('general', 'contact_email', e.target.value)}
                        placeholder="Enter contact email"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <PhoneInput
                        value={safeSettings.general?.phone || ''}
                        onChange={(value) => handleSettingChange('general', 'phone', value)}
                        country="US"
                        showCountrySelector={false}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <Textarea
                        value={safeSettings.general?.address || ''}
                        onChange={(e) => handleSettingChange('general', 'address', e.target.value)}
                        placeholder="Enter company address"
                        className="w-full"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site Description
                      </label>
                      <Textarea
                        value={safeSettings.general?.site_description || ''}
                        onChange={(e) => handleSettingChange('general', 'site_description', e.target.value)}
                        placeholder="Enter site description"
                        className="w-full"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone
                      </label>
                      <Select 
                        value={safeSettings.general?.timezone || ''} 
                        onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <Select 
                        value={safeSettings.general?.currency || ''} 
                        onValueChange={(value) => handleSettingChange('general', 'currency', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={safeSettings.general?.tax_rate || ''}
                        onChange={(e) => handleSettingChange('general', 'tax_rate', e.target.value)}
                        placeholder="Enter tax rate"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Maintenance Mode</h4>
                        <p className="text-sm text-gray-600">
                          Enable to put the site in maintenance mode
                        </p>
                      </div>
                      <Switch
                        checked={safeSettings.general?.maintenance_mode || false}
                        onCheckedChange={(checked) => handleSettingChange('general', 'maintenance_mode', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => saveSettings('general')}
                  disabled={saving}
                  className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {Object.entries(safeSettings.notifications || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getNotificationDescription(key)}
                        </p>
                      </div>
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => handleSettingChange('notifications', key, checked)}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => saveSettings('notifications')}
                  disabled={saving}
                  className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stripe Configuration */}
                <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Stripe</h3>
                        <p className="text-sm text-gray-600">Accept credit cards, debit cards, and digital wallets</p>
                      </div>
                    </div>
                    <Switch
                      checked={safeSettings.payments?.stripe_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('payments', 'stripe_enabled', checked)}
                    />
                  </div>
                  
                  {safeSettings.payments?.stripe_enabled && (
                    <div className="mt-4 space-y-4 pl-13">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secret Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.stripe_secret_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'stripe_secret_key', e.target.value)}
                            placeholder="sk_test_... or sk_live_..."
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Publishable Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.stripe_publishable_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'stripe_publishable_key', e.target.value)}
                            placeholder="pk_test_... or pk_live_..."
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Webhook Secret (Optional)
                        </label>
                        <Input
                          type="password"
                          value={safeSettings.payments?.stripe_webhook_secret || ''}
                          onChange={(e) => handleSettingChange('payments', 'stripe_webhook_secret', e.target.value)}
                          placeholder="whsec_... (Leave empty to disable webhooks)"
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Optional: Only needed for webhook events like payment confirmations and disputes
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Get your keys from the <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe Dashboard</a>
                      </p>
                    </div>
                  )}
                </div>

                {/* PayPal Configuration */}
                <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">PayPal</h3>
                        <p className="text-sm text-gray-600">Accept PayPal payments and Pay Later options</p>
                      </div>
                    </div>
                    <Switch
                      checked={safeSettings.payments?.paypal_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('payments', 'paypal_enabled', checked)}
                    />
                  </div>
                  
                  {safeSettings.payments?.paypal_enabled && (
                    <div className="mt-4 space-y-4 pl-13">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.paypal_api_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'paypal_api_key', e.target.value)}
                            placeholder="Enter PayPal API Key"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secret Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.paypal_client_secret || ''}
                            onChange={(e) => handleSettingChange('payments', 'paypal_client_secret', e.target.value)}
                            placeholder="Enter PayPal Secret Key"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.paypal_username || ''}
                            onChange={(e) => handleSettingChange('payments', 'paypal_username', e.target.value)}
                            placeholder="Enter PayPal Username"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.paypal_password || ''}
                            onChange={(e) => handleSettingChange('payments', 'paypal_password', e.target.value)}
                            placeholder="Enter PayPal Password"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Client ID (REST API)
                            </label>
                            <Input
                              type="password"
                              value={safeSettings.payments?.paypal_client_id || ''}
                              onChange={(e) => handleSettingChange('payments', 'paypal_client_id', e.target.value)}
                              placeholder="Enter PayPal Client ID (optional)"
                              className="font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Get your credentials from the <a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PayPal Developer Dashboard</a>. 
                        For classic PayPal integration, use API Key, Secret Key, Username, and Password. For REST API, use Client ID.
                      </p>
                    </div>
                  )}
                </div>

                {/* Klarna Configuration */}
                <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary-red" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Klarna</h3>
                        <p className="text-sm text-gray-600">Buy now, pay later in 4 interest-free payments</p>
                      </div>
                    </div>
                    <Switch
                      checked={safeSettings.payments?.klarna_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('payments', 'klarna_enabled', checked)}
                    />
                  </div>
                  
                  {safeSettings.payments?.klarna_enabled && (
                    <div className="mt-4 space-y-4 pl-13">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.klarna_api_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'klarna_api_key', e.target.value)}
                            placeholder="Enter Klarna API Key"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username *
                          </label>
                          <Input
                            value={safeSettings.payments?.klarna_username || ''}
                            onChange={(e) => handleSettingChange('payments', 'klarna_username', e.target.value)}
                            placeholder="Enter Klarna Username"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <Input
                          type="password"
                          value={safeSettings.payments?.klarna_password || ''}
                          onChange={(e) => handleSettingChange('payments', 'klarna_password', e.target.value)}
                          placeholder="Enter Klarna Password"
                          className="font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Get your credentials from the <a href="https://developers.klarna.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Klarna Developer Portal</a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Afterpay Configuration */}
                <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Afterpay</h3>
                        <p className="text-sm text-gray-600">Split purchases into 4 interest-free payments</p>
                      </div>
                    </div>
                    <Switch
                      checked={safeSettings.payments?.afterpay_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('payments', 'afterpay_enabled', checked)}
                    />
                  </div>
                  
                  {safeSettings.payments?.afterpay_enabled && (
                    <div className="mt-4 space-y-4 pl-13">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Merchant ID *
                          </label>
                          <Input
                            value={safeSettings.payments?.afterpay_merchant_id || ''}
                            onChange={(e) => handleSettingChange('payments', 'afterpay_merchant_id', e.target.value)}
                            placeholder="Enter Afterpay Merchant ID"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secret Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.afterpay_secret_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'afterpay_secret_key', e.target.value)}
                            placeholder="Enter Afterpay Secret Key"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Get your credentials from the <a href="https://developers.afterpay.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Afterpay Developer Portal</a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Affirm Configuration */}
                <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Affirm</h3>
                        <p className="text-sm text-gray-600">Flexible payment plans from 3-36 months</p>
                      </div>
                    </div>
                    <Switch
                      checked={safeSettings.payments?.affirm_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('payments', 'affirm_enabled', checked)}
                    />
                  </div>
                  
                  {safeSettings.payments?.affirm_enabled && (
                    <div className="mt-4 space-y-4 pl-13">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Public API Key *
                          </label>
                          <Input
                            value={safeSettings.payments?.affirm_public_api_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'affirm_public_api_key', e.target.value)}
                            placeholder="Enter Affirm Public API Key"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Private API Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.affirm_private_api_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'affirm_private_api_key', e.target.value)}
                            placeholder="Enter Affirm Private API Key"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Get your credentials from the <a href="https://docs.affirm.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Affirm Developer Documentation</a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Braintree Configuration */}
                <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Braintree</h3>
                        <p className="text-sm text-gray-600">All-in-one payment platform with BNPL options</p>
                      </div>
                    </div>
                    <Switch
                      checked={safeSettings.payments?.braintree_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('payments', 'braintree_enabled', checked)}
                    />
                  </div>
                  
                  {safeSettings.payments?.braintree_enabled && (
                    <div className="mt-4 space-y-4 pl-13">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Merchant ID *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.braintree_merchant_id || ''}
                            onChange={(e) => handleSettingChange('payments', 'braintree_merchant_id', e.target.value)}
                            placeholder="Enter Merchant ID"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Public Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.braintree_public_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'braintree_public_key', e.target.value)}
                            placeholder="Enter Public Key"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Private Key *
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.payments?.braintree_private_key || ''}
                            onChange={(e) => handleSettingChange('payments', 'braintree_private_key', e.target.value)}
                            placeholder="Enter Private Key"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Get your credentials from the <a href="https://sandbox.braintreegateway.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Braintree Control Panel</a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Google Pay Configuration */}
                <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Google Pay</h3>
                        <p className="text-sm text-gray-600">Pay quickly with your Google account (uses Stripe)</p>
                      </div>
                    </div>
                    <Switch
                      checked={safeSettings.payments?.google_pay_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('payments', 'google_pay_enabled', checked)}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-red-50 p-3 rounded">
                    <p><strong>Note:</strong> Google Pay uses your Stripe configuration. Make sure Stripe is enabled and configured above.</p>
                  </div>
                </div>

                {/* Apple Pay Configuration */}
                <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Apple Pay</h3>
                        <p className="text-sm text-gray-600">Pay securely with Touch ID or Face ID (uses Stripe)</p>
                      </div>
                    </div>
                    <Switch
                      checked={safeSettings.payments?.apple_pay_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('payments', 'apple_pay_enabled', checked)}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-red-50 p-3 rounded">
                    <p><strong>Note:</strong> Apple Pay uses your Stripe configuration. Make sure Stripe is enabled and configured above.</p>
                  </div>
                </div>

                {/* General Payment Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold mb-4">General Payment Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Processing Fee (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={safeSettings.payments?.payment_processing_fee || ''}
                        onChange={(e) => handleSettingChange('payments', 'payment_processing_fee', e.target.value)}
                        placeholder="2.9"
                      />
                      <p className="text-xs text-gray-500 mt-1">Standard payment processing fee charged to vendors</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vendor Commission Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={safeSettings.payments?.vendor_commission_rate || ''}
                        onChange={(e) => handleSettingChange('payments', 'vendor_commission_rate', e.target.value)}
                        placeholder="15.0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Platform commission on vendor sales</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Order Amount ($)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={safeSettings.payments?.minimum_order_amount || ''}
                        onChange={(e) => handleSettingChange('payments', 'minimum_order_amount', e.target.value)}
                        placeholder="25.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum order value required for checkout</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Shipping Threshold ($)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={safeSettings.payments?.free_shipping_threshold || ''}
                        onChange={(e) => handleSettingChange('payments', 'free_shipping_threshold', e.target.value)}
                        placeholder="100.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Order amount for free shipping eligibility</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => saveSettings('payments')}
                  disabled={saving}
                  className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Security Notice</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Changes to security settings will affect all users. Please review carefully before saving.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication Required</h4>
                      <p className="text-sm text-gray-600">
                        Require all admin users to use 2FA
                      </p>
                    </div>
                    <Switch
                      checked={safeSettings.security?.two_factor_required || false}
                      onCheckedChange={(checked) => handleSettingChange('security', 'two_factor_required', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">IP Whitelist</h4>
                      <p className="text-sm text-gray-600">
                        Restrict admin access to specific IP addresses
                      </p>
                    </div>
                    <Switch
                      checked={safeSettings.security?.ip_whitelist_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('security', 'ip_whitelist_enabled', checked)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Expiry (Days)
                    </label>
                    <Input
                      type="number"
                      value={safeSettings.security?.password_expiry_days || ''}
                      onChange={(e) => handleSettingChange('security', 'password_expiry_days', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Login Attempts Limit
                    </label>
                    <Input
                      type="number"
                      value={safeSettings.security?.login_attempts_limit || ''}
                      onChange={(e) => handleSettingChange('security', 'login_attempts_limit', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (Minutes)
                    </label>
                    <Input
                      type="number"
                      value={safeSettings.security?.session_timeout_minutes || ''}
                      onChange={(e) => handleSettingChange('security', 'session_timeout_minutes', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audit Logs Retention (Days)
                    </label>
                    <Input
                      type="number"
                      value={safeSettings.security?.audit_logs_retention_days || ''}
                      onChange={(e) => handleSettingChange('security', 'audit_logs_retention_days', e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => saveSettings('security')}
                  disabled={saving}
                  className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Third-Party Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Analytics & Tracking</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Google Analytics ID
                        </label>
                        <Input
                          value={safeSettings.integrations?.google_analytics_id || ''}
                          onChange={(e) => handleSettingChange('integrations', 'google_analytics_id', e.target.value)}
                          placeholder="GA-XXXXXXXXX-X"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facebook Pixel ID
                        </label>
                        <Input
                          value={safeSettings.integrations?.facebook_pixel_id || ''}
                          onChange={(e) => handleSettingChange('integrations', 'facebook_pixel_id', e.target.value)}
                          placeholder="XXXXXXXXXXXXXXX"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Email & SMS</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mailchimp API Key
                        </label>
                        <Input
                          type="password"
                          value={safeSettings.integrations?.mailchimp_api_key || ''}
                          onChange={(e) => handleSettingChange('integrations', 'mailchimp_api_key', e.target.value)}
                          placeholder="Enter API key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Twilio Account SID
                        </label>
                        <Input
                          value={safeSettings.integrations?.twilio_account_sid || ''}
                          onChange={(e) => handleSettingChange('integrations', 'twilio_account_sid', e.target.value)}
                          placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">File Storage</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AWS S3 Bucket Name
                      </label>
                      <Input
                        value={safeSettings.integrations?.aws_s3_bucket || ''}
                        onChange={(e) => handleSettingChange('integrations', 'aws_s3_bucket', e.target.value)}
                        placeholder="your-bucket-name"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">SMTP Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Server
                        </label>
                        <Input
                          value={safeSettings.integrations?.smtp_server || ''}
                          onChange={(e) => handleSettingChange('integrations', 'smtp_server', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <Input
                          value={safeSettings.integrations?.smtp_port || ''}
                          onChange={(e) => handleSettingChange('integrations', 'smtp_port', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Username
                        </label>
                        <Input
                          value={safeSettings.integrations?.smtp_username || ''}
                          onChange={(e) => handleSettingChange('integrations', 'smtp_username', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Password
                        </label>
                        <Input
                          type="password"
                          value={safeSettings.integrations?.smtp_password || ''}
                          onChange={(e) => handleSettingChange('integrations', 'smtp_password', e.target.value)}
                          placeholder="Enter SMTP password"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Tax Calculation Service</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <Key className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-red-800">TaxJar Integration</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Enable TaxJar API for accurate, real-time tax calculations based on ZIP code and product type.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">Use TaxJar API</h4>
                          <p className="text-sm text-gray-600">
                            Enable TaxJar for tax calculations (overrides local tax rates)
                          </p>
                        </div>
                        <Switch
                          checked={safeSettings.integrations?.use_taxjar_api || false}
                          onCheckedChange={(checked) => handleSettingChange('integrations', 'use_taxjar_api', checked)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            TaxJar API Key
                          </label>
                          <Input
                            type="password"
                            value={safeSettings.integrations?.taxjar_api_key || ''}
                            onChange={(e) => handleSettingChange('integrations', 'taxjar_api_key', e.target.value)}
                            placeholder="Enter TaxJar API key"
                            disabled={!safeSettings.integrations?.use_taxjar_api}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Get your API key from <a href="https://www.taxjar.com/api/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">TaxJar Dashboard</a>
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Environment
                          </label>
                          <Select
                            value={safeSettings.integrations?.taxjar_environment || 'production'}
                            onValueChange={(value) => handleSettingChange('integrations', 'taxjar_environment', value)}
                            disabled={!safeSettings.integrations?.use_taxjar_api}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                              <SelectItem value="production">Production (Live)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* TaxJar Test Button */}
                      {safeSettings.integrations?.taxjar_api_key && (
                        <div className="mt-4">
                          <Button
                            onClick={testTaxJarConnection}
                            disabled={testingTaxJar}
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            {testingTaxJar ? 'Testing...' : 'Test TaxJar Connection'}
                          </Button>
                          
                          {taxJarTestResult && (
                            <div className={`mt-2 p-3 rounded-lg ${
                              taxJarTestResult.success 
                                ? 'bg-green-50 border border-green-200 text-green-800' 
                                : 'bg-red-50 border border-red-200 text-red-800'
                            }`}>
                              {taxJarTestResult.message}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Shipping Providers</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <Truck className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-red-800">Shipping Integration</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Connect with UPS and DHL for real-time shipping rates and label generation.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* UPS Configuration */}
                    <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Truck className="h-6 w-6 text-amber-700" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">UPS</h3>
                            <p className="text-sm text-gray-600">United Parcel Service shipping integration</p>
                          </div>
                        </div>
                        <Switch
                          checked={safeSettings.integrations?.shipping_ups_enabled || false}
                          onCheckedChange={(checked) => handleSettingChange('integrations', 'shipping_ups_enabled', checked)}
                        />
                      </div>
                      
                      {safeSettings.integrations?.shipping_ups_enabled && (
                        <div className="mt-4 space-y-4 pl-13">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                API Key *
                              </label>
                              <Input
                                type="password"
                                value={safeSettings.integrations?.shipping_ups_api_key || ''}
                                onChange={(e) => handleSettingChange('integrations', 'shipping_ups_api_key', e.target.value)}
                                placeholder="Enter UPS API Key"
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Number *
                              </label>
                              <Input
                                type="password"
                                value={safeSettings.integrations?.shipping_ups_account_number || ''}
                                onChange={(e) => handleSettingChange('integrations', 'shipping_ups_account_number', e.target.value)}
                                placeholder="Enter UPS Account Number"
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Environment
                            </label>
                            <Select
                              value={safeSettings.integrations?.shipping_ups_environment || 'production'}
                              onValueChange={(value) => handleSettingChange('integrations', 'shipping_ups_environment', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="test">Test (CIE)</SelectItem>
                                <SelectItem value="production">Production</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-xs text-gray-500">
                            Get your credentials from the <a href="https://www.ups.com/upsdeveloperkit" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">UPS Developer Kit</a>
                          </p>
                          
                          {/* UPS Test Button */}
                          {safeSettings.integrations?.shipping_ups_api_key && safeSettings.integrations?.shipping_ups_account_number && (
                            <div className="mt-4">
                              <Button
                                onClick={() => testShippingConnection('ups')}
                                disabled={testingShipping.ups}
                                variant="outline"
                                className="w-full sm:w-auto"
                              >
                                {testingShipping.ups ? 'Testing...' : 'Test UPS Connection'}
                              </Button>
                              
                              {shippingTestResults.ups && (
                                <div className={`mt-2 p-3 rounded-lg ${
                                  shippingTestResults.ups.success 
                                    ? 'bg-green-50 border border-green-200 text-green-800' 
                                    : 'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                  {shippingTestResults.ups.message}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* DHL Configuration */}
                    <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Truck className="h-6 w-6 text-yellow-700" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">DHL</h3>
                            <p className="text-sm text-gray-600">DHL Express shipping integration</p>
                          </div>
                        </div>
                        <Switch
                          checked={safeSettings.integrations?.shipping_dhl_enabled || false}
                          onCheckedChange={(checked) => handleSettingChange('integrations', 'shipping_dhl_enabled', checked)}
                        />
                      </div>
                      
                      {safeSettings.integrations?.shipping_dhl_enabled && (
                        <div className="mt-4 space-y-4 pl-13">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                API Key *
                              </label>
                              <Input
                                type="password"
                                value={safeSettings.integrations?.shipping_dhl_api_key || ''}
                                onChange={(e) => handleSettingChange('integrations', 'shipping_dhl_api_key', e.target.value)}
                                placeholder="Enter DHL API Key"
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Number *
                              </label>
                              <Input
                                type="password"
                                value={safeSettings.integrations?.shipping_dhl_account_number || ''}
                                onChange={(e) => handleSettingChange('integrations', 'shipping_dhl_account_number', e.target.value)}
                                placeholder="Enter DHL Account Number"
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Environment
                            </label>
                            <Select
                              value={safeSettings.integrations?.shipping_dhl_environment || 'production'}
                              onValueChange={(value) => handleSettingChange('integrations', 'shipping_dhl_environment', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="test">Test</SelectItem>
                                <SelectItem value="production">Production</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-xs text-gray-500">
                            Get your credentials from the <a href="https://developer.dhl.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DHL Developer Portal</a>
                          </p>
                          
                          {/* DHL Test Button */}
                          {safeSettings.integrations?.shipping_dhl_api_key && safeSettings.integrations?.shipping_dhl_account_number && (
                            <div className="mt-4">
                              <Button
                                onClick={() => testShippingConnection('dhl')}
                                disabled={testingShipping.dhl}
                                variant="outline"
                                className="w-full sm:w-auto"
                              >
                                {testingShipping.dhl ? 'Testing...' : 'Test DHL Connection'}
                              </Button>
                              
                              {shippingTestResults.dhl && (
                                <div className={`mt-2 p-3 rounded-lg ${
                                  shippingTestResults.dhl.success 
                                    ? 'bg-green-50 border border-green-200 text-green-800' 
                                    : 'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                  {shippingTestResults.dhl.message}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => saveSettings('integrations')}
                  disabled={saving}
                  className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Integration Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function getNotificationDescription(key: string): string {
  const descriptions: { [key: string]: string } = {
    email_notifications: 'Send notifications via email',
    sms_notifications: 'Send notifications via SMS',
    push_notifications: 'Send browser push notifications',
    order_notifications: 'Notify when orders are placed or updated',
    inventory_alerts: 'Alert when inventory is low',
    vendor_notifications: 'Notify vendors of relevant events',
    customer_service_alerts: 'Alert customer service team',
    system_alerts: 'System maintenance and error notifications'
  };
  return descriptions[key] || 'Configure notification settings';
}