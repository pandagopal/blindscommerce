'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Bell, BellOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SMSPreferencesProps {
  userPhone?: string;
  userEmail?: string;
  onPreferencesUpdate?: (preferences: any) => void;
}

interface SMSPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required?: boolean;
}

export default function SMSPreferences({ 
  userPhone = '', 
  userEmail = '',
  onPreferencesUpdate 
}: SMSPreferencesProps) {
  const [phone, setPhone] = useState(userPhone);
  const [email, setEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isOptedOut, setIsOptedOut] = useState(false);

  const [preferences, setPreferences] = useState<SMSPreference[]>([
    {
      id: 'order_updates',
      name: 'Order Updates',
      description: 'Order confirmations, shipping updates, and delivery notifications',
      enabled: true,
      required: true
    },
    {
      id: 'installation_reminders',
      name: 'Installation Reminders',
      description: 'Appointment confirmations and installation reminders',
      enabled: true
    },
    {
      id: 'price_alerts',
      name: 'Price Alerts',
      description: 'Notifications when items in your wishlist go on sale',
      enabled: false
    },
    {
      id: 'cart_reminders',
      name: 'Cart Reminders',
      description: 'Reminders about items left in your shopping cart',
      enabled: false
    },
    {
      id: 'promotions',
      name: 'Promotional Offers',
      description: 'Special discounts, flash sales, and exclusive offers',
      enabled: false
    },
    {
      id: 'restock_alerts',
      name: 'Back in Stock Alerts',
      description: 'Notifications when out-of-stock items become available',
      enabled: false
    }
  ]);

  // Check current opt-out status
  useEffect(() => {
    if (phone) {
      checkOptOutStatus();
    }
  }, [phone]);

  const checkOptOutStatus = async () => {
    if (!phone) return;
    
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await fetch(`/api/v2/notifications/sms/opt-out?phone=${cleanPhone}`);
      
      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API request failed');
        setIsOptedOut(data.data?.isOptedOut || false);
      }
    } catch (error) {
      console.error('Error checking opt-out status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptOut = async () => {
    if (!phone) {
      setMessage('Please enter a valid phone number');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/v2/notifications/sms/opt-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, email }),
      });

      const data = await response.json();
      if (!data.success && response.ok) throw new Error(data.message || 'API request failed');

      if (response.ok && data.success) {
        setIsOptedOut(true);
        setMessage('Successfully opted out of SMS notifications');
        // Disable all non-required preferences
        setPreferences(prev => prev.map(pref => ({
          ...pref,
          enabled: pref.required || false
        })));
      } else {
        setMessage(data.error || 'Failed to opt out');
      }
    } catch (error) {
      console.error('Error opting out:', error);
      setMessage('Failed to opt out. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOptIn = async () => {
    if (!phone) {
      setMessage('Please enter a valid phone number');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/v2/notifications/sms/opt-out', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, email }),
      });

      const data = await response.json();
      if (!data.success && response.ok) throw new Error(data.message || 'API request failed');

      if (response.ok && data.success) {
        setIsOptedOut(false);
        setMessage('Successfully opted back into SMS notifications');
      } else {
        setMessage(data.error || 'Failed to opt in');
      }
    } catch (error) {
      console.error('Error opting in:', error);
      setMessage('Failed to opt in. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (preferenceId: string, enabled: boolean) => {
    if (isOptedOut && enabled) {
      setMessage('Please opt back into SMS notifications to enable preferences');
      return;
    }

    setPreferences(prev => prev.map(pref => 
      pref.id === preferenceId ? { ...pref, enabled } : pref
    ));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      // Save preferences to user profile
      const response = await fetch('/api/v2/users/sms-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          email,
          preferences: preferences.reduce((acc, pref) => {
            acc[pref.id] = pref.enabled;
            return acc;
          }, {} as Record<string, boolean>)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API request failed');
        setMessage('SMS preferences saved successfully');
        onPreferencesUpdate?.(preferences);
      } else {
        setMessage('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const match = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          SMS Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(316) 530-2635"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Opt-out Status */}
          <div className={`p-4 rounded-lg border ${
            isOptedOut ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isOptedOut ? (
                  <BellOff className="h-5 w-5 text-red-600 mr-2" />
                ) : (
                  <Bell className="h-5 w-5 text-green-600 mr-2" />
                )}
                <div>
                  <p className={`font-medium ${
                    isOptedOut ? 'text-red-900' : 'text-green-900'
                  }`}>
                    {isOptedOut ? 'SMS Notifications Disabled' : 'SMS Notifications Enabled'}
                  </p>
                  <p className={`text-sm ${
                    isOptedOut ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {isOptedOut 
                      ? 'You will not receive promotional SMS messages'
                      : 'You will receive SMS notifications based on your preferences below'
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={isOptedOut ? handleOptIn : handleOptOut}
                variant={isOptedOut ? "default" : "outline"}
                size="sm"
                disabled={saving || !phone}
              >
                {saving ? 'Processing...' : (isOptedOut ? 'Opt In' : 'Opt Out')}
              </Button>
            </div>
          </div>
        </div>

        {/* SMS Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Types</h3>
          <div className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium">{pref.name}</h4>
                    {pref.required && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pref.description}</p>
                </div>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={(enabled) => handlePreferenceChange(pref.id, enabled)}
                  disabled={pref.required || (isOptedOut && !pref.required)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-gray-600">
            <p>
              <strong>Note:</strong> Transactional messages (order updates) cannot be disabled.
            </p>
            <p className="mt-1">
              Reply STOP to any SMS to opt out immediately.
            </p>
          </div>
          <Button
            onClick={savePreferences}
            disabled={saving || !phone}
            className="min-w-[120px]"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-3 rounded-lg border ${
            message.includes('success') || message.includes('Success')
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.includes('success') || message.includes('Success') ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}