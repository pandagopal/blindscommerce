import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Roman Shades Buying Guide - Fabric Roman Blinds',
  description: 'Complete guide to roman shades. Learn about fold styles, fabric options, liner choices, and find the best roman shades for your home decor.',
  keywords: [
    'roman shades',
    'roman blinds',
    'roman shades buying guide',
    'fabric roman shades',
    'flat roman shades',
    'hobbled roman shades',
  ],
  path: '/guides/roman-shades',
});

// FAQ Schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are roman shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Roman shades are fabric window treatments that fold up in horizontal pleats when raised and lie flat against the window when lowered. They combine the softness of drapery with the functionality of a shade, adding elegance and texture to any room."
      }
    },
    {
      "@type": "Question",
      "name": "What are the different styles of roman shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The main styles are: Flat/Classic (smooth, tailored look when lowered), Hobbled/Teardrop (cascading folds that remain visible when lowered), Relaxed/European (soft curve at the bottom), and Balloon (puffy, gathered fabric). Flat is the most popular for modern homes."
      }
    },
    {
      "@type": "Question",
      "name": "Are roman shades good for insulation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Roman shades provide moderate insulation, especially with lined fabrics. For better energy efficiency, choose roman shades with thermal or blackout lining. However, cellular shades offer superior insulation due to their honeycomb structure."
      }
    },
    {
      "@type": "Question",
      "name": "Can roman shades be motorized?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, roman shades can be motorized. However, because they're heavier than other shade types, make sure to choose a motor rated for the shade weight. Motorization is especially useful for large roman shades or hard-to-reach windows."
      }
    },
    {
      "@type": "Question",
      "name": "How do I clean roman shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Regular dusting with a vacuum brush attachment keeps roman shades clean. Spot clean stains by blotting (not rubbing) with a damp cloth. Most roman shades should be professionally cleaned for deep cleaning to maintain fabric integrity and fold structure."
      }
    },
    {
      "@type": "Question",
      "name": "What rooms are best for roman shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Roman shades work beautifully in living rooms, dining rooms, bedrooms, and home offices. They're particularly popular in spaces where you want to add warmth, texture, and a custom look. Avoid using fabric roman shades in high-humidity areas like bathrooms."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Roman Shades Buying Guide: Styles, Fabrics, and Options",
  "description": "Everything you need to know about roman shades including fold styles, fabric choices, liner options, and best rooms for this elegant window treatment.",
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

export default function RomanShadesBuyingGuideLayout({
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
