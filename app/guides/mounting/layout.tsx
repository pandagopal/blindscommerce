import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Inside vs Outside Mount Blinds - Mounting Guide',
  description: 'Learn the difference between inside mount and outside mount blinds. Understand which mounting option is best for your windows and how to measure for each.',
  keywords: [
    'inside mount blinds',
    'outside mount blinds',
    'blind mounting options',
    'how to mount blinds',
    'window mount types',
    'mounting guide',
  ],
  path: '/guides/mounting',
});

// HowTo Schema for choosing mount type
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Choose Between Inside and Outside Mount for Blinds",
  "description": "Step-by-step guide to determine whether inside mount or outside mount is best for your windows.",
  "image": "https://smartblindshub.com/images/guides/mounting-options.jpg",
  "totalTime": "PT10M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Measure Window Frame Depth",
      "text": "Measure the depth of your window frame from the front edge to the window glass. Most blinds require 1.5\" to 3\" minimum depth for inside mount.",
      "position": 1
    },
    {
      "@type": "HowToStep",
      "name": "Check for Obstructions",
      "text": "Look for window cranks, handles, or locks inside the frame that might interfere with inside-mounted blinds. If obstructions exist, outside mount is recommended.",
      "position": 2
    },
    {
      "@type": "HowToStep",
      "name": "Evaluate Light Blocking Needs",
      "text": "If maximum light blocking is your priority (such as for bedrooms), outside mount is better as it covers the entire window opening and eliminates side light gaps.",
      "position": 3
    },
    {
      "@type": "HowToStep",
      "name": "Consider Window Trim",
      "text": "If you have beautiful decorative window trim you want to showcase, choose inside mount. If trim is plain or damaged, outside mount can cover it.",
      "position": 4
    },
    {
      "@type": "HowToStep",
      "name": "Check if Frame is Square",
      "text": "Measure width at top, middle, and bottom. Measure height at left, center, and right. If measurements vary by more than 1/4\", outside mount may look better as it hides irregularities.",
      "position": 5
    },
    {
      "@type": "HowToStep",
      "name": "Make Your Decision",
      "text": "Choose inside mount for a clean, built-in look with sufficient depth. Choose outside mount for maximum light blocking, shallow frames, or to make windows appear larger.",
      "position": 6
    }
  ]
};

// FAQ Schema for mounting questions
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the minimum depth for inside mount blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Minimum depth varies by product: Mini blinds need 1.5\", cellular shades need 1.75\", wood blinds need 2.5\", and roman shades need 3\". Check specific product pages for exact requirements."
      }
    },
    {
      "@type": "Question",
      "name": "Which mount is better for bedrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Outside mount is generally better for bedrooms because it provides superior light blocking by covering the entire window opening and eliminating light gaps on the sides. This is especially important for blackout needs."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to add overlap for outside mount?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, for optimal light blocking and privacy, add 3-4 inches to each side of the window opening and 3-4 inches above. Measure to where you want the bottom to fall (windowsill or below)."
      }
    },
    {
      "@type": "Question",
      "name": "Can I install inside mount blinds in a shallow window?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If your window frame depth is less than the product's minimum requirement, you have two options: choose outside mount instead, or select a different product type with shallower depth requirements like mini blinds or certain roller shades."
      }
    },
    {
      "@type": "Question",
      "name": "Which mount option costs less?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Inside mount typically costs less because it requires smaller blinds that fit within your window frame. Outside mount blinds need to be larger to overlap the window opening, using more material."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Inside Mount vs Outside Mount Blinds: Which is Best?",
  "description": "Complete guide to choosing between inside mount and outside mount for your window blinds and shades. Learn the advantages of each and how to measure.",
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
  "datePublished": "2024-01-12",
  "dateModified": "2024-01-12"
};

export default function MountingGuideLayout({
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
