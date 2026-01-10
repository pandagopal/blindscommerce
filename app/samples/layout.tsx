import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Free Samples - See & Feel Before You Buy',
  description: 'Order free window treatment samples from Smart Blinds Hub. See actual colors, textures, and materials in your home before ordering custom blinds, shades, or shutters.',
  keywords: [
    'free blinds samples',
    'window shade samples',
    'fabric samples',
    'color samples',
    'blinds swatches',
    'free material samples',
  ],
  path: '/samples',
});

export default function SamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
