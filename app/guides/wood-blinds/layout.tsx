import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Wood Blinds Buying Guide - Real Wood Window Blinds',
  description: 'Complete guide to real wood blinds. Learn about wood types, slat sizes, stain options, and find the best wood blinds for your home.',
  keywords: [
    'wood blinds',
    'real wood blinds',
    'wood blinds buying guide',
    'basswood blinds',
    'wooden window blinds',
    'natural wood blinds',
  ],
  path: '/guides/wood-blinds',
});

// FAQ Schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are real wood blinds made of?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Quality real wood blinds are typically made from basswood, which is lightweight, strong, and takes stain beautifully. Other wood types include bamboo, ash, and oak. Basswood is the most popular choice because it resists warping and provides a smooth finish."
      }
    },
    {
      "@type": "Question",
      "name": "Are wood blinds better than faux wood?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Real wood blinds offer natural beauty, lighter weight, and authentic grain patterns that faux wood can't perfectly replicate. However, faux wood is better for high-humidity areas, costs less, and is more durable. Choose real wood for dry rooms where aesthetics are priority; choose faux wood for bathrooms, kitchens, or budget-conscious projects."
      }
    },
    {
      "@type": "Question",
      "name": "Can wood blinds be used in bathrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Real wood blinds are not recommended for bathrooms or other high-humidity areas. Moisture can cause wood to warp, crack, or develop mold. For bathrooms, choose faux wood blinds or vinyl shutters which are moisture-resistant."
      }
    },
    {
      "@type": "Question",
      "name": "What slat size should I choose for wood blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Common slat sizes are 1 inch, 2 inch, and 2.5 inch. 2-inch slats are most popular for homes as they balance view-through with privacy. 1-inch slats suit smaller windows. 2.5-inch slats create a bolder statement and work well on large windows."
      }
    },
    {
      "@type": "Question",
      "name": "How do I clean wood blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dust wood blinds weekly with a soft cloth, duster, or vacuum brush attachment. Wipe in the direction of the wood grain. For deeper cleaning, use a slightly damp cloth with mild wood cleaner and dry immediately. Never soak wood blinds or use excess water."
      }
    },
    {
      "@type": "Question",
      "name": "How long do wood blinds last?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Quality wood blinds can last 10-20 years with proper care. Factors affecting longevity include wood quality, sun exposure (can cause fading), humidity levels, and frequency of use. Real wood blinds in appropriate rooms (not bathrooms) can be a long-term investment."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Wood Blinds Buying Guide: Natural Beauty for Your Windows",
  "description": "Everything you need to know about real wood blinds including wood types, slat sizes, stain options, and proper care.",
  "author": {
    "@type": "Person",
    "name": "David Thompson",
    "jobTitle": "Senior Installation Specialist"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Smart Blinds Hub",
    "url": "https://smartblindshub.com"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-15"
};

export default function WoodBlindsBuyingGuideLayout({
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
