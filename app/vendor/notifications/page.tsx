'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Bell, Package, DollarSign, AlertCircle, Info, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Notification {
  notification_id: number;
  type: 'order' | 'payment' | 'system' | 'product';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  productAlerts: boolean;
  systemAlerts: boolean;
}

export default function VendorNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    orderUpdates: true,
    paymentAlerts: true,
    productAlerts: true,
    systemAlerts: true,
  });

  // Lazy load notifications data only when this route is active
  const fetchNotificationsData = async () => {
    try {
      const response = await fetch('/api/v2/vendors/notifications', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      return { 
        notifications: data.data || [], 
        settings: data.settings || settings 
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Return empty array on error to ensure the page doesn't break
      return { notifications: [], settings };
    }
  };

  const { 
    data: fetchedData, 
    loading, 
    error, 
    refetch 
  } = useLazyLoad(fetchNotificationsData, {
    targetPath: '/vendor/notifications',
    dependencies: []
  });

  useEffect(() => {
    if (fetchedData) {
      setNotifications(fetchedData.notifications || []);
      if (fetchedData.settings) {
        setSettings(fetchedData.settings);
      }
    }
  }, [fetchedData]);

  const markAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.notification_id === notificationId
          ? { ...notif, is_read: true, read_at: new Date().toISOString() }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({
        ...notif,
        is_read: true,
        read_at: notif.read_at || new Date().toISOString(),
      }))
    );
  };

  const deleteNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(notif => notif.notification_id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-5 w-5" />;
      case 'payment':
        return <DollarSign className="h-5 w-5" />;
      case 'product':
        return <AlertCircle className="h-5 w-5" />;
      case 'system':
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-600 bg-blue-100';
      case 'payment':
        return 'text-green-600 bg-green-100';
      case 'product':
        return 'text-orange-600 bg-orange-100';
      case 'system':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-purple-600 bg-purple-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-2">Stay updated with your store activities</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            All Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary-red">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Actions Bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications yet</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    You'll receive notifications here when there are new orders, payments, 
                    or important updates about your store.
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.notification_id}
                  className={`transition-all ${
                    !notification.is_read ? 'border-red-200 bg-red-50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-full ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(notification.created_at)}
                              </span>
                              {notification.action_url && (
                                <a
                                  href={notification.action_url}
                                  className="text-xs text-primary-red hover:text-red-700 font-medium"
                                >
                                  View Details →
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-4">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.notification_id)}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.notification_id)}
                              title="Delete"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="text-base">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Notification Types</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="order-updates" className="text-base">
                      Order Updates
                    </Label>
                    <p className="text-sm text-gray-600">
                      New orders, cancellations, and status changes
                    </p>
                  </div>
                  <Switch
                    id="order-updates"
                    checked={settings.orderUpdates}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, orderUpdates: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payment-alerts" className="text-base">
                      Payment Alerts
                    </Label>
                    <p className="text-sm text-gray-600">
                      Payment received, refunds, and payout notifications
                    </p>
                  </div>
                  <Switch
                    id="payment-alerts"
                    checked={settings.paymentAlerts}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, paymentAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="product-alerts" className="text-base">
                      Product Alerts
                    </Label>
                    <p className="text-sm text-gray-600">
                      Low stock warnings and product updates
                    </p>
                  </div>
                  <Switch
                    id="product-alerts"
                    checked={settings.productAlerts}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, productAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-alerts" className="text-base">
                      System Alerts
                    </Label>
                    <p className="text-sm text-gray-600">
                      Platform updates and maintenance notifications
                    </p>
                  </div>
                  <Switch
                    id="system-alerts"
                    checked={settings.systemAlerts}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, systemAlerts: checked }))
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-primary-red hover:bg-red-700">
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}