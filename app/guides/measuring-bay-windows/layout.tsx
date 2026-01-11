import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'How to Measure Bay Windows for Blinds - Complete Guide',
  description: 'Step-by-step guide to measuring bay windows for blinds and shades. Learn the correct way to measure each section and get a perfect fit every time.',
  keywords: [
    'measure bay windows',
    'bay window blinds',
    'bay window shades',
    'how to measure bay window',
    'bay window measurement guide',
    'blinds for bay windows',
  ],
  path: '/guides/measuring-bay-windows',
});

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Measure Bay Windows for Blinds",
  "description": "Complete guide to measuring bay windows for custom blinds and shades",
  "totalTime": "PT20M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Steel tape measure"
    },
    {
      "@type": "HowToSupply",
      "name": "Paper and pen for recording measurements"
    },
    {
      "@type": "HowToSupply",
      "name": "Step stool (if needed)"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Metal tape measure (at least 25 feet)"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Understand Your Bay Window Configuration",
      "text": "Identify how many window sections make up your bay window. Most bay windows have 3-5 sections: a large center window with angled side windows. Each section needs to be measured separately.",
      "position": 1
    },
    {
      "@type": "HowToStep",
      "name": "Decide on Mount Type",
      "text": "Choose inside mount (blinds fit inside the window frame) or outside mount (blinds cover the entire window frame). Inside mount is most common for bay windows to maintain the architectural detail.",
      "position": 2
    },
    {
      "@type": "HowToStep",
      "name": "Measure Each Section's Width",
      "text": "For inside mount, measure the width at the top, middle, and bottom of each window section. Record the smallest measurement. For outside mount, measure the overall width you want to cover.",
      "position": 3
    },
    {
      "@type": "HowToStep",
      "name": "Measure Each Section's Height",
      "text": "Measure the height on the left side, center, and right side of each section. Record the longest measurement for inside mount. For outside mount, add 3-4 inches to desired coverage.",
      "position": 4
    },
    {
      "@type": "HowToStep",
      "name": "Check for Obstructions",
      "text": "Note any window cranks, handles, or locks that may interfere with blinds operation. Consider if you need clearance for opening windows.",
      "position": 5
    },
    {
      "@type": "HowToStep",
      "name": "Label Your Measurements",
      "text": "Clearly label each section (Left, Center-Left, Center, Center-Right, Right). Record width x height for each. Double-check all measurements before ordering.",
      "position": 6
    }
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Should I use one blind or multiple blinds for a bay window?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Multiple blinds (one per section) is recommended for bay windows. This allows each blind to fit properly within its angled section and provides better light control and operation. One large blind rarely works due to the angles."
      }
    },
    {
      "@type": "Question",
      "name": "What's the best blind type for bay windows?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular shades, roman shades, and roller shades work well for bay windows. They mount easily in angled openings and look cohesive when using the same style across all sections. Avoid vertical blinds in bay windows."
      }
    },
    {
      "@type": "Question",
      "name": "How do I measure the angles in a bay window?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For most bay windows, you don't need to measure the angles. Each window section is typically a standard rectangle - measure each one independently. The angle is in how the sections connect, not in the windows themselves."
      }
    }
  ]
};

export default function MeasuringBayWindowsLayout({
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
