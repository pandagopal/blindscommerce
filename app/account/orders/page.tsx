'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Search, Filter, Clock } from 'lucide-react';

interface Order {
  order_id: number;
  order_number: string;
  created_at: string;
  total_amount: string | number; // Can be string from database
  status: string;
  item_count: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ordersPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * ordersPerPage;
      const res = await fetch(`/api/v2/commerce/orders?limit=${ordersPerPage}&offset=${offset}`);

      const response = await res.json();
      
      if (!res.ok) {
        console.error('API Error:', response);
        throw new Error(response.error || 'Failed to fetch orders');
      }
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch orders');
      }
      
      // Ensure we have an array for orders
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
      setTotalOrders(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Set empty state on error
      setOrders([]);
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter orders based on search and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
          </div>
        </form>

        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-20 rounded-md"></div>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Order #</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Items</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium">{order.order_number}</td>
                  <td className="px-4 py-4 text-gray-600">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      order.status === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'Shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : order.status === 'Processing'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{order.item_count}</td>
                  <td className="px-4 py-4 font-medium">${(typeof order.total_amount === 'number' ? order.total_amount : parseFloat(order.total_amount) || 0).toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/account/orders/${order.order_id}`}
                      className="text-primary-red hover:text-primary-red-dark text-sm font-medium inline-flex items-center"
                    >
                      View Details
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white py-3 mt-4">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * ordersPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * ordersPerPage, totalOrders)}
                    </span>{' '}
                    of <span className="font-medium">{totalOrders}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                        currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === i + 1
                            ? 'bg-primary-red text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-red'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                        currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Orders Found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'No orders match your search criteria. Try adjusting your filters.'
              : 'You haven\'t placed any orders yet. Start shopping to see your orders here.'}
          </p>
          <Link
            href="/products"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
          >
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}
