'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Suspense } from 'react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'Order confirmed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your payment has been processed successfully.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-6 inline-block">
          <p className="text-sm text-gray-500">Order Number</p>
          <p className="text-lg font-medium text-gray-900">{orderNumber}</p>
        </div>

        <p className="text-gray-600 mb-8">
          We've sent a confirmation email with all the details of your order.
        </p>

        <div className="space-x-4">
          <Link 
            href="/account/orders" 
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl inline-block"
          >
            View Orders
          </Link>
          <Link 
            href="/" 
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl inline-block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}