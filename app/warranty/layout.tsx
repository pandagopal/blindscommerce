import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Warranty Information - Product Guarantees',
  description: 'Smart Blinds Hub warranty coverage information. Learn about our lifetime limited warranty, satisfaction guarantee, and what\'s covered on all window treatments.',
  keywords: [
    'blinds warranty',
    'window treatment warranty',
    'lifetime warranty blinds',
    'satisfaction guarantee',
    'product warranty',
    'warranty coverage',
  ],
  path: '/warranty',
});

export default function WarrantyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
