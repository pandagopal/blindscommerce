'use client';

import React, { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Star, CheckCircle, X } from 'lucide-react';

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
  base_price: number;
  rating: number;
  primary_image_url?: string;
  avg_rating?: number;
}

interface Room {
  id: number;
  name: string;
  image: string;
  link: string;
}

interface Review {
  review_id: number;
  product_name: string;
  user_name: string;
  rating: number;
  title: string;
  review_text: string;
  created_at: string;
}

interface HeroBanner {
  banner_id: number;
  title: string;
  subtitle: string;
  description: string;
  background_image: string;
  right_side_image: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  display_order: number;
  is_active: boolean;
}

interface HomeClientProps {
  categories: Category[];
  products: Product[];
  rooms?: Room[];
  reviews?: Review[];
  heroBanners?: HeroBanner[];
}

export default function HomeClient({ categories, products, rooms = [], reviews = [], heroBanners = [] }: HomeClientProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const searchParams = useSearchParams();

  // Check for login success parameter
  useEffect(() => {
    if (searchParams.get('login') === 'success') {
      setShowSuccessMessage(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // State for dynamic content
  const [heroSlides, setHeroSlides] = React.useState([
    {
      id: 1,
      image: '/images/hero/hero-1.jpg',
      title: 'Custom Window Treatments',
      subtitle: 'Made to Your Exact Specifications',
      description: 'Free Shipping on Orders Over $100',
      primaryCta: { text: 'Shop Now', href: '/products' },
      secondaryCta: { text: 'Free Samples', href: '/customer/samples' }
    },
    {
      id: 2,
      image: '/images/hero/hero-2.jpg',
      title: 'Smart Motorized Blinds',
      subtitle: 'Control with Voice or App',
      description: 'Professional Installation Available',
      primaryCta: { text: 'Explore Smart Blinds', href: '/products?category=22' },
      secondaryCta: { text: 'Book Consultation', href: '/measure-install' }
    },
    {
      id: 3,
      image: '/images/hero/hero-1.jpg',
      title: 'End of Year Sale',
      subtitle: 'Save Up to 40% Off',
      description: 'Limited Time Offer - While Supplies Last',
      primaryCta: { text: 'Shop Sale', href: '/sales' },
      secondaryCta: { text: 'View All Deals', href: '/products?sale=true' }
    }
  ]);
  
  const [promoBanners, setPromoBanners] = React.useState([
    'Free Shipping on orders over $100',
    'Extra 20% off Cellular Shades',
    'Free Cordless Upgrade'
  ]);

  // Transform database hero banners to match slide format
  const dynamicSlides = heroBanners
    .filter(banner => banner.is_active) // Only show active banners
    .map(banner => ({
      id: banner.banner_id,
      image: banner.background_image || '/images/hero/hero-1.jpg',
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      primaryCta: {
        text: banner.primary_cta_text || 'Shop Now',
        href: banner.primary_cta_link || '/products'
      },
      secondaryCta: {
        text: banner.secondary_cta_text || 'Learn More',
        href: banner.secondary_cta_link || '/about'
      },
      rightSideImage: banner.right_side_image
    }));

  const slides = dynamicSlides.length > 0 ? dynamicSlides : heroSlides;

  // Auto-advance slides every 6 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Transform database rooms to match display format
  const displayRooms = Array.isArray(rooms) ? rooms.map(room => ({
    id: room.room_type_id || room.id,
    name: room.name,
    image: room.image_url || room.image || '/images/rooms/default-room.jpg',
    link: `/products?room=${room.name.toLowerCase().replace(/\s+/g, '-')}`
  })) : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right">
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

        {/* Hero Section with Multiple Slides */}
        <section className="relative h-[400px] md:h-[500px]">
          {/* Coming Soon Banner */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
              <span className="font-semibold text-2xl">Coming Soon!</span>
            </div>
          </div>
          {/* Hero Slideshow */}
          <div className="relative h-full">
            <Image
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              fill
              className="object-cover transition-all duration-1000 ease-in-out"
              priority
              quality={90}
            />
            {/* Background Overlay - adjusted for right image */}
            <div className={`absolute inset-0 ${slides[currentSlide].rightSideImage ? 'bg-gradient-to-r from-black/70 via-black/50 to-black/20' : 'bg-gradient-to-r from-black/60 via-black/40 to-transparent'}`} />
            
            {/* Right Side Image */}
            {slides[currentSlide].rightSideImage && (
              <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block">
                <Image
                  src={slides[currentSlide].rightSideImage}
                  alt="Feature image"
                  fill
                  className="object-cover"
                  quality={90}
                />
              </div>
            )}
            
            {/* Text Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className={`text-white ${slides[currentSlide].rightSideImage ? 'max-w-lg' : 'max-w-2xl'}`}>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                    {slides[currentSlide].title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-2 text-white/90">
                    {slides[currentSlide].subtitle}
                  </p>
                  <p className="text-lg mb-8 text-white/80">
                    {slides[currentSlide].description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link 
                      href={slides[currentSlide].primaryCta.href} 
                      className="bg-primary-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                    >
                      {slides[currentSlide].primaryCta.text}
                    </Link>
                    <Link 
                      href={slides[currentSlide].secondaryCta.href} 
                      className="bg-white/90 backdrop-blur hover:bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                    >
                      {slides[currentSlide].secondaryCta.text}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Manual Pagination Dots */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide ? 'bg-primary-red' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            {/* Manual Navigation Arrows */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur transition-all"
            >
              <span className="text-xl">←</span>
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur transition-all"
            >
              <span className="text-xl">→</span>
            </button>
          </div>
      </section>

      {/* Custom Hero Styles */}
      <style jsx global>{`
        .hero-swiper .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: white;
          opacity: 0.5;
          transition: all 0.3s;
        }
        
        .hero-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: var(--primary-red);
          transform: scale(1.2);
        }
        
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: white;
          background: rgba(0,0,0,0.3);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          backdrop-filter: blur(4px);
        }
        
        .hero-swiper .swiper-button-next:after,
        .hero-swiper .swiper-button-prev:after {
          font-size: 20px;
        }
        
        .hero-swiper .swiper-button-next:hover,
        .hero-swiper .swiper-button-prev:hover {
          background: rgba(0,0,0,0.5);
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Promotion Banner Strip */}
      <section className="bg-gradient-to-r from-red-500 to-primary-dark text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8">
              {promoBanners.map((banner, index) => (
                <div key={index} className={`flex items-center gap-2 ${index === 0 ? '' : index === 1 ? 'hidden md:flex' : 'hidden lg:flex'}`}>
                  <span className="font-semibold text-lg">
                    {index === 0 ? '🚚' : index === 1 ? '⚡️' : '🎉'}
                  </span>
                  <span>{banner}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute left-0 right-0 h-4 bg-gradient-to-b from-black/10 to-transparent"></div>
        </section>


        {/* Shop By Room - Only show if rooms exist */}
        {displayRooms.length > 0 && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Shop By Room</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">Find the perfect window treatments for every room in your home</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {displayRooms.map((room) => (
                  <Link href={room.link} key={room.id} className="group">
                    <div className="relative h-72 rounded-xl overflow-hidden shadow-lg">
                      <Image
                        src={room.image}
                        alt={room.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-start p-6 group-hover:from-black/80 transition-all duration-300">
                        <div>
                          <h3 className="text-white text-2xl font-semibold mb-2">{room.name}</h3>
                          <span className="text-white/90 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Shop Now →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Featured Categories */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.isArray(categories) && categories.map((category) => (
              <Link href={`/products?category=${category.category_id || category.id}`} key={category.category_id || category.id}>
                <div className="group relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  {((category.image_url || category.image) && (category.image_url || category.image)!.trim() !== '') ? (
                    <Image
                      src={category.image_url || category.image || ''}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">🪟</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="text-white text-xl font-semibold mb-2">{category.name}</h3>
                      <p className="text-white/80 text-sm">{category.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews - Moving Carousel */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="relative">
            <div className="flex gap-6 animate-scroll">
              {/* First set of reviews */}
              {Array.isArray(reviews) && reviews.length > 0 && reviews.map((review) => (
                <div key={review.review_id} className="flex-shrink-0 w-80 bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
                  <p className="text-gray-600 mb-4 line-clamp-3">&quot;{review.review_text}&quot;</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-sm">{review.user_name}</p>
                    <p className="text-xs text-gray-500">{review.product_name}</p>
                    <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {/* Duplicate set for continuous scroll */}
              {Array.isArray(reviews) && reviews.length > 0 && reviews.map((review) => (
                <div key={`dup-${review.review_id}`} className="flex-shrink-0 w-80 bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
                  <p className="text-gray-600 mb-4 line-clamp-3">&quot;{review.review_text}&quot;</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-sm">{review.user_name}</p>
                    <p className="text-xs text-gray-500">{review.product_name}</p>
                    <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.isArray(products) && products.map((product) => (
              <Link href={`/products/configure/${product.slug}`} key={product.product_id}>
                <div className="group">
                  <div className="relative h-64 rounded-lg overflow-hidden shadow-lg mb-4">
                    {product.primary_image_url && product.primary_image_url.trim() !== '' ? (
                      <>
                        <Image
                          src={
                            product.primary_image_url.startsWith('http') 
                              ? product.primary_image_url 
                              : product.primary_image_url.startsWith('/') 
                                ? product.primary_image_url 
                                : `/uploads/products/${product.primary_image_url}`
                          }
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                          }}
                          unoptimized={true}
                        />
                        <div className="hidden absolute inset-0 fallback-icon">
                          <Image
                            src="/images/no-image-found.svg"
                            alt="No image found"
                            fill
                            className="object-contain p-8"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0">
                        <Image
                          src="/images/no-image-available.svg"
                          alt="No image available"
                          fill
                          className="object-contain p-8"
                        />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-red font-bold">${product.base_price}</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{product.avg_rating || product.rating || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
