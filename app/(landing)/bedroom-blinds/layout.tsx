import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bedroom Blinds & Shades | Blackout Window Treatments | Smart Blinds Hub",
  description: "Shop the best blinds for bedrooms. Blackout cellular shades, room darkening roller shades, and insulating options for better sleep. Cordless & motorized available.",
  keywords: "bedroom blinds, blackout blinds bedroom, bedroom window treatments, bedroom shades, room darkening blinds, sleep better blinds, nursery blinds",
  openGraph: {
    title: "Bedroom Blinds & Shades | Better Sleep Starts Here",
    description: "Blackout blinds and shades designed for better sleep. Block 100% of light with our bedroom window treatments.",
    type: "website",
    url: "https://smartblindshub.com/bedroom-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/bedroom-blinds",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the best blinds for sleeping?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blackout cellular shades or blackout roller shades are the best options for sleep. They block 99-100% of light, creating complete darkness. Cellular shades add the bonus of noise reduction and temperature control."
      }
    },
    {
      "@type": "Question",
      "name": "Do blackout blinds really block all light?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Quality blackout blinds block 99-100% of incoming light through the fabric. For complete darkness, consider adding side channels or choosing outside mount installation to eliminate light gaps around the edges."
      }
    },
    {
      "@type": "Question",
      "name": "Are blackout blinds safe for nurseries?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, when you choose cordless options. We recommend cordless blackout cellular shades for nurseries - they're certified child-safe with no dangling cords, and they create the perfect dark environment for nap time."
      }
    },
    {
      "@type": "Question",
      "name": "What's better for bedrooms - blinds or shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Shades (especially cellular or roller) are generally better for bedrooms because they offer complete coverage without slats that can let light through. Cellular shades are our top recommendation for their light blocking, insulation, and noise reduction."
      }
    },
    {
      "@type": "Question",
      "name": "Can bedroom blinds help with energy bills?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Cellular shades can reduce heat loss through windows by up to 40%, lowering energy costs by up to 25%. They keep bedrooms cooler in summer and warmer in winter for year-round comfort."
      }
    }
  ]
};

export default function BedroomBlindsLayout({
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
      {children}
    </>
  );
}
