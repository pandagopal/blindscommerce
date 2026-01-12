'use client';

import { useState, useMemo } from 'react';
import ProductFilters from './ProductFilters';
import ProductGrid from './ProductGrid';
import ProductSortHeader from './ProductSortHeader';

interface Product {
  product_id: number;
  category_id: number;
  name: string;
  slug: string;
  category_name: string;
  base_price: number;
  rating?: number;
  primary_image?: string;
  short_description?: string;
}

interface Category {
  id?: number;
  category_id?: number;
  name: string;
  slug: string;
}

interface Feature {
  id: number;
  name: string;
  description: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
  features: Feature[];
  initialCategoryId?: number | null;
  initialMinPrice?: number | null;
  initialMaxPrice?: number | null;
  initialSort?: string;
  initialFeatures?: number[];
  initialRoom?: string;
  initialSale?: boolean;
  pageContext?: any;
}

export default function ProductsClient({
  initialProducts,
  categories,
  features,
  initialCategoryId,
  initialMinPrice,
  initialMaxPrice,
  initialSort,
  initialFeatures,
  initialRoom,
  initialSale,
  pageContext
}: ProductsClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialCategoryId ? [initialCategoryId] : []
  );
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice ? initialMinPrice.toString() : '');
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice ? initialMaxPrice.toString() : '');
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>(initialFeatures || []);
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoom || '');
  const [saleOnly, setSaleOnly] = useState<boolean>(initialSale || false);
  const [sortBy, setSortBy] = useState<string>(initialSort || 'recommended');

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    let filtered = [...initialProducts];

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.category_id)
      );
    }

    // Filter by price range
    if (minPrice.trim()) {
      const min = parseFloat(minPrice);
      filtered = filtered.filter(product => product.base_price >= min);
    }
    if (maxPrice.trim()) {
      const max = parseFloat(maxPrice);
      filtered = filtered.filter(product => product.base_price <= max);
    }

    // TODO: Filter by features, room, sale when that data is available on products

    return filtered;
  }, [initialProducts, selectedCategories, minPrice, maxPrice]);

  // Client-side sorting
  const sortedProducts = useMemo(() => {
    const products = [...filteredProducts];

    switch (sortBy) {
      case 'price-low':
        return products.sort((a, b) => a.base_price - b.base_price);
      case 'price-high':
        return products.sort((a, b) => b.base_price - a.base_price);
      case 'rating':
        return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        return products.sort((a, b) => b.product_id - a.product_id);
      case 'recommended':
      default:
        return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  }, [filteredProducts, sortBy]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Filters sidebar */}
      <div className="md:col-span-1">
        <ProductFilters
          categories={categories}
          features={features}
          defaultCategoryId={initialCategoryId}
          initialMinPrice={initialMinPrice}
          initialMaxPrice={initialMaxPrice}
          initialSort={initialSort}
          initialFeatures={initialFeatures}
          initialRoom={initialRoom}
          initialSale={initialSale}
          productCount={sortedProducts.length}
          pageContext={pageContext}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          selectedFeatures={selectedFeatures}
          setSelectedFeatures={setSelectedFeatures}
          selectedRoom={selectedRoom}
          setSelectedRoom={setSelectedRoom}
          saleOnly={saleOnly}
          setSaleOnly={setSaleOnly}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      {/* Products section with sorting header */}
      <div className="md:col-span-3">
        <ProductSortHeader
          productCount={sortedProducts.length}
          initialSort={sortBy}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <ProductGrid products={sortedProducts} />
      </div>
    </div>
  );
}
