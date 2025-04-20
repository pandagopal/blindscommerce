'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SearchIcon, FilterIcon, ChevronDownIcon,
  ArrowDownIcon, ArrowUpIcon, RefreshCwIcon,
  CheckCircleIcon, XCircleIcon, TruckIcon,
  ClockIcon, ArchiveIcon, FileDownIcon,
  PlusIcon, CalendarIcon, ChevronRightIcon
} from 'lucide-react';

// Types
interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  status: string;
  total: number;
  items: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ordersPerPage = 15;

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFilter, sortBy, sortDirection, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // In a real application, this would fetch from the API
      // Mock data for demonstration
      const mockOrders: Order[] = [];

      // Generate mock orders based on filter criteria
      for (let i = 1; i <= 50; i++) {
        const randomStatus = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'][Math.floor(Math.random() * 5)];
        const randomDate = new Date();

        // Apply date filter to mock data
        if (dateFilter === 'today') {
          randomDate.setHours(0, 0, 0, 0);
          randomDate.setHours(randomDate.getHours() + Math.floor(Math.random() * 24));
        } else if (dateFilter === 'this_week') {
          const daysAgo = Math.floor(Math.random() * 7);
          randomDate.setDate(randomDate.getDate() - daysAgo);
        } else if (dateFilter === 'this_month') {
          const daysAgo = Math.floor(Math.random() * 30);
          randomDate.setDate(randomDate.getDate() - daysAgo);
        } else {
          // For "all", generate random dates within the last 90 days
          const daysAgo = Math.floor(Math.random() * 90);
          randomDate.setDate(randomDate.getDate() - daysAgo);
        }

        const randomTotal = (Math.random() * 700 + 50).toFixed(2);
        const randomItems = Math.floor(Math.random() * 5) + 1;
        const orderNumber = `SBH-${10000 + i}`;

        // Apply status filter to mock data
        if (statusFilter === 'all' || statusFilter === randomStatus.toLowerCase()) {
          mockOrders.push({
            id: i.toString(),
            orderNumber,
            date: randomDate.toISOString(),
            customer: {
              id: 100 + i,
              name: ['John Smith', 'Jane Doe', 'Robert Johnson', 'Emily Davis', 'Michael Wilson'][Math.floor(Math.random() * 5)],
              email: `customer${i}@example.com`
            },
            status: randomStatus,
            total: parseFloat(randomTotal),
            items: randomItems
          });
        }
      }

      // Apply sorting
      mockOrders.sort((a, b) => {
        if (sortBy === 'date') {
          return sortDirection === 'asc'
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === 'total') {
          return sortDirection === 'asc'
            ? a.total - b.total
            : b.total - a.total;
        } else if (sortBy === 'status') {
          return sortDirection === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        } else {
          return sortDirection === 'asc'
            ? a.orderNumber.localeCompare(b.orderNumber)
            : b.orderNumber.localeCompare(a.orderNumber);
        }
      });

      // Apply search filter
      const filteredOrders = mockOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setTotalOrders(filteredOrders.length);

      // Apply pagination
      const startIndex = (currentPage - 1) * ordersPerPage;
      const endIndex = startIndex + ordersPerPage;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      setOrders(paginatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  // Handle bulk selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map(order => order.id));
      setShowBulkActions(true);
    } else {
      setSelectedOrders([]);
      setShowBulkActions(false);
    }
  };

  // Handle individual selection
  const handleSelectOrder = (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    if (e.target.checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  // Update bulk actions visibility whenever selections change
  useEffect(() => {
    setShowBulkActions(selectedOrders.length > 0);
  }, [selectedOrders]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-gray-500">Manage and process customer orders</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchOrders()}
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCwIcon size={16} className="mr-1" />
            <span className="text-sm">Refresh</span>
          </button>
          <Link
            href="/admin/orders/export"
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FileDownIcon size={16} className="mr-1" />
            <span className="text-sm">Export</span>
          </Link>
          <Link
            href="/admin/orders/new"
            className="flex items-center p-2 text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700"
          >
            <PlusIcon size={16} className="mr-1" />
            <span className="text-sm">New Order</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <form onSubmit={handleSearch} className="col-span-1 md:col-span-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders by ID, customer, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <span className="text-sm text-blue-600">Search</span>
            </button>
          </div>
        </form>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2 pl-10 border border-gray-300 rounded-md appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FilterIcon size={18} className="text-gray-400" />
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon size={18} className="text-gray-400" />
          </div>
        </div>

        <div className="relative">
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2 pl-10 border border-gray-300 rounded-md appearance-none"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <CalendarIcon size={18} className="text-gray-400" />
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon size={18} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="p-4 mb-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">{selectedOrders.length} orders selected</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // In a real app, this would call an API to update order status
                  alert(`Processing ${selectedOrders.length} orders`);
                  setSelectedOrders([]);
                }}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                Mark Processing
              </button>
              <button
                onClick={() => {
                  // In a real app, this would call an API to update order status
                  alert(`Marking ${selectedOrders.length} orders as shipped`);
                  setSelectedOrders([]);
                }}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
              >
                Mark Shipped
              </button>
              <button
                onClick={() => {
                  // In a real app, this would call an API to update order status
                  alert(`Cancelling ${selectedOrders.length} orders`);
                  setSelectedOrders([]);
                }}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
              >
                Cancel Orders
              </button>
              <button
                onClick={() => {
                  // In a real app, this would call an API to export orders
                  alert(`Exporting ${selectedOrders.length} orders`);
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                Export Selected
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-md"></div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 rounded-md shadow-sm bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 w-5">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('orderNumber')}
                >
                  <div className="flex items-center">
                    <span>Order</span>
                    {sortBy === 'orderNumber' && (
                      sortDirection === 'asc' ?
                        <ArrowUpIcon size={14} className="ml-1" /> :
                        <ArrowDownIcon size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    <span>Date</span>
                    {sortBy === 'date' && (
                      sortDirection === 'asc' ?
                        <ArrowUpIcon size={14} className="ml-1" /> :
                        <ArrowDownIcon size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    <span>Status</span>
                    {sortBy === 'status' && (
                      sortDirection === 'asc' ?
                        <ArrowUpIcon size={14} className="ml-1" /> :
                        <ArrowDownIcon size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">
                    <span>Total</span>
                    {sortBy === 'total' && (
                      sortDirection === 'asc' ?
                        <ArrowUpIcon size={14} className="ml-1" /> :
                        <ArrowDownIcon size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => handleSelectOrder(e, order.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link href={`/admin/orders/${order.id}`} className="hover:text-purple-600">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-sm">{order.customer.name}</div>
                      <div className="text-xs text-gray-500">{order.customer.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${order.status === 'Delivered' && 'bg-green-100 text-green-800'}
                      ${order.status === 'Shipped' && 'bg-blue-100 text-blue-800'}
                      ${order.status === 'Processing' && 'bg-purple-100 text-purple-800'}
                      ${order.status === 'Pending' && 'bg-amber-100 text-amber-800'}
                      ${order.status === 'Cancelled' && 'bg-red-100 text-red-800'}
                    `}>
                      {order.status === 'Delivered' && <CheckCircleIcon size={12} className="mr-1" />}
                      {order.status === 'Shipped' && <TruckIcon size={12} className="mr-1" />}
                      {order.status === 'Processing' && <ArchiveIcon size={12} className="mr-1" />}
                      {order.status === 'Pending' && <ClockIcon size={12} className="mr-1" />}
                      {order.status === 'Cancelled' && <XCircleIcon size={12} className="mr-1" />}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {order.items}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/orders/${order.id}/edit`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          // In a real app, this would call an API to delete the order
                          alert(`Deleting order ${order.orderNumber}`);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ArchiveIcon size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'No orders match your search criteria. Try adjusting your filters.'
              : 'There are no orders in the system yet.'}
          </p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateFilter('all');
                fetchOrders();
              }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
            <Link
              href="/admin/orders/new"
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Create Order
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalOrders > ordersPerPage && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * ordersPerPage + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * ordersPerPage, totalOrders)}
            </span>{' '}
            of <span className="font-medium">{totalOrders}</span> results
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, Math.ceil(totalOrders / ordersPerPage)) }).map((_, i) => {
              // Calculate page number based on current page
              let pageNumber;
              const totalPages = Math.ceil(totalOrders / ordersPerPage);

              if (totalPages <= 5) {
                // If total pages are 5 or less, display all
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                // If current page is near the beginning
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // If current page is near the end
                pageNumber = totalPages - 4 + i;
              } else {
                // If current page is in the middle
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === pageNumber
                      ? 'z-10 bg-purple-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalOrders / ordersPerPage)))}
              disabled={currentPage === Math.ceil(totalOrders / ordersPerPage)}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === Math.ceil(totalOrders / ordersPerPage)
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
