import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'How to Measure Sliding Glass Doors for Blinds - Complete Guide',
  description: 'Step-by-step guide to measuring sliding glass doors and patio doors for blinds and shades. Learn about vertical blinds, panel tracks, and other options.',
  keywords: [
    'measure sliding doors',
    'sliding door blinds',
    'patio door blinds',
    'vertical blinds measuring',
    'panel track blinds',
    'sliding glass door shades',
  ],
  path: '/guides/measuring-sliding-doors',
});

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Measure Sliding Glass Doors for Blinds",
  "description": "Complete guide to measuring sliding glass doors and patio doors for window treatments",
  "totalTime": "PT10M",
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Steel tape measure (25 feet)"
    },
    {
      "@type": "HowToSupply",
      "name": "Step stool"
    },
    {
      "@type": "HowToSupply",
      "name": "Paper and pen"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Choose Your Mount Type",
      "text": "For sliding doors, outside mount is most common - blinds mount above the door frame and extend beyond the sides. This allows the door to operate freely. Inside mount is possible if there's adequate frame depth.",
      "position": 1
    },
    {
      "@type": "HowToStep",
      "name": "Measure the Width",
      "text": "For outside mount, measure the full width you want to cover. Add 3-4 inches on each side of the door frame to ensure light blockage and full coverage. For panel tracks, measure wall-to-wall if possible.",
      "position": 2
    },
    {
      "@type": "HowToStep",
      "name": "Measure the Height",
      "text": "Measure from where you want the blinds to start (typically 3-4 inches above frame) to 1/2 inch above the floor. Blinds shouldn't drag on the floor but should come close for maximum privacy.",
      "position": 3
    },
    {
      "@type": "HowToStep",
      "name": "Check Clearance",
      "text": "Ensure there's space above the door frame for the headrail. Most vertical blinds need 4-6 inches. Note any obstructions like crown molding, vents, or light fixtures.",
      "position": 4
    },
    {
      "@type": "HowToStep",
      "name": "Determine Stack Direction",
      "text": "Decide which way you want the blinds to stack open - left, right, or split in the center. This should match how you use the sliding door.",
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
      "name": "What are the best blinds for sliding glass doors?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The best options are: Vertical blinds (most affordable, easy operation), Panel track blinds (modern look, fabric panels), Cellular vertical shades (energy efficient, contemporary), and Sliding panels (like vertical blinds but with wider fabric panels). Your choice depends on style preference and budget."
      }
    },
    {
      "@type": "Question",
      "name": "Should sliding door blinds go inside or outside the frame?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Outside mount is recommended for most sliding doors. It provides better light blockage, doesn't interfere with door operation, and makes the door appear larger. Inside mount can work if you have deep frames (3+ inches) and want a built-in look."
      }
    },
    {
      "@type": "Question",
      "name": "How much should blinds overlap a sliding door?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For outside mount, blinds should extend 3-4 inches beyond each side of the door frame and 3-4 inches above. This overlap ensures privacy, blocks light leakage, and provides a more finished look."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use regular horizontal blinds on a sliding door?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While possible, horizontal blinds aren't ideal for sliding doors. They can be heavy and difficult to operate at large sizes, may sag over time, and the door cannot be used when blinds are lowered. Vertical blinds or panel tracks are better suited."
      }
    }
  ]
};

export default function MeasuringSlidingDoorsLayout({
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
