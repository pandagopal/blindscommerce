import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Window Treatment Guides & How-To Resources',
  description: 'Expert guides for measuring, installing, and choosing window treatments. Step-by-step instructions for blinds, shades, and shutters from Smart Blinds Hub.',
  keywords: [
    'blinds installation guide',
    'how to measure blinds',
    'window treatment guide',
    'blinds care instructions',
    'mounting blinds',
    'choosing window treatments',
  ],
  path: '/guides',
});

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
