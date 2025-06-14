'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPricingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to commission management since global discounts are now vendor-controlled
    router.push('/admin/pricing/commissions');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Commission Management...</h1>
        <p className="text-gray-600">
          Discount management has been moved to vendor-level control. 
          You are being redirected to commission settings.
        </p>
      </div>
    </div>
  );
}