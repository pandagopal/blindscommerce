'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellOff,
  Package,
  Truck,
  CheckCircle,
  MessageSquare,
  RotateCcw,
  Tag,
  Settings,
  Trash2,
  Check,
  ChevronRight,
  Star,
  Gift
} from 'lucide-react';

interface Notification {
  notification_id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: any;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  order_update: { icon: <Package className="w-5 h-5" />, color: 'bg-red-100 text-red-600' },
  shipping: { icon: <Truck className="w-5 h-5" />, color: 'bg-red-100 text-red-600' },
  delivery: { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-100 text-green-600' },
  promotion: { icon: <Tag className="w-5 h-5" />, color: 'bg-red-100 text-red-600' },
  review_response: { icon: <Star className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-600' },
  support_update: { icon: <MessageSquare className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' },
  return_update: { icon: <RotateCcw className="w-5 h-5" />, color: 'bg-red-100 text-red-600' },
  system: { icon: <Settings className="w-5 h-5" />, color: 'bg-gray-100 text-gray-600' },
  reminder: { icon: <Bell className="w-5 h-5" />, color: 'bg-red-100 text-red-600' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [page, showUnreadOnly]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (showUnreadOnly) params.append('unread', 'true');

      const response = await fetch(`/api/v2/support/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/v2/support/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/v2/support/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      setNotifications(notifications.map(n =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/v2/support/notifications/read-all', {
        method: 'POST',
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await fetch(`/api/v2/support/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      setNotifications(notifications.filter(n => n.notification_id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/account/settings#notifications">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </Button>
          </Link>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={showUnreadOnly ? 'outline' : 'default'}
          size="sm"
          onClick={() => { setShowUnreadOnly(false); setPage(1); }}
        >
          All
        </Button>
        <Button
          variant={showUnreadOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setShowUnreadOnly(true); setPage(1); }}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showUnreadOnly ? 'No Unread Notifications' : 'No Notifications'}
              </h3>
              <p className="text-gray-500">
                {showUnreadOnly
                  ? 'You\'ve read all your notifications!'
                  : 'You don\'t have any notifications yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.system;
                const NotificationContent = (
                  <div
                    className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-red-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(notification.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {notification.link && <ChevronRight className="w-5 h-5 text-gray-400" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.notification_id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );

                return notification.link ? (
                  <Link key={notification.notification_id} href={notification.link}>
                    {NotificationContent}
                  </Link>
                ) : (
                  <div key={notification.notification_id}>{NotificationContent}</div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">Notification Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${typeConfig.order_update.color}`}>
                <Package className="w-3 h-3" />
              </div>
              <span className="text-gray-600">Order Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${typeConfig.shipping.color}`}>
                <Truck className="w-3 h-3" />
              </div>
              <span className="text-gray-600">Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${typeConfig.support_update.color}`}>
                <MessageSquare className="w-3 h-3" />
              </div>
              <span className="text-gray-600">Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${typeConfig.promotion.color}`}>
                <Tag className="w-3 h-3" />
              </div>
              <span className="text-gray-600">Promotions</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
