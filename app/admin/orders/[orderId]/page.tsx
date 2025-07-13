'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, BanIcon, RefreshCwIcon } from 'lucide-react';

const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export default function AdminOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v2/admin/orders/${orderId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch order');
      }
      const result = await res.json();
      const orderData = result.data || result;
      setOrder(orderData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/v2/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDisableOrder = async () => {
    if (!confirm('Are you sure you want to disable this order? It will be hidden from vendor dashboard.')) {
      return;
    }
    setDisabling(true);
    try {
      const res = await fetch(`/api/v2/admin/orders/${orderId}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to disable order');
      }
      alert('Order has been disabled and hidden from vendor dashboard');
      router.push('/admin/orders');
    } catch (err: any) {
      alert(err.message || 'Failed to disable order');
    } finally {
      setDisabling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }
  if (error) {
    return <div className="text-center text-red-600 py-12">{error}</div>;
  }
  if (!order) {
    return <div className="text-center py-12">Order not found.</div>;
  }

  const isFinalStatus = order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'cancelled';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/orders" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
            <p className="text-gray-500 mt-1">Placed on {formatDate(order.created_at)}</p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href={`/admin/orders/${orderId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDisableOrder}
              disabled={disabling || order.is_disabled}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BanIcon className="h-4 w-4 mr-2" />
              {order.is_disabled ? 'Disabled' : disabling ? 'Disabling...' : 'Disable'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                order.status === 'Shipped' ? 'bg-green-100 text-green-800' :
                order.status === 'Delivered' ? 'bg-purple-100 text-purple-800' :
                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
              {!isFinalStatus && (
                <select
                  value={order.status}
                  onChange={handleStatusChange}
                  disabled={statusUpdating}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              )}
              {statusUpdating && <span className="text-xs text-gray-500">Updating...</span>}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-lg font-semibold mt-1">{formatCurrency(order.total_amount || 0)}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="mt-1">{order.customer_first_name} {order.customer_last_name}</p>
            <p className="text-sm text-gray-600">{order.customer_email}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p className="mt-1">{order.payment_method || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(order.items || []).map((item: any, idx: number) => (
                <tr key={item.order_item_id || idx}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.vendor_name || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {item.width && <span className="block">Width: {item.width}</span>}
                    {item.height && <span className="block">Height: {item.height}</span>}
                    {item.color_name && <span className="block">Color: {item.color_name}</span>}
                    {item.material_name && <span className="block">Material: {item.material_name}</span>}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(item.unit_price || 0)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    {formatCurrency((item.unit_price || 0) * (item.quantity || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-end space-y-2">
            <div className="text-right">
              <div className="flex justify-between text-sm">
                <span className="mr-8">Subtotal:</span>
                <span>{formatCurrency(order.subtotal || 0)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="mr-8">Discount:</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="mr-8">Tax:</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="mr-8">Shipping:</span>
                  <span>{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t">
                <span className="mr-8">Total:</span>
                <span>{formatCurrency(order.total_amount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Billing Address</h2>
          {order.billing_address ? (
            <div>
              <p>{order.billing_first_name} {order.billing_last_name}</p>
              <p className="text-gray-600">{order.billing_address_line_1}</p>
              {order.billing_address_line_2 && <p className="text-gray-600">{order.billing_address_line_2}</p>}
              <p className="text-gray-600">{order.billing_city}, {order.billing_state} {order.billing_postal_code}</p>
              {order.billing_country && <p className="text-gray-600">{order.billing_country}</p>}
              {order.billing_phone && <p className="text-gray-600 mt-2">Phone: {order.billing_phone}</p>}
            </div>
          ) : (
            <p className="text-gray-500">No billing address</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
          {order.shipping_address ? (
            <div>
              <p>{order.shipping_first_name} {order.shipping_last_name}</p>
              <p className="text-gray-600">{order.shipping_address_line_1}</p>
              {order.shipping_address_line_2 && <p className="text-gray-600">{order.shipping_address_line_2}</p>}
              <p className="text-gray-600">{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
              {order.shipping_country && <p className="text-gray-600">{order.shipping_country}</p>}
              {order.shipping_phone && <p className="text-gray-600 mt-2">Phone: {order.shipping_phone}</p>}
            </div>
          ) : (
            <p className="text-gray-500">Same as billing address</p>
          )}
        </div>
      </div>

      {order.notes && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Order Notes</h2>
          <p className="text-gray-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
}