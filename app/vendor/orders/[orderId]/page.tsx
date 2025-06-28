'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export default function VendorOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/v2/vendors/orders/${orderId}`);
        if (!res.ok) throw new Error('Failed to fetch order');
        const data = await res.json();
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusUpdating(true);
    setStatusError('');
    try {
      const res = await fetch(`/api/v2/vendors/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
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

  const isFinalStatus = (order.status_name || order.status)?.toLowerCase() === 'delivered' || (order.status_name || order.status)?.toLowerCase() === 'cancelled';

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <button onClick={() => router.push('/vendor/orders')} className="mb-4 text-blue-600 hover:underline">&larr; Back to Orders</button>
      <h1 className="text-2xl font-bold mb-2">Order #{order.order_number || order.orderNumber}</h1>
      <div className="mb-4 text-gray-600">Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : order.orderDate}</div>
      <div className="mb-6">
        <div className="font-medium flex items-center gap-2">
          Status: <span className="font-semibold">{order.status_name || order.status}</span>
          {!isFinalStatus && (
            <select
              value={order.status_name || order.status}
              onChange={handleStatusChange}
              disabled={statusUpdating}
              className="ml-2 border p-1 rounded"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          {statusUpdating && <span className="ml-2 text-xs text-gray-500">Updating...</span>}
        </div>
        {statusError && <div className="text-red-600 text-sm mt-1">{statusError}</div>}
        <div>Customer: {order.customer_name || order.customerName}</div>
        <div>Email: {order.customer_email || order.customerEmail}</div>
        <div>My Items Total: <span className="font-semibold text-green-600">${order.vendor_items_total?.toFixed(2)}</span></div>
        <div>Full Order Total: <span className="font-semibold">${order.total_amount?.toFixed(2) || order.total?.toFixed(2)}</span></div>
      </div>
      <h2 className="text-lg font-semibold mb-2">Order Items</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 border-b text-left">Product</th>
              <th className="px-4 py-2 border-b text-left">Options</th>
              <th className="px-4 py-2 border-b text-right">Qty</th>
              <th className="px-4 py-2 border-b text-right">Unit Price</th>
              <th className="px-4 py-2 border-b text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item: any, idx: number) => (
              <tr key={item.order_item_id || idx}>
                <td className="px-4 py-2 border-b">{item.product_name}</td>
                <td className="px-4 py-2 border-b text-sm text-gray-500">
                  {item.width && <span>W: {item.width}  </span>}
                  {item.height && <span>H: {item.height}  </span>}
                  {item.color_name && <span>Color: {item.color_name} </span>}
                  {item.material_name && <span>Material: {item.material_name} </span>}
                </td>
                <td className="px-4 py-2 border-b text-right">{item.quantity}</td>
                <td className="px-4 py-2 border-b text-right">${item.unit_price?.toFixed(2)}</td>
                <td className="px-4 py-2 border-b text-right">${item.subtotal?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
      <div className="mb-6 text-gray-700">
        {order.shipping_address || 'N/A'}
      </div>
      <div className="flex justify-between items-center font-bold text-right">
        <span>My Items Total:</span>
        <span className="text-green-600">${order.vendor_items_total?.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center text-gray-600 text-sm">
        <span>Full Order Total:</span>
        <span>${order.total_amount?.toFixed(2) || order.total?.toFixed(2)}</span>
      </div>
    </div>
  );
} 