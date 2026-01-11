import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cellular Shades | Energy Efficient Honeycomb Blinds | Smart Blinds Hub",
  description: "Shop cellular shades with honeycomb design for maximum energy efficiency. Save up to 25% on energy bills. Single, double & triple cell options. Cordless & motorized available.",
  keywords: "cellular shades, honeycomb blinds, energy efficient blinds, insulating shades, honeycomb shades, cellular blinds, blackout cellular shades",
  openGraph: {
    title: "Cellular Shades | Energy Efficient Honeycomb Blinds",
    description: "Premium cellular shades with honeycomb design. Save up to 25% on energy bills. Free shipping & lifetime warranty.",
    type: "website",
    url: "https://smartblindshub.com/cellular-shades",
  },
  alternates: {
    canonical: "https://smartblindshub.com/cellular-shades",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are cellular shades and how do they work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular shades, also called honeycomb shades, feature a unique honeycomb-shaped cell structure that traps air to create insulation. This design acts as a barrier between your window and room, keeping heat out in summer and warmth in during winter."
      }
    },
    {
      "@type": "Question",
      "name": "How much can I save on energy bills with cellular shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular shades can reduce heat loss through windows by up to 40% and lower overall energy costs by up to 25%. Double and triple cell options provide even greater savings."
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between single, double, and triple cell shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Single cell shades have one layer of honeycomb cells and offer good insulation at an affordable price. Double cell shades have two layers for approximately 50% more insulation. Triple cell shades provide maximum insulation for extreme climates."
      }
    },
    {
      "@type": "Question",
      "name": "Are cellular shades good for bedrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Blackout cellular shades block 99-100% of light for optimal sleep conditions. The honeycomb structure also provides sound dampening, reducing outside noise by up to 50%."
      }
    },
    {
      "@type": "Question",
      "name": "Can cellular shades be motorized?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Our cellular shades are available with motorization options including battery-powered and hardwired systems. They work with Amazon Alexa, Google Home, and Apple HomeKit."
      }
    }
  ]
};

export default function CellularShadesLayout({
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
