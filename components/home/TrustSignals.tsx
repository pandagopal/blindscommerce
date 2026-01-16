'use client';

import { Shield, Truck, Award, CreditCard, Clock, Headphones } from 'lucide-react';

const trustItems = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On eligible orders',
    gradient: 'from-red-500 to-rose-600'
  },
  {
    icon: Shield,
    title: 'Lifetime Warranty',
    description: 'Quality guaranteed',
    gradient: 'from-orange-500 to-amber-600'
  },
  {
    icon: Clock,
    title: 'Easy Returns',
    description: '30-day return policy',
    gradient: 'from-amber-500 to-yellow-600'
  },
  {
    icon: Award,
    title: '50,000+ Customers',
    description: 'Trusted nationwide',
    gradient: 'from-rose-500 to-pink-600'
  },
  {
    icon: CreditCard,
    title: 'Secure Payment',
    description: 'SSL encrypted checkout',
    gradient: 'from-red-600 to-rose-700'
  },
  {
    icon: Headphones,
    title: 'Expert Support',
    description: 'Mon-Fri 8am-8pm EST',
    gradient: 'from-orange-600 to-red-600'
  }
];

export default function TrustSignals() {
  return (
    <section className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Trust Items Grid */}
        <div className="py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className="group flex flex-col items-center text-center p-5 bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-500 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-red/10"
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg mb-3 group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white text-base">{item.title}</h3>
              <p className="text-sm text-white/80 mt-1">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Rating Badges */}
        <div className="py-6 bg-white/5 backdrop-blur-sm border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* Google Reviews */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-bold text-white">4.8</span>
                <span className="text-white/50"> / 5</span>
                <span className="text-white/40 text-xs ml-1">(2,450+ reviews)</span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent" />

            {/* BBB Rating */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded shadow-lg">
                A+
              </div>
              <span className="text-sm text-white/80">BBB Accredited</span>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent" />

            {/* Secure Checkout */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded shadow-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-white/80">256-bit SSL Secure</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="py-5 bg-white/5 border-t border-white/10 flex flex-wrap items-center justify-center gap-4">
          <span className="text-xs uppercase tracking-wide text-white/40">We Accept:</span>
          <div className="flex items-center gap-2">
            {[
              { name: 'Visa', color: 'from-blue-600 to-blue-700' },
              { name: 'Mastercard', color: 'from-red-500 to-orange-500' },
              { name: 'Amex', color: 'from-blue-500 to-cyan-600' },
              { name: 'PayPal', color: 'from-blue-600 to-blue-800' },
              { name: 'Apple Pay', color: 'from-gray-700 to-gray-900' }
            ].map((method) => (
              <span
                key={method.name}
                className={`text-xs font-semibold text-white bg-gradient-to-r ${method.color} px-3 py-1.5 rounded shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer`}
              >
                {method.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
