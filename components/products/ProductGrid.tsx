'use client';

import React from 'react';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: any[];
  searchTerm: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, searchTerm }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {searchTerm.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Products
        </h1>
        <p className="text-gray-600">Found {products.length} products</p>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">All Prices</option>
              <option value="0-50">$0 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-200">$100 - $200</option>
              <option value="200+">$200+</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">All Brands</option>
              {[...new Set(products.map(p => p.brand_name).filter(Boolean))].map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">All Categories</option>
              {[...new Set(products.map(p => p.category_name).filter(Boolean))].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="name">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
