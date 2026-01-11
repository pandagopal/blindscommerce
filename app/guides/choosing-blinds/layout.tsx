import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'How to Choose the Right Blinds - Buyer\'s Guide',
  description: 'Complete guide to choosing the perfect blinds for your home. Compare blind types, materials, light control options, and find the best window treatments for each room.',
  keywords: [
    'how to choose blinds',
    'best blinds for rooms',
    'blinds buyer guide',
    'compare window treatments',
    'blinds vs shades',
    'window covering options',
  ],
  path: '/guides/choosing-blinds',
});

// FAQ Schema for buyer's guide questions
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What type of blinds are best for bedrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blackout cellular shades and room darkening roller shades are best for bedrooms. They block 99%+ of light for better sleep. Blackout options are especially important for shift workers, nurseries, and media rooms."
      }
    },
    {
      "@type": "Question",
      "name": "What blinds are best for bathrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Faux wood blinds and vinyl shutters are best for bathrooms because they resist humidity and moisture. Avoid real wood blinds as they can warp. Aluminum mini blinds are also a budget-friendly moisture-resistant option."
      }
    },
    {
      "@type": "Question",
      "name": "Are cordless blinds safer than corded blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, cordless blinds are significantly safer for homes with children and pets. Corded blinds pose strangulation hazards. All major safety organizations recommend cordless or motorized options for child safety."
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between blinds and shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blinds have individual slats (horizontal or vertical) that tilt to control light. Shades are made from continuous material that rolls, folds, or stacks. Blinds offer more precise light control, while shades often provide better insulation and a softer look."
      }
    },
    {
      "@type": "Question",
      "name": "Which blinds provide the best insulation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular (honeycomb) shades provide the best insulation due to their air-trapping pockets. Double cell shades offer even more insulation. They can reduce heat loss through windows by up to 40% and save on energy bills."
      }
    },
    {
      "@type": "Question",
      "name": "What are the most affordable blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Aluminum mini blinds are the most affordable option, followed by vinyl blinds and basic roller shades. Faux wood blinds offer a good mid-range balance between cost and appearance. Real wood, shutters, and motorized options are premium-priced."
      }
    },
    {
      "@type": "Question",
      "name": "How do I choose the right color for blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "White and neutral colors (cream, gray, beige) are most versatile and work with any décor. Match blinds to your trim for a cohesive look, or choose a complementary color from your room's palette. Darker colors absorb more heat."
      }
    },
    {
      "@type": "Question",
      "name": "Are motorized blinds worth it?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Motorized blinds are worth it for hard-to-reach windows, skylights, large windows, or multiple windows you want to control together. They're also ideal for smart home integration, scheduling, and child safety. The convenience factor is high for daily use."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Choose the Right Window Treatments: Complete Buyer's Guide",
  "description": "Expert guide to selecting the perfect blinds, shades, or shutters for every room in your home. Compare products, features, and prices.",
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
  "datePublished": "2024-01-08",
  "dateModified": "2024-01-08"
};

// Product comparison table schema
const comparisonTableSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Window Treatment Comparison",
  "description": "Comparison of different window treatment types by light control, privacy, insulation, and price",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Wood Blinds",
      "description": "Excellent light control and privacy, good insulation, premium price ($$$)"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Faux Wood Blinds",
      "description": "Excellent light control and privacy, good insulation, moderate price ($$)"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Cellular Shades",
      "description": "Excellent light control and privacy, best insulation, moderate to premium price ($$-$$$)"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Roller Shades",
      "description": "Good light control and privacy, fair insulation, budget to moderate price ($-$$)"
    },
    {
      "@type": "ListItem",
      "position": 5,
      "name": "Roman Shades",
      "description": "Good light control, excellent privacy, good insulation, moderate to premium price ($$-$$$)"
    },
    {
      "@type": "ListItem",
      "position": 6,
      "name": "Shutters",
      "description": "Excellent light control, privacy, and insulation, highest price ($$$$)"
    },
    {
      "@type": "ListItem",
      "position": 7,
      "name": "Aluminum Mini Blinds",
      "description": "Good light control and privacy, fair insulation, most affordable ($)"
    }
  ]
};

export default function ChoosingBlindsGuideLayout({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonTableSchema) }}
      />
      {children}
    </>
  );
}
