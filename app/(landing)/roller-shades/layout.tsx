import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roller Shades | Modern Window Shades & Motorized Options | Smart Blinds Hub",
  description: "Shop roller shades with clean, modern design. Sheer to blackout options. Motorized & smart home ready. 100+ fabric choices. Custom sizes. Free shipping over $99!",
  keywords: "roller shades, roller blinds, window shades, motorized shades, smart shades, blackout roller shades, solar shades",
  openGraph: {
    title: "Roller Shades | Modern Window Shades",
    description: "Premium roller shades for modern homes. Motorized & smart home options. 100+ fabrics. Free shipping over $99.",
    type: "website",
    url: "https://smartblindshub.com/roller-shades",
  },
  alternates: {
    canonical: "https://smartblindshub.com/roller-shades",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are roller shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Roller shades are window coverings made from a single piece of fabric that rolls up onto a tube at the top of the window. They offer a clean, minimalist look and smooth operation, with options from sheer to blackout."
      }
    },
    {
      "@type": "Question",
      "name": "Can roller shades be motorized?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Our motorized roller shades can be controlled via remote, smartphone app, or voice commands through Amazon Alexa, Google Home, and Apple HomeKit. You can set schedules and integrate with your smart home system."
      }
    },
    {
      "@type": "Question",
      "name": "Are roller shades good for bedrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Roller shades come in blackout options that block 99-100% of light, making them excellent for bedrooms. We recommend cordless or motorized options for convenience and child safety."
      }
    },
    {
      "@type": "Question",
      "name": "What opacity level should I choose for roller shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sheer (80-90% light) for living rooms, Light Filtering (40-60%) for most spaces, Room Darkening (5-10%) for bedrooms and media rooms, Blackout (0%) for complete darkness in bedrooms or home theaters."
      }
    },
    {
      "@type": "Question",
      "name": "How do I measure for roller shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For inside mount, measure width at top, middle, and bottom - use the narrowest. Measure height on left, center, and right - use the longest. For outside mount, add 2-3 inches on each side."
      }
    }
  ]
};

export default function RollerShadesLayout({
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
