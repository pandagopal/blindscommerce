'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, MoreHorizontal, Edit, Copy, Calendar, BarChart3, Save, AlertCircle, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

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
  const [error, setError] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('discounts');
  const [editingItem, setEditingItem] = useState<VendorDiscount | VendorCoupon | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Lazy load discounts/coupons data only when this route is active
  const fetchDiscountsData = async () => {
    const endpoint = activeTab === 'discounts' ? '/api/vendor/discounts' : '/api/vendor/coupons';
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pagination.limit.toString(),
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(typeFilter !== 'all' && { type: typeFilter })
    });

    const response = await fetch(`${endpoint}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch data');
    
    return response.json();
  };

  const { 
    data: fetchedData, 
    loading, 
    error: fetchError, 
    refetch 
  } = useLazyLoad(fetchDiscountsData, {
    targetPath: '/vendor/discounts',
    dependencies: [currentPage, searchTerm, statusFilter, typeFilter, activeTab]
  });

  useEffect(() => {
    if (fetchedData) {
      const data = fetchedData;
      
      if (activeTab === 'discounts') {
        setDiscounts(data.discounts || []);
      } else {
        setCoupons(data.coupons || []);
      }
      
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / prev.limit)
      }));
    }
  }, [fetchedData, activeTab]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive: boolean, validUntil?: string | null) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (validUntil && new Date(validUntil) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  const getDiscountValue = (item: VendorDiscount | VendorCoupon) => {
    if (item.discount_type === 'percentage') {
      return `${item.discount_value}%`;
    }
    return `$${item.discount_value}`;
  };

  const handleEdit = (item: VendorDiscount | VendorCoupon) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData: Partial<VendorDiscount | VendorCoupon>) => {
    if (!editingItem) return;

    try {
      const endpoint = activeTab === 'discounts' 
        ? `/api/vendor/discounts/${(editingItem as VendorDiscount).discount_id}`
        : `/api/vendor/coupons/${(editingItem as VendorCoupon).coupon_id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      setIsEditModalOpen(false);
      setEditingItem(null);
      refetch(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleToggleStatus = async (item: VendorDiscount | VendorCoupon) => {
    try {
      const endpoint = activeTab === 'discounts' 
        ? `/api/vendor/discounts/${(item as VendorDiscount).discount_id}`
        : `/api/vendor/coupons/${(item as VendorCoupon).coupon_id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle status');
      }

      refetch(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discounts & Coupons</h1>
            <p className="text-gray-600 mt-1">Manage your product discounts and coupon codes</p>
          </div>
          <Button className="inline-flex items-center px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-red-700 transition-colors">
            <Plus className="h-5 w-5 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 my-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              <SelectItem value="tiered">Tiered</SelectItem>
              {activeTab === 'coupons' && <SelectItem value="free_shipping">Free Shipping</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="discounts">
          <div className="bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discounts.map((discount) => (
                    <tr key={discount.discount_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {discount.display_name || discount.discount_name}
                        </div>
                        <div className="text-sm text-gray-500">{discount.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{discount.discount_type.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDiscountValue(discount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(discount.is_active, discount.valid_until)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {discount.usage_count}
                        {discount.usage_limit_total && ` / ${discount.usage_limit_total}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {discount.valid_until ? formatDate(discount.valid_until) : 'No expiry'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(discount)}
                          title="Edit discount"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleStatus(discount)}
                          title={discount.is_active ? 'Deactivate discount' : 'Activate discount'}
                        >
                          {discount.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {discounts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No discounts found</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="coupons">
          <div className="bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => (
                    <tr key={coupon.coupon_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {coupon.coupon_code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {coupon.display_name || coupon.coupon_name}
                        </div>
                        <div className="text-sm text-gray-500">{coupon.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{coupon.discount_type.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDiscountValue(coupon)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(coupon.is_active, coupon.valid_until)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coupon.usage_count}
                        {coupon.usage_limit_total && ` / ${coupon.usage_limit_total}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {coupon.valid_until ? formatDate(coupon.valid_until) : 'No expiry'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(coupon)}
                          title="Edit coupon"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleStatus(coupon)}
                          title={coupon.is_active ? 'Deactivate coupon' : 'Activate coupon'}
                        >
                          {coupon.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {coupons.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No coupons found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({length: pagination.totalPages}, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit {activeTab === 'discounts' ? 'Discount' : 'Coupon'}
            </DialogTitle>
            <DialogDescription>
              Update the details for this {activeTab === 'discounts' ? 'discount' : 'coupon'}.
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <EditForm
              item={editingItem}
              type={activeTab}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Form Component
interface EditFormProps {
  item: VendorDiscount | VendorCoupon;
  type: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function EditForm({ item, type, onSave, onCancel }: EditFormProps) {
  const [formData, setFormData] = useState({
    discount_name: type === 'discounts' ? (item as VendorDiscount).discount_name : (item as VendorCoupon).coupon_name,
    discount_code: type === 'discounts' ? (item as VendorDiscount).discount_code || '' : (item as VendorCoupon).coupon_code,
    display_name: item.display_name || '',
    description: item.description || '',
    discount_type: item.discount_type,
    discount_value: item.discount_value,
    minimum_order_value: item.minimum_order_value,
    maximum_discount_amount: item.maximum_discount_amount || 0,
    minimum_quantity: item.minimum_quantity,
    valid_from: item.valid_from.split('T')[0], // Convert to date input format
    valid_until: item.valid_until ? item.valid_until.split('T')[0] : '',
    is_active: item.is_active,
    usage_limit_total: type === 'discounts' ? (item as VendorDiscount).usage_limit_total || 0 : (item as VendorCoupon).usage_limit_total || 0,
    usage_limit_per_customer: type === 'discounts' ? (item as VendorDiscount).usage_limit_per_customer || 0 : (item as VendorCoupon).usage_limit_per_customer || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'discounts' ? 'Discount' : 'Coupon'} Name
          </label>
          <Input
            value={formData.discount_name}
            onChange={(e) => handleChange('discount_name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code
          </label>
          <Input
            value={formData.discount_code}
            onChange={(e) => handleChange('discount_code', e.target.value)}
            placeholder="Optional code"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <Input
            value={formData.display_name}
            onChange={(e) => handleChange('display_name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <Select
            value={formData.discount_type}
            onValueChange={(value) => handleChange('discount_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              {type === 'discounts' && <SelectItem value="tiered">Tiered</SelectItem>}
              {type === 'discounts' && <SelectItem value="bulk_pricing">Bulk Pricing</SelectItem>}
              {type === 'coupons' && <SelectItem value="free_shipping">Free Shipping</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.discount_value}
            onChange={(e) => handleChange('discount_value', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Order Value
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.minimum_order_value}
            onChange={(e) => handleChange('minimum_order_value', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valid From
          </label>
          <Input
            type="date"
            value={formData.valid_from}
            onChange={(e) => handleChange('valid_from', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valid Until
          </label>
          <Input
            type="date"
            value={formData.valid_until}
            onChange={(e) => handleChange('valid_until', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usage Limit (Total)
          </label>
          <Input
            type="number"
            value={formData.usage_limit_total}
            onChange={(e) => handleChange('usage_limit_total', parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usage Limit (Per Customer)
          </label>
          <Input
            type="number"
            value={formData.usage_limit_per_customer}
            onChange={(e) => handleChange('usage_limit_per_customer', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Input
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={formData.is_active}
          onCheckedChange={(checked) => handleChange('is_active', checked)}
        />
        <label className="text-sm font-medium">Active</label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary-red hover:bg-red-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}