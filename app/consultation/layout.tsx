import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Free Consultation - Custom Window Treatment Experts',
  description: 'Schedule your free in-home consultation with Smart Blinds Hub experts. Get personalized window treatment recommendations, professional measuring, and custom quotes.',
  keywords: [
    'free blinds consultation',
    'window treatment consultation',
    'in-home consultation',
    'custom blinds quote',
    'professional measuring',
    'window expert advice',
  ],
  path: '/consultation',
});

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
