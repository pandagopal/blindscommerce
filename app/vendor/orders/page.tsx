'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const ORDER_STATUSES = [
  'All',
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

interface Order {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  status: string;
  total: number;
}

export default function VendorOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [currentPage, status, limit]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * limit;
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (status && status !== 'All') params.set('status', status);
      if (search) params.set('search', search);
      const response = await fetch(`/api/vendor/orders?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
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
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId}>
                    <td className="px-6 py-4 border-b border-gray-200">{order.orderNumber}</td>
                    <td className="px-6 py-4 border-b border-gray-200">{order.customerName}</td>
                    <td className="px-6 py-4 border-b border-gray-200">{order.customerEmail}</td>
                    <td className="px-6 py-4 border-b border-gray-200">{new Date(order.orderDate).toLocaleString()}</td>
                    <td className="px-6 py-4 border-b border-gray-200">{order.status}</td>
                    <td className="px-6 py-4 border-b border-gray-200">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 border-b border-gray-200">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => router.push(`/vendor/orders/${order.orderId}`)}
                      >
                        View
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