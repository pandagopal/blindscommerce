import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';
import { FAQJsonLd, ProductJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'Zebra Blinds & Dual Shades - Modern Light Control Window Treatments',
  description: 'Shop custom zebra blinds starting at $49. Alternating sheer & solid stripes for perfect light control. 50+ colors. Free shipping over $100. Perfect fit guarantee.',
  keywords: [
    'zebra blinds',
    'zebra shades',
    'dual shades',
    'layered shades',
    'zebra roller blinds',
    'striped blinds',
    'light filtering blinds',
    'modern window blinds',
    'transitional shades',
  ],
  path: '/zebra-blinds',
});

export default function ZebraBlindsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProductJsonLd
        name="Custom Zebra Blinds"
        description="Zebra blinds with alternating sheer and solid stripes for versatile light control. Custom-made to fit your windows. Available in 50+ colors."
        image="/images/products/zebra-blinds.jpg"
        price={49}
        url="https://smartblindshub.com/zebra-blinds"
        category="Zebra Blinds"
        rating={4.8}
        reviewCount={1250}
      />
      <FAQJsonLd
        items={[
          {
            question: 'What are zebra blinds?',
            answer: 'Zebra blinds (also called dual shades or layered shades) feature alternating sheer and solid horizontal stripes on a single piece of fabric. By adjusting the blinds, you can align the solid stripes for privacy or offset them to allow light through the sheer sections.'
          },
          {
            question: 'Are zebra blinds good for bedrooms?',
            answer: 'Yes! When the solid stripes are aligned, zebra blinds provide excellent privacy and significant light blocking. For complete blackout in bedrooms, we recommend our zebra blinds with blackout fabric option, which blocks 99% of light.'
          },
          {
            question: 'How do you clean zebra blinds?',
            answer: 'Zebra blinds are easy to maintain. Regular dusting with a soft cloth or vacuum with a brush attachment keeps them clean. For spots, use a damp cloth with mild soap. The polyester fabric is stain-resistant and durable.'
          },
          {
            question: 'Can zebra blinds be motorized?',
            answer: 'Absolutely! We offer motorized zebra blinds that can be controlled via remote, smartphone app, or voice commands through Alexa and Google Home. Perfect for hard-to-reach windows or smart home integration.'
          },
          {
            question: 'How much do custom zebra blinds cost?',
            answer: 'Our custom zebra blinds start at $49 for standard sizes. Prices vary based on window dimensions, fabric choice, and features like motorization. Use our online configurator for instant pricing or request a free quote.'
          }
        ]}
      />
      {children}
    </>
  );
}
