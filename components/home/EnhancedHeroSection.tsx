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
    title: 'Transform Your Space',
    subtitle: 'Premium Custom Blinds & Shades',
    description: 'Discover our collection of custom-made window treatments, designed to perfectly fit your style and budget.',
    background_image: '/images/hero/hero-1.jpg',
    cta_primary_text: 'Shop Now',
    cta_primary_link: '/products',
    cta_secondary_text: 'Free Samples',
    cta_secondary_link: '/samples'
  },
  {
    banner_id: 2,
    title: 'Up to 50% Off',
    subtitle: 'Limited Time Sale',
    description: 'Save big on premium blinds and shades. Professional quality at factory-direct prices.',
    background_image: '/images/hero/hero-2.jpg',
    cta_primary_text: 'Shop Sale',
    cta_primary_link: '/products?sale=true',
    cta_secondary_text: 'View All',
    cta_secondary_link: '/products'
  },
  {
    banner_id: 3,
    title: 'Smart Home Ready',
    subtitle: 'Motorized Window Treatments',
    description: 'Control your blinds with voice commands. Compatible with Alexa, Google Home, and Apple HomeKit.',
    background_image: '/images/hero/hero-3.jpg',
    cta_primary_text: 'Explore Motorized',
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

  // Auto-advance slides
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
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
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gray-900">
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.banner_id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Video Background */}
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
            /* Image Background */
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

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"
            style={{ opacity: slide.overlay_opacity || 0.7 }}
          />
        </div>
      ))}

      {/* Content Container */}
      <div className="relative z-20 h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl">
          {/* Animated Text Content */}
          <div key={textAnimationKey} className="space-y-4">
            {/* Subtitle */}
            {currentBanner.subtitle && (
              <p
                className="text-primary-red font-semibold tracking-wider uppercase animate-fadeInUp"
                style={{ animationDelay: '0ms', animationFillMode: 'both' }}
              >
                {currentBanner.subtitle}
              </p>
            )}

            {/* Title */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight animate-fadeInUp"
              style={{ animationDelay: '150ms', animationFillMode: 'both' }}
            >
              {currentBanner.title}
            </h1>

            {/* Description */}
            {currentBanner.description && (
              <p
                className="text-lg md:text-xl text-gray-200 max-w-xl animate-fadeInUp"
                style={{ animationDelay: '300ms', animationFillMode: 'both' }}
              >
                {currentBanner.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div
              className="flex flex-wrap gap-4 pt-4 animate-fadeInUp"
              style={{ animationDelay: '450ms', animationFillMode: 'both' }}
            >
              {currentBanner.cta_primary_text && (
                <Link
                  href={currentBanner.cta_primary_link || '/products'}
                  className="group relative inline-flex items-center gap-2 bg-primary-red hover:bg-primary-red-dark text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                >
                  <span className="relative z-10">{currentBanner.cta_primary_text}</span>
                  <svg className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )}
              {currentBanner.cta_secondary_text && (
                <Link
                  href={currentBanner.cta_secondary_link || '/samples'}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg border border-white/30 transition-all duration-300 hover:-translate-y-1"
                >
                  {currentBanner.cta_secondary_text}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Image (optional) */}
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

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Slide Indicators with Progress */}
            <div className="flex items-center gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`relative h-1 rounded-full overflow-hidden transition-all duration-300 ${
                    index === currentSlide ? 'w-12 bg-white/30' : 'w-8 bg-white/20 hover:bg-white/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {index === currentSlide && (
                    <div
                      className="absolute inset-0 bg-white rounded-full origin-left"
                      style={{ transform: `scaleX(${progress / 100})` }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full transition-colors"
                aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Mute/Unmute (only for video) */}
              {hasVideo && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full transition-colors"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              {/* Prev/Next */}
              <button
                onClick={prevSlide}
                className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 z-30 bg-black/30 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
        {currentSlide + 1} / {slides.length}
      </div>
    </section>
  );
}
