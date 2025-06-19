'use client';

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { Star } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
}

interface Product {
  product_id: number;
  name: string;
  slug: string;
  category_name: string;
  base_price: number;
  rating: number;
  primary_image: string;
}

interface Room {
  id: number;
  name: string;
  image: string;
  link: string;
}

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  date: string;
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

  // Use dynamic hero banners or fallback to default slides
  const defaultSlides = [
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
  ];

  // Transform database hero banners to match slide format
  const dynamicSlides = heroBanners.map(banner => ({
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

  const slides = dynamicSlides.length > 0 ? dynamicSlides : defaultSlides;

  // Auto-advance slides every 6 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Fallback rooms if none provided (only for graceful degradation)
  const defaultRooms = [
    { id: 1, name: 'Living Room', image: '/images/rooms/living-room.jpg', link: '/rooms?type=living-room' },
    { id: 2, name: 'Bedroom', image: '/images/rooms/bedroom.jpg', link: '/rooms?type=bedroom' },
    { id: 3, name: 'Kitchen', image: '/images/rooms/kitchen.jpg', link: '/rooms?type=kitchen' },
    { id: 4, name: 'Bathroom', image: '/images/rooms/bathroom.jpg', link: '/rooms?type=bathroom' }
  ];

  const displayRooms = rooms.length > 0 ? rooms : defaultRooms;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Hero Section with Multiple Slides */}
        <section className="relative h-[400px] md:h-[500px]">
          {/* Coming Soon Banner */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
              <span className="font-semibold text-sm">Coming Soon!</span>
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
          background: #CC2229;
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
      `}</style>

      {/* Promotion Banner Strip */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">🚚 Free Shipping</span>
                <span>on orders over $100</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="font-semibold text-lg">⚡️ Flash Sale</span>
                <span>Extra 20% off Cellular Shades</span>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <span className="font-semibold text-lg">🎉 Limited Time</span>
                <span>Free Cordless Upgrade</span>
              </div>
            </div>
          </div>
          <div className="absolute left-0 right-0 h-4 bg-gradient-to-b from-black/10 to-transparent"></div>
        </section>


        {/* Shop By Room */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Shop By Room</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Find the perfect window treatments for every room in your home</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.isArray(displayRooms) && displayRooms.map((room, index) => (
                <Link href={room.link} key={index} className="group">
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

      {/* Featured Categories */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.isArray(categories) && categories.map((category) => (
              <Link href={`/products?category=${category.id}`} key={category.id}>
                <div className="group relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  {category.image && category.image.trim() !== '' ? (
                    <Image
                      src={category.image}
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

      {/* Customer Reviews */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(reviews) && reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">&quot;{review.text}&quot;</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{review.author}</span>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.isArray(products) && products.map((product) => (
              <Link href={`/products/configure/${product.slug}`} key={product.product_id}>
                <div className="group">
                  <div className="relative h-64 rounded-lg overflow-hidden shadow-lg mb-4">
                    {product.primary_image && product.primary_image.trim() !== '' ? (
                      <Image
                        src={product.primary_image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl text-gray-400">📦</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-red font-bold">${product.base_price}</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
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
