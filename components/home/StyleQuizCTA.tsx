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
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <h3 className="text-xl font-bold mb-2">Find Your Perfect Style</h3>
            <p className="text-white/80 text-sm mb-4">
              Take our quick quiz and get personalized blind recommendations.
            </p>

            <ul className="space-y-2 mb-6">
              {QUIZ_BENEFITS.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-white/90">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  {benefit}
                </li>
              ))}
            </ul>

            <Link
              href="/style-quiz"
              className="inline-flex items-center gap-2 bg-white text-purple-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              Start Quiz
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </ScrollAnimationWrapper>
    );
  }

  // Banner variant
  return (
    <section className="py-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm-6 60v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm-6 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm12-60v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-3 h-3 bg-white/30 rounded-full animate-float" />
      <div className="absolute top-1/3 right-20 w-2 h-2 bg-white/20 rounded-full animate-float-delayed" />
      <div className="absolute bottom-1/4 left-1/4 w-4 h-4 bg-white/20 rounded-full animate-float" />

      <div className="container mx-auto px-4 relative z-10">
        <ScrollAnimationWrapper animation="fadeInUp">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Content */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                Style Quiz
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Not Sure Where to Start?
              </h2>
              <p className="text-lg text-white/80 max-w-xl">
                Take our 2-minute style quiz and discover the perfect blinds for your home.
                Get personalized recommendations based on your preferences.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/style-quiz"
                className="inline-flex items-center gap-3 bg-white text-purple-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              >
                <span>Find My Style</span>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
              <p className="text-white/60 text-sm">
                Takes only 2 minutes
              </p>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
