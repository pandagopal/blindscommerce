'use client';

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, X } from 'lucide-react';

// Import enhanced components
import {
  TrustSignalsBar,
  HowItWorks,
  EnhancedHeroSection,
  EnhancedProductsSection,
  EnhancedReviewsSection,
  EnhancedRoomsSection,
  StyleQuizCTA,
  FloatingActionButtons
} from '@/components/home';

interface Category {
  id?: number;
  category_id?: number;
  name: string;
  slug: string;
  image?: string;
  image_url?: string;
  description?: string;
}

interface Product {
  product_id: number;
  name: string;
  slug: string;
  category_name: string;
  category_id?: number;
  base_price: number;
  rating: number;
  review_count?: number;
  primary_image_url?: string;
  short_description?: string;
  avg_rating?: number;
  is_new?: boolean;
  is_bestseller?: boolean;
  is_on_sale?: boolean;
  sale_price?: number;
}

interface Room {
  room_type_id?: number;
  id?: number;
  name: string;
  image?: string;
  image_url?: string;
  link?: string;
  description?: string;
  product_count?: number;
}

interface Review {
  review_id: number;
  product_name: string;
  user_name: string;
  rating: number;
  title: string;
  review_text: string;
  created_at: string;
  verified_purchase?: boolean;
  helpful_count?: number;
  images?: string[];
}

interface HeroBanner {
  banner_id: number;
  title: string;
  subtitle: string;
  description: string;
  background_image: string;
  video_url?: string;
  right_side_image: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  display_order: number;
  is_active: boolean;
  text_color?: string;
  overlay_opacity?: number;
}

interface HomeClientProps {
  categories: Category[];
  products: Product[];
  rooms?: Room[];
  reviews?: Review[];
  heroBanners?: HeroBanner[];
}

export default function HomeClient({
  categories,
  products,
  rooms = [],
  reviews = [],
  heroBanners = []
}: HomeClientProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const searchParams = useSearchParams();

  // Check for login success parameter
  useEffect(() => {
    if (searchParams.get('login') === 'success') {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchParams]);

  // Transform hero banners for the enhanced component
  const transformedBanners = heroBanners
    .filter(banner => banner.is_active)
    .map(banner => ({
      banner_id: banner.banner_id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      background_image: banner.background_image,
      video_url: banner.video_url,
      right_side_image: banner.right_side_image,
      cta_primary_text: banner.primary_cta_text,
      cta_primary_link: banner.primary_cta_link,
      cta_secondary_text: banner.secondary_cta_text,
      cta_secondary_link: banner.secondary_cta_link,
      text_color: banner.text_color,
      overlay_opacity: banner.overlay_opacity
    }));

  return (
    <main className="min-h-screen bg-white">
      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 shadow-lg flex items-center space-x-2 animate-slideInRight">
          <CheckCircle size={20} />
          <span className="font-medium">Login successful! Welcome back.</span>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="ml-2 hover:bg-green-600 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. HERO - Clear value proposition */}
      <EnhancedHeroSection heroBanners={transformedBanners} />

      {/* 2. TRUST SIGNALS BAR - Condensed single row */}
      <TrustSignalsBar />

      {/* 3. SHOP BY ROOM - Visual inspiration */}
      {rooms.length > 0 && (
        <EnhancedRoomsSection
          rooms={rooms}
          title="Shop by Room"
          subtitle="Find the perfect blinds for every space in your home"
        />
      )}

      {/* 4. FEATURED PRODUCTS - Immediate shopping (most important) */}
      <EnhancedProductsSection
        products={products}
        title="Featured Products"
        subtitle="Starting from $29 - Factory direct prices, premium quality"
      />

      {/* 5. HOW IT WORKS - Reduce purchase anxiety */}
      <HowItWorks />

      {/* 6. SHOP BY CATEGORY - Single browsing method */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Shop by Style</h2>
            <p className="text-gray-600 text-lg">Find the perfect window treatment for your space</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.isArray(categories) && categories.map((category, index) => (
              <Link
                href={`/products?category=${category.category_id || category.id}`}
                key={category.category_id || category.id}
                className="group"
              >
                <div
                  className="relative aspect-square overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {((category.image_url || category.image) && (category.image_url || category.image)!.trim() !== '') ? (
                    <Image
                      src={category.image_url || category.image || ''}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">🪟</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4 group-hover:from-black/80 transition-all">
                    <div>
                      <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2">{category.name}</h3>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Categories Link */}
          <div className="text-center mt-8">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-primary-red hover:text-primary-dark font-semibold transition-colors"
            >
              View All Categories
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS - Social proof */}
      {reviews.length > 0 && (
        <EnhancedReviewsSection
          reviews={reviews}
          title="What Our Customers Say"
          subtitle="Join 50,000+ satisfied customers"
        />
      )}

      {/* 8. STYLE QUIZ CTA - For undecided visitors */}
      <StyleQuizCTA variant="banner" />

      {/* Floating Action Buttons */}
      <FloatingActionButtons />

      {/* Custom Animations CSS */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes shine {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
          animation-delay: 1s;
        }

        /* Hide scrollbar for carousel */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Line clamp utilities */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}
