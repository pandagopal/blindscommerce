import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bathroom Blinds & Shades | Moisture Resistant Window Treatments | Smart Blinds Hub",
  description: "Shop waterproof bathroom blinds. Faux wood, aluminum, and vinyl options that resist humidity and mold. Privacy and style for any bathroom. Free shipping available.",
  keywords: "bathroom blinds, waterproof blinds, moisture resistant blinds, bathroom window treatments, faux wood blinds bathroom, bathroom shades, humidity resistant blinds",
  openGraph: {
    title: "Bathroom Blinds & Shades | Waterproof Window Treatments",
    description: "Moisture-resistant blinds designed for bathroom humidity. Faux wood, aluminum, and vinyl options that won't warp or mold.",
    type: "website",
    url: "https://smartblindshub.com/bathroom-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/bathroom-blinds",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Can I put wood blinds in my bathroom?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Real wood blinds are not recommended for bathrooms. The humidity and steam from showers will cause warping, cracking, and discoloration. Choose faux wood blinds instead - they look like real wood but are 100% waterproof."
      }
    },
    {
      "@type": "Question",
      "name": "What blinds are best for high humidity?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Faux wood blinds, aluminum mini blinds, vinyl roller shades, and composite shutters are all excellent for high humidity. They won't warp, crack, or develop mold."
      }
    },
    {
      "@type": "Question",
      "name": "How do I clean bathroom blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Faux wood and aluminum blinds can be wiped with a damp cloth or mild soap and water. For deeper cleaning, you can remove them and rinse in the bathtub. Regular cleaning prevents mildew buildup."
      }
    },
    {
      "@type": "Question",
      "name": "Are cellular shades OK for bathrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standard cellular shades can trap moisture and develop mold. However, some manufacturers offer moisture-resistant cellular shades specifically designed for bathrooms. Check product specifications before buying."
      }
    },
    {
      "@type": "Question",
      "name": "Will bathroom blinds get moldy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Not if you choose the right materials. Faux wood, aluminum, vinyl, and composite materials resist mold and mildew. Ensure good bathroom ventilation and occasionally wipe down blinds to prevent any buildup."
      }
    }
  ]
};

export default function BathroomBlindsLayout({
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
