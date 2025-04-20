'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Trash2, AlertCircle,
  ArrowRight, EyeIcon, CheckCircle
} from 'lucide-react';

interface Configuration {
  id: number;
  name: string;
  product_id: number;
  product_name: string;
  created_at: string;
  config: {
    width: number;
    height: number;
    colorId?: number;
    colorName?: string;
    materialId?: number;
    materialName?: string;
    mountType?: number;
    mountTypeName?: string;
    controlType?: string;
    currentPrice: number;
    image?: string;
  };
}

export default function SavedConfigurationsPage() {
  const router = useRouter();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const response = await fetch('/api/account/configurations');
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if not authenticated
            router.push('/login?redirect=/account/configurations');
            return;
          }
          throw new Error('Failed to fetch configurations');
        }

        const data = await response.json();
        setConfigurations(data.configurations || []);
      } catch (error) {
        console.error('Error fetching saved configurations:', error);
        setError('There was a problem loading your saved configurations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigurations();
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setDeleteStatus('loading');
    try {
      const response = await fetch(`/api/account/configurations?id=${deleteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      setDeleteStatus('success');

      // Remove the deleted configuration from the state
      setConfigurations(prev => prev.filter(config => config.id !== deleteId));

      // Close the dialog after a success animation
      setTimeout(() => {
        setDeleteDialogOpen(false);
        setDeleteStatus('idle');
        setDeleteId(null);
      }, 1500);
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setDeleteStatus('error');
    }
  };

  const addToCart = (config: Configuration) => {
    const cartItem = {
      id: Number(Date.now()), // Temporary ID
      productId: config.product_id,
      name: config.product_name,
      slug: '', // This would need to be fetched or stored in the configuration
      price: config.config.currentPrice,
      quantity: 1,
      width: config.config.width,
      height: config.config.height,
      colorId: config.config.colorId,
      colorName: config.config.colorName,
      materialId: config.config.materialId,
      materialName: config.config.materialName,
      image: config.config.image || '',
      totalPrice: config.config.currentPrice
    };

    // In a real app, this would dispatch an action to add to cart
    // For demo, we'll just redirect to the cart page
    // addToCart(cartItem);
    router.push('/cart');
  };

  const reconfigure = (config: Configuration) => {
    // In a real app, we would redirect to the product configurator with the saved configuration
    router.push(`/products/configure/${config.product_id}?configId=${config.id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Saved Configurations</h1>

        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Saved Configurations</h1>

        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-800 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Saved Configurations</h1>

      {configurations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-medium mb-2">No Saved Configurations</h2>
          <p className="text-gray-500 mb-6">
            You haven't saved any product configurations yet. Configure a product and save it to see it here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Browse Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configurations.map(config => (
            <div key={config.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                {config.config.image ? (
                  <img
                    src={config.config.image}
                    alt={config.product_name}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <span>No image available</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-medium">{config.name}</h2>
                  <span className="text-sm text-gray-500">{formatDate(config.created_at)}</span>
                </div>

                <h3 className="text-gray-600 mb-3">
                  {config.product_name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Dimensions:</span>
                    <span className="font-medium">{config.config.width}" × {config.config.height}"</span>
                  </div>

                  {config.config.colorName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Color:</span>
                      <span className="font-medium">{config.config.colorName}</span>
                    </div>
                  )}

                  {config.config.materialName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Material:</span>
                      <span className="font-medium">{config.config.materialName}</span>
                    </div>
                  )}

                  {config.config.mountTypeName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Mount Type:</span>
                      <span className="font-medium">{config.config.mountTypeName}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
                    <span>Price:</span>
                    <span className="text-primary-red">${config.config.currentPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => addToCart(config)}
                    className="flex items-center justify-center bg-primary-red hover:bg-primary-red-dark text-white py-2 px-4 rounded-md transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => reconfigure(config)}
                      className="flex-1 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-md border border-blue-200 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View
                    </button>

                    <button
                      onClick={() => handleDelete(config.id)}
                      className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-md border border-gray-200 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            {deleteStatus === 'success' ? (
              <div className="text-center py-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">Deleted Successfully!</p>
              </div>
            ) : deleteStatus === 'error' ? (
              <div className="text-center py-4">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">Error Deleting Configuration</p>
                <p className="text-gray-500">Please try again later.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4">Delete Configuration</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this saved configuration? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteDialogOpen(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteStatus === 'loading'}
                    className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                  >
                    {deleteStatus === 'loading' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
