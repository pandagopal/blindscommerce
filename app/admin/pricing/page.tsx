'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  RefreshCwIcon,
  FileDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  PercentIcon,
  TrendingUpIcon,
  UsersIcon
} from 'lucide-react';

interface GlobalDiscount {
  campaign_id: number;
  campaign_name: string;
  campaign_code: string;
  campaign_type: string;
  discount_percent: number;
  discount_amount: number;
  minimum_order_value: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  total_orders: number;
  total_revenue: number;
  total_discount_given: number;
}

interface VolumeDiscount {
  discount_id: number;
  discount_name: string;
  discount_code: string;
  volume_tiers: Array<{
    min_qty: number;
    max_qty?: number;
    discount_percent?: number;
    discount_amount?: number;
  }>;
  is_active: boolean;
  usage_count: number;
}

interface VendorDiscount {
  discount_id: number;
  discount_name: string;
  vendor_id: number;
  business_name: string;
  discount_type: string;
  discount_value: number;
  admin_approved: boolean;
  usage_count: number;
}

interface CommissionSummary {
  vendor_summary: Array<{
    vendor_id: number;
    business_name: string;
    total_commission_earned: number;
    total_orders: number;
    commission_paid: number;
    commission_pending: number;
  }>;
  sales_summary: Array<{
    staff_id: number;
    staff_name: string;
    total_commission_earned: number;
    total_orders: number;
    commission_paid: number;
    commission_pending: number;
  }>;
}

export default function AdminPricingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [globalDiscounts, setGlobalDiscounts] = useState<GlobalDiscount[]>([]);
  const [volumeDiscounts, setVolumeDiscounts] = useState<VolumeDiscount[]>([]);
  const [vendorDiscounts, setVendorDiscounts] = useState<VendorDiscount[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);

  // Form states
  const [showCreateGlobalDiscount, setShowCreateGlobalDiscount] = useState(false);
  const [showCreateVolumeDiscount, setShowCreateVolumeDiscount] = useState(false);
  const [showCommissionPayment, setShowCommissionPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [];

      if (activeTab === 'overview' || activeTab === 'global') {
        promises.push(
          fetch('/api/admin/pricing/global-discounts')
            .then(res => res.json())
            .then(data => setGlobalDiscounts(data.discounts || []))
        );
      }

      if (activeTab === 'overview' || activeTab === 'volume') {
        promises.push(
          fetch('/api/admin/pricing/volume-discounts')
            .then(res => res.json())
            .then(data => setVolumeDiscounts(data.discounts || []))
        );
      }

      if (activeTab === 'overview' || activeTab === 'vendor') {
        promises.push(
          fetch('/api/admin/pricing/vendor-discounts')
            .then(res => res.json())
            .then(data => setVendorDiscounts(data.discounts || []))
        );
      }

      if (activeTab === 'overview' || activeTab === 'commissions') {
        promises.push(
          fetch('/api/admin/pricing/commissions?type=summary')
            .then(res => res.json())
            .then(data => setCommissionSummary(data))
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      setError('Failed to fetch pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVendorDiscount = async (discountId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/pricing/vendor-discounts?id=${discountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} vendor discount`);
      }
    } catch (error) {
      setError(`Failed to ${action} vendor discount`);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUpIcon },
    { id: 'global', name: 'Global Discounts', icon: PercentIcon },
    { id: 'volume', name: 'Volume Discounts', icon: DollarSignIcon },
    { id: 'vendor', name: 'Vendor Discounts', icon: UsersIcon },
    { id: 'commissions', name: 'Commissions', icon: DollarSignIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pricing Management</h1>
          <p className="text-gray-500">Manage discounts, commissions, and pricing controls</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCwIcon size={16} className="mr-1" />
            <span className="text-sm">Refresh</span>
          </button>
          <button className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <FileDownIcon size={16} className="mr-1" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Icon size={16} className="mr-2" />
                  {tab.name}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <PercentIcon size={24} className="text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Active Global Discounts</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {globalDiscounts.filter(d => d.is_active).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSignIcon size={24} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Volume Discounts</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {volumeDiscounts.filter(d => d.is_active).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangleIcon size={24} className="text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Pending Vendor Discounts</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendorDiscounts.filter(d => !d.admin_approved).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UsersIcon size={24} className="text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Pending Commissions</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    ${commissionSummary?.vendor_summary.reduce((sum, v) => sum + v.commission_pending, 0).toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Recent Vendor Discount Requests</h3>
            </div>
            <div className="p-6">
              {vendorDiscounts.filter(d => !d.admin_approved).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending vendor discount requests</p>
              ) : (
                <div className="space-y-4">
                  {vendorDiscounts.filter(d => !d.admin_approved).slice(0, 5).map((discount) => (
                    <div key={discount.discount_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{discount.discount_name}</h4>
                        <p className="text-sm text-gray-500">
                          {discount.business_name} • {discount.discount_type} • {discount.discount_value}%
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveVendorDiscount(discount.discount_id, 'approve')}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        >
                          <CheckCircleIcon size={16} className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveVendorDiscount(discount.discount_id, 'reject')}
                          className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          <XCircleIcon size={16} className="mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Discounts Tab */}
      {activeTab === 'global' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Global Discounts</h2>
            <button
              onClick={() => setShowCreateGlobalDiscount(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <PlusIcon size={16} className="mr-1" />
              Create Global Discount
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {globalDiscounts.map((discount) => (
                  <tr key={discount.campaign_id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{discount.campaign_name}</div>
                        <div className="text-sm text-gray-500">{discount.campaign_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{discount.campaign_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {discount.discount_percent ? `${discount.discount_percent}%` : `$${discount.discount_amount}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {discount.total_orders} orders • ${discount.total_discount_given?.toFixed(2) || '0.00'} saved
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button className="text-purple-600 hover:text-purple-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Volume Discounts Tab */}
      {activeTab === 'volume' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Volume Discounts</h2>
            <button
              onClick={() => setShowCreateVolumeDiscount(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <PlusIcon size={16} className="mr-1" />
              Create Volume Discount
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {volumeDiscounts.map((discount) => (
                  <tr key={discount.discount_id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{discount.discount_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{discount.discount_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {discount.volume_tiers.length} tiers
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{discount.usage_count} uses</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button className="text-purple-600 hover:text-purple-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendor Discounts Tab */}
      {activeTab === 'vendor' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Vendor Discounts</h2>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendorDiscounts.map((discount) => (
                  <tr key={discount.discount_id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{discount.discount_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{discount.business_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{discount.discount_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {discount.discount_type === 'percentage' ? `${discount.discount_value}%` : `$${discount.discount_value}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        discount.admin_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {discount.admin_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{discount.usage_count} uses</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {!discount.admin_approved && (
                        <>
                          <button
                            onClick={() => handleApproveVendorDiscount(discount.discount_id, 'approve')}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveVendorDiscount(discount.discount_id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && commissionSummary && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Commission Management</h2>
            <button
              onClick={() => setShowCommissionPayment(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <PlusIcon size={16} className="mr-1" />
              Process Payment
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Commissions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Vendor Commissions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {commissionSummary.vendor_summary.map((vendor) => (
                      <tr key={vendor.vendor_id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{vendor.business_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${vendor.commission_pending.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${vendor.total_commission_earned.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales Staff Commissions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Sales Staff Commissions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {commissionSummary.sales_summary.map((staff) => (
                      <tr key={staff.staff_id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{staff.staff_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${staff.commission_pending.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${staff.total_commission_earned.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}