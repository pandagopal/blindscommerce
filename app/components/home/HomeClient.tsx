'use client';

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, X } from 'lucide-react';

// Import enhanced components
import {
  TrustSignals,
  EnhancedHeroSection,
  EnhancedProductsSection,
  EnhancedReviewsSection,
  EnhancedRoomsSection,
  EducationalContentSection,
  RecentlyViewedSection,
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
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2 animate-slideInRight">
          <CheckCircle size={20} />
          <span className="font-medium">Login successful! Welcome back.</span>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="ml-2 hover:bg-green-600 p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Enhanced Hero Section with Video Support */}
      <EnhancedHeroSection heroBanners={transformedBanners} />

      {/* Trust Signals */}
      <TrustSignals />

      {/* Shop By Room - Enhanced with Parallax */}
      {rooms.length > 0 && (
        <EnhancedRoomsSection rooms={rooms} />
      )}

      {/* Featured Categories - Luxury Styled */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-4 mb-6">
              <span className="w-12 h-px bg-primary-red" />
              <span className="text-primary-red text-sm font-medium tracking-[0.3em] uppercase">Collections</span>
              <span className="w-12 h-px bg-primary-red" />
            </div>
            <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
              <span className="font-light">Browse</span>{' '}
              <span className="font-semibold">Categories</span>
            </h2>
            <p className="text-gray-500 text-lg font-light">Find the perfect style for your windows</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {Array.isArray(categories) && categories.map((category, index) => (
              <Link
                href={`/products?category=${category.category_id || category.id}`}
                key={category.category_id || category.id}
                className="group"
              >
                <div
                  className="relative aspect-square overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {((category.image_url || category.image) && (category.image_url || category.image)!.trim() !== '') ? (
                    <Image
                      src={category.image_url || category.image || ''}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-4xl text-gray-300">🪟</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 group-hover:from-black/90 transition-all duration-500">
                    <div>
                      <h3 className="text-white font-medium text-sm md:text-base line-clamp-2 tracking-wide group-hover:text-primary-red transition-colors duration-500">{category.name}</h3>
                    </div>
                  </div>
                  {/* Red accent line on hover */}
                  <div className="absolute bottom-0 left-0 h-1 bg-primary-red w-0 group-hover:w-full transition-all duration-700" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Style Quiz CTA Banner */}
      <StyleQuizCTA variant="banner" />

      {/* Featured Products - Enhanced with Tabs & Quick View */}
      <EnhancedProductsSection
        products={products}
        title="Featured Products"
        subtitle="Handpicked selections for your home"
      />

      {/* Customer Reviews - Enhanced with Filters & Photos */}
      {reviews.length > 0 && (
        <EnhancedReviewsSection
          reviews={reviews}
          title="What Our Customers Say"
          subtitle="Real reviews from verified buyers"
        />
      )}

      {/* Recently Viewed Products */}
      <RecentlyViewedSection />

      {/* Educational Content Section */}
      <EducationalContentSection />

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

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
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

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
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
