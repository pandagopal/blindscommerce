'use client';

import { Shield, Truck, Award, CreditCard, Clock, Headphones } from 'lucide-react';

const trustItems = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $100',
    highlight: true
  },
  {
    icon: Shield,
    title: 'Lifetime Warranty',
    description: 'Quality guaranteed',
    highlight: false
  },
  {
    icon: Clock,
    title: 'Easy Returns',
    description: '30-day return policy',
    highlight: false
  },
  {
    icon: Award,
    title: '50,000+ Customers',
    description: 'Trusted nationwide',
    highlight: false
  },
  {
    icon: CreditCard,
    title: 'Secure Payment',
    description: 'SSL encrypted checkout',
    highlight: false
  },
  {
    icon: Headphones,
    title: 'Expert Support',
    description: 'Mon-Fri 8am-8pm EST',
    highlight: false
  }
];

export default function TrustSignals() {
  return (
    <section className="bg-white py-8 border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Trust Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col items-center text-center p-4 rounded-xl transition-all duration-300 hover:shadow-md ${
                item.highlight
                  ? 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`p-3 rounded-full mb-3 ${
                item.highlight
                  ? 'bg-primary-red text-white'
                  : 'bg-blue-50 text-blue-600'
              }`}>
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Rating Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10 pt-6 border-t border-gray-100">
          {/* Google Reviews */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <div className="text-sm">
              <span className="font-bold text-gray-900">4.8</span>
              <span className="text-gray-500"> / 5</span>
              <span className="text-gray-400 text-xs ml-1">(2,450+ reviews)</span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-gray-200" />

          {/* BBB Rating */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
              A+
            </div>
            <span className="text-sm text-gray-600">BBB Accredited</span>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-gray-200" />

          {/* Secure Checkout */}
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">256-bit SSL Secure</span>
          </div>
        </div>

        {/* Payment Methods - Using text fallback since images may not exist */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-gray-400">
          <span className="text-xs uppercase tracking-wide">We Accept:</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Visa</span>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Mastercard</span>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Amex</span>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">PayPal</span>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Apple Pay</span>
          </div>
        </div>
      </div>
    </section>
  );
}
