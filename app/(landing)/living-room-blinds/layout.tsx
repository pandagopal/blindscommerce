import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Living Room Blinds & Shades | Stylish Window Treatments | Smart Blinds Hub",
  description: "Shop beautiful living room blinds and shades. Roman shades, wood blinds, cellular shades, and more. Find the perfect style for your home. Free shipping available.",
  keywords: "living room blinds, living room window treatments, living room shades, roman shades living room, wood blinds living room, stylish blinds",
  openGraph: {
    title: "Living Room Blinds & Shades | Style Meets Function",
    description: "Beautiful window treatments that enhance your living room. Roman shades, wood blinds, cellular shades, and more styles to match any décor.",
    type: "website",
    url: "https://smartblindshub.com/living-room-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/living-room-blinds",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What blinds make a living room look bigger?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Light-colored blinds and shades make rooms appear larger. White or cream cellular shades, sheer roller shades that let light through, and mounting blinds at ceiling height all create the illusion of more space."
      }
    },
    {
      "@type": "Question",
      "name": "Should living room blinds match the furniture?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blinds don't need to exactly match furniture, but should complement the room's color palette. Neutral blinds (white, cream, gray) work with any decor. For a cohesive look, pull colors from your accent pieces or wall color."
      }
    },
    {
      "@type": "Question",
      "name": "What's the best light level for a living room?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most living rooms benefit from light filtering options that soften harsh sunlight while maintaining brightness. For media rooms or TV viewing areas, consider room darkening or blackout for glare control."
      }
    },
    {
      "@type": "Question",
      "name": "Are motorized blinds worth it for living rooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For large windows, hard-to-reach windows, or multiple windows, motorized blinds add convenience and can be controlled with your phone or voice. They're especially popular for living rooms where you want seamless control."
      }
    },
    {
      "@type": "Question",
      "name": "What's the best choice for sliding glass doors in living rooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vertical blinds are the classic choice for easy access. Sliding panel tracks offer a modern alternative. Motorized roller shades that can be stacked are also popular for a clean look."
      }
    }
  ]
};

export default function LivingRoomBlindsLayout({
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
