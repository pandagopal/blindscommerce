'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, SlidersHorizontal, ChevronDown, Star, Tag, Sparkles, Clock, ArrowUpDown, Grid3X3, LayoutGrid, Loader2 } from 'lucide-react';
import EnhancedProductGrid from './EnhancedProductGrid';
import MobileFilterDrawer from './MobileFilterDrawer';
import ActiveFilterPills from './ActiveFilterPills';
import QuickViewModal from './QuickViewModal';
import { useWishlist } from '@/context/WishlistContext';

interface Product {
  product_id: number;
  category_id: number;
  name: string;
  slug: string;
  category_name: string;
  base_price: number;
  sale_price?: number;
  rating?: number;
  review_count?: number;
  primary_image?: string;
  short_description?: string;
  is_new?: boolean;
  is_bestseller?: boolean;
  is_on_sale?: boolean;
  color_options?: string[];
  created_at?: string;
}

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

interface EnhancedProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
  features: Feature[];
  totalCount?: number;
  initialCategoryId?: number | null;
  initialMinPrice?: number | null;
  initialMaxPrice?: number | null;
  initialSort?: string;
  initialFeatures?: number[];
  initialRoom?: string;
  initialSale?: boolean;
  initialSearch?: string;
}

// Sort options
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended', icon: Sparkles },
  { value: 'price-low', label: 'Price: Low to High', icon: ArrowUpDown },
  { value: 'price-high', label: 'Price: High to Low', icon: ArrowUpDown },
  { value: 'rating', label: 'Top Rated', icon: Star },
  { value: 'newest', label: 'Newest', icon: Clock },
];

// Room options
const ROOM_OPTIONS = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom',
  'Dining Room', 'Home Office', 'Nursery', 'Media Room',
  'Sunroom', 'Basement', 'Garage', 'Patio/Outdoor'
];

