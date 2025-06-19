'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronRight, Truck, Shield, Palette } from 'lucide-react';

// Dynamically import Swiper to avoid SSR issues
const Swiper = dynamic(() => import('swiper/react').then(mod => mod.Swiper), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 animate-pulse" />
});

const SwiperSlide = dynamic(() => import('swiper/react').then(mod => mod.SwiperSlide), {
  ssr: false
});

export default function HeroSection() {
  const [swiperModules, setSwiperModules] = React.useState<any>(null);

  // Import Swiper CSS and modules dynamically
  React.useEffect(() => {
    const loadSwiper = async () => {
      await import('swiper/css');
      await import('swiper/css/navigation');
      await import('swiper/css/pagination');
      await import('swiper/css/effect-fade');
      
      const { Autoplay, Navigation, Pagination, EffectFade } = await import('swiper/modules');
      setSwiperModules([Autoplay, Navigation, Pagination, EffectFade]);
    };
    
    loadSwiper();
  }, []);

  const slides = [
    {
      id: 1,
      image: '/images/hero/hero-1.jpg',
      title: 'Custom Window Treatments',
      subtitle: 'Made to Your Exact Specifications',
      description: 'Free Shipping on Orders Over $100',
      cta: {
        primary: { text: 'Shop Now', href: '/products' },
        secondary: { text: 'Free Samples', href: '/customer/samples' }
      }
    },
    {
      id: 2,
      image: '/images/hero/hero-2.jpg',
      title: 'Smart Motorized Blinds',
      subtitle: 'Control with Voice or App',
      description: 'Professional Installation Available',
      cta: {
        primary: { text: 'Explore Smart Blinds', href: '/products?category=22' },
        secondary: { text: 'Book Consultation', href: '/consultation' }
      }
    },
    {
      id: 3,
      image: '/images/hero/hero-3.jpg',
      title: 'End of Year Sale',
      subtitle: 'Save Up to 40% Off',
      description: 'Limited Time Offer - While Supplies Last',
      cta: {
        primary: { text: 'Shop Sale', href: '/sales' },
        secondary: { text: 'View All Deals', href: '/products?sale=true' }
      }
    }
  ];

  const features = [
    { icon: <Truck className="w-5 h-5" />, text: 'Free Shipping Over $100' },
    { icon: <Shield className="w-5 h-5" />, text: 'Lifetime Warranty' },
    { icon: <Palette className="w-5 h-5" />, text: 'Free Design Consultation' }
  ];

  return (
    <section className="relative">
      {/* Hero Slider */}
      <div className="relative h-[500px] md:h-[600px] lg:h-[700px]">
        {swiperModules ? (
          <Swiper
            modules={swiperModules}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 6000, disableOnInteraction: false }}
            effect="fade"
            loop={true}
            className="h-full hero-swiper"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="relative h-full">
                  {/* Background Image */}
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    priority={slide.id === 1}
                    quality={90}
                  />
                  
                  {/* Gradient Overlay - More subtle */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-4">
                      <div className="max-w-2xl">
                        {/* Main Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                          {slide.title}
                        </h1>
                        
                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-white/90 mb-2">
                          {slide.subtitle}
                        </p>
                        
                        {/* Description */}
                        <p className="text-lg text-white/80 mb-8">
                          {slide.description}
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-wrap gap-4">
                          <Link 
                            href={slide.cta.primary.href}
                            className="inline-flex items-center gap-2 bg-primary-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                          >
                            {slide.cta.primary.text}
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                          <Link 
                            href={slide.cta.secondary.href}
                            className="inline-flex items-center gap-2 bg-white/90 backdrop-blur hover:bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                          >
                            {slide.cta.secondary.text}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="h-full bg-gray-100 animate-pulse" />
        )}
      </div>

      {/* Features Bar */}
      <div className="bg-gray-900 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm md:text-base">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                {feature.icon}
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
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
    </section>
  );
}