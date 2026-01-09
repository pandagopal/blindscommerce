'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface HeroBanner {
  banner_id: number;
  title: string;
  subtitle?: string;
  description?: string;
  background_image?: string;
  video_url?: string;
  right_side_image?: string;
  cta_primary_text?: string;
  cta_primary_link?: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
  text_color?: string;
  overlay_opacity?: number;
}

interface EnhancedHeroSectionProps {
  heroBanners: HeroBanner[];
  autoPlayInterval?: number;
}

const defaultSlides: HeroBanner[] = [
  {
    banner_id: 1,
    title: 'Elevate Your Living Space',
    subtitle: 'Bespoke Window Treatments',
    description: 'Discover our curated collection of premium custom blinds and shades, crafted to perfection.',
    background_image: '/images/hero/hero-1.jpg',
    cta_primary_text: 'Explore Collection',
    cta_primary_link: '/products',
    cta_secondary_text: 'Request Samples',
    cta_secondary_link: '/samples'
  },
  {
    banner_id: 2,
    title: 'Exclusive Savings',
    subtitle: 'Up to 50% Off Select Styles',
    description: 'Indulge in luxury at exceptional value. Premium quality meets unmatched craftsmanship.',
    background_image: '/images/hero/hero-2.jpg',
    cta_primary_text: 'Shop Sale',
    cta_primary_link: '/products?sale=true',
    cta_secondary_text: 'View All',
    cta_secondary_link: '/products'
  },
  {
    banner_id: 3,
    title: 'Intelligent Luxury',
    subtitle: 'Motorized Window Treatments',
    description: 'Seamless integration with your smart home. Voice control meets timeless elegance.',
    background_image: '/images/hero/hero-3.jpg',
    cta_primary_text: 'Discover Smart Blinds',
    cta_primary_link: '/products?category=motorized',
    cta_secondary_text: 'Learn More',
    cta_secondary_link: '/motorized'
  }
];

export default function EnhancedHeroSection({
  heroBanners,
  autoPlayInterval = 6000
}: EnhancedHeroSectionProps) {
  const slides = heroBanners.length > 0 ? heroBanners : defaultSlides;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [textAnimationKey, setTextAnimationKey] = useState(0);

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + (100 / (autoPlayInterval / 100));
      });
    }, 100);

    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
      setProgress(0);
      setTextAnimationKey(prev => prev + 1);
    }, autoPlayInterval);

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [isPlaying, slides.length, autoPlayInterval]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setProgress(0);
    setTextAnimationKey(prev => prev + 1);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const currentBanner = slides[currentSlide];
  const hasVideo = !!currentBanner.video_url;

  return (
    <section className="relative h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden bg-black">
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.banner_id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {slide.video_url ? (
            <video
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={slide.video_url} type="video/mp4" />
            </video>
          ) : (
            <div className="absolute inset-0">
              <Image
                src={slide.background_image || '/images/hero/hero-1.jpg'}
                alt={slide.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          )}

          {/* Elegant Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      ))}

      {/* Decorative Red Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-red via-red-400 to-primary-red z-20" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />

      {/* Content Container */}
      <div className="relative z-20 h-full container mx-auto px-6 lg:px-12 flex items-center">
        <div className="max-w-3xl">
          {/* Animated Text Content */}
          <div key={textAnimationKey} className="space-y-6">
            {/* Elegant Subtitle with Line */}
            {currentBanner.subtitle && (
              <div
                className="animate-fadeInUp"
                style={{ animationDelay: '0ms', animationFillMode: 'both' }}
              >
                <span className="inline-flex items-center gap-4 text-primary-red font-medium tracking-[0.3em] uppercase text-sm">
                  <span className="w-12 h-px bg-primary-red" />
                  {currentBanner.subtitle}
                </span>
              </div>
            )}

            {/* Luxurious Title */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight animate-fadeInUp"
              style={{ animationDelay: '150ms', animationFillMode: 'both' }}
            >
              {currentBanner.title.split(' ').map((word, i) => (
                <span key={i}>
                  {i === 0 ? (
                    <span className="font-semibold">{word}</span>
                  ) : (
                    <span className="font-light">{word}</span>
                  )}{' '}
                </span>
              ))}
            </h1>

            {/* Description */}
            {currentBanner.description && (
              <p
                className="text-lg md:text-xl text-white/70 max-w-xl leading-relaxed font-light animate-fadeInUp"
                style={{ animationDelay: '300ms', animationFillMode: 'both' }}
              >
                {currentBanner.description}
              </p>
            )}

            {/* Elegant CTA Buttons */}
            <div
              className="flex flex-wrap gap-5 pt-4 animate-fadeInUp"
              style={{ animationDelay: '450ms', animationFillMode: 'both' }}
            >
              {currentBanner.cta_primary_text && (
                <Link
                  href={currentBanner.cta_primary_link || '/products'}
                  className="group relative inline-flex items-center gap-3 bg-primary-red text-white font-medium px-10 py-5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/30"
                >
                  <span className="relative z-10 tracking-wider uppercase text-sm">{currentBanner.cta_primary_text}</span>
                  <svg className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                </Link>
              )}
              {currentBanner.cta_secondary_text && (
                <Link
                  href={currentBanner.cta_secondary_link || '/samples'}
                  className="group inline-flex items-center gap-3 text-white font-medium px-10 py-5 border border-white/30 hover:border-white/60 transition-all duration-500 hover:bg-white/5"
                >
                  <span className="tracking-wider uppercase text-sm">{currentBanner.cta_secondary_text}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Image */}
        {currentBanner.right_side_image && (
          <div className="hidden lg:block absolute right-0 bottom-0 w-1/2 h-full">
            <Image
              src={currentBanner.right_side_image}
              alt=""
              fill
              className="object-contain object-bottom"
            />
          </div>
        )}
      </div>

      {/* Elegant Navigation */}
      <div className="absolute bottom-12 left-0 right-0 z-30">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            {/* Slide Progress Indicators */}
            <div className="flex items-center gap-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="group relative"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className={`h-px transition-all duration-500 ${
                    index === currentSlide ? 'w-16 bg-white' : 'w-8 bg-white/30 group-hover:bg-white/50'
                  }`}>
                    {index === currentSlide && (
                      <div
                        className="h-full bg-primary-red origin-left"
                        style={{ transform: `scaleX(${progress / 100})` }}
                      />
                    )}
                  </div>
                  <span className={`absolute -top-6 left-0 text-xs font-medium transition-opacity ${
                    index === currentSlide ? 'text-white opacity-100' : 'text-white/50 opacity-0 group-hover:opacity-100'
                  }`}>
                    0{index + 1}
                  </span>
                </button>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 border border-white/20 hover:border-primary-red hover:bg-primary-red text-white/70 hover:text-white transition-all duration-300"
                aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {hasVideo && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 border border-white/20 hover:border-primary-red hover:bg-primary-red text-white/70 hover:text-white transition-all duration-300"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              <div className="w-px h-6 bg-white/20 mx-2" />

              <button
                onClick={prevSlide}
                className="p-3 border border-white/20 hover:border-primary-red hover:bg-primary-red text-white/70 hover:text-white transition-all duration-300"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="p-3 border border-white/20 hover:border-primary-red hover:bg-primary-red text-white/70 hover:text-white transition-all duration-300"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Slide Counter */}
      <div className="absolute top-8 right-8 z-30 flex items-baseline gap-1 text-white">
        <span className="text-3xl font-light">0{currentSlide + 1}</span>
        <span className="text-white/40 text-sm">/ 0{slides.length}</span>
      </div>
    </section>
  );
}
