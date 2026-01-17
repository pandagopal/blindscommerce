'use client';

import { Shield, Truck, Award, Clock, Headphones, Star } from 'lucide-react';

const trustItems = [
  { icon: Truck, text: 'Free Shipping on eligible orders' },
  { icon: Award, text: '5000+ Happy Customers' },
  { icon: Headphones, text: 'Expert Support' }
];

export default function TrustSignalsBar() {
  return (
    <section className="bg-primary-red py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 text-accent-yellow fill-current" />
              ))}
            </div>
            <span className="text-white text-sm font-medium">4.8/5</span>
            <span className="text-white/70 text-sm">(450+ reviews)</span>
          </div>

          <div className="hidden md:block w-px h-4 bg-white/30" />

          {/* Trust Items */}
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-white text-sm">
              <item.icon className="w-4 h-4 text-accent-yellow" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
