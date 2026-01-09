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
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative">
      {/* Subtle Top Border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp" className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <span className="w-12 h-px bg-primary-red" />
            <span className="text-primary-red text-sm font-medium tracking-[0.3em] uppercase">Curated Selection</span>
            <span className="w-12 h-px bg-primary-red" />
          </div>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
            <span className="font-light">{title.split(' ')[0]}</span>{' '}
            <span className="font-semibold">{title.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-gray-500 text-lg font-light max-w-xl mx-auto">{subtitle}</p>
        </ScrollAnimationWrapper>

        {/* Category Tabs - Elegant Pill Style */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={100} className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentIndex(0);
                }}
                className={`px-6 py-3 text-sm font-medium transition-all duration-500 tracking-wide ${
                  activeTab === tab.id
                    ? 'bg-primary-red text-white shadow-lg shadow-primary-red/30'
                    : 'bg-white text-gray-600 hover:text-primary-red border border-gray-200 hover:border-primary-red'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Products Carousel/Grid */}
        <div className="relative">
          {/* Navigation Arrows - Elegant Square */}
          {filteredProducts.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white border border-gray-200 shadow-lg transition-all duration-500 ${
                  currentIndex === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-primary-red hover:border-primary-red hover:text-white hover:shadow-xl'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white border border-gray-200 shadow-lg transition-all duration-500 ${
                  currentIndex >= maxIndex
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-primary-red hover:border-primary-red hover:text-white hover:shadow-xl'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Products Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
              }}
            >
              {filteredProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`flex-shrink-0 px-3 ${
                    isMobile ? 'w-full' : 'w-1/4'
                  }`}
                >
                  <ScrollAnimationWrapper
                    animation="fadeInUp"
                    delay={index * 100}
                    className="h-full"
                  >
                    <div className="group bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700 h-full flex flex-col">
                      {/* Image Container */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                        <Image
                          src={getImageUrl(product.primary_image_url)}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        />

                        {/* Badges - Elegant Style */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {product.is_new && (
                            <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 tracking-wider uppercase">
                              New
                            </span>
                          )}
                          {product.is_bestseller && (
                            <span className="bg-primary-red text-white text-xs font-medium px-3 py-1.5 tracking-wider uppercase">
                              Bestseller
                            </span>
                          )}
                          {(product.is_on_sale || product.sale_price) && (
                            <span className="bg-amber-500 text-white text-xs font-medium px-3 py-1.5 tracking-wider uppercase">
                              Sale
                            </span>
                          )}
                        </div>

                        {/* Hover Actions - Elegant Overlay */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setQuickViewProduct(product);
                            }}
                            className="bg-white text-gray-900 p-4 hover:bg-primary-red hover:text-white transition-all duration-300 shadow-lg"
                            title="Quick View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => toggleWishlist(product.product_id, e)}
                            className={`p-4 transition-all duration-300 shadow-lg ${
                              wishlist.includes(product.product_id)
                                ? 'bg-primary-red text-white'
                                : 'bg-white text-gray-900 hover:bg-primary-red hover:text-white'
                            }`}
                            title={wishlist.includes(product.product_id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                          >
                            <Heart className={`w-5 h-5 ${wishlist.includes(product.product_id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Mobile Wishlist Button */}
                        <button
                          onClick={(e) => toggleWishlist(product.product_id, e)}
                          className={`md:hidden absolute top-4 right-4 p-2.5 transition-colors ${
                            wishlist.includes(product.product_id)
                              ? 'bg-primary-red text-white'
                              : 'bg-white/90 text-gray-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${wishlist.includes(product.product_id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Content */}
                      <Link href={`/products/configure/${product.slug}`} className="flex-1 p-5 flex flex-col">
                        {/* Category */}
                        {product.category_name && (
                          <p className="text-xs text-primary-red font-medium uppercase tracking-[0.15em] mb-2">
                            {product.category_name}
                          </p>
                        )}

                        {/* Name */}
                        <h3 className="font-medium text-gray-900 group-hover:text-primary-red transition-colors line-clamp-2 mb-3 tracking-wide">
                          {product.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(product.rating || 0)
                                    ? 'text-primary-red fill-current'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400 font-light">
                            {product.rating?.toFixed(1) || 'N/A'}
                            {product.review_count && (
                              <span className="text-gray-300"> ({product.review_count})</span>
                            )}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="mt-auto flex items-baseline gap-3">
                          <span className="text-xl font-semibold text-gray-900">
                            ${(product.sale_price || product.base_price).toFixed(2)}
                          </span>
                          {product.sale_price && product.sale_price < product.base_price && (
                            <span className="text-sm text-gray-400 line-through font-light">
                              ${product.base_price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Configure Link */}
                        <span className="mt-4 inline-flex items-center text-sm text-primary-red font-medium tracking-wide group-hover:underline">
                          Configure
                          <ExternalLink className="w-3.5 h-3.5 ml-2" />
                        </span>
                      </Link>
                    </div>
                  </ScrollAnimationWrapper>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Indicators - Elegant Lines */}
          {filteredProducts.length > itemsPerView && (
            <div className="flex justify-center gap-3 mt-10">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-0.5 transition-all duration-500 ${
                    index === currentIndex
                      ? 'bg-primary-red w-10'
                      : 'bg-gray-300 w-6 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Link - Elegant Button */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={300} className="text-center mt-14">
          <Link
            href="/products"
            className="group relative inline-flex items-center gap-4 bg-gray-900 text-white font-medium px-10 py-5 overflow-hidden transition-all duration-500 hover:shadow-2xl"
          >
            <span className="relative z-10 uppercase tracking-wider text-sm">View All Products</span>
            <ChevronRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-primary-red translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
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

// Quick View Modal Component - Luxury Styled
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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-1/2 aspect-square bg-gray-50">
            <Image
              src={getImageUrl(product.primary_image_url)}
              alt={product.name}
              fill
              className="object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-3 bg-white hover:bg-primary-red hover:text-white transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="md:w-1/2 p-8 flex flex-col">
            {product.category_name && (
              <p className="text-sm text-primary-red font-medium uppercase tracking-[0.15em] mb-3">
                {product.category_name}
              </p>
            )}

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 tracking-wide">{product.name}</h2>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(product.rating || 0)
                        ? 'text-primary-red fill-current'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 font-light">
                {product.rating?.toFixed(1) || 'No ratings yet'}
                {product.review_count && ` (${product.review_count} reviews)`}
              </span>
            </div>

            {/* Description */}
            {product.short_description && (
              <p className="text-gray-600 mb-6 line-clamp-3 font-light leading-relaxed">{product.short_description}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl font-semibold text-gray-900">
                ${(product.sale_price || product.base_price).toFixed(2)}
              </span>
              {product.sale_price && product.sale_price < product.base_price && (
                <>
                  <span className="text-xl text-gray-400 line-through font-light">
                    ${product.base_price.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-primary-red uppercase tracking-wide">
                    Save ${(product.base_price - product.sale_price).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-4">
              <Link
                href={`/products/configure/${product.slug}`}
                className="w-full inline-flex items-center justify-center gap-3 bg-primary-red hover:bg-primary-dark text-white font-medium px-8 py-4 transition-all duration-500"
              >
                <span className="uppercase tracking-wider text-sm">Configure & Buy</span>
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                onClick={onToggleWishlist}
                className={`w-full inline-flex items-center justify-center gap-3 font-medium px-8 py-4 transition-all duration-500 border ${
                  isWishlisted
                    ? 'bg-red-50 border-primary-red text-primary-red'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-primary-red hover:text-primary-red'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                <span className="uppercase tracking-wider text-sm">
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
