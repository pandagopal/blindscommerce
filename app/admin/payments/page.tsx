import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PaymentDashboard from '@/components/admin/PaymentDashboard';
import { TestTube } from 'lucide-react';

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage payment methods and monitor performance</p>
        </div>
        
        <Link href="/admin/payments/test">
          <Button variant="outline" className="flex items-center space-x-2">
            <TestTube className="w-4 h-4" />
            <span>Test Payment Methods</span>
          </Button>
        </Link>
      </div>

      <PaymentDashboard />
    </div>
  );
}