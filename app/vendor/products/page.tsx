'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon, SearchIcon, FilterIcon, EyeIcon,
  EditIcon, TrashIcon, ToggleLeftIcon, ToggleRightIcon,
  SlidersIcon, TagIcon, AlertTriangleIcon, ArrowUpDownIcon,
  ChevronDownIcon, PackageIcon
} from 'lucide-react';

// Types
interface Product {
  id: number;
  name: string;
  slug: string;
  type: string;
  base_price: number;
  is_active: boolean;
  is_listing_enabled: boolean;
  image: string;
  created_at: string;
  updated_at: string;
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const productsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, typeFilter, statusFilter, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // In a real application, this would call an API
      // Mock data for demonstration
      const mockProducts: Product[] = [];

      const types = ['Blinds', 'Shades', 'Drapes', 'Shutters'];
      const images = [
        '/images/products/faux-wood-blinds.jpg',
        '/images/products/cellular-shades.jpg',
        '/images/products/roman-shades.jpg',
        '/images/products/wood-blinds.jpg',
        '/images/products/roller-shades.jpg',
      ];

      for (let i = 1; i <= 30; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const isActive = Math.random() > 0.2;
        const isListingEnabled = isActive && Math.random() > 0.3;
        const image = images[Math.floor(Math.random() * images.length)];
        const basePrice = Math.floor(Math.random() * 300) + 50;

        // Create product with random data
        const product: Product = {
          id: i,
          name: `${type} - Premium Series ${i}`,
          slug: `${type.toLowerCase()}-premium-series-${i}`,
          type,
          base_price: basePrice,
          is_active: isActive,
          is_listing_enabled: isListingEnabled,
          image,
          created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
          updated_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
        };

        mockProducts.push(product);
      }

      // Apply filters
      let filteredProducts = [...mockProducts];

      // Type filter
      if (typeFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.type.toLowerCase() === typeFilter.toLowerCase());
      }

      // Status filter
      if (statusFilter === 'active') {
        filteredProducts = filteredProducts.filter(p => p.is_active);
      } else if (statusFilter === 'inactive') {
        filteredProducts = filteredProducts.filter(p => !p.is_active);
      } else if (statusFilter === 'listed') {
        filteredProducts = filteredProducts.filter(p => p.is_listing_enabled);
      } else if (statusFilter === 'unlisted') {
        filteredProducts = filteredProducts.filter(p => !p.is_listing_enabled);
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      filteredProducts.sort((a, b) => {
        if (sortBy === 'name') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else if (sortBy === 'type') {
          return sortOrder === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
        } else if (sortBy === 'base_price') {
          return sortOrder === 'asc' ? a.base_price - b.base_price : b.base_price - a.base_price;
        } else {
          // Default sort by created_at
          return sortOrder === 'asc'
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      setTotalProducts(filteredProducts.length);

      // Apply pagination
      const start = (currentPage - 1) * productsPerPage;
      const paginatedProducts = filteredProducts.slice(start, start + productsPerPage);

      setProducts(paginatedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (product: Product, field: 'is_active' | 'is_listing_enabled') => {
    try {
      // In a real app, this would call an API to update the product status
      // For now, just update the local state
      const updatedProducts = products.map(p => {
        if (p.id === product.id) {
          return { ...p, [field]: !p[field] };
        }
        return p;
      });

      setProducts(updatedProducts);

      // Show success message (in a real app)
      console.log(`Updated ${product.name} ${field} to ${!product[field]}`);
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      // In a real app, this would call an API to delete the product
      // For now, just update the local state
      const updatedProducts = products.filter(p => p.id !== productToDelete.id);
      setProducts(updatedProducts);
      setTotalProducts(prev => prev - 1);

      // Close the modal
      setShowDeleteModal(false);
      setProductToDelete(null);

      // Show success message (in a real app)
      console.log(`Deleted product: ${productToDelete.name}`);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-gray-500">Manage your product listings</p>
        </div>
        <Link
          href="/vendor/products/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <span className="text-sm text-blue-600">Search</span>
            </button>
          </form>

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none"
              >
                <option value="all">All Types</option>
                <option value="blinds">Blinds</option>
                <option value="shades">Shades</option>
                <option value="drapes">Drapes</option>
                <option value="shutters">Shutters</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PackageIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="relative flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="listed">Listed</option>
                <option value="unlisted">Unlisted</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TagIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="type-asc">Type (A-Z)</option>
                <option value="base_price-asc">Price (Low to High)</option>
                <option value="base_price-desc">Price (High to Low)</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowUpDownIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setStatusFilter('all');
                setSortBy('created_at');
                setSortOrder('desc');
                setCurrentPage(1);
                fetchProducts();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-md"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Product
                    {sortBy === 'name' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Type
                    {sortBy === 'type' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('base_price')}
                >
                  <div className="flex items-center">
                    Base Price
                    {sortBy === 'base_price' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Created
                    {sortBy === 'created_at' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-md object-cover"
                          src={product.image || '/images/placeholder-product.jpg'}
                          alt={product.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {product.type}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatCurrency(product.base_price)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleToggleStatus(product, 'is_active')}
                          className={`flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 ${
                            product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? (
                            <ToggleRightIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ToggleLeftIcon className="h-3 w-3 mr-1" />
                          )}
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleToggleStatus(product, 'is_listing_enabled')}
                          className={`flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 ${
                            product.is_listing_enabled ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {product.is_listing_enabled ? (
                            <EyeIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertTriangleIcon className="h-3 w-3 mr-1" />
                          )}
                          {product.is_listing_enabled ? 'Listed' : 'Unlisted'}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(product.created_at)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/products/configure/${product.slug}`}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Product"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        href={`/vendor/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Product"
                      >
                        <EditIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => {
                          setProductToDelete(product);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Product"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                      <Link
                        href={`/vendor/products/${product.id}/options`}
                        className="text-purple-600 hover:text-purple-900"
                        title="Manage Product Options"
                      >
                        <SlidersIcon className="h-5 w-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <PackageIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Products Found</h3>
          <p className="mt-2 text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No products match your current filters. Try adjusting your search criteria.'
              : "You haven't created any products yet. Start by adding a new product."}
          </p>
          <div className="flex justify-center space-x-3">
            {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSortBy('created_at');
                  setSortOrder('desc');
                  fetchProducts();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/vendor/products/new"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Add New Product
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalProducts > productsPerPage && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * productsPerPage + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * productsPerPage, totalProducts)}
            </span>{' '}
            of <span className="font-medium">{totalProducts}</span> products
          </div>
          <div className="flex-1 flex justify-end">
            <nav className="inline-flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, Math.ceil(totalProducts / productsPerPage)) }).map((_, i) => {
                // Calculate page number based on current page
                let pageNumber;
                const totalPages = Math.ceil(totalProducts / productsPerPage);

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
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalProducts / productsPerPage)))}
                disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === Math.ceil(totalProducts / productsPerPage)
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
              Delete Product
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Are you sure you want to delete <span className="font-medium">{productToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
