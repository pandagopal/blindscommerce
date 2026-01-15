'use client';

import { useEffect } from 'react';
import { X, Tag, ChevronDown, Check } from 'lucide-react';

interface Category {
  id?: number;
  category_id?: number;
  name: string;
  slug: string;
  product_count?: number;
}

interface Feature {
  id: number;
  name: string;
  description: string;
}

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  features: Feature[];
  selectedCategories: number[];
  setSelectedCategories: (categories: number[]) => void;
  minPrice: string;
  setMinPrice: (price: string) => void;
  maxPrice: string;
  setMaxPrice: (price: string) => void;
  selectedRoom: string;
  setSelectedRoom: (room: string) => void;
  saleOnly: boolean;
  setSaleOnly: (sale: boolean) => void;
  selectedFeatures: number[];
  setSelectedFeatures: (features: number[]) => void;
  onClearAll: () => void;
  productCount: number;
}

const ROOM_OPTIONS = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom',
  'Dining Room', 'Home Office', 'Nursery', 'Media Room',
  'Sunroom', 'Basement', 'Garage', 'Patio/Outdoor'
];

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  categories,
  features,
  selectedCategories,
  setSelectedCategories,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  selectedRoom,
  setSelectedRoom,
  saleOnly,
  setSaleOnly,
  selectedFeatures,
  setSelectedFeatures,
  onClearAll,
  productCount
}: MobileFilterDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const activeFilterCount = selectedCategories.length +
    (minPrice || maxPrice ? 1 : 0) +
    (selectedRoom ? 1 : 0) +
    (saleOnly ? 1 : 0) +
    selectedFeatures.length;

  const toggleCategory = (catId: number) => {
    setSelectedCategories(
      selectedCategories.includes(catId)
        ? selectedCategories.filter(id => id !== catId)
        : [...selectedCategories, catId]
    );
  };

  const toggleFeature = (featureId: number) => {
    setSelectedFeatures(
      selectedFeatures.includes(featureId)
        ? selectedFeatures.filter(id => id !== featureId)
        : [...selectedFeatures, featureId]
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-full max-w-sm bg-white z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <p className="text-sm text-gray-500">{activeFilterCount} active</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
              Categories
              {selectedCategories.length > 0 && (
                <span className="text-xs text-red-600">{selectedCategories.length} selected</span>
              )}
            </h3>
            <div className="space-y-2">
              {categories.map(category => {
                const catId = category.category_id || category.id || 0;
                const isSelected = selectedCategories.includes(catId);
                return (
                  <button
                    key={catId}
                    onClick={() => toggleCategory(catId)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    {isSelected && <Check size={18} className="text-red-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <span className="text-gray-400 font-medium">to</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Room Type */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Room Type</h3>
            <div className="relative">
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full appearance-none p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-10"
              >
                <option value="">All Rooms</option>
                {ROOM_OPTIONS.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Sale Filter */}
          <div>
            <button
              onClick={() => setSaleOnly(!saleOnly)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                saleOnly
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag size={18} className={saleOnly ? 'text-red-500' : 'text-gray-400'} />
                <span className={`font-medium ${saleOnly ? 'text-red-700' : 'text-gray-700'}`}>
                  On Sale Only
                </span>
              </div>
              {saleOnly && <Check size={18} className="text-red-500" />}
            </button>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>
              <div className="space-y-2">
                {features.map(feature => {
                  const isSelected = selectedFeatures.includes(feature.id);
                  return (
                    <button
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{feature.name}</span>
                      {isSelected && <Check size={18} className="text-red-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {activeFilterCount > 0 && (
            <button
              onClick={onClearAll}
              className="w-full py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
            >
              Clear All Filters
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Show {productCount} Products
          </button>
        </div>
      </div>
    </>
  );
}
