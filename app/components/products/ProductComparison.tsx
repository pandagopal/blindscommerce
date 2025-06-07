'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from 'next/image';

interface ProductFeature {
  id: string;
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
  onClose: () => void;
}

export default function ProductComparison({ products, onClose }: ProductComparisonProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [comparisonData, setComparisonData] = useState<{
    specifications: string[];
    features: string[];
  }>({
    specifications: [],
    features: []
  });

  useEffect(() => {
    // Collect all unique specifications and features
    const specs = new Set<string>();
    const features = new Set<string>();

    products.forEach(product => {
      Object.keys(product.specifications).forEach(spec => specs.add(spec));
      product.features.forEach(feature => features.add(feature.name));
    });

    setComparisonData({
      specifications: Array.from(specs),
      features: Array.from(features)
    });
  }, [products]);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : products.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < products.length - 1 ? prev + 1 : 0));
  };

  const renderSpecificationValue = (product: Product, spec: string) => {
    const value = product.specifications[spec];
    return value ? (
      <span className="text-sm">{value}</span>
    ) : (
      <span className="text-sm text-gray-400">-</span>
    );
  };

  const renderFeatureValue = (product: Product, feature: string) => {
    const hasFeature = product.features.some(f => f.name === feature);
    return hasFeature ? (
      <span className="text-green-600">✓</span>
    ) : (
      <span className="text-red-600">✗</span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Compare Products</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Product Images and Basic Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={`relative ${
                    index === currentIndex ? 'ring-2 ring-primary-red' : ''
                  }`}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="mt-2">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-lg font-semibold">${product.price}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < product.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mb-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === products.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Specifications */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                {comparisonData.specifications.map(spec => (
                  <div key={spec} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{spec}</h4>
                    <div className="space-y-2">
                      {products.map(product => (
                        <div key={product.id} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-24">
                            {product.name}:
                          </span>
                          {renderSpecificationValue(product, spec)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <div className="grid grid-cols-2 gap-4">
                {comparisonData.features.map(feature => (
                  <div key={feature} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{feature}</h4>
                    <div className="space-y-2">
                      {products.map(product => (
                        <div key={product.id} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-24">
                            {product.name}:
                          </span>
                          {renderFeatureValue(product, feature)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 