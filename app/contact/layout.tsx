import { Metadata } from 'next';
import { generatePageMetadata, siteConfig } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Contact Us - Smart Blinds Hub',
  description: 'Contact Smart Blinds Hub for custom window blinds, shades, and shutters. Call (316) 530-2635 or email us. Free consultations available in Washington area.',
  keywords: [
    'contact smart blinds',
    'blinds customer service',
    'window treatment help',
    'schedule consultation',
    'blinds support',
    'washington blinds contact',
  ],
  path: '/contact',
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
