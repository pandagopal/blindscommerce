'use client';

import { useState, useEffect } from 'react';
import { Package, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';

interface UserLimits {
  remainingLifetime: number;
  remainingPeriod: number;
  isSuspended: boolean;
  periodEnd: string;
}

interface Swatch {
  id: string;
  name: string;
  color: string;
  material: string;
  image: string;
  isPremium: boolean;
  inStock: boolean;
  categoryName: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface SampleRequestWidgetProps {
  userEmail?: string;
  showLimitsInfo?: boolean;
  onRequestComplete?: (orderId: string) => void;
}

export default function SampleRequestWidget({ 
  userEmail, 
  showLimitsInfo = true,
  onRequestComplete 
}: SampleRequestWidgetProps) {
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSwatches, setSelectedSwatches] = useState<string[]>([]);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Form data for shipping
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    priority: 'STANDARD'
  });

  // Load swatches and limits
  useEffect(() => {
    loadData();
  }, [userEmail, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory.toString());
      }
      if (userEmail) {
        params.append('email', userEmail);
      }

      const response = await fetch(`/api/swatches?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setSwatches(data.swatches);
        setCategories(data.categories);
        setUserLimits(data.userLimits);
      } else {
        setError('Failed to load swatches');
      }
    } catch (error) {
      console.error('Error loading swatches:', error);
      setError('Failed to load swatches');
    } finally {
      setLoading(false);
    }
  };

  const handleSwatchSelect = (swatchId: string) => {
    setSelectedSwatches(prev => {
      if (prev.includes(swatchId)) {
        return prev.filter(id => id !== swatchId);
      } else {
        // Check limits before adding
        if (userLimits) {
          const newCount = prev.length + 1;
          if (newCount > userLimits.remainingPeriod) {
            setError(`You can only request ${userLimits.remainingPeriod} more samples this period`);
            return prev;
          }
          if (newCount > userLimits.remainingLifetime) {
            setError(`You can only request ${userLimits.remainingLifetime} more samples total`);
            return prev;
          }
        }
        setError('');
        return [...prev, swatchId];
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/swatches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedSwatches,
          shippingInfo: formData,
          priority: formData.priority
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Sample request submitted successfully! Order ID: ${data.orderId}`);
        setSelectedSwatches([]);
        setShowRequestForm(false);
        loadData(); // Refresh limits
        onRequestComplete?.(data.orderId);
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitRequest = () => {
    return selectedSwatches.length > 0 && 
           userLimits && 
           !userLimits.isSuspended &&
           selectedSwatches.length <= userLimits.remainingPeriod &&
           selectedSwatches.length <= userLimits.remainingLifetime;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Limits Information */}
      {showLimitsInfo && userLimits && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Sample Request Limits</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>Remaining this period:</span>
                  <span className="font-medium">{userLimits.remainingPeriod} samples</span>
                </div>
                <div className="flex justify-between">
                  <span>Lifetime remaining:</span>
                  <span className="font-medium">{userLimits.remainingLifetime} samples</span>
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  Period resets: {new Date(userLimits.periodEnd).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Notice */}
      {userLimits?.isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">
              Your sample request privileges have been suspended. Please contact customer service.
            </span>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedCategory === null
              ? 'bg-primary-red text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Selected Samples Counter */}
      {selectedSwatches.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-green-800">
                {selectedSwatches.length} sample{selectedSwatches.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={() => setShowRequestForm(true)}
              disabled={!canSubmitRequest() || userLimits?.isSuspended}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-1 rounded text-sm transition-colors"
            >
              Request Samples
            </button>
          </div>
        </div>
      )}

      {/* Swatches Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {swatches.map(swatch => {
          const isSelected = selectedSwatches.includes(swatch.id);
          const isDisabled = !swatch.inStock || userLimits?.isSuspended;
          
          return (
            <div
              key={swatch.id}
              className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-red bg-red-50'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => !isDisabled && handleSwatchSelect(swatch.id)}
            >
              {/* Sample Image */}
              <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                {swatch.image ? (
                  <img
                    src={swatch.image}
                    alt={swatch.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{ backgroundColor: swatch.color }}
                  />
                )}
              </div>

              {/* Sample Info */}
              <div className="text-sm">
                <div className="font-medium text-gray-900 truncate">{swatch.name}</div>
                <div className="text-gray-500 text-xs">{swatch.material}</div>
                {swatch.categoryName && (
                  <div className="text-gray-400 text-xs">{swatch.categoryName}</div>
                )}
              </div>

              {/* Badges */}
              <div className="absolute top-2 right-2 space-y-1">
                {swatch.isPremium && (
                  <div className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded">
                    Premium
                  </div>
                )}
                {!swatch.inStock && (
                  <div className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 left-2">
                  <CheckCircle className="h-5 w-5 text-primary-red" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h3 className="text-lg font-bold mb-4">Request Sample Shipping</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                >
                  <option value="STANDARD">Standard (3-5 business days)</option>
                  <option value="EXPRESS">Express (1-2 business days) - $5.99</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2 bg-primary-red text-white rounded-md transition-colors ${
                    submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-red-dark'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Request ${selectedSwatches.length} Samples`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}