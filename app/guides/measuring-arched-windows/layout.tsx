import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'How to Measure Arched Windows for Blinds - Complete Guide',
  description: 'Learn how to measure arched, half-circle, and specialty shaped windows for blinds and shades. Expert tips for perfect-fit window treatments.',
  keywords: [
    'measure arched windows',
    'arched window blinds',
    'half circle window shades',
    'arch window treatments',
    'specialty shape windows',
    'curved window blinds',
  ],
  path: '/guides/measuring-arched-windows',
});

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Measure Arched Windows for Blinds",
  "description": "Step-by-step guide to measuring arched and specialty shaped windows for custom blinds",
  "totalTime": "PT15M",
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Steel tape measure"
    },
    {
      "@type": "HowToSupply",
      "name": "Paper and pen"
    },
    {
      "@type": "HowToSupply",
      "name": "Cardboard for template (optional)"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Identify Your Arch Type",
      "text": "Determine if you have a perfect half-circle arch, quarter circle, eyebrow arch, or gothic arch. Each type has specific measuring requirements.",
      "position": 1
    },
    {
      "@type": "HowToStep",
      "name": "Measure the Width",
      "text": "Measure the width at the widest point of the arch (the base of the arch where it meets the straight portion or wall). This is your width measurement.",
      "position": 2
    },
    {
      "@type": "HowToStep",
      "name": "Measure the Height",
      "text": "For the height, measure from the base of the arch to the highest point of the curve. For combination windows, measure the arch height and rectangular height separately.",
      "position": 3
    },
    {
      "@type": "HowToStep",
      "name": "Determine if Perfect Half-Circle",
      "text": "If your arch height is exactly half of your width, you have a perfect half-circle. If not, you have an eyebrow or elliptical arch which may require a template.",
      "position": 4
    },
    {
      "@type": "HowToStep",
      "name": "Create a Template (If Needed)",
      "text": "For non-standard arches, create a cardboard template by tracing the exact curve of your window. This ensures a perfect fit for custom-made blinds.",
      "position": 5
    }
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Can you put blinds on arched windows?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Options include: custom arch-shaped cellular shades that follow the curve, shutters with a sunburst pattern, stationary fabric shades, or covering just the rectangular portion below the arch while leaving the arch open."
      }
    },
    {
      "@type": "Question",
      "name": "How do I know if my arch is a perfect half circle?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Measure the width at the base of the arch and the height from base to top of curve. If the height is exactly half the width, it's a perfect half-circle. For example, a 36-inch wide arch should be 18 inches tall for a perfect half-circle."
      }
    },
    {
      "@type": "Question",
      "name": "What's the best window treatment for arched windows?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular arch shades are most popular - they're energy efficient and available in perfect arch and eyebrow shapes. Plantation shutters with sunburst design are elegant. For budget options, leave the arch uncovered and treat only the rectangular portion below."
      }
    }
  ]
};

export default function MeasuringArchedWindowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
