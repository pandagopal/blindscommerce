'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Calendar, Package, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WarrantyRegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    product_id: '',
    serial_number: '',
    purchase_date: '',
    warranty_type: 'standard',
    warranty_duration_months: '12'
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/account/warranty/register');
          return;
        }
        const result = await res.json();
        const data = result.data || result;setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/account/warranty/register');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchRecentOrders();
    }
  }, [user]);

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch(`/api/account/orders`);
      if (res.ok) {
        const data = await res.json();
        // Get recent orders with products that might need warranty registration
        setRecentOrders(data.orders?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v2/users/warranty/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          customer_id: user.userId,
          product_id: parseInt(formData.product_id),
          warranty_duration_months: parseInt(formData.warranty_duration_months)
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const selectFromOrder = (order: any, product: any) => {
    setFormData({
      product_id: product.product_id.toString(),
      serial_number: '',
      purchase_date: order.order_date.split('T')[0],
      warranty_type: 'standard',
      warranty_duration_months: '12'
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto border-green-200 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-700">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your product warranty has been registered successfully. You can now submit claims if needed.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push('/account/warranty')}
                className="bg-gradient-to-r from-red-500 to-primary-dark hover:from-primary-dark hover:to-red-900"
              >
                View Warranties
              </Button>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    product_id: '',
                    serial_number: '',
                    purchase_date: '',
                    warranty_type: 'standard',
                    warranty_duration_months: '12'
                  });
                }}
                variant="outline"
              >
                Register Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
              Register Product Warranty
            </h1>
            <p className="text-gray-600">
              Register your product to activate warranty protection and access support services
            </p>
          </div>

          {/* Recent Orders for Quick Registration */}
          {recentOrders.length > 0 && (
            <Card className="mb-8 border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Quick Register from Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.order_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Order #{order.order_number}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.order_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-2">
                          {order.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <Button
                                onClick={() => selectFromOrder(order, item)}
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-primary-red hover:bg-red-50"
                              >
                                Register
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Registration Form */}
          <Card className="border-red-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Product Registration Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="h-4 w-4 inline mr-1" />
                    Product ID *
                  </label>
                  <Input
                    type="number"
                    value={formData.product_id}
                    onChange={(e) => handleInputChange('product_id', e.target.value)}
                    placeholder="Enter product ID"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can find the product ID on your receipt or product packaging
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => handleInputChange('serial_number', e.target.value)}
                    placeholder="Enter serial number"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usually found on a label on the product or packaging
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Purchase Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Type
                  </label>
                  <Select
                    value={formData.warranty_type}
                    onValueChange={(value) => handleInputChange('warranty_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Warranty</SelectItem>
                      <SelectItem value="extended">Extended Warranty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Duration (Months)
                  </label>
                  <Select
                    value={formData.warranty_duration_months}
                    onValueChange={(value) => handleInputChange('warranty_duration_months', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                      <SelectItem value="36">36 Months</SelectItem>
                      <SelectItem value="60">60 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-red-500 to-primary-dark hover:from-primary-dark hover:to-red-900"
                  >
                    {loading ? 'Registering...' : 'Register Warranty'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/account/warranty')}
                    className="border-red-200 text-primary-red hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}