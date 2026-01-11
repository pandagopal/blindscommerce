import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Light Filtering vs Room Darkening vs Blackout Blinds | Smart Blinds Hub",
  description: "Compare light filtering, room darkening, and blackout blinds. Learn which opacity level is right for each room in your home. Expert guide with recommendations.",
  keywords: "light filtering vs blackout, room darkening blinds, blackout shades comparison, light control blinds, opacity levels blinds, which blinds block most light",
  openGraph: {
    title: "Light Filtering vs Room Darkening vs Blackout - Which Do You Need?",
    description: "Complete comparison of light control options. Learn when to choose light filtering, room darkening, or blackout blinds for every room.",
    type: "website",
    url: "https://smartblindshub.com/light-filtering-vs-blackout",
  },
  alternates: {
    canonical: "https://smartblindshub.com/light-filtering-vs-blackout",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the difference between light filtering and blackout blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Light filtering blinds allow natural light to enter while providing privacy - you can see out during the day but others can't see in clearly. They block 40-70% of light. Blackout blinds block 99%+ of light and provide complete privacy day and night. Room darkening falls in between, blocking 85-95% of light."
      }
    },
    {
      "@type": "Question",
      "name": "Which rooms need blackout blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blackout blinds are essential for bedrooms (especially for light sleepers, shift workers, or nurseries), media rooms/home theaters, and any room where you need complete darkness. They're also good for reducing heat gain in west-facing windows."
      }
    },
    {
      "@type": "Question",
      "name": "Are room darkening and blackout the same thing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, they're different. Room darkening blocks 85-95% of light, making rooms significantly darker but not completely dark. Blackout blocks 99%+ of light for near-total darkness. Room darkening is often sufficient for general sleeping, while blackout is better for shift workers, children's naps, or media rooms."
      }
    },
    {
      "@type": "Question",
      "name": "Can light filtering blinds provide privacy at night?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Light filtering blinds provide excellent daytime privacy but limited nighttime privacy. When your interior lights are on at night and it's dark outside, silhouettes may be visible through light filtering fabrics. For nighttime privacy, choose room darkening or blackout options, or layer with curtains."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best opacity for a living room?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Light filtering is usually best for living rooms. It provides daytime privacy while letting in natural light and maintaining your view. If your living room has a TV and you watch during the day, consider room darkening for better screen visibility, or use dual shades with both options."
      }
    },
    {
      "@type": "Question",
      "name": "Do blackout blinds make a room completely dark?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blackout fabric blocks 99%+ of light, but some light may still enter around the edges. For maximum darkness, choose inside mount with minimal gaps, add side channels or frame, select darker fabric colors, or opt for cassette valance to block light at the top."
      }
    }
  ]
};

const comparisonSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Light Filtering vs Room Darkening vs Blackout Blinds: Complete Comparison",
  "description": "Comprehensive guide comparing light filtering, room darkening, and blackout blinds to help you choose the right opacity for each room.",
  "author": {
    "@type": "Person",
    "name": "Jennifer Walsh",
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

export default function LightFilteringVsBlackoutLayout({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonSchema) }}
      />
      {children}
    </>
  );
}
