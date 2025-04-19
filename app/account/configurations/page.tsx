'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookmarkIcon, SearchIcon, FilterIcon, ChevronDownIcon,
  EyeIcon, ShoppingCartIcon, TrashIcon, ArrowUpDownIcon,
  AlertTriangleIcon, PlusCircleIcon
} from 'lucide-react';

interface Configuration {
  id: number;
  name: string;
  product_id: number;
  product_name: string;
  product_image: string;
  product_slug: string;
  width: number;
  height: number;
  color: string;
  material: string;
  price: number;
  created_at: string;
}

export default function SavedConfigurationsPage() {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<Configuration | null>(null);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);

      // In a real app, this would fetch data from an API
      // For now, use mock data
      setTimeout(() => {
        const mockConfigurations: Configuration[] = [
          {
            id: 1,
            name: 'Living Room Faux Wood',
            product_id: 1,
            product_name: 'Premium Faux Wood Blinds',
            product_image: '/images/products/faux-wood-blinds.jpg',
            product_slug: 'premium-faux-wood-blinds',
            width: 36.5,
            height: 72.25,
            color: 'White',
            material: 'Premium PVC',
            price: 89.98,
            created_at: '2023-09-15T14:32:00Z'
          },
          {
            id: 2,
            name: 'Office Cellular Shades',
            product_id: 6,
            product_name: 'Double Cell Cordless Cellular Shades',
            product_image: '/images/products/cellular-shades.jpg',
            product_slug: 'double-cell-cordless-cellular-shades',
            width: 48.0,
            height: 60.0,
            color: 'Ivory',
            material: 'Polyester',
            price: 119.99,
            created_at: '2023-09-10T10:15:00Z'
          },
          {
            id: 3,
            name: 'Master Bedroom Wood Blinds',
            product_id: 4,
            product_name: 'Premium Hardwood Blinds',
            product_image: '/images/products/wood-blinds.jpg',
            product_slug: 'premium-hardwood-blinds',
            width: 30.25,
            height: 60.5,
            color: 'Rustic Oak',
            material: 'Basswood',
            price: 229.98,
            created_at: '2023-09-05T16:45:00Z'
          }
        ];

        setConfigurations(mockConfigurations);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching saved configurations:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery) {
      fetchConfigurations();
      return;
    }

    // Filter configurations based on search query
    const filtered = configurations.filter(config =>
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.material.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setConfigurations(filtered);
  };

  const handleProductFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProductFilter(e.target.value);

    // If filter is empty, show all configurations
    if (!e.target.value) {
      fetchConfigurations();
      return;
    }

    // Filter configurations based on product name
    const filtered = configurations.filter(config =>
      config.product_name.toLowerCase().includes(e.target.value.toLowerCase())
    );

    setConfigurations(filtered);
  };

  const handleSort = (field: string) => {
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newSortOrder);

    // Sort configurations
    const sorted = [...configurations].sort((a, b) => {
      if (field === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (field === 'product_name') {
        return sortOrder === 'asc'
          ? a.product_name.localeCompare(b.product_name)
          : b.product_name.localeCompare(a.product_name);
      } else if (field === 'price') {
        return sortOrder === 'asc'
          ? a.price - b.price
          : b.price - a.price;
      } else {
        // Default sort by created_at
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setConfigurations(sorted);
  };

  const handleDelete = (config: Configuration) => {
    setConfigToDelete(config);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;

    try {
      // In a real app, this would call an API to delete the configuration
      // For now, just update the local state
      const updatedConfigurations = configurations.filter(config => config.id !== configToDelete.id);
      setConfigurations(updatedConfigurations);

      // Close the modal
      setShowDeleteModal(false);
      setConfigToDelete(null);
    } catch (error) {
      console.error('Error deleting configuration:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get unique product names for filter
  const productOptions = Array.from(new Set(configurations.map(config => config.product_name)));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Saved Configurations</h1>
          <p className="text-gray-500">Your saved product configurations for quick ordering</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search configurations..."
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

          <div className="relative">
            <select
              value={productFilter}
              onChange={handleProductFilter}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none"
            >
              <option value="">All Products</option>
              {productOptions.map((product) => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <select
              value={`${sortBy}|${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('|');
                setSortBy(field);
                setSortOrder(order);
                handleSort(field);
              }}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none"
            >
              <option value="created_at|desc">Newest First</option>
              <option value="created_at|asc">Oldest First</option>
              <option value="name|asc">Name (A-Z)</option>
              <option value="name|desc">Name (Z-A)</option>
              <option value="product_name|asc">Product (A-Z)</option>
              <option value="product_name|desc">Product (Z-A)</option>
              <option value="price|asc">Price (Low to High)</option>
              <option value="price|desc">Price (High to Low)</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDownIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Configurations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-t-lg"></div>
              <div className="bg-white p-4 rounded-b-lg border border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : configurations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configurations.map((config) => (
            <div key={config.id} className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={config.product_image}
                  alt={config.product_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow">
                  <BookmarkIcon size={16} className="text-blue-600" />
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{config.name}</h3>
                  <span className="text-sm text-gray-500">{formatDate(config.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{config.product_name}</p>

                <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Dimensions:</span>
                    <span className="ml-1 text-gray-900">{config.width}" × {config.height}"</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="ml-1 text-gray-900 font-medium">{formatCurrency(config.price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Color:</span>
                    <span className="ml-1 text-gray-900">{config.color}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Material:</span>
                    <span className="ml-1 text-gray-900">{config.material}</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Link
                    href={`/products/configure/${config.product_slug}?config=${config.id}`}
                    className="flex-1 flex items-center justify-center py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
                  >
                    <EyeIcon size={14} className="mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/cart?add=${config.id}`}
                    className="flex-1 flex items-center justify-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    <ShoppingCartIcon size={14} className="mr-1" />
                    Add to Cart
                  </Link>
                  <button
                    onClick={() => handleDelete(config)}
                    className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <BookmarkIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Saved Configurations</h3>
          <p className="mt-2 text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery || productFilter
              ? 'No configurations match your search filters. Try adjusting your criteria.'
              : "You haven't saved any product configurations yet. When configuring products, click 'Save Configuration' to keep track of your preferences."}
          </p>
          <Link
            href="/products"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 inline-flex items-center"
          >
            <PlusCircleIcon className="h-4 w-4 mr-1" />
            Browse Products
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && configToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
              Delete Saved Configuration
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Are you sure you want to delete <span className="font-medium">{configToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfigToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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
