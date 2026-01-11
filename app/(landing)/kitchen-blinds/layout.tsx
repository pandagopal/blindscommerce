import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen Blinds & Shades | Easy-Clean Window Treatments | Smart Blinds Hub",
  description: "Shop durable kitchen blinds that resist moisture, grease, and heat. Faux wood, aluminum, and vinyl options. Easy to clean. Free shipping on orders over $99.",
  keywords: "kitchen blinds, kitchen window treatments, blinds for kitchen, faux wood blinds kitchen, easy clean blinds, grease resistant blinds, kitchen shades",
  openGraph: {
    title: "Kitchen Blinds & Shades | Durable, Easy-Clean Options",
    description: "Kitchen-tough window treatments that resist moisture, grease, and heat. Easy to clean faux wood, aluminum, and vinyl blinds.",
    type: "website",
    url: "https://smartblindshub.com/kitchen-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/kitchen-blinds",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the best blinds for above the kitchen sink?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Faux wood blinds or aluminum mini blinds are best over kitchen sinks. They're completely moisture-resistant and won't be damaged by water splashes. Both are easy to wipe clean and won't warp or mold."
      }
    },
    {
      "@type": "Question",
      "name": "Are fabric blinds OK for kitchens?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Fabric blinds are generally not recommended for kitchens, especially near cooking areas. They can absorb grease, odors, and moisture. If you prefer fabric, choose roller shades with vinyl coating for easier maintenance."
      }
    },
    {
      "@type": "Question",
      "name": "How do I clean grease off kitchen blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For faux wood or aluminum blinds, use warm water with dish soap or a degreasing cleaner. For stubborn grease, remove the blinds and soak in the bathtub. Vinyl roller shades can be wiped with a damp cloth and mild cleaner."
      }
    },
    {
      "@type": "Question",
      "name": "What blinds work best for kitchen sliding doors?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vertical blinds or sliding panel tracks are ideal for kitchen sliding doors. They allow easy access, provide good light control, and come in materials that resist moisture and grease."
      }
    },
    {
      "@type": "Question",
      "name": "Can kitchen blinds help reduce heat from windows?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Solar roller shades can block up to 90% of heat and UV rays, keeping your kitchen cooler during sunny hours. Cellular shades also provide good insulation. This can help reduce air conditioning costs in summer."
      }
    }
  ]
};

export default function KitchenBlindsLayout({
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
