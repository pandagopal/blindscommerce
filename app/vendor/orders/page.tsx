'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLazyLoad } from '@/hooks/useLazyLoad';

const ORDER_STATUSES = [
  'All',
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

interface Order {
  order_id: number;
  user_id: number;
  status: string;
  total_amount: number;
  vendor_items_total: number;
  vendor_items_count: number;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function VendorOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Lazy load orders data only when this route is active
  const fetchOrdersData = async () => {
    const offset = (currentPage - 1) * limit;
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (status && status !== 'All') params.set('status', status);
    if (search) params.set('search', search);
    
    const response = await fetch(`/api/vendor/orders?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    const data = await response.json();
    
    return {
      orders: data.orders || [],
      total: data.total || 0
    };
  };

  const { 
    data: ordersData, 
    loading, 
    error, 
    refetch 
  } = useLazyLoad(fetchOrdersData, {
    targetPath: '/vendor/orders',
    dependencies: [currentPage, status, limit, search]
  });

  const orders = ordersData?.orders || [];
  const totalOrders = ordersData?.total || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const totalPages = Math.ceil(totalOrders / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Vendor Orders</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by order number, customer, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border p-2 rounded w-64"
          />
          <button type="submit" className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark">Search</button>
        </form>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setCurrentPage(1); }}
          className="border p-2 rounded"
        >
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={limit}
          onChange={e => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
          className="border p-2 rounded"
        >
          {[10, 20, 50].map(n => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-primary-red" />
        </div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : orders.length === 0 ? (
        <p className="text-gray-600">No orders found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">My Items Total</th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Order Total</th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td className="px-6 py-4 border-b border-gray-200">#{order.order_id}</td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      {order.first_name} {order.last_name}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">{order.email}</td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <span className="font-medium text-green-600">
                        ${order.vendor_items_total.toFixed(2)}
                      </span>
                      <div className="text-xs text-gray-500">
                        ({order.vendor_items_count} items)
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200 text-gray-600">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => router.push(`/vendor/orders/${order.order_id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * limit, totalOrders)}</span> of{' '}
                <span className="font-medium">{totalOrders}</span> orders
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 