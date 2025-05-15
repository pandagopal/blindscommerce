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
  FilterIcon
} from 'lucide-react';

interface Product {
  product_id: number;
  name: string;
  slug: string;
  short_description: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name: string;
  vendor_name: string;
  review_count: number;
  average_rating: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * productsPerPage;
      const queryParams = new URLSearchParams({
        limit: productsPerPage.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/admin/products?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalProducts(data.total);
    } catch (error) {
      console.error('Error fetching products:', error);
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
    fetchProducts();
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
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500">Manage your product catalog</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchProducts()}
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCwIcon size={16} className="mr-1" />
            <span className="text-sm">Refresh</span>
          </button>
          <Link
            href="/admin/products/export"
            className="flex items-center p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FileDownIcon size={16} className="mr-1" />
            <span className="text-sm">Export</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center p-2 text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700"
          >
            <PlusIcon size={16} className="mr-1" />
            <span className="text-sm">Add Product</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Product Name
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('base_price')}
                >
                  <div className="flex items-center">
                    Price
                    {sortBy === 'base_price' && (
                      sortOrder === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('average_rating')}
                >
                  <div className="flex items-center">
                    Rating
                    {sortBy === 'average_rating' && (
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
                    Created
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
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.short_description}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.vendor_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.base_price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.average_rating.toFixed(1)} ({product.review_count} reviews)
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/products/${product.product_id}`}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/products/${product.product_id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product?')) {
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
        {totalProducts > productsPerPage && (
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
                  onClick={() => setCurrentPage(page => Math.min(Math.ceil(totalProducts / productsPerPage), page + 1))}
                  disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
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
                      {Math.min((currentPage - 1) * productsPerPage + 1, totalProducts)}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * productsPerPage, totalProducts)}
                    </span>{' '}
                    of <span className="font-medium">{totalProducts}</span> results
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
                      Page {currentPage} of {Math.ceil(totalProducts / productsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(page => Math.min(Math.ceil(totalProducts / productsPerPage), page + 1))}
                      disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.ceil(totalProducts / productsPerPage))}
                      disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
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