'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

interface StyleQuizCTAProps {
  variant?: 'banner' | 'card';
}

const QUIZ_BENEFITS = [
  'Personalized recommendations',
  'Takes only 2 minutes',
  'Save your style profile'
];

export default function StyleQuizCTA({ variant = 'banner' }: StyleQuizCTAProps) {
  if (variant === 'card') {
    return (
      <ScrollAnimationWrapper animation="fadeInUp">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-none p-8 text-white relative overflow-hidden border-l-4 border-primary-red">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-red/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-red/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="w-14 h-14 bg-primary-red/20 border border-primary-red/30 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6 text-primary-red" />
            </div>

            <h3 className="text-2xl font-light mb-2 tracking-wide">Find Your <span className="font-semibold">Perfect Style</span></h3>
            <p className="text-white/60 text-sm mb-5 font-light leading-relaxed">
              Take our curated quiz and receive personalized blind recommendations tailored to your aesthetic.
            </p>

            <ul className="space-y-2.5 mb-6">
              {QUIZ_BENEFITS.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle className="w-4 h-4 text-primary-red" />
                  <span className="font-light">{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/style-quiz"
              className="group inline-flex items-center gap-3 bg-primary-red text-white font-medium px-6 py-3 hover:bg-primary-dark transition-all duration-500"
            >
              <span className="uppercase text-sm tracking-wider">Start Quiz</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </ScrollAnimationWrapper>
    );
  }

  // Banner variant - Luxurious Red Theme
  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Red Accent Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-red to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23da0530' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute top-1/4 left-20 w-2 h-2 bg-primary-red/40 rounded-full animate-float" />
      <div className="absolute top-1/3 right-32 w-1.5 h-1.5 bg-primary-red/30 rounded-full animate-float-delayed" />
      <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-primary-red/20 rounded-full animate-float" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <ScrollAnimationWrapper animation="fadeInUp">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Content */}
            <div className="text-center md:text-left max-w-2xl">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="w-12 h-px bg-primary-red" />
                <span className="text-primary-red text-sm font-medium tracking-[0.3em] uppercase">Style Quiz</span>
              </div>
              <h2 className="text-4xl md:text-5xl text-white mb-4 leading-tight">
                <span className="font-light">Not Sure</span>{' '}
                <span className="font-semibold">Where to Start?</span>
              </h2>
              <p className="text-lg text-white/50 max-w-xl font-light leading-relaxed">
                Take our 2-minute style quiz and discover the perfect blinds for your home.
                Receive personalized recommendations crafted for your unique aesthetic.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center md:items-end gap-4">
              <Link
                href="/style-quiz"
                className="group relative inline-flex items-center gap-4 bg-primary-red text-white font-medium px-10 py-5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary-red/30"
              >
                <span className="relative z-10 uppercase tracking-wider text-sm">Find My Style</span>
                <div className="relative z-10 w-10 h-10 border border-white/30 flex items-center justify-center group-hover:border-white/60 transition-colors duration-500">
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="absolute inset-0 bg-primary-dark translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </Link>
              <p className="text-white/40 text-sm font-light tracking-wide">
                Takes only 2 minutes
              </p>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
