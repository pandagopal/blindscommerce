import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blackout Blinds & Shades | 100% Light Blocking | Smart Blinds Hub",
  description: "Shop blackout blinds for complete darkness. Perfect for bedrooms, nurseries & home theaters. Roller, cellular & roman shade options. Cordless & motorized available. Free shipping!",
  keywords: "blackout blinds, blackout shades, room darkening blinds, blackout roller shades, blackout cellular shades, bedroom blinds, nursery blinds",
  openGraph: {
    title: "Blackout Blinds & Shades | 100% Light Blocking",
    description: "Premium blackout blinds for better sleep. Block 100% of light. Perfect for bedrooms & nurseries. Free shipping!",
    type: "website",
    url: "https://smartblindshub.com/blackout-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/blackout-blinds",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do blackout blinds block 100% of light?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "True blackout blinds block 99-100% of incoming light when properly installed. For complete darkness, we recommend inside mount installation with side channels that eliminate light gaps around the edges."
      }
    },
    {
      "@type": "Question",
      "name": "Are blackout blinds good for sleep?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely! Research shows that sleeping in complete darkness improves sleep quality, duration, and helps regulate your circadian rhythm. Blackout blinds are especially beneficial for shift workers and light-sensitive sleepers."
      }
    },
    {
      "@type": "Question",
      "name": "What's the best type of blackout blind for bedrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For bedrooms, we recommend blackout cellular shades or blackout roller shades. Cellular shades offer energy efficiency and sound dampening, while roller shades provide a clean, modern look with motorization options."
      }
    },
    {
      "@type": "Question",
      "name": "Do blackout blinds help with energy efficiency?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Blackout blinds provide excellent insulation. The thick, opaque fabric blocks heat transfer through windows, keeping rooms cooler in summer and warmer in winter. You can save 10-25% on heating and cooling costs."
      }
    },
    {
      "@type": "Question",
      "name": "Are blackout blinds safe for nurseries?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, when you choose cordless options. We offer cordless blackout blinds that are certified child-safe with no dangling cords. Motorized options provide the ultimate in safety and convenience."
      }
    }
  ]
};

export default function BlackoutBlindsLayout({
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
