import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'Professional Measuring & Installation Services',
  description: 'Expert window treatment measuring and installation by certified professionals. Free in-home measuring service. Perfect fit guaranteed for all blinds, shades, and shutters.',
  keywords: [
    'blinds installation service',
    'professional measuring',
    'window treatment installation',
    'in-home measuring',
    'certified installers',
    'blinds fitting service',
  ],
  path: '/measure-install',
});

export default function MeasureInstallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Professional Measuring & Installation"
        description="Expert window treatment measuring and installation services by certified professionals. Includes free in-home measuring, professional installation, and perfect fit guarantee."
        serviceType="Window Treatment Installation"
      />
      {children}
    </>
  );
}
