import { Metadata } from 'next';
import MeasurementCalculator from '@/components/tools/MeasurementCalculator';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Window Measurement Calculator | Smart Blinds Hub',
  description: 'Calculate the perfect blind sizes for your windows with our professional measurement tool. Get accurate sizing for both inside and outside mount options.',
};

export default function MeasurementCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back to products link */}
        <Link
          href="/products"
          className="inline-flex items-center text-primary-red hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Link>

        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Window Measurement Calculator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get accurate blind measurements for your windows. Our calculator helps you determine the perfect size for both inside and outside mount installations.
          </p>
        </div>

        {/* Calculator component */}
        <MeasurementCalculator />

        {/* Additional resources */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Need Help Measuring?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Watch our step-by-step video guide on how to measure your windows accurately.
            </p>
            <Link
              href="/guides/how-to-measure"
              className="text-primary-red hover:underline text-sm font-medium"
            >
              View Measurement Guide →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Professional Measurement</h3>
            <p className="text-gray-600 text-sm mb-4">
              Book a professional to measure your windows for you. Service available in most areas.
            </p>
            <Link
              href="/services/professional-measurement"
              className="text-primary-red hover:underline text-sm font-medium"
            >
              Book Measurement Service →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Common Questions</h3>
            <p className="text-gray-600 text-sm mb-4">
              Find answers to frequently asked questions about measuring and installing blinds.
            </p>
            <Link
              href="/faq/measuring"
              className="text-primary-red hover:underline text-sm font-medium"
            >
              View FAQs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}