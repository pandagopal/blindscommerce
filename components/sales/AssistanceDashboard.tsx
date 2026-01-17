'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  UserCheck, 
  ShoppingCart, 
  MessageCircle, 
  HelpCircle,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Minus,
  Percent
} from 'lucide-react';

interface Customer {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface CartItem {
  cart_item_id: number;
  product_id: number;
  product_name: string;
  vendor_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  discount_amount?: number;
  coupon_code?: string;
}

interface Cart {
  cartId: number;
  status: string;
  totalAmount: number;
  itemCount: number;
  customer: Customer;
  items: CartItem[];
}

interface ActiveSession {
  sessionId: number;
  customer: Customer;
  sessionType: string;
  permissions: Record<string, boolean>;
  cartDetails?: Cart;
}

interface SalesStatus {
  isOnline: boolean;
  isAvailableForAssistance: boolean;
  currentActiveSessions: number;
  maxConcurrentSessions: number;
  notificationPreferences: Record<string, any>;
}

export default function AssistanceDashboard() {
  const [status, setStatus] = useState<SalesStatus>({
    isOnline: false,
    isAvailableForAssistance: false,
    currentActiveSessions: 0,
    maxConcurrentSessions: 5,
    notificationPreferences: {}
  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [offlineReason, setOfflineReason] = useState('');

  useEffect(() => {
    // Auto-set online status when component loads
    autoSetOnline();
    loadStatus();
  }, []);

  const autoSetOnline = async () => {
    try {
      const response = await fetch('/api/v2/sales/auto-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'API request failed');
      
      if (data.success && data.data?.status) {
        setStatus(prev => ({ ...prev, ...data.data.status }));
      }
    } catch (error) {
      console.error('Failed to auto-set online:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/v2/sales/status');
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'API request failed');
      
      if (data.success) {
        setStatus(data.data?.status || data.status);
        setActiveSessions(data.data?.activeSessions || []);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const updateStatus = async (updates: Partial<SalesStatus>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v2/sales/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.message || data.error || 'Failed to update status');
      } else {
        setStatus(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      setError('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptAssistanceRequest = async () => {
    if (!pinInput.trim()) {
      setError('Please enter a PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v2/sales/assistance/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessPin: pinInput.trim() }),
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.message || data.error || 'Failed to accept assistance request');
        return;
      }
      
      if (data.success && data.data) {
        const newSession: ActiveSession = {
          sessionId: data.data.sessionId,
          customer: data.data.customer,
          sessionType: data.data.sessionType,
          permissions: data.data.permissions,
          cartDetails: data.data.cartDetails
        };
        
        setActiveSessions(prev => [...prev, newSession]);
        setPinInput('');
        setStatus(prev => ({
          ...prev,
          currentActiveSessions: prev.currentActiveSessions + 1
        }));
      }
    } catch (error) {
      setError('Failed to accept assistance request');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerCart = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/v2/sales/assistance/cart?sessionId=${sessionId}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'API request failed');
      
      if (data.success && data.data?.cart) {
        const updatedSessions = activeSessions.map(session => 
          session.sessionId === sessionId 
            ? { ...session, cartDetails: data.data.cart }
            : session
        );
        setActiveSessions(updatedSessions);
        
        if (selectedSession?.sessionId === sessionId) {
          setSelectedSession({ ...selectedSession, cartDetails: data.cart });
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const modifyCart = async (sessionId: number, action: string, params: any = {}) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v2/sales/assistance/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action,
          ...params
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.message || data.error || 'Failed to modify cart');
      } else {
        // Reload cart after modification
        await loadCustomerCart(sessionId);
      }
    } catch (error) {
      setError('Failed to modify cart');
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'cart_assistance': return ShoppingCart;
      case 'consultation': return MessageCircle;
      default: return HelpCircle;
    }
  };

  const getSessionTypeBadge = (type: string) => {
    switch (type) {
      case 'cart_assistance': return <Badge className="bg-red-100 text-red-800">Cart Help</Badge>;
      case 'consultation': return <Badge className="bg-red-100 text-red-800">Consultation</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Support</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Sales Assistant Status</span>
          </CardTitle>
          <CardDescription>
            Manage your availability for customer assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Online Status</div>
              <div className="text-sm text-gray-600">
                Show as available to receive assistance requests
              </div>
            </div>
            <Switch
              checked={status.isOnline}
              onCheckedChange={(checked) => {
                if (!checked) {
                  // Show dialog for offline reason
                  setShowOfflineDialog(true);
                } else {
                  // Going online
                  updateStatus({ 
                    isOnline: true,
                    isAvailableForAssistance: true
                  });
                }
              }}
              disabled={isLoading}
            />
          </div>

          {status.isOnline && (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">Available for Assistance</div>
                <div className="text-sm text-gray-600">
                  Accept new customer assistance requests
                </div>
              </div>
              <Switch
                checked={status.isAvailableForAssistance}
                onCheckedChange={(checked) => 
                  updateStatus({ isAvailableForAssistance: checked })
                }
                disabled={isLoading}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-red">
                {status.currentActiveSessions}
              </div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {status.maxConcurrentSessions}
              </div>
              <div className="text-sm text-gray-600">Max Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIN Input */}
      <Card>
        <CardHeader>
          <CardTitle>Accept Assistance Request</CardTitle>
          <CardDescription>
            Enter the customer's 8-digit PIN to start helping them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter 8-digit PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              maxLength={8}
              className="font-mono text-lg"
            />
            <Button
              onClick={acceptAssistanceRequest}
              disabled={isLoading || !pinInput.trim() || !status.isAvailableForAssistance}
              className="bg-red-600 hover:bg-primary-dark"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Accept'
              )}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Active Assistance Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No active assistance sessions
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => {
                const Icon = getSessionTypeIcon(session.sessionType);
                return (
                  <div key={session.sessionId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-primary-red" />
                        <div>
                          <div className="font-medium">
                            {session.customer.firstName} {session.customer.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {session.customer.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSessionTypeBadge(session.sessionType)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    {session.cartDetails && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        Cart: {session.cartDetails.itemCount} items, 
                        ${session.cartDetails.totalAmount.toFixed(2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Details Modal/Panel */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Session Details - {selectedSession.customer.firstName} {selectedSession.customer.lastName}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSession(null)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cart" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cart">Customer Cart</TabsTrigger>
                <TabsTrigger value="actions">Quick Actions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cart" className="space-y-4">
                {selectedSession.cartDetails ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Cart Items</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadCustomerCart(selectedSession.sessionId)}
                      >
                        Refresh Cart
                      </Button>
                    </div>
                    
                    {selectedSession.cartDetails.items.map((item) => (
                      <div key={item.cart_item_id} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-gray-600">
                              {item.vendor_name} • Qty: {item.quantity} • ${item.unit_price}
                            </div>
                            {item.discount_amount && (
                              <div className="text-sm text-green-600">
                                Discount: -${item.discount_amount}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${item.line_total.toFixed(2)}</div>
                            <div className="flex space-x-1 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => modifyCart(selectedSession.sessionId, 'update_quantity', {
                                  itemId: item.cart_item_id,
                                  quantity: item.quantity + 1
                                })}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => modifyCart(selectedSession.sessionId, 'update_quantity', {
                                  itemId: item.cart_item_id,
                                  quantity: Math.max(1, item.quantity - 1)
                                })}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => modifyCart(selectedSession.sessionId, 'apply_discount', {
                                  itemId: item.cart_item_id,
                                  discountAmount: 10
                                })}
                              >
                                <Percent className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-medium">
                        <span>Total: ${selectedSession.cartDetails.totalAmount.toFixed(2)}</span>
                        <span>{selectedSession.cartDetails.itemCount} items</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Customer has no active cart
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Chat Session
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add Recommended Products
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Percent className="h-4 w-4 mr-2" />
                    Apply Bulk Discount
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Session
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Offline Reason Dialog */}
      <Dialog open={showOfflineDialog} onOpenChange={setShowOfflineDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Going Offline</DialogTitle>
            <DialogDescription>
              Please provide a reason for going offline. This helps with scheduling and coverage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="offline-reason">Reason</Label>
              <Textarea
                id="offline-reason"
                placeholder="e.g., Lunch break, Meeting, End of shift..."
                value={offlineReason}
                onChange={(e) => setOfflineReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOfflineDialog(false);
                setOfflineReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateStatus({ 
                  isOnline: false,
                  isAvailableForAssistance: false
                });
                // You could also save the offline reason to the database here
                setShowOfflineDialog(false);
                setOfflineReason('');
              }}
              disabled={!offlineReason.trim()}
            >
              Go Offline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}