'use client';

import { formatPrice } from '@/lib/utils/priceUtils';
import Image from 'next/image';

interface OrderItem {
  order_item_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  sku: string;
  image_url: string;
  product_options?: any;
}

interface OrderData {
  order_id: number;
  order_number: string;
  user_id: number;
  status: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  currency: string;
  shipping_address_id?: number;
  billing_address_id?: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  items: OrderItem[];
}

interface OrderInvoiceProps {
  order: OrderData;
}

export default function OrderInvoice({ order }: OrderInvoiceProps) {
  const formatOptionKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  return (
    <div className="invoice-container bg-white p-8 max-w-5xl mx-auto">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-container, .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <Image
            src="/images/logo/SmartBlindsLogo.png"
            alt="Smart Blinds Hub"
            width={180}
            height={60}
            className="mb-4"
          />
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Smart Blinds Hub</p>
            <p>1234 Commerce Street</p>
            <p>City, State 12345</p>
            <p>Phone: (316) 530-2635</p>
            <p>Email: sales@smartblindshub.com</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <div className="text-sm">
            <p className="mb-1"><span className="font-semibold">Invoice #:</span> {order.order_number}</p>
            <p className="mb-1"><span className="font-semibold">Date:</span> {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="mb-1"><span className="font-semibold">Status:</span> <span className="capitalize">{order.status}</span></p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Bill To:</h2>
        <div className="text-sm text-gray-700">
          <p className="font-semibold">{order.first_name} {order.last_name}</p>
          <p>{order.email}</p>
          {order.phone && <p>{order.phone}</p>}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Item</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">SKU</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Qty</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Unit Price</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.order_item_id} className="border-b border-gray-200">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{item.product_name}</div>
                  {item.product_options && (
                    <div className="text-xs text-gray-600 mt-1">
                      {typeof item.product_options === 'object' && Object.entries(item.product_options).slice(0, 4).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {formatOptionKey(key)}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{item.sku}</td>
                <td className="py-3 px-4 text-center text-sm">{item.quantity}</td>
                <td className="py-3 px-4 text-right text-sm">{formatPrice(item.unit_price)}</td>
                <td className="py-3 px-4 text-right font-medium">{formatPrice(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between py-2 text-sm text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Shipping:</span>
            <span className="font-medium">{formatPrice(order.shipping_amount)}</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Tax:</span>
            <span className="font-medium">{formatPrice(order.tax_amount)}</span>
          </div>
          <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-300 mt-2">
            <span>Total:</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
        <div className="text-sm text-gray-700">
          <p><span className="font-medium">Payment Method:</span> <span className="capitalize">{order.payment_method}</span></p>
          <p><span className="font-medium">Payment Status:</span> <span className="capitalize">{order.payment_status}</span></p>
        </div>
      </div>

      {/* Warranty Information */}
      <div className="mb-8 p-6 border-2 border-red-200 rounded-lg bg-red-50">
        <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center">
          <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-2"></span>
          Warranty Information
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-semibold">Your products are covered by our comprehensive warranty:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>Lifetime Warranty:</strong> Available on select premium products (wood shutters)</li>
            <li><strong>10-Year Limited Warranty:</strong> Standard coverage on most window treatments</li>
            <li><strong>5-Year Basic Warranty:</strong> Covers manufacturing defects and materials</li>
          </ul>
          <p className="mt-3"><strong>What's Covered:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Manufacturing defects and material breakdown</li>
            <li>Operating mechanism and hardware failures</li>
            <li>Installation-related issues (when installed by our certified team)</li>
            <li>Color fading under normal indoor use conditions</li>
          </ul>
          <p className="mt-3 text-xs text-gray-600">
            <strong>Not Covered:</strong> Normal wear from daily use, damage from pets/children, improper cleaning, modifications, or extreme weather damage.
          </p>
          <p className="mt-2 text-xs">
            To file a warranty claim, contact us at <strong>(316) 530-2635</strong> or <strong>warranty@smartblindshub.com</strong>
          </p>
        </div>
      </div>

      {/* Return Policy */}
      <div className="mb-8 p-6 border-2 border-yellow-200 rounded-lg bg-yellow-50">
        <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center">
          <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
          Return & Exchange Policy
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-semibold">We want you to love your purchase! Returns and exchanges accepted within 30 days.</p>

          <p className="mt-3"><strong>Return Eligibility:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Products must be in original, unopened packaging</li>
            <li>Custom-made items may be subject to a 20% restocking fee</li>
            <li>Motorized products must include all original accessories and packaging</li>
            <li>Defective or damaged items: Full refund with no restocking fee</li>
          </ul>

          <p className="mt-3"><strong>Return Process:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>Step 1:</strong> Contact customer service at <strong>sales@smartblindshub.com</strong></li>
            <li><strong>Step 2:</strong> Receive return authorization and shipping label</li>
            <li><strong>Step 3:</strong> Ship items back in original packaging</li>
            <li><strong>Step 4:</strong> Refund processed within 5-7 business days after receipt</li>
          </ul>

          <p className="mt-3 text-xs text-gray-600">
            <strong>Refund Method:</strong> Refunds issued to original payment method. Store credit available for faster processing.
          </p>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="mb-8 p-6 border-2 border-gray-300 rounded-lg">
        <h3 className="font-bold text-gray-900 mb-3 text-lg">Terms & Conditions</h3>
        <div className="text-xs text-gray-600 space-y-2">
          <p>
            <strong>1. Product Specifications:</strong> All measurements, colors, and specifications are approximate. Actual products may vary slightly due to manufacturing processes.
          </p>
          <p>
            <strong>2. Installation:</strong> Professional installation is recommended. DIY installation voids certain warranty provisions. Installation services available at additional cost.
          </p>
          <p>
            <strong>3. Delivery:</strong> Delivery times are estimates and may vary. We are not liable for delays caused by shipping carriers or circumstances beyond our control.
          </p>
          <p>
            <strong>4. Pricing:</strong> All prices are in USD. Prices subject to change without notice. Your order is confirmed at the price shown at time of purchase.
          </p>
          <p>
            <strong>5. Cancellation:</strong> Orders may be cancelled within 24 hours of placement for a full refund. After 24 hours, standard return policy applies.
          </p>
          <p>
            <strong>6. Liability:</strong> Our liability is limited to the purchase price of the product. We are not liable for indirect, incidental, or consequential damages.
          </p>
          <p className="mt-3">
            For complete terms and conditions, visit: <strong>www.smartblindshub.com/terms</strong>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-6 border-t-2 border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Thank you for your business!</p>
        <p className="text-xs text-gray-500">
          Questions? Contact us at sales@smartblindshub.com or (316) 530-2635
        </p>
        <p className="text-xs text-gray-400 mt-3">
          © {new Date().getFullYear()} Smart Blinds Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
