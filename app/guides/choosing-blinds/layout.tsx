import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'How to Choose the Right Blinds - Buyer\'s Guide',
  description: 'Complete guide to choosing the perfect blinds for your home. Compare blind types, materials, light control options, and find the best window treatments for each room.',
  keywords: [
    'how to choose blinds',
    'best blinds for rooms',
    'blinds buyer guide',
    'compare window treatments',
    'blinds vs shades',
    'window covering options',
  ],
  path: '/guides/choosing-blinds',
});

export default function ChoosingBlindsGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
