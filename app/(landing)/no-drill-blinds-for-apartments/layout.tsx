import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';
import { FAQJsonLd, ProductJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'No-Drill Blinds for Apartments - Renter Friendly Window Treatments',
  description: 'Shop no-drill blinds perfect for apartments & rentals. Tension mount, adhesive, or magnetic options. No holes, no damage, no lost deposit. 5-minute install. Free shipping.',
  keywords: [
    'no drill blinds',
    'no drill blinds for apartments',
    'renter friendly blinds',
    'tension mount blinds',
    'adhesive blinds',
    'blinds without drilling',
    'apartment blinds',
    'temporary blinds',
    'no damage blinds',
  ],
  path: '/no-drill-blinds-for-apartments',
});

export default function NoDrillBlindsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProductJsonLd
        name="No-Drill Blinds for Apartments"
        description="Renter-friendly blinds that install without drilling. Tension mount, adhesive, or magnetic options. Zero wall damage. Custom-made to fit your windows."
        image="/images/products/no-drill-blinds.jpg"
        price={39}
        url="https://smartblindshub.com/no-drill-blinds-for-apartments"
        category="No-Drill Blinds"
        rating={4.7}
        reviewCount={1560}
      />
      <FAQJsonLd
        items={[
          {
            question: 'Will no-drill blinds really hold up?',
            answer: "Yes! Our tension-mount and adhesive blinds use commercial-grade hardware designed for daily use. Tension mounts support blinds up to 36\" wide, while our 3M adhesive strips can hold blinds on windows up to 48\" wide. Thousands of apartment dwellers use them daily."
          },
          {
            question: 'Can I take them with me when I move?',
            answer: "Absolutely! That's the beauty of no-drill blinds. Tension mounts simply release when you remove them, and adhesive strips peel off cleanly using the pull tabs. Your blinds and walls stay damage-free, so you can reinstall them at your new place."
          },
          {
            question: 'Do no-drill blinds work on all window types?',
            answer: "Most window types work great. Tension mounts require a flat window frame at least 1.5\" deep. Adhesive mounts work on any clean, flat surface including drywall, tile, metal, and wood. Contact us if you're unsure about your specific windows."
          },
          {
            question: 'Are no-drill blinds as good as regular blinds?',
            answer: 'Yes! We use the same premium materials and construction as our drill-mount blinds. The only difference is the mounting hardware. You get the same light control, privacy, and style—just easier to install and remove.'
          }
        ]}
      />
      {children}
    </>
  );
}
