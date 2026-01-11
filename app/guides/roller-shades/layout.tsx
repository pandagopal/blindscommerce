import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Roller Shades Buying Guide - Window Roller Blinds',
  description: 'Complete guide to roller shades. Learn about fabric options, opacity levels, motorization, and find the best roller shades for your home or office.',
  keywords: [
    'roller shades',
    'roller blinds',
    'roller shades buying guide',
    'solar shades',
    'blackout roller shades',
    'motorized roller shades',
  ],
  path: '/guides/roller-shades',
});

// FAQ Schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are roller shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Roller shades are window treatments made from a single piece of fabric that rolls up onto a tube at the top of the window. They offer a clean, minimalist look and are available in a wide range of fabrics from sheer to blackout."
      }
    },
    {
      "@type": "Question",
      "name": "What is the difference between roller shades and roller blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Roller shades and roller blinds are often used interchangeably. Technically, 'shades' refers to fabric window treatments that roll, fold, or stack, while 'blinds' have slats. However, in common usage, both terms describe the same product - fabric that rolls onto a tube."
      }
    },
    {
      "@type": "Question",
      "name": "What are solar shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Solar shades are a type of roller shade made from specially woven fabric that blocks UV rays and reduces glare while maintaining your view of the outside. They're measured by 'openness factor' - lower percentages block more light and heat, higher percentages provide better visibility."
      }
    },
    {
      "@type": "Question",
      "name": "Are roller shades good for bedrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, blackout roller shades are excellent for bedrooms. They block 99%+ of light for better sleep. For maximum darkness, choose outside mount to minimize light gaps around the edges. Consider adding side channels for complete light blocking."
      }
    },
    {
      "@type": "Question",
      "name": "Can roller shades be motorized?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, roller shades are ideal for motorization due to their simple rolling mechanism. Motorized roller shades can be controlled via remote, smartphone, or smart home systems. They're especially useful for large windows, high windows, or multiple shades you want to control together."
      }
    },
    {
      "@type": "Question",
      "name": "How do I clean roller shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dust roller shades regularly with a soft cloth or vacuum with brush attachment. For spot cleaning, use a damp cloth with mild soap. Some vinyl and PVC roller shades can be wiped down with a wet cloth. Fabric roller shades may require professional cleaning for deep stains."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Roller Shades Buying Guide: Complete Overview",
  "description": "Everything you need to know about roller shades including fabric types, solar shades, motorization options, and choosing the right opacity.",
  "author": {
    "@type": "Person",
    "name": "Mike Chen",
    "jobTitle": "Lead Window Consultant"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Smart Blinds Hub",
    "url": "https://smartblindshub.com"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-15"
};

export default function RollerShadesBuyingGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
