import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Blinds Care & Maintenance Guide - Cleaning Tips',
  description: 'Learn how to clean and maintain your window blinds and shades. Expert tips for dusting, deep cleaning, and extending the life of all blind types.',
  keywords: [
    'how to clean blinds',
    'blinds maintenance',
    'clean window shades',
    'blind cleaning tips',
    'maintain blinds',
    'blinds care guide',
  ],
  path: '/guides/care-maintenance',
});

export default function CareMaintenanceGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
