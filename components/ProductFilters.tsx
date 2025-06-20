'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

interface Feature {
  id: number;
  name: string;
  description: string;
  count?: number;
}

interface Brand {
  id: number;
  name: string;
  count?: number;
}

interface Color {
  name: string;
  count: number;
}

interface Material {
  name: string;
  count: number;
}

interface PriceRange {
  min_price: number;
  max_price: number;
  avg_price: number;
}

interface PageContext {
  isRoomFiltered: boolean;
  isCategoryFiltered: boolean;
  isSaleFiltered: boolean;
  isSearchFiltered: boolean;
  roomName?: string;
  categoryName?: string;
}

interface ProductFiltersProps {
  categories: Category[];
  features: Feature[];
  brands?: Brand[];
  colors?: Color[];
  materials?: Material[];
  priceRange?: PriceRange;
  defaultCategoryId?: number | null;
  initialMinPrice?: number | null;
  initialMaxPrice?: number | null;
  initialSort?: string;
  initialFeatures?: number[];
  initialBrands?: string[];
  initialColors?: string[];
  initialMaterials?: string[];
  initialRoom?: string;
  initialSale?: boolean;
  productCount: number;
  showAdvancedFilters?: boolean;
  pageContext?: PageContext;
}

export default function ProductFilters({
  categories,
  features,
  brands = [],
  colors = [],
  materials = [],
  priceRange,
  defaultCategoryId = null,
  initialMinPrice = null,
  initialMaxPrice = null,
  initialSort = 'recommended',
  initialFeatures = [],
  initialBrands = [],
  initialColors = [],
  initialMaterials = [],
  initialRoom,
  initialSale = false,
  productCount,
  showAdvancedFilters = true,
  pageContext
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for filters
  const [selectedCategories, setSelectedCategories] = useState<number[]>(defaultCategoryId ? [defaultCategoryId] : []);
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice ? initialMinPrice.toString() : '');
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice ? initialMaxPrice.toString() : '');
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>(initialFeatures);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrands);
  const [selectedColors, setSelectedColors] = useState<string[]>(initialColors);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(initialMaterials);
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoom || '');
  const [saleOnly, setSaleOnly] = useState<boolean>(initialSale);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Initialize state from URL parameters when component mounts
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Parse categories
    const categoryParam = params.get('category');
    if (categoryParam) {
      try {
        const categoryId = parseInt(categoryParam, 10);
        setSelectedCategories([categoryId]);
      } catch (e) {
        console.error('Invalid category parameter', e);
      }
    }

    // Parse price range
    const minPriceParam = params.get('minPrice');
    if (minPriceParam) setMinPrice(minPriceParam);

    const maxPriceParam = params.get('maxPrice');
    if (maxPriceParam) setMaxPrice(maxPriceParam);

    // Parse sort
    const sortParam = params.get('sort');
    if (sortParam) setSortBy(sortParam);

    // Parse features
    const featuresParam = params.get('features');
    if (featuresParam) {
      try {
        const featuresIds = featuresParam.split(',').map(id => parseInt(id, 10));
        setSelectedFeatures(featuresIds);
      } catch (e) {
        console.error('Invalid features parameter', e);
      }
    }

    // Parse room
    const roomParam = params.get('room');
    if (roomParam) setSelectedRoom(roomParam);

    // Parse sale
    const saleParam = params.get('sale');
    if (saleParam === 'true') setSaleOnly(true);
  }, [searchParams]);

  // Map sort values to API parameters
  const sortToApiMapping: Record<string, { sortBy: string; sortOrder: string }> = {
    'recommended': { sortBy: 'rating', sortOrder: 'desc' },
    'price-low': { sortBy: 'base_price', sortOrder: 'asc' },
    'price-high': { sortBy: 'base_price', sortOrder: 'desc' },
    'rating': { sortBy: 'rating', sortOrder: 'desc' },
    'newest': { sortBy: 'product_id', sortOrder: 'desc' }
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Handle feature selection
  const handleFeatureChange = (featureId: number) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(id => id !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };

  // Apply filters and update URL
  const applyFilters = () => {
    setIsApplyingFilters(true);

    const params = new URLSearchParams();

    // Add categories
    if (selectedCategories.length === 1) {
      params.set('category', selectedCategories[0].toString());
    }

    // Add price range
    if (minPrice.trim()) {
      params.set('minPrice', minPrice.trim());
    }

    if (maxPrice.trim()) {
      params.set('maxPrice', maxPrice.trim());
    }

    // Add sort parameters
    if (sortBy !== 'recommended') {
      params.set('sort', sortBy);

      // Map sort values to API parameters
      const sortMapping = sortToApiMapping[sortBy];
      if (sortMapping) {
        params.set('sortBy', sortMapping.sortBy);
        params.set('sortOrder', sortMapping.sortOrder);
      }
    }

    // Add features
    if (selectedFeatures.length > 0) {
      params.set('features', selectedFeatures.join(','));
    }

    // Add room
    if (selectedRoom.trim()) {
      params.set('room', selectedRoom.trim());
    }

    // Add sale filter
    if (saleOnly) {
      params.set('sale', 'true');
    }

    // Create the URL with the search parameters
    const url = `/products?${params.toString()}`;
    router.push(url);

    setIsApplyingFilters(false);
  };

  // Handle sort change
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSortBy(value);

    // Apply sorting immediately
    const params = new URLSearchParams(searchParams.toString());

    if (value !== 'recommended') {
      params.set('sort', value);

      // Map sort values to API parameters
      const sortMapping = sortToApiMapping[value];
      if (sortMapping) {
        params.set('sortBy', sortMapping.sortBy);
        params.set('sortOrder', sortMapping.sortOrder);
      }
    } else {
      params.delete('sort');
      params.delete('sortBy');
      params.delete('sortOrder');
    }

    router.push(`/products?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('recommended');
    setSelectedFeatures([]);
    setSelectedRoom('');
    setSaleOnly(false);
    router.push('/products');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Filters</h2>
        {(selectedCategories.length > 0 || minPrice || maxPrice || selectedFeatures.length > 0 || selectedRoom || saleOnly) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-primary-red transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories - Grouped by Type */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Categories</h3>
        <div className="space-y-3">
          {/* Blinds Group */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Blinds</h4>
            <div className="space-y-1 pl-2">
              {Array.isArray(categories) && categories.filter(cat => 
                ['Venetian Blinds', 'Vertical Blinds', 'Roller Blinds', 'Roman Blinds', 'Wooden Blinds', 'Faux Wood Blinds'].includes(cat.name)
              ).map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Shades Group */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Shades</h4>
            <div className="space-y-1 pl-2">
              {Array.isArray(categories) && categories.filter(cat => 
                ['Cellular Shades', 'Roller Shades', 'Solar Shades', 'Woven Wood Shades', 'Pleated Shades'].includes(cat.name)
              ).map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Shutters Group */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Shutters</h4>
            <div className="space-y-1 pl-2">
              {Array.isArray(categories) && categories.filter(cat => 
                ['Plantation Shutters', 'Vinyl Shutters', 'Wood Shutters', 'Composite Shutters'].includes(cat.name)
              ).map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Other Categories */}
          {Array.isArray(categories) && categories.filter(cat => 
            !['Venetian Blinds', 'Vertical Blinds', 'Roller Blinds', 'Roman Blinds', 'Wooden Blinds', 'Faux Wood Blinds',
              'Cellular Shades', 'Roller Shades', 'Solar Shades', 'Woven Wood Shades', 'Pleated Shades',
              'Plantation Shutters', 'Vinyl Shutters', 'Wood Shutters', 'Composite Shutters'].includes(cat.name)
          ).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Other</h4>
              <div className="space-y-1 pl-2">
                {categories.filter(cat => 
                  !['Venetian Blinds', 'Vertical Blinds', 'Roller Blinds', 'Roman Blinds', 'Wooden Blinds', 'Faux Wood Blinds',
                    'Cellular Shades', 'Roller Shades', 'Solar Shades', 'Woven Wood Shades', 'Pleated Shades',
                    'Plantation Shutters', 'Vinyl Shutters', 'Wood Shutters', 'Composite Shutters'].includes(cat.name)
                ).map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Price Range</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="sr-only" htmlFor="min-price">
                Minimum Price
              </label>
              <input
                type="number"
                id="min-price"
                placeholder="Min"
                className="w-full rounded border-gray-300 text-sm p-2"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="max-price">
                Maximum Price
              </label>
              <input
                type="number"
                id="max-price"
                placeholder="Max"
                className="w-full rounded border-gray-300 text-sm p-2"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-1 px-3 rounded transition-colors"
            onClick={applyFilters}
            disabled={isApplyingFilters}
          >
            {isApplyingFilters ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Room Filter */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Room Type</h3>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="w-full rounded border-gray-300 text-sm p-2"
        >
          <option value="">All Rooms</option>
          <option value="living-room">Living Room</option>
          <option value="bedroom">Bedroom</option>
          <option value="kitchen">Kitchen</option>
          <option value="bathroom">Bathroom</option>
          <option value="dining-room">Dining Room</option>
          <option value="office">Office</option>
          <option value="nursery">Nursery</option>
        </select>
      </div>

      {/* Sale Filter */}
      <div className="mb-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="sale-only"
            className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
            checked={saleOnly}
            onChange={(e) => setSaleOnly(e.target.checked)}
          />
          <label htmlFor="sale-only" className="ml-2 text-sm text-gray-700">
            Sale Items Only
          </label>
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-sm font-medium mb-2">Features</h3>
        <div className="space-y-2">
          {Array.isArray(features) && features.map((feature) => (
            <div key={feature.id} className="flex items-center">
              <input
                type="checkbox"
                id={`feature-${feature.id}`}
                className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                checked={selectedFeatures.includes(feature.id)}
                onChange={() => handleFeatureChange(feature.id)}
              />
              <label
                htmlFor={`feature-${feature.id}`}
                className="ml-2 text-sm text-gray-700"
                title={feature.description}
              >
                {feature.name}
              </label>
            </div>
          ))}
        </div>
        {(selectedFeatures.length > 0 || selectedRoom || saleOnly) && (
          <button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-1 px-3 rounded transition-colors mt-2"
            onClick={applyFilters}
            disabled={isApplyingFilters}
          >
            {isApplyingFilters ? 'Applying...' : 'Apply Filters'}
          </button>
        )}
      </div>
    </div>
  );
}
