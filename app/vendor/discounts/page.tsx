'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Copy, Calendar, BarChart3 } from 'lucide-react';

interface VendorDiscount {
  discount_id: number;
  discount_name: string;
  discount_code: string | null;
  display_name: string | null;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'tiered' | 'bulk_pricing';
  is_automatic: boolean;
  discount_value: number;
  volume_tiers: Array<{min_qty: number, max_qty?: number, discount_percent?: number, discount_amount?: number}> | null;
  minimum_order_value: number;
  maximum_discount_amount: number | null;
  minimum_quantity: number;
  applies_to: 'all_vendor_products' | 'specific_products' | 'specific_categories';
  target_ids: number[] | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  usage_count: number;
  usage_limit_total: number | null;
  usage_limit_per_customer: number | null;
  stackable_with_coupons: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface VendorCoupon {
  coupon_id: number;
  coupon_code: string;
  coupon_name: string;
  display_name: string | null;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'upgrade';
  discount_value: number;
  maximum_discount_amount: number | null;
  minimum_order_value: number;
  minimum_quantity: number;
  applies_to: 'all_vendor_products' | 'specific_products' | 'specific_categories';
  target_ids: number[] | null;
  usage_limit_total: number | null;
  usage_limit_per_customer: number;
  usage_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  stackable_with_discounts: boolean;
  priority: number;
  created_at: string;
}

export default function VendorDiscountsPage() {
  const [discounts, setDiscounts] = useState<VendorDiscount[]>([]);
  const [coupons, setCoupons] = useState<VendorCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('discounts');

  // Pagination and filtering states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch discounts and coupons
  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      });

      const response = await fetch(`/api/vendor/discounts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDiscounts(data.discounts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      });

      const response = await fetch(`/api/vendor/coupons?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCoupons(data.coupons);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'discounts') {
      fetchDiscounts();
    } else {
      fetchCoupons();
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter, activeTab]);

  // Bulk operations
  const handleBulkOperation = async (action: string, data?: any) => {
    if (selectedItems.length === 0) return;

    try {
      const endpoint = activeTab === 'discounts' ? '/api/vendor/discounts/bulk' : '/api/vendor/coupons/bulk';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          [activeTab === 'discounts' ? 'discount_ids' : 'coupon_ids']: selectedItems,
          data
        })
      });

      if (response.ok) {
        setSelectedItems([]);
        if (activeTab === 'discounts') {
          fetchDiscounts();
        } else {
          fetchCoupons();
        }
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error);
    }
  };

  // Status badge component with null safety
  const StatusBadge = ({ item }: { item: VendorDiscount | VendorCoupon }) => {
    try {
      if (!item || typeof item.is_active !== 'boolean') {
        return <Badge variant="secondary">Unknown</Badge>;
      }

      const now = new Date();
      const validFrom = item.valid_from ? new Date(item.valid_from) : null;
      const validUntil = item.valid_until ? new Date(item.valid_until) : null;

      if (!item.is_active) return <Badge variant="secondary">Inactive</Badge>;
      if (validFrom && now < validFrom) return <Badge variant="outline">Scheduled</Badge>;
      if (validUntil && now > validUntil) return <Badge variant="destructive">Expired</Badge>;
      return <Badge variant="default">Active</Badge>;
    } catch (error) {
      console.error('Error determining status:', error);
      return <Badge variant="secondary">Error</Badge>;
    }
  };

  // Discount type badge
  const TypeBadge = ({ type }: { type: string }) => {
    const colors: Record<string, string> = {
      percentage: 'bg-blue-100 text-blue-800',
      fixed_amount: 'bg-green-100 text-green-800',
      tiered: 'bg-purple-100 text-purple-800',
      bulk_pricing: 'bg-orange-100 text-orange-800',
      free_shipping: 'bg-cyan-100 text-cyan-800',
      upgrade: 'bg-pink-100 text-pink-800'
    };

    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  // Format discount value display safely
  const formatDiscountValue = (item: VendorDiscount | VendorCoupon) => {
    try {
      if ('volume_tiers' in item && item.volume_tiers) {
        return 'Tiered';
      }
      
      if (item.discount_type === 'percentage') {
        return `${item.discount_value || 0}%`;
      } else if (item.discount_type === 'fixed_amount') {
        return `$${item.discount_value || 0}`;
      } else if (item.discount_type === 'free_shipping') {
        return 'Free Shipping';
      } else if (item.discount_type === 'upgrade') {
        return 'Upgrade';
      }
      return String(item.discount_value || 0);
    } catch (error) {
      console.error('Error formatting discount value:', error);
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discounts & Coupons</h1>
          <p className="text-gray-600 mt-2">Manage your product discounts and coupon codes</p>
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </SheetTrigger>
            <SheetContent className="w-96">
              <SheetHeader>
                <SheetTitle>Discount Analytics</SheetTitle>
                <SheetDescription>
                  View performance metrics for your discounts and coupons
                </SheetDescription>
              </SheetHeader>
              {/* Analytics content would go here */}
              <div className="mt-6 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$2,450</div>
                    <p className="text-xs text-gray-600">Total discount amount</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top Performing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">SAVE10NOW</div>
                    <p className="text-xs text-gray-600">145 uses this month</p>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New {activeTab === 'discounts' ? 'Discount' : 'Coupon'}</DialogTitle>
                <DialogDescription>
                  Set up a new {activeTab === 'discounts' ? 'automatic discount' : 'coupon code'} for your products
                </DialogDescription>
              </DialogHeader>
              {/* Form would go here */}
              <div className="text-center py-8 text-gray-500">
                Form component would be implemented here
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search discounts and coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
            <SelectItem value="tiered">Tiered</SelectItem>
            <SelectItem value="free_shipping">Free Shipping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedItems.length} item(s) selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleBulkOperation('activate')}>
              Activate
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkOperation('deactivate')}>
              Deactivate
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkOperation('duplicate')}>
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkOperation('delete')}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discounts">Automatic Discounts</TabsTrigger>
          <TabsTrigger value="coupons">Coupon Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="discounts" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading discounts...</div>
          ) : discounts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500 mb-4">No discounts found</p>
                <Button>Create Your First Discount</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {discounts.map((discount) => (
                <Card key={discount.discount_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedItems.includes(discount.discount_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, discount.discount_id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== discount.discount_id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {discount.display_name || discount.discount_name}
                            </h3>
                            <StatusBadge item={discount} />
                            <TypeBadge type={discount.discount_type} />
                            {discount.discount_code && (
                              <Badge variant="outline" className="font-mono">
                                {discount.discount_code}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span>Value: {formatDiscountValue(discount)}</span>
                            <span>Min Order: ${discount.minimum_order_value}</span>
                            <span>Uses: {discount.usage_count}</span>
                            <span>Valid: {new Date(discount.valid_from).toLocaleDateString()}</span>
                          </div>
                          {discount.description && (
                            <p className="text-sm text-gray-500 mt-2">{discount.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500 mb-4">No coupons found</p>
                <Button>Create Your First Coupon</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <Card key={coupon.coupon_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedItems.includes(coupon.coupon_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, coupon.coupon_id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== coupon.coupon_id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {coupon.display_name || coupon.coupon_name}
                            </h3>
                            <StatusBadge item={coupon} />
                            <TypeBadge type={coupon.discount_type} />
                            <Badge variant="outline" className="font-mono text-lg px-3">
                              {coupon.coupon_code}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span>Value: {formatDiscountValue(coupon)}</span>
                            <span>Min Order: ${coupon.minimum_order_value}</span>
                            <span>Uses: {coupon.usage_count}/{coupon.usage_limit_total || '∞'}</span>
                            <span>Valid: {new Date(coupon.valid_from).toLocaleDateString()}</span>
                          </div>
                          {coupon.description && (
                            <p className="text-sm text-gray-500 mt-2">{coupon.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === pagination.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}