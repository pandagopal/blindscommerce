import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductFeature {
  name: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  features: ProductFeature[];
  specifications: Record<string, string>;
}

interface ProductComparisonProps {
  products: Product[];
  onRemoveProduct: (productId: string) => void;
  onAddToCart: (productId: string) => void;
}

export default function ProductComparison({
  products,
  onRemoveProduct,
  onAddToCart
}: ProductComparisonProps) {
  // Get all unique specification keys across all products
  const allSpecifications = Array.from(
    new Set(
      products.flatMap(product => Object.keys(product.specifications))
    )
  ).sort();

  return (
    <div className="border rounded-lg shadow-sm">
      <ScrollArea className="w-full overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
            {products.map((product) => (
              <div key={product.id} className="p-4 border-b">
                <div className="relative">
                  <button
                    onClick={() => onRemoveProduct(product.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                  >
                    ×
                  </button>
                  <div className="aspect-square rounded-lg overflow-hidden mb-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1">{product.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => onAddToCart(product.id)}
                    className="w-full"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="border-b">
            <div className="bg-gray-50 p-4 font-semibold">
              Features
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
              {products.map((product) => (
                <div key={product.id} className="p-4 space-y-4">
                  {product.features.map((feature, index) => (
                    <div key={index}>
                      <h4 className="font-medium text-sm">{feature.name}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Specifications Comparison */}
          <div>
            <div className="bg-gray-50 p-4 font-semibold">
              Specifications
            </div>
            {allSpecifications.map((spec) => (
              <div
                key={spec}
                className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] border-b last:border-b-0"
              >
                {products.map((product) => (
                  <div key={product.id} className="p-4">
                    <div className="font-medium text-sm mb-1">{spec}</div>
                    <div className="text-sm text-gray-600">
                      {product.specifications[spec] || '—'}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
} 