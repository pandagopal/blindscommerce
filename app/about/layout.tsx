import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'About Smart Blinds Hub - Premium Custom Window Treatments',
  description: 'Learn about Smart Blinds Hub, Washington\'s trusted source for custom blinds, shades, and shutters since 2010. Over 50,000 satisfied customers. Free consultations available.',
  keywords: [
    'about smart blinds hub',
    'window treatment company',
    'custom blinds company',
    'washington blinds',
    'window treatment experts',
    'blinds installation company',
  ],
  path: '/about',
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