export default function EnhancedProductsClient({
  initialProducts,
  categories,
  features,
  totalCount,
  initialCategoryId,
  initialMinPrice,
  initialMaxPrice,
  initialSort,
  initialFeatures,
  initialRoom,
  initialSale,
  initialSearch
}: EnhancedProductsClientProps) {
  // Router for URL sync
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < (totalCount || 0));
  // Page starts at 2 because server loaded 50 items (50/20 = 2.5, rounded down = 2, next page is 3)
  const [page, setPage] = useState(Math.max(1, Math.floor(initialProducts.length / 20)));

  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialCategoryId ? [initialCategoryId] : []
  );
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>(initialFeatures || []);
  const [selectedRoom, setSelectedRoom] = useState(initialRoom || '');
  const [saleOnly, setSaleOnly] = useState(initialSale || false);
  const [sortBy, setSortBy] = useState(initialSort || 'recommended');

  // UI states
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [gridView, setGridView] = useState<'comfortable' | 'compact'>('comfortable');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // Use centralized wishlist context
  const { items: wishlistItems, toggleWishlist: contextToggleWishlist, isInWishlist } = useWishlist();
  const wishlist = wishlistItems.map(item => item.product_id);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Track if component has mounted to prevent initial navigation
  const hasMountedRef = useRef(false);
  const isNavigatingRef = useRef(false);

  // Sync filter state with URL parameters when URL changes (e.g., from navbar clicks)
  useEffect(() => {
    if (isNavigatingRef.current) return; // Skip if we're the ones navigating

    // Update filter states from URL params
    if (initialCategoryId && !selectedCategories.includes(initialCategoryId)) {
      setSelectedCategories([initialCategoryId]);
    } else if (!initialCategoryId && selectedCategories.length > 0) {
      setSelectedCategories([]);
    }

    if (initialSearch !== searchQuery) {
      setSearchQuery(initialSearch || '');
    }

    if ((initialMinPrice?.toString() || '') !== minPrice) {
      setMinPrice(initialMinPrice?.toString() || '');
    }

    if ((initialMaxPrice?.toString() || '') !== maxPrice) {
      setMaxPrice(initialMaxPrice?.toString() || '');
    }
  }, [initialCategoryId, initialSearch, initialMinPrice, initialMaxPrice]);

  // When filters change, navigate to update server-side rendering
  useEffect(() => {
    // Skip navigation on first mount
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const params = new URLSearchParams();

    if (selectedCategories.length === 1) {
      params.set('category', selectedCategories[0].toString());
    }
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    if (minPrice) {
      params.set('minPrice', minPrice);
    }
    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    }
    if (selectedRoom) {
      params.set('room', selectedRoom);
    }
    if (saleOnly) {
      params.set('sale', 'true');
    }
    if (sortBy && sortBy !== 'recommended') {
      params.set('sort', sortBy);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Use window.location for hard reload to fetch fresh data from server
    isNavigatingRef.current = true;
    window.location.href = newUrl;
  }, [selectedCategories, debouncedSearch, minPrice, maxPrice, selectedRoom, saleOnly, sortBy, pathname]);

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.length > 1) {
      const suggestions = initialProducts
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
        .map(p => p.name);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, initialProducts]);

  // Toggle wishlist using context - creates the product object needed by context
  const toggleWishlist = useCallback((productId: number) => {
    const product = initialProducts.find(p => p.product_id === productId);
    if (product) {
      contextToggleWishlist({
        product_id: product.product_id,
        name: product.name,
        slug: product.slug,
        base_price: product.sale_price || product.base_price,
        image: product.primary_image || ''
      });
    }
  }, [initialProducts, contextToggleWishlist]);

  // Client-side filtering - disabled, server handles filtering
  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  // Client-side sorting
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.base_price - b.base_price);
      case 'price-high':
        return sorted.sort((a, b) => b.base_price - a.base_price);
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        return sorted.sort((a, b) => b.product_id - a.product_id);
      default:
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  }, [filteredProducts, sortBy]);

  // Infinite scroll - Load more products
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.set('limit', '20');
      params.set('offset', (nextPage * 20).toString());

      if (selectedCategories.length === 1) {
        params.set('category', selectedCategories[0].toString());
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const response = await fetch(`/api/v2/commerce/products?${params.toString()}`);
      if (!response.ok) {
        console.error('API error:', response.status, response.statusText);
        setHasMore(false);
        return;
      }
      const data = await response.json();
      const newProducts = data.data?.products || data.products || [];

      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(nextPage);
        setHasMore(newProducts.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, selectedCategories, debouncedSearch]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  // Active filters for pills
  const activeFilters = useMemo(() => {
    const filters: { type: string; value: string; label: string }[] = [];

    if (debouncedSearch) {
      filters.push({ type: 'search', value: debouncedSearch, label: `"${debouncedSearch}"` });
    }

    selectedCategories.forEach(catId => {
      const cat = categories.find(c => (c.category_id || c.id) === catId);
      if (cat) {
        filters.push({ type: 'category', value: catId.toString(), label: cat.name });
      }
    });

    if (minPrice || maxPrice) {
      const priceLabel = minPrice && maxPrice
        ? `$${minPrice} - $${maxPrice}`
        : minPrice
        ? `$${minPrice}+`
        : `Up to $${maxPrice}`;
      filters.push({ type: 'price', value: 'price', label: priceLabel });
    }

    if (selectedRoom) {
      filters.push({ type: 'room', value: selectedRoom, label: selectedRoom });
    }

    if (saleOnly) {
      filters.push({ type: 'sale', value: 'true', label: 'On Sale' });
    }

    return filters;
  }, [debouncedSearch, selectedCategories, categories, minPrice, maxPrice, selectedRoom, saleOnly]);

  // Remove filter
  const removeFilter = useCallback((type: string, value: string) => {
    switch (type) {
      case 'search':
        setSearchQuery('');
        break;
      case 'category':
        setSelectedCategories(prev => prev.filter(id => id.toString() !== value));
        break;
      case 'price':
        setMinPrice('');
        setMaxPrice('');
        break;
      case 'room':
        setSelectedRoom('');
        break;
      case 'sale':
        setSaleOnly(false);
        break;
    }
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setSelectedFeatures([]);
    setSelectedRoom('');
    setSaleOnly(false);
    setSortBy('recommended');
  }, []);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    // Search is already handled by debounce
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSearchFocused(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar - Prominent */}
      <div className="bg-white border-b border-gray-200 shadow-md">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500" size={24} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search for blinds, shades, shutters..."
                className="w-full pl-14 pr-12 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {searchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                  >
                    <Search size={14} className="text-gray-400 mr-2" />
                    <span dangerouslySetInnerHTML={{
                      __html: suggestion.replace(
                        new RegExp(`(${searchQuery})`, 'gi'),
                        '<strong class="text-red-600">$1</strong>'
                      )
                    }} />
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Left side - Filter button (mobile) & Product count */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 text-red-700"
            >
              <SlidersHorizontal size={18} />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </button>

            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{sortedProducts.length}</span> products
              {totalCount && sortedProducts.length < totalCount && (
                <span className="text-gray-400"> of {totalCount}</span>
              )}
            </p>
          </div>

          {/* Right side - Sort & View toggle */}
          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Grid view toggle */}
            <div className="hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setGridView('comfortable')}
                className={`p-2 ${gridView === 'comfortable' ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                title="Comfortable view"
              >
                <LayoutGrid size={18} className={gridView === 'comfortable' ? 'text-red-600' : 'text-gray-400'} />
              </button>
              <button
                onClick={() => setGridView('compact')}
                className={`p-2 ${gridView === 'compact' ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                title="Compact view"
              >
                <Grid3X3 size={18} className={gridView === 'compact' ? 'text-red-600' : 'text-gray-400'} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Pills */}
        {activeFilters.length > 0 && (
          <ActiveFilterPills
            filters={activeFilters}
            onRemove={removeFilter}
            onClearAll={clearAllFilters}
          />
        )}

        {/* Main Grid Layout */}
        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                {activeFilters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map(category => {
                    const catId = category.category_id || category.id || 0;
                    const isSelected = selectedCategories.includes(catId);
                    return (
                      <label
                        key={catId}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedCategories(prev =>
                              isSelected
                                ? prev.filter(id => id !== catId)
                                : [...prev, catId]
                            );
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className={`text-sm ${isSelected ? 'text-red-600 font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {category.name}
                        </span>
                        {category.product_count && (
                          <span className="text-xs text-gray-400">({category.product_count})</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Price Range</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Room Type */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Room Type</h3>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Rooms</option>
                  {ROOM_OPTIONS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              {/* Sale Filter */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saleOnly}
                    onChange={(e) => setSaleOnly(e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">On Sale</span>
                  <Tag size={14} className="text-red-500" />
                </label>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Features</h3>
                  <div className="space-y-2">
                    {features.map(feature => (
                      <label
                        key={feature.id}
                        className="flex items-center gap-2 cursor-pointer"
                        title={feature.description}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature.id)}
                          onChange={() => {
                            setSelectedFeatures(prev =>
                              prev.includes(feature.id)
                                ? prev.filter(id => id !== feature.id)
                                : [...prev, feature.id]
                            );
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">{feature.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {sortedProducts.length === 0 && !isLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <EnhancedProductGrid
                  products={sortedProducts}
                  gridView={gridView}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                  onQuickView={setQuickViewProduct}
                />

                {/* Load More / Infinite Scroll Trigger */}
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                  {isLoading && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading more products...</span>
                    </div>
                  )}
                  {!isLoading && hasMore && (
                    <button
                      onClick={loadMore}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Load More Products
                    </button>
                  )}
                  {!hasMore && sortedProducts.length > 0 && (
                    <p className="text-gray-400 text-sm">You've seen all products</p>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        categories={categories}
        features={features}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        saleOnly={saleOnly}
        setSaleOnly={setSaleOnly}
        selectedFeatures={selectedFeatures}
        setSelectedFeatures={setSelectedFeatures}
        onClearAll={clearAllFilters}
        productCount={sortedProducts.length}
      />

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          isWishlisted={wishlist.includes(quickViewProduct.product_id)}
          onToggleWishlist={() => toggleWishlist(quickViewProduct.product_id)}
        />
      )}
    </div>
  );
}
