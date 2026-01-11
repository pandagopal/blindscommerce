import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blinds vs Shutters: Which Should You Choose? | Complete Guide",
  description: "Compare blinds vs shutters - cost, durability, style, and home value. Learn which window treatment is right for your home and budget.",
  keywords: "blinds vs shutters, shutters or blinds, plantation shutters vs blinds, window blinds comparison, shutter cost, blinds cost",
  openGraph: {
    title: "Blinds vs Shutters: Complete Comparison Guide",
    description: "Blinds or shutters? Compare cost, durability, home value impact, and find the perfect window treatment for your situation.",
    type: "article",
    url: "https://smartblindshub.com/blinds-vs-shutters",
  },
  alternates: {
    canonical: "https://smartblindshub.com/blinds-vs-shutters",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do shutters increase home value more than blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, plantation shutters are considered a home improvement that can increase resale value by 3-5%. They're seen as permanent fixtures rather than window coverings. Blinds, while functional and attractive, don't typically add to home value."
      }
    },
    {
      "@type": "Question",
      "name": "Which is better for energy efficiency - blinds or shutters?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Both can be energy efficient. Cellular (honeycomb) shades offer the best insulation among blinds with R-values up to 5. Shutters provide excellent insulation due to their solid construction and create an air gap when closed."
      }
    },
    {
      "@type": "Question",
      "name": "Are shutters worth the extra cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If you plan to stay in your home long-term, shutters are often worth it. They last 20-30 years vs 5-10 for blinds, require less maintenance, and add home value. For rentals or short-term situations, blinds make more financial sense."
      }
    },
    {
      "@type": "Question",
      "name": "Can I install shutters myself?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While DIY shutter installation is possible, it's more challenging than blinds. Shutters require precise measurements, level mounting, and often custom fitting. Professional installation is recommended for the best results."
      }
    },
    {
      "@type": "Question",
      "name": "Which provides better light control - blinds or shutters?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Both offer excellent light control. Shutters have adjustable louvers for precise control. Blinds offer more variety from sheer to blackout options, and some styles like top-down/bottom-up provide more flexibility."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Blinds vs Shutters: Which Window Treatment Should You Choose?",
  "description": "Complete comparison guide between blinds and shutters covering cost, durability, home value, and best use cases.",
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

export default function BlindsVsShuttersLayout({
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
