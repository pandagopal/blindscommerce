import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Inside vs Outside Mount Blinds - Mounting Guide',
  description: 'Learn the difference between inside mount and outside mount blinds. Understand which mounting option is best for your windows and how to measure for each.',
  keywords: [
    'inside mount blinds',
    'outside mount blinds',
    'blind mounting options',
    'how to mount blinds',
    'window mount types',
    'mounting guide',
  ],
  path: '/guides/mounting',
});

export default function MountingGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
