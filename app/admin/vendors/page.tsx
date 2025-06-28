'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  RefreshCwIcon,
  FileDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SearchIcon,
  Building2,
  MapPin
} from 'lucide-react';

interface VendorInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  // Address fields
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Status fields
  isActive: boolean;
  isVerified: boolean;
  approvalStatus: string;
  // Business fields
  businessDescription?: string;
  totalSales: number;
  rating: number;
  createdAt: string;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('companyName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);
  const vendorsPerPage = 10;

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v2/admin/vendors?limit=${vendorsPerPage}&offset=${(currentPage - 1) * vendorsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}${searchQuery ? `&search=${searchQuery}` : ''}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vendors: ${response.status}`);
      }
      
      const data = await response.json() as { vendors?: VendorInfo[], total?: number, error?: string };
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setVendors(data.vendors || []);
      setTotalVendors(data.total || 0);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, [currentPage, vendorsPerPage, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVendors();
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = (e.target as HTMLSelectElement).value;
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusToggle = async (vendorId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/v2/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update vendor status');
      }

      // Refresh the vendors list
      fetchVendors();
    } catch (err) {
      console.error('Error updating vendor status:', err instanceof Error ? err.message : 'Failed to update vendor status');
      setError(err instanceof Error ? err.message : 'Failed to update vendor status');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-gray-500">Manage vendor accounts and profiles</p>
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </form>
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
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
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center">
                    Company
                    {sortBy === 'companyName' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Joined
                    {sortBy === 'createdAt' && (
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
              ) : !vendors || vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              ) : (
                (vendors || []).map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.companyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {vendor.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vendor.firstName} {vendor.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{vendor.email}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.companyName}</div>
                      <div className="text-sm text-gray-500">{vendor.contactEmail}</div>
                      <div className="text-sm text-gray-500">{vendor.contactPhone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <div className="text-sm text-gray-900">
                          {vendor.city && vendor.state ? `${vendor.city}, ${vendor.state}` : 'No address provided'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vendor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vendor.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/vendors/${vendor.id}`}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/vendors/${vendor.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/vendor?admin_view=${vendor.id}`}
                        className="text-green-600 hover:text-green-900 mr-3"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => handleStatusToggle(vendor.id, vendor.isActive)}
                        className={`${
                          vendor.isActive
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {vendor.isActive ? 'Deactivate' : 'Activate'}
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