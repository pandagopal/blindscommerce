'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, Eye, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

interface Product {
  product_id: number;
  name: string;
  slug: string;
  category_name?: string;
  category_id?: number;
  base_price: number;
  sale_price?: number;
  rating?: number;
  review_count?: number;
  primary_image_url?: string;
  short_description?: string;
  is_new?: boolean;
  is_bestseller?: boolean;
  is_on_sale?: boolean;
}

interface EnhancedProductsSectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Products' },
  { id: 'blinds', label: 'Blinds', categoryNames: ['Blinds', 'Venetian', 'Vertical', 'Roman'] },
  { id: 'shades', label: 'Shades', categoryNames: ['Shades', 'Roller', 'Cellular', 'Solar'] },
  { id: 'shutters', label: 'Shutters', categoryNames: ['Shutters', 'Plantation'] },
  { id: 'motorized', label: 'Motorized', categoryNames: ['Motorized', 'Smart', 'Remote'] }
];

export default function EnhancedProductsSection({
  products,
  title = 'Featured Products',
  subtitle = 'Handpicked selections for your home'
}: EnhancedProductsSectionProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('product_wishlist');
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  }, []);

  const toggleWishlist = useCallback((productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist(prev => {
      const newWishlist = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem('product_wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  }, []);

  // Filter products by category tab
  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter(p => {
        const tab = CATEGORY_TABS.find(t => t.id === activeTab);
        if (!tab?.categoryNames) return true;
        return tab.categoryNames.some(name =>
          p.category_name?.toLowerCase().includes(name.toLowerCase())
        );
      });

  // Carousel navigation
  const itemsPerView = isMobile ? 1 : 4;
  const maxIndex = Math.max(0, filteredProducts.length - itemsPerView);

  const nextSlide = () => setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  const prevSlide = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '/images/no-image.svg';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url;
    return `/uploads/${url}`;
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp" className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 text-lg">{subtitle}</p>
        </ScrollAnimationWrapper>

        {/* Category Tabs */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={100} className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentIndex(0);
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary-red text-white shadow-lg shadow-red-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Products Carousel/Grid */}
        <div className="relative">
          {/* Navigation Arrows */}
          {filteredProducts.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg transition-all duration-300 ${
                  currentIndex === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50 hover:shadow-xl'
                }`}
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg transition-all duration-300 ${
                  currentIndex >= maxIndex
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50 hover:shadow-xl'
                }`}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Products Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
              }}
            >
              {filteredProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`flex-shrink-0 px-2 ${
                    isMobile ? 'w-full' : 'w-1/4'
                  }`}
                >
                  <ScrollAnimationWrapper
                    animation="fadeInUp"
                    delay={index * 100}
                    className="h-full"
                  >
                    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col">
                      {/* Image Container */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <Image
                          src={getImageUrl(product.primary_image_url)}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.is_new && (
                            <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                              NEW
                            </span>
                          )}
                          {product.is_bestseller && (
                            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                              BESTSELLER
                            </span>
                          )}
                          {(product.is_on_sale || product.sale_price) && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                              SALE
                            </span>
                          )}
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setQuickViewProduct(product);
                            }}
                            className="bg-white text-gray-800 p-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg transform hover:scale-110"
                            title="Quick View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => toggleWishlist(product.product_id, e)}
                            className={`p-3 rounded-full transition-colors shadow-lg transform hover:scale-110 ${
                              wishlist.includes(product.product_id)
                                ? 'bg-red-500 text-white'
                                : 'bg-white text-gray-800 hover:bg-gray-100'
                            }`}
                            title={wishlist.includes(product.product_id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                          >
                            <Heart className={`w-5 h-5 ${wishlist.includes(product.product_id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Mobile Wishlist Button */}
                        <button
                          onClick={(e) => toggleWishlist(product.product_id, e)}
                          className={`md:hidden absolute top-3 right-3 p-2 rounded-full transition-colors ${
                            wishlist.includes(product.product_id)
                              ? 'bg-red-500 text-white'
                              : 'bg-white/90 text-gray-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${wishlist.includes(product.product_id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Content */}
                      <Link href={`/products/configure/${product.slug}`} className="flex-1 p-4 flex flex-col">
                        {/* Category */}
                        {product.category_name && (
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
                            {product.category_name}
                          </p>
                        )}

                        {/* Name */}
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {product.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(product.rating || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {product.rating?.toFixed(1) || 'N/A'}
                            {product.review_count && (
                              <span className="text-gray-400"> ({product.review_count})</span>
                            )}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="mt-auto flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${(product.sale_price || product.base_price).toFixed(2)}
                          </span>
                          {product.sale_price && product.sale_price < product.base_price && (
                            <span className="text-sm text-gray-400 line-through">
                              ${product.base_price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Configure Link */}
                        <span className="mt-3 inline-flex items-center text-sm text-blue-600 font-medium group-hover:underline">
                          Configure
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </span>
                      </Link>
                    </div>
                  </ScrollAnimationWrapper>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Dots */}
          {filteredProducts.length > itemsPerView && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-primary-red w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Link */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={300} className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            View All Products
            <ChevronRight className="w-5 h-5" />
          </Link>
        </ScrollAnimationWrapper>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          isWishlisted={wishlist.includes(quickViewProduct.product_id)}
          onToggleWishlist={() => {
            setWishlist(prev => {
              const newWishlist = prev.includes(quickViewProduct.product_id)
                ? prev.filter(id => id !== quickViewProduct.product_id)
                : [...prev, quickViewProduct.product_id];
              localStorage.setItem('product_wishlist', JSON.stringify(newWishlist));
              return newWishlist;
            });
          }}
          getImageUrl={getImageUrl}
        />
      )}
    </section>
  );
}

// Quick View Modal Component
function QuickViewModal({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist,
  getImageUrl
}: {
  product: Product;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  getImageUrl: (url: string | undefined) => string;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-1/2 aspect-square bg-gray-100">
            <Image
              src={getImageUrl(product.primary_image_url)}
              alt={product.name}
              fill
              className="object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="md:w-1/2 p-6 flex flex-col">
            {product.category_name && (
              <p className="text-sm text-blue-600 font-medium uppercase tracking-wide mb-2">
                {product.category_name}
              </p>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(product.rating || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating?.toFixed(1) || 'No ratings yet'}
                {product.review_count && ` (${product.review_count} reviews)`}
              </span>
            </div>

            {/* Description */}
            {product.short_description && (
              <p className="text-gray-600 mb-4 line-clamp-3">{product.short_description}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ${(product.sale_price || product.base_price).toFixed(2)}
              </span>
              {product.sale_price && product.sale_price < product.base_price && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ${product.base_price.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    Save ${(product.base_price - product.sale_price).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-3">
              <Link
                href={`/products/configure/${product.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary-red hover:bg-primary-red-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Configure & Buy
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                onClick={onToggleWishlist}
                className={`w-full inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-lg transition-colors border ${
                  isWishlisted
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
