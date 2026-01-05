'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ProductSortHeaderProps {
  productCount: number;
  initialSort?: string;
  sortBy?: string;
  setSortBy?: (sort: string) => void;
}

export default function ProductSortHeader({
  productCount,
  initialSort = 'recommended',
  sortBy: controlledSortBy,
  setSortBy: controlledSetSortBy
}: ProductSortHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [internalSortBy, internalSetSortBy] = useState<string>(initialSort);

  // Use controlled or internal state
  const sortBy = controlledSortBy ?? internalSortBy;
  const setSortBy = controlledSetSortBy ?? internalSetSortBy;

  // Map sort values to API parameters
  const sortToApiMapping: Record<string, { sortBy: string; sortOrder: string }> = {
    'recommended': { sortBy: 'rating', sortOrder: 'desc' },
    'price-low': { sortBy: 'price', sortOrder: 'asc' },
    'price-high': { sortBy: 'price', sortOrder: 'desc' },
    'rating': { sortBy: 'rating', sortOrder: 'desc' },
    'newest': { sortBy: 'created_at', sortOrder: 'desc' }
  };

  // Initialize from URL parameters
  useEffect(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam) {
      setSortBy(sortParam);
    }
  }, [searchParams]);

  // Handle sort change
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSortBy(value);

    // Apply sorting immediately - preserve all existing filters
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
      // Remove sort parameters when switching back to recommended
      params.delete('sort');
      params.delete('sortBy');
      params.delete('sortOrder');
    }

    // Use window.location for full page reload to ensure server component refetches
    window.location.href = `/products?${params.toString()}`;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div className="mb-4 sm:mb-0">
        <span className="text-sm text-gray-500">
          {productCount} products
        </span>
      </div>
      <div className="flex space-x-2">
        <label className="text-sm text-gray-700 mr-2" htmlFor="sort-by">
          Sort by:
        </label>
        <select
          id="sort-by"
          className="rounded border-gray-300 text-sm py-1 pr-8 pl-3"
          value={sortBy}
          onChange={handleSortChange}
        >
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </div>
  );
}