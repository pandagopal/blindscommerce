import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Shutters Buying Guide - Interior Plantation Shutters',
  description: 'Complete guide to interior shutters. Learn about materials, louver sizes, mounting options, and find the best plantation shutters for your home.',
  keywords: [
    'shutters',
    'plantation shutters',
    'interior shutters',
    'shutters buying guide',
    'wood shutters',
    'vinyl shutters',
  ],
  path: '/guides/shutters',
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are plantation shutters?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Plantation shutters are interior window coverings with wide horizontal louvers (slats) that tilt to control light and privacy. They're mounted in a frame that attaches to your window and typically have 2.5 to 4.5-inch louvers. The name comes from their historical use on Southern plantations."
      }
    },
    {
      "@type": "Question",
      "name": "Are shutters worth the investment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, shutters are considered a home improvement investment. They increase home value, last 20-25+ years, provide excellent insulation, and never go out of style. While they cost more upfront than blinds or shades, their longevity and impact on home value make them worthwhile for many homeowners."
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between wood and composite shutters?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Wood shutters (typically basswood or poplar) offer natural beauty, can be stained or painted any color, and are lightweight. Composite/vinyl shutters are moisture-resistant, more affordable, extremely durable, and ideal for bathrooms or humid climates. Both look similar; choose based on room conditions and budget."
      }
    },
    {
      "@type": "Question",
      "name": "What louver size should I choose?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Louver size affects both appearance and view-through. 2.5-inch louvers have a traditional look. 3.5-inch louvers are the most popular, balancing style and function. 4.5-inch louvers provide maximum view and a modern appearance, best for large windows."
      }
    },
    {
      "@type": "Question",
      "name": "Can shutters be used on any window shape?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, shutters can be custom-made for virtually any window shape including arched, circular, triangular, and specialty shapes. Arched shutters can have fixed or operable louvers. Specialty shapes are typically fixed but add architectural interest."
      }
    },
    {
      "@type": "Question",
      "name": "How do I clean shutters?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Shutters are among the easiest window treatments to clean. Dust regularly with a soft cloth or duster. For deeper cleaning, wipe with a damp cloth and mild soap. The smooth surfaces don't trap dust like fabric shades, and individual louvers are easy to access."
      }
    }
  ]
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Shutters Buying Guide: Timeless Elegance for Your Home",
  "description": "Everything you need to know about plantation shutters including materials, louver sizes, mounting options, and why they're worth the investment.",
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

export default function ShuttersBuyingGuideLayout({
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
