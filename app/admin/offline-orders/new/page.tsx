'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import OfflineOrderForm from '@/components/offline-orders/OfflineOrderForm';

export default function NewOfflineOrderPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/offline-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Offline Order</h1>
          <p className="text-gray-600 mt-1">Create a new offline order for a customer</p>
        </div>
      </div>

      {/* Order Form */}
      <OfflineOrderForm />
    </div>
  );
}