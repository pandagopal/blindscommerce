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
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Phone,
      label: 'Call Us',
      href: 'tel:1-800-BLINDS',
      color: 'bg-green-500 hover:bg-green-600'
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
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <>
      {/* Main FAB Group */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Scroll to Top */}
        <button
          onClick={scrollToTop}
          className={`p-3 bg-gray-800 text-white rounded-full shadow-lg transition-all duration-300 ${
            showScrollTop
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Action Buttons */}
        <div className={`flex flex-col items-end gap-2 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {actions.map((action, index) => (
            action.href ? (
              <Link
                key={index}
                href={action.href}
                className={`flex items-center gap-3 px-4 py-3 ${action.color} text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl`}
                style={{
                  transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                  opacity: isOpen ? 1 : 0,
                  transitionDelay: `${index * 50}ms`
                }}
              >
                <action.icon className="w-5 h-5" />
                <span className="font-medium text-sm whitespace-nowrap">{action.label}</span>
              </Link>
            ) : (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center gap-3 px-4 py-3 ${action.color} text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl`}
                style={{
                  transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                  opacity: isOpen ? 1 : 0,
                  transitionDelay: `${index * 50}ms`
                }}
              >
                <action.icon className="w-5 h-5" />
                <span className="font-medium text-sm whitespace-nowrap">{action.label}</span>
              </button>
            )
          ))}
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-4 rounded-full shadow-lg transition-all duration-300 ${
            isOpen
              ? 'bg-gray-800 text-white rotate-45'
              : 'bg-primary-red text-white hover:bg-primary-red-dark'
          } ${hasScrolled ? 'scale-100' : 'scale-90'}`}
          aria-label={isOpen ? 'Close menu' : 'Open help menu'}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Free Samples Banner (shows after scroll) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 transition-transform duration-500 md:hidden ${
          hasScrolled && !isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="font-medium text-sm">Get Free Samples</span>
          </div>
          <Link
            href="/samples"
            className="bg-white text-blue-600 font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-gray-100 transition-colors"
          >
            Order Now
          </Link>
        </div>
      </div>

      {/* Overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
