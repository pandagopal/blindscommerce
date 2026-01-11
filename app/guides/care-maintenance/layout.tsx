import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Blinds Care & Maintenance Guide - Cleaning Tips',
  description: 'Learn how to clean and maintain your window blinds and shades. Expert tips for dusting, deep cleaning, and extending the life of all blind types.',
  keywords: [
    'how to clean blinds',
    'blinds maintenance',
    'clean window shades',
    'blind cleaning tips',
    'maintain blinds',
    'blinds care guide',
  ],
  path: '/guides/care-maintenance',
});

// HowTo Schema for cleaning blinds
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Clean and Maintain Window Blinds",
  "description": "Complete guide to cleaning and maintaining all types of window blinds and shades to keep them looking beautiful and functioning properly.",
  "image": "https://smartblindshub.com/images/guides/cleaning-blinds.jpg",
  "totalTime": "PT30M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "5"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Microfiber cloth or feather duster"
    },
    {
      "@type": "HowToSupply",
      "name": "Vacuum with brush attachment"
    },
    {
      "@type": "HowToSupply",
      "name": "Mild dish soap"
    },
    {
      "@type": "HowToSupply",
      "name": "Warm water"
    },
    {
      "@type": "HowToSupply",
      "name": "Clean dry towel"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Vacuum cleaner"
    },
    {
      "@type": "HowToTool",
      "name": "Bucket or basin"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Regular Dusting",
      "text": "Use a feather duster or microfiber cloth weekly to prevent dust buildup. For blinds, close them in one direction, dust, then close in the other direction and dust again.",
      "position": 1
    },
    {
      "@type": "HowToStep",
      "name": "Vacuum with Brush Attachment",
      "text": "Monthly, use a vacuum with a soft brush attachment on low suction to remove deeper dust from blinds and shades. Work from top to bottom.",
      "position": 2
    },
    {
      "@type": "HowToStep",
      "name": "Spot Clean Stains",
      "text": "Address stains promptly by dabbing (not rubbing) with a damp cloth and mild soap solution. Test in an inconspicuous area first.",
      "position": 3
    },
    {
      "@type": "HowToStep",
      "name": "Deep Clean When Needed",
      "text": "For deep cleaning, remove blinds and wipe each slat with a damp cloth and mild soap. For aluminum blinds, you can soak them in a bathtub. Always dry completely before reinstalling.",
      "position": 4
    },
    {
      "@type": "HowToStep",
      "name": "Maintain Operating Mechanisms",
      "text": "Operate blinds gently by raising and lowering smoothly. Check cords, springs, and tilt mechanisms periodically for wear.",
      "position": 5
    }
  ]
};

// FAQ Schema for common care questions
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How often should I clean my blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dust your blinds weekly with a microfiber cloth or feather duster. Vacuum monthly with a brush attachment. Deep clean every 3-6 months depending on dust levels in your home."
      }
    },
    {
      "@type": "Question",
      "name": "Can I wash my blinds in the bathtub?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Aluminum and vinyl mini blinds can be soaked in a bathtub with mild soap. However, never soak wood blinds, cellular shades, or fabric shades as water can cause warping, damage, or mold."
      }
    },
    {
      "@type": "Question",
      "name": "How do I remove yellow stains from blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yellow stains are often from nicotine or UV damage. Try cleaning with a solution of warm water and white vinegar. For severe yellowing, bleach may help on white vinyl blinds only. UV yellowing is permanent and may require replacement."
      }
    },
    {
      "@type": "Question",
      "name": "Why won't my blinds stay up?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If blinds won't stay up, the cord lock mechanism may be worn or broken. For cordless blinds, the internal spring may need resetting - gently pull down and release to reset tension. If problems persist, contact customer support."
      }
    },
    {
      "@type": "Question",
      "name": "How do I clean cellular honeycomb shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use a vacuum with brush attachment on low suction. For spots, dab gently with a damp cloth - don't rub. Some cellular shades can be gently hand-washed, but check manufacturer guidelines first. Never machine wash."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Clean and Maintain Window Blinds: Complete Guide",
  "description": "Expert tips for cleaning and maintaining all types of window blinds and shades including wood, faux wood, cellular, roller, and aluminum blinds.",
  "author": {
    "@type": "Person",
    "name": "Sarah Mitchell",
    "jobTitle": "Product Care Expert"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Smart Blinds Hub",
    "url": "https://smartblindshub.com"
  },
  "datePublished": "2024-01-10",
  "dateModified": "2024-01-10"
};

export default function CareMaintenanceGuideLayout({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {children}
    </>
  );
}
