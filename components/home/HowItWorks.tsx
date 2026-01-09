'use client';

import { Ruler, ShoppingCart, Wrench } from 'lucide-react';
import Link from 'next/link';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

const steps = [
  {
    number: '01',
    icon: Ruler,
    title: 'Measure',
    description: 'Use our easy guide to measure your windows accurately. Free measuring tools included.',
    link: '/guides/measuring',
    linkText: 'View Measuring Guide'
  },
  {
    number: '02',
    icon: ShoppingCart,
    title: 'Order',
    description: 'Choose your style, enter dimensions, and customize. We manufacture to your exact specs.',
    link: '/products',
    linkText: 'Browse Products'
  },
  {
    number: '03',
    icon: Wrench,
    title: 'Install',
    description: 'Simple DIY installation or book our professional installers. Most installs take under 30 mins.',
    link: '/measure-install',
    linkText: 'Installation Options'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp" className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            How It Works
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Getting custom blinds has never been easier. Three simple steps to transform your windows.
          </p>
        </ScrollAnimationWrapper>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <ScrollAnimationWrapper
              key={step.number}
              animation="fadeInUp"
              delay={index * 100}
            >
              <div className="relative text-center group">
                {/* Connector Line (hidden on mobile, visible on md+) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-red/30 to-primary-red/10" />
                )}

                {/* Step Number & Icon */}
                <div className="relative inline-flex flex-col items-center mb-6">
                  <span className="text-5xl font-bold text-gray-100 absolute -top-4 -left-4">
                    {step.number}
                  </span>
                  <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-primary-red to-rose-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>

                <Link
                  href={step.link}
                  className="inline-flex items-center text-primary-red font-medium hover:underline"
                >
                  {step.linkText}
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        {/* CTA */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={400} className="text-center mt-12">
          <p className="text-gray-500 mb-4">Need help? Our experts are here for you.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Get Free Consultation
          </Link>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}
