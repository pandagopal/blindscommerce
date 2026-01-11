import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Cellular Shades Buying Guide - Honeycomb Shades',
  description: 'Complete guide to cellular shades (honeycomb shades). Learn about energy efficiency, light control options, cell sizes, and find the best cellular shades for your home.',
  keywords: [
    'cellular shades',
    'honeycomb shades',
    'cellular blinds buying guide',
    'energy efficient shades',
    'honeycomb blinds',
    'insulating window shades',
  ],
  path: '/guides/cellular-shades',
});

// FAQ Schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are cellular shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular shades, also called honeycomb shades, are window treatments made from pleated fabric that forms honeycomb-shaped cells when viewed from the side. These cells trap air, providing excellent insulation that can help reduce energy costs by up to 25%."
      }
    },
    {
      "@type": "Question",
      "name": "Are cellular shades energy efficient?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, cellular shades are among the most energy-efficient window treatments available. The honeycomb cells trap air to create insulation. Single cell shades offer good insulation, while double cell (or triple cell) shades provide even better energy savings. Studies show they can reduce heat loss through windows by up to 40%."
      }
    },
    {
      "@type": "Question",
      "name": "What cell size should I choose?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cell size affects both appearance and insulation. 3/8\" cells are best for small windows and a sleek look. 1/2\" cells are versatile and work on most windows. 3/4\" cells provide maximum insulation and suit larger windows. Double cell shades (two layers of cells) offer the best energy efficiency."
      }
    },
    {
      "@type": "Question",
      "name": "Are cellular shades good for bathrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standard cellular shades are not ideal for high-humidity areas like bathrooms because the fabric can absorb moisture. However, some manufacturers offer moisture-resistant cellular shades specifically designed for bathrooms. For most bathrooms, faux wood blinds or vinyl roller shades are better choices."
      }
    },
    {
      "@type": "Question",
      "name": "Do cellular shades block light completely?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It depends on the opacity level. Light filtering cellular shades softly diffuse light while maintaining privacy. Room darkening shades block about 95-99% of light. Blackout cellular shades block nearly all light, though some light may enter around edges depending on mount type. For maximum darkness, combine blackout shades with outside mount."
      }
    },
    {
      "@type": "Question",
      "name": "How long do cellular shades last?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Quality cellular shades typically last 7-10 years with proper care. Factors affecting lifespan include fabric quality, sun exposure, frequency of use, and maintenance. Cordless and motorized options often last longer as they have fewer mechanical parts that can wear out."
      }
    },
    {
      "@type": "Question",
      "name": "Can cellular shades be motorized?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, cellular shades are excellent candidates for motorization. Motorized cellular shades can be controlled via remote, smartphone app, or voice assistants like Alexa and Google Home. They're particularly useful for hard-to-reach windows, skylights, and large windows."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Cellular Shades Buying Guide: Everything You Need to Know",
  "description": "Comprehensive guide to choosing cellular shades including energy efficiency, cell sizes, opacity levels, and best uses for each room.",
  "author": {
    "@type": "Person",
    "name": "Jennifer Adams",
    "jobTitle": "Interior Design Consultant"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Smart Blinds Hub",
    "url": "https://smartblindshub.com"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-15"
};

export default function CellularShadesBuyingGuideLayout({
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
