'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, Package, ChevronRight, Home } from 'lucide-react';
import { Suspense } from 'react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'Order confirmed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      {/* Hero Section with Red-Yellow Theme */}
      <div className="bg-gradient-to-r from-red-600 via-red-600 to-red-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-700/10"></div>
        <div className="relative container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl">
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
              Payment Successful!
            </h1>
            <p className="text-sm md:text-base text-white/90 mb-3 leading-relaxed">
              Thank you for your purchase. Your order has been confirmed.
            </p>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 inline-block shadow-lg">
              <p className="text-xs text-white/80 mb-1 font-medium">Order Number</p>
              <p className="text-lg font-bold text-white tracking-wide">{orderNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* What Happens Next Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What Happens Next?
          </h2>

          <div className="space-y-6">
            {/* Email Updates */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-yellow/10 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-accent-yellow" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Regular Email Updates
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You'll receive regular email notifications at every stage of your order - from processing to shipping and delivery. Check your inbox for the confirmation email we just sent.
                </p>
              </div>
            </div>

            {/* Order Tracking */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary-red" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Track Your Order
                </h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  View real-time order status, estimated delivery dates, and shipment tracking information in your customer dashboard.
                </p>
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-2 text-primary-red hover:text-primary-red-dark font-semibold transition-colors group"
                >
                  Go to Dashboard
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Order Processing */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Order Processing
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our team is already processing your order. Custom-made blinds typically ship within 5-7 business days, and you'll receive a tracking number as soon as your order ships.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/account/orders"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-semibold py-4 px-8 rounded-lg transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <Package className="h-5 w-5" />
            View Order Status
          </Link>
          <Link
            href="/"
            className="border-2 border-primary-red bg-white text-primary-red hover:bg-primary-red hover:text-white font-semibold py-4 px-8 rounded-lg transition-all shadow-sm hover:shadow-md inline-flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Continue Shopping
          </Link>
        </div>

        {/* Support Section */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-red-50 rounded-lg p-6 text-center border border-gray-200">
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Need Help?</span> Our customer support team is here for you.
          </p>
          <p className="text-gray-600">
            Email us at{' '}
            <a href="mailto:sales@smartblindshub.com" className="text-primary-red hover:text-primary-red-dark font-semibold">
              sales@smartblindshub.com
            </a>
            {' '}or call us during business hours.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
        <div className="bg-gradient-to-r from-red-600 via-red-600 to-red-700 relative overflow-hidden">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl">
                <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                Loading...
              </h1>
            </div>
          </div>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}