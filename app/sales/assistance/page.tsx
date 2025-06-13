import { Metadata } from 'next';
import AssistanceDashboard from '@/components/sales/AssistanceDashboard';

export const metadata: Metadata = {
  title: 'Customer Assistance Dashboard | Sales',
  description: 'Manage customer assistance requests and support sessions',
};

export default function SalesAssistancePage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Assistance</h1>
        <p className="text-gray-600 mt-2">
          Manage customer assistance requests, view carts, and provide support
        </p>
      </div>
      
      <AssistanceDashboard />
    </div>
  );
}