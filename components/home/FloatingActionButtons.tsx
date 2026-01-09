'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, Package, X, ArrowUp } from 'lucide-react';

export default function FloatingActionButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      setHasScrolled(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const actions = [
    {
      icon: Package,
      label: 'Free Samples',
      href: '/samples',
      color: 'bg-gray-800 hover:bg-gray-900'
    },
    {
      icon: Phone,
      label: 'Concierge',
      href: 'tel:1-800-BLINDS',
      color: 'bg-gray-700 hover:bg-gray-800'
    },
    {
      icon: MessageCircle,
      label: 'Live Chat',
      onClick: () => {
        // Trigger chat widget if available
        if (typeof window !== 'undefined' && (window as any).Intercom) {
          (window as any).Intercom('show');
        } else {
          window.location.href = '/contact';
        }
      },
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <>
      {/* Main FAB Group */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        {/* Scroll to Top - Elegant Square Button */}
        <button
          onClick={scrollToTop}
          className={`p-3 bg-gray-900 text-white shadow-lg transition-all duration-500 hover:bg-primary-red ${
            showScrollTop
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Action Buttons */}
        <div className={`flex flex-col items-end gap-3 transition-all duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {actions.map((action, index) => (
            action.href ? (
              <Link
                key={index}
                href={action.href}
                className={`flex items-center gap-3 px-5 py-3 ${action.color} text-white shadow-lg transition-all duration-500 hover:shadow-xl`}
                style={{
                  transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                  opacity: isOpen ? 1 : 0,
                  transitionDelay: `${index * 75}ms`
                }}
              >
                <action.icon className="w-4 h-4" />
                <span className="font-medium text-sm tracking-wide">{action.label}</span>
              </Link>
            ) : (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center gap-3 px-5 py-3 ${action.color} text-white shadow-lg transition-all duration-500 hover:shadow-xl`}
                style={{
                  transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                  opacity: isOpen ? 1 : 0,
                  transitionDelay: `${index * 75}ms`
                }}
              >
                <action.icon className="w-4 h-4" />
                <span className="font-medium text-sm tracking-wide">{action.label}</span>
              </button>
            )
          ))}
        </div>

        {/* Main Toggle Button - Elegant Square */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-4 shadow-lg transition-all duration-500 ${
            isOpen
              ? 'bg-gray-900 text-white'
              : 'bg-primary-red text-white hover:bg-primary-dark'
          } ${hasScrolled ? 'scale-100' : 'scale-90'}`}
          aria-label={isOpen ? 'Close menu' : 'Open help menu'}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-300" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Free Samples Banner (shows after scroll on mobile) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 px-6 transition-transform duration-500 md:hidden ${
          hasScrolled && !isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary-red" />
            <span className="font-medium text-sm tracking-wide">Complimentary Samples</span>
          </div>
          <Link
            href="/samples"
            className="bg-primary-red text-white font-medium px-5 py-2 text-sm tracking-wider uppercase hover:bg-primary-dark transition-colors"
          >
            Order
          </Link>
        </div>
      </div>

      {/* Overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
