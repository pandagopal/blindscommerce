import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'How to Measure Skylights for Blinds - Complete Guide',
  description: 'Step-by-step guide to measuring skylights for shades. Learn proper techniques for fixed and vented skylights, plus tips for hard-to-reach windows.',
  keywords: [
    'measure skylights',
    'skylight blinds',
    'skylight shades',
    'how to measure skylight',
    'skylight window treatments',
    'roof window blinds',
  ],
  path: '/guides/measuring-skylights',
});

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Measure Skylights for Blinds",
  "description": "Complete guide to measuring skylights for custom blinds and shades",
  "totalTime": "PT15M",
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Steel tape measure"
    },
    {
      "@type": "HowToSupply",
      "name": "Ladder or step stool"
    },
    {
      "@type": "HowToSupply",
      "name": "Paper and pen"
    },
    {
      "@type": "HowToSupply",
      "name": "Flashlight (optional)"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Identify Your Skylight Brand",
      "text": "Check for manufacturer labels on your skylight frame. Common brands include VELUX, Fakro, and Andersen. Many brands offer made-to-measure blinds using the skylight's model number.",
      "position": 1
    },
    {
      "@type": "HowToStep",
      "name": "Determine Skylight Type",
      "text": "Identify if your skylight is fixed (doesn't open), vented (opens for ventilation), or curb-mounted (sits on a raised frame). This affects which blinds will work.",
      "position": 2
    },
    {
      "@type": "HowToStep",
      "name": "Measure the Width",
      "text": "Measure the inside width of the skylight frame at the glass edge. Measure at top, middle, and bottom. Record the smallest measurement.",
      "position": 3
    },
    {
      "@type": "HowToStep",
      "name": "Measure the Height",
      "text": "Measure the inside height from the glass edge at top to the glass edge at bottom. Measure left side, center, and right side. Record the longest measurement.",
      "position": 4
    },
    {
      "@type": "HowToStep",
      "name": "Note the Angle",
      "text": "Skylights are angled. Note the pitch - steeper angles may require different mounting solutions. Standard skylight blinds work on pitches from 15-85 degrees.",
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
      "name": "What blinds work best for skylights?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular skylight shades are most popular - they're lightweight, energy efficient, and available in blackout options. Many are designed with side tracks to hold the shade in place at any angle. For VELUX skylights, brand-specific blinds are available that clip into the frame."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use regular blinds on a skylight?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, regular blinds won't work. Skylights need special blinds with side channels or tensioned systems to hold them in place at an angle. Without these, blinds would sag or fall away from the glass."
      }
    },
    {
      "@type": "Question",
      "name": "How do I operate skylight blinds that are out of reach?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Options include: motorized skylight blinds controlled by remote or app, manual blinds with an extension pole, or solar-powered options that require no wiring. Motorized is recommended for skylights over 10 feet high."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to measure the angle of my skylight?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For most skylight blinds, the exact angle isn't needed - standard products work on pitches from 15-85 degrees. However, for very flat (under 15°) or near-vertical installations, mention the approximate angle when ordering."
      }
    }
  ]
};

export default function MeasuringSkylightsLayout({
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
