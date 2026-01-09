'use client';

import { Shield, Truck, Award, CreditCard, Clock, Headphones } from 'lucide-react';

const trustItems = [
  {
    icon: Truck,
    title: 'Complimentary Shipping',
    description: 'On orders over $100'
  },
  {
    icon: Shield,
    title: 'Lifetime Warranty',
    description: 'Craftsmanship guaranteed'
  },
  {
    icon: Clock,
    title: 'Effortless Returns',
    description: '30-day satisfaction policy'
  },
  {
    icon: Award,
    title: '50,000+ Clients',
    description: 'Trusted nationwide'
  },
  {
    icon: CreditCard,
    title: 'Secure Checkout',
    description: 'SSL encrypted transactions'
  },
  {
    icon: Headphones,
    title: 'Concierge Support',
    description: 'Mon-Fri 8am-8pm EST'
  }
];

export default function TrustSignals() {
  return (
    <section className="bg-warm-gray-50 border-b border-warm-gray-200">
      <div className="container mx-auto px-4">
        {/* Trust Items - Elegant Cards with Shadow */}
        <div className="py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className="group flex flex-col items-center text-center px-4 py-6 bg-white border border-warm-gray-200 shadow-sm hover:shadow-lg hover:border-primary-red/30 transition-all duration-500 hover:-translate-y-1"
            >
              <div className="p-3 mb-3 bg-red-50 border border-red-100 group-hover:bg-primary-red group-hover:border-primary-red transition-all duration-500">
                <item.icon className="w-5 h-5 text-primary-red group-hover:text-white transition-colors duration-500" />
              </div>
              <h3 className="font-semibold text-charcoal-900 text-sm tracking-wide">{item.title}</h3>
              <p className="text-xs text-warm-gray-500 mt-1 font-light">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Rating & Credentials Bar */}
        <div className="py-6 bg-white border-t border-warm-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {/* Google Reviews */}
            <div className="flex items-center gap-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-4 h-4 text-primary-red fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-charcoal-900">4.8</span>
                <span className="text-warm-gray-400 font-light"> / 5</span>
                <span className="text-warm-gray-400 text-xs ml-2 tracking-wide">(2,450+ reviews)</span>
              </div>
            </div>

            {/* Elegant Divider */}
            <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-warm-gray-300 to-transparent" />

            {/* BBB Rating */}
            <div className="flex items-center gap-3">
              <div className="bg-primary-red text-white text-xs font-bold px-3 py-1.5 tracking-wider">
                A+
              </div>
              <span className="text-sm text-charcoal-800 font-light tracking-wide">BBB Accredited</span>
            </div>

            {/* Elegant Divider */}
            <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-warm-gray-300 to-transparent" />

            {/* Secure Checkout */}
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-red" />
              <span className="text-sm text-charcoal-800 font-light tracking-wide">256-bit SSL Secure</span>
            </div>
          </div>
        </div>

        {/* Payment Methods - Refined */}
        <div className="py-5 bg-white border-t border-warm-gray-200 flex flex-wrap items-center justify-center gap-6">
          <span className="text-xs uppercase tracking-[0.2em] text-warm-gray-400 font-medium">Accepted Payment Methods</span>
          <div className="flex items-center gap-3">
            {['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay'].map((method) => (
              <span
                key={method}
                className="text-xs font-medium text-charcoal-700 bg-warm-gray-50 px-3 py-1.5 border border-warm-gray-200 hover:border-primary-red hover:text-primary-red transition-colors duration-300"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
