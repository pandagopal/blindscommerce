import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';
import { FAQJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'Help Center - FAQs & Support',
  description: 'Get answers to frequently asked questions about ordering, measuring, installing, and caring for your window blinds and shades. 24/7 online support available.',
  keywords: [
    'blinds help',
    'window treatment FAQ',
    'blinds support',
    'ordering help',
    'installation help',
    'customer support',
  ],
  path: '/help',
});

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FAQJsonLd
        items={[
          {
            question: "How do I measure my windows for blinds?",
            answer: "Measure the width at the top, middle, and bottom of your window. Use the narrowest measurement for inside mount. Measure height on the left, center, and right - use the longest measurement. Always measure twice for accuracy."
          },
          {
            question: "What is your return policy?",
            answer: "We offer a 100% satisfaction guarantee. If you're not completely satisfied with your custom blinds, contact us within 30 days and we'll work with you to make it right or provide a full refund."
          },
          {
            question: "How long does shipping take?",
            answer: "Custom blinds are typically manufactured within 5-7 business days and shipped via FedEx Ground. Total delivery time is usually 7-14 business days depending on your location."
          },
          {
            question: "Do you offer professional installation?",
            answer: "Yes! We offer professional measuring and installation services in select areas. Our certified installers ensure perfect fit and operation of your window treatments."
          },
          {
            question: "What warranty do you offer?",
            answer: "We offer a limited lifetime warranty on most of our products covering defects in materials and workmanship. Motorized components typically carry a 5-year warranty."
          }
        ]}
      />
      {children}
    </>
  );
}
