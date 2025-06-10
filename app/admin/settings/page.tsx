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
  Database, Key, AlertTriangle, Save, Upload 
} from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<{[key: string]: string[]}>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [settings, setSettings] = useState({
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
      smtp_username: 'notifications@smartblindshub.com'
    }
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/admin/settings');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'admin') {
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
      const res = await fetch('/api/admin/settings');
      if (!res.ok) {
        throw new Error('Failed to load settings');
      }
      const data = await res.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      alert('Failed to load settings. Using defaults.');
    }
  };

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const saveSettings = async (category?: string) => {
    setSaving(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      let response;
      
      if (category) {
        // Save specific category
        response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category,
            settings: settings[category as keyof typeof settings]
          }),
        });
      } else {
        // Save all settings
        response = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
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
            const currentCategory = category || 'general';
            if (!errorsByCategory[currentCategory]) {
              errorsByCategory[currentCategory] = [];
            }
            errorsByCategory[currentCategory].push(error);
          });
          setErrors(errorsByCategory);
        } else {
          setErrors({ general: [result.error || 'Failed to save settings'] });
        }
        return;
      }

      setSuccessMessage(result.message || 'Settings saved successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Reload settings to ensure we have the latest data
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrors({ 
        general: [`Failed to save settings: ${error instanceof Error ? error.message : 'Please try again.'}`] 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              System Settings
            </h1>
            <p className="text-gray-600">Configure system-wide settings and preferences</p>
          </div>
          
          <Button
            onClick={() => saveSettings()}
            disabled={saving}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
          <TabsList className="bg-white border border-purple-100">
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
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Name
                    </label>
                    <Input
                      value={settings.general.site_name}
                      onChange={(e) => handleSettingChange('general', 'site_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <Input
                      type="email"
                      value={settings.general.contact_email}
                      onChange={(e) => handleSettingChange('general', 'contact_email', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <Textarea
                    value={settings.general.site_description}
                    onChange={(e) => handleSettingChange('general', 'site_description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      value={settings.general.phone}
                      onChange={(e) => handleSettingChange('general', 'phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <Select
                      value={settings.general.timezone}
                      onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <Select
                      value={settings.general.currency}
                      onValueChange={(value) => handleSettingChange('general', 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar</SelectItem>
                        <SelectItem value="EUR">Euro</SelectItem>
                        <SelectItem value="GBP">British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.general.tax_rate}
                      onChange={(e) => handleSettingChange('general', 'tax_rate', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-3 mt-8">
                    <Switch
                      checked={settings.general.maintenance_mode}
                      onCheckedChange={(checked) => handleSettingChange('general', 'maintenance_mode', checked)}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Maintenance Mode
                    </label>
                  </div>
                </div>

                <Button
                  onClick={() => saveSettings('general')}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Payment Methods</h4>
                  {Object.entries(settings.payments)
                    .filter(([key]) => key.endsWith('_enabled'))
                    .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">
                          {key.replace(/_enabled/g, '').replace(/_/g, ' ')}
                        </h4>
                      </div>
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => handleSettingChange('payments', key, checked)}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Processing Fee (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.payments.payment_processing_fee}
                      onChange={(e) => handleSettingChange('payments', 'payment_processing_fee', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Amount ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.payments.minimum_order_amount}
                      onChange={(e) => handleSettingChange('payments', 'minimum_order_amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Shipping Threshold ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.payments.free_shipping_threshold}
                      onChange={(e) => handleSettingChange('payments', 'free_shipping_threshold', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Commission Rate (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.payments.vendor_commission_rate}
                      onChange={(e) => handleSettingChange('payments', 'vendor_commission_rate', e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => saveSettings('payments')}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center">
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
                      checked={settings.security.two_factor_required}
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
                      checked={settings.security.ip_whitelist_enabled}
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
                      value={settings.security.password_expiry_days}
                      onChange={(e) => handleSettingChange('security', 'password_expiry_days', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Login Attempts Limit
                    </label>
                    <Input
                      type="number"
                      value={settings.security.login_attempts_limit}
                      onChange={(e) => handleSettingChange('security', 'login_attempts_limit', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (Minutes)
                    </label>
                    <Input
                      type="number"
                      value={settings.security.session_timeout_minutes}
                      onChange={(e) => handleSettingChange('security', 'session_timeout_minutes', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audit Logs Retention (Days)
                    </label>
                    <Input
                      type="number"
                      value={settings.security.audit_logs_retention_days}
                      onChange={(e) => handleSettingChange('security', 'audit_logs_retention_days', e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => saveSettings('security')}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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
                          value={settings.integrations.google_analytics_id}
                          onChange={(e) => handleSettingChange('integrations', 'google_analytics_id', e.target.value)}
                          placeholder="GA-XXXXXXXXX-X"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facebook Pixel ID
                        </label>
                        <Input
                          value={settings.integrations.facebook_pixel_id}
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
                          value={settings.integrations.mailchimp_api_key}
                          onChange={(e) => handleSettingChange('integrations', 'mailchimp_api_key', e.target.value)}
                          placeholder="Enter API key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Twilio Account SID
                        </label>
                        <Input
                          value={settings.integrations.twilio_account_sid}
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
                        value={settings.integrations.aws_s3_bucket}
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
                          value={settings.integrations.smtp_server}
                          onChange={(e) => handleSettingChange('integrations', 'smtp_server', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <Input
                          value={settings.integrations.smtp_port}
                          onChange={(e) => handleSettingChange('integrations', 'smtp_port', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Username
                        </label>
                        <Input
                          value={settings.integrations.smtp_username}
                          onChange={(e) => handleSettingChange('integrations', 'smtp_username', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => saveSettings('integrations')}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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