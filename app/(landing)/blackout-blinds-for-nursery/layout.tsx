import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';
import { FAQJsonLd, ProductJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'Blackout Blinds for Nursery - Child Safe & Cordless Window Treatments',
  description: 'Shop 100% cordless blackout blinds for baby nursery. Block 99.9% of light for better sleep. GREENGUARD certified, child-safe. Free shipping. Starting at $49.',
  keywords: [
    'blackout blinds for nursery',
    'baby room blackout blinds',
    'cordless nursery blinds',
    'child safe blinds',
    'blackout shades for baby room',
    'nursery window treatments',
    'safe blinds for kids room',
    'blackout blinds baby sleep',
  ],
  path: '/blackout-blinds-for-nursery',
});

export default function BlackoutBlindsNurseryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProductJsonLd
        name="Cordless Blackout Blinds for Nursery"
        description="100% cordless, child-safe blackout blinds for baby nurseries. Blocks 99.9% of light. GREENGUARD Gold certified. Custom-made to fit your windows."
        image="/images/products/nursery-blackout-blinds.jpg"
        price={49}
        url="https://smartblindshub.com/blackout-blinds-for-nursery"
        category="Blackout Blinds"
        rating={4.9}
        reviewCount={890}
      />
      <FAQJsonLd
        items={[
          {
            question: 'Why do babies need blackout blinds?',
            answer: "Blackout blinds help regulate your baby's circadian rhythm by creating a dark sleep environment. This is especially important for daytime naps and during summer months when the sun sets late. Studies show babies sleep longer and more soundly in darker rooms."
          },
          {
            question: 'Are cordless blinds really safer for nurseries?',
            answer: 'Yes, cordless blinds eliminate the strangulation hazard posed by blind cords, which are responsible for numerous child injuries each year. The CPSC recommends cordless window coverings in all homes with young children. All our nursery blinds are 100% cordless.'
          },
          {
            question: "What's the difference between blackout and room darkening?",
            answer: 'Blackout blinds block 99-100% of light, creating near-total darkness. Room darkening blocks about 95-99% of light. For nurseries, we recommend true blackout blinds to ensure the best sleep environment for your baby.'
          },
          {
            question: 'How do I measure for nursery blinds?',
            answer: 'Measure the inside width at the top, middle, and bottom of the window frame. Use the smallest measurement. For height, measure left, center, and right sides and use the longest measurement. We offer free virtual measuring assistance if needed.'
          }
        ]}
      />
      {children}
    </>
  );
}
