'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusIcon,
  RefreshCwIcon,
  FileDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon
} from 'lucide-react';

interface Vendor {
  vendor_info_id: number;
  business_name: string;
  business_email: string;
  business_phone: string | null;
  business_address: string | null;
  tax_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_email: string;
  first_name: string | null;
  last_name: string | null;
  user_phone: string | null;
  product_count: number;
  total_sales: number;
}

export default function AdminVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);
  const vendorsPerPage = 10;

  useEffect(() => {
    fetchVendors();
  }, [currentPage, statusFilter, sortBy, sortOrder]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * vendorsPerPage;
      const queryParams = new URLSearchParams({
        limit: vendorsPerPage.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/vendors?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data = await response.json();
      setVendors(data.vendors);
      setTotalVendors(data.total);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVendors();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-gray-500">Manage vendor accounts and products</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchVendors()}
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCwIcon size={16} className="mr-1" />
            <span className="text-sm">Refresh</span>
          </button>
          <Link
            href="/admin/vendors/export"
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FileDownIcon size={16} className="mr-1" />
            <span className="text-sm">Export</span>
          </Link>
          <Link
            href="/admin/vendors/new"
            className="flex items-center p-2 text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700"
          >
            <PlusIcon size={16} className="mr-1" />
            <span className="text-sm">Add Vendor</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('business_name')}
                >
                  <div className="flex items-center">
                    Vendor
                    {sortBy === 'business_name' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('product_count')}
                >
                  <div className="flex items-center">
                    Products
                    {sortBy === 'product_count' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total_sales')}
                >
                  <div className="flex items-center">
                    Total Sales
                    {sortBy === 'total_sales' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Joined
                    {sortBy === 'created_at' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.vendor_info_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <BuildingIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.business_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {[vendor.first_name, vendor.last_name].filter(Boolean).join(' ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 space-y-1">
                        <div className="flex items-center">
                          <MailIcon size={14} className="text-gray-400 mr-1" />
                          {vendor.business_email}
                        </div>
                        {vendor.business_phone && (
                          <div className="flex items-center">
                            <PhoneIcon size={14} className="text-gray-400 mr-1" />
                            {vendor.business_phone}
                          </div>
                        )}
                        {vendor.business_address && (
                          <div className="flex items-center">
                            <MapPinIcon size={14} className="text-gray-400 mr-1" />
                            {vendor.business_address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.product_count} products
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(vendor.total_sales)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {vendor.is_active ? (
                          <>
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1.5" />
                            <span className="text-sm text-green-900">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-5 w-5 text-red-500 mr-1.5" />
                            <span className="text-sm text-red-900">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vendor.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/vendors/${vendor.vendor_info_id}`}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/vendors/${vendor.vendor_info_id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this vendor?')) {
                            // Handle delete
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalVendors > vendorsPerPage && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(page => Math.min(Math.ceil(totalVendors / vendorsPerPage), page + 1))}
                  disabled={currentPage === Math.ceil(totalVendors / vendorsPerPage)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {Math.min((currentPage - 1) * vendorsPerPage + 1, totalVendors)}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * vendorsPerPage, totalVendors)}
                    </span>{' '}
                    of <span className="font-medium">{totalVendors}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {Math.ceil(totalVendors / vendorsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(page => Math.min(Math.ceil(totalVendors / vendorsPerPage), page + 1))}
                      disabled={currentPage === Math.ceil(totalVendors / vendorsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.ceil(totalVendors / vendorsPerPage))}
                      disabled={currentPage === Math.ceil(totalVendors / vendorsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Last
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 