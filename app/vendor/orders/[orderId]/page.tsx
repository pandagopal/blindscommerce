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
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch order');
        }
        const result = await res.json();
        // Handle V2 API response format
        const orderData = result.data || result.order || result;
        setOrder(orderData);
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
      const result = await res.json();
      // Handle V2 API response format
      const orderData = result.data || result.order || result;
      setOrder(orderData);
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
        <div>My Items Total: <span className="font-semibold text-green-600">${(parseFloat(order.vendor_items_total) || 0).toFixed(2)}</span></div>
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
                <td className="px-4 py-2 border-b text-right">${(parseFloat(item.unit_price) || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-lg font-semibold mb-2">Shipping Information</h2>
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        {(() => {
          // Use shipping address, but fallback to billing address if shipping fields are empty
          const firstName = order.shipping_first_name || order.billing_first_name || order.customer_name?.split(' ')[0] || '';
          const lastName = order.shipping_last_name || order.billing_last_name || order.customer_name?.split(' ').slice(1).join(' ') || '';
          const addressLine1 = order.shipping_address_line_1 || order.billing_address_line_1;
          const addressLine2 = order.shipping_address_line_2 || order.billing_address_line_2;
          const city = order.shipping_city || order.billing_city;
          const state = order.shipping_state || order.billing_state;
          const postalCode = order.shipping_postal_code || order.billing_postal_code;
          const country = order.shipping_country || order.billing_country;
          const phone = order.shipping_phone || order.billing_phone || order.customer_phone;
          const email = order.shipping_email || order.billing_email || order.customer_email;
          
          const isSameAsBilling = order.shipping_address_id === order.billing_address_id;

          if (addressLine1 && city) {
            return (
              <div className="space-y-2">
                {isSameAsBilling && (
                  <div className="text-sm text-gray-600 italic mb-2">
                    (Same as billing address)
                  </div>
                )}
                <div>
                  <span className="font-medium">Name:</span> {firstName} {lastName}
                </div>
                <div>
                  <span className="font-medium">Address:</span><br />
                  {addressLine1}<br />
                  {addressLine2 && <>{addressLine2}<br /></>}
                  {city}, {state} {postalCode}<br />
                  {country && <>{country}<br /></>}
                </div>
                {phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {phone}
                  </div>
                )}
                {email && (
                  <div>
                    <span className="font-medium">Email:</span> {email}
                  </div>
                )}
              </div>
            );
          } else {
            return <div className="text-gray-500">No shipping information available</div>;
          }
        })()}
      </div>
      <div className="flex justify-between items-center font-bold text-right">
        <span>My Items Total:</span>
        <span className="text-green-600">${(parseFloat(order.vendor_items_total) || 0).toFixed(2)}</span>
      </div>
    </div>
  );
} 