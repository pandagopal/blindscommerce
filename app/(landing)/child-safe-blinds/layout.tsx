import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Child-Safe Blinds & Shades | Cordless & Motorized | Smart Blinds Hub",
  description: "Shop child-safe window treatments. Cordless and motorized blinds eliminate cord hazards. WCMA certified safe options for nurseries, kids rooms, and family homes.",
  keywords: "child safe blinds, kid safe blinds, cordless blinds child safety, nursery blinds, baby safe window treatments, WCMA certified blinds",
  openGraph: {
    title: "Child-Safe Window Treatments | Protect Your Family",
    description: "Keep children safe with cordless and motorized blinds. No dangerous cords. WCMA certified options for every room.",
    type: "website",
    url: "https://smartblindshub.com/child-safe-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/child-safe-blinds",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why are corded blinds dangerous for children?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Corded blinds have dangling cords or loops that pose strangulation hazards. Young children can become entangled when playing near windows. The CPSC reports hundreds of cord-related injuries and deaths, making cordless options essential for child safety."
      }
    },
    {
      "@type": "Question",
      "name": "What is WCMA certification for blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "WCMA (Window Covering Manufacturers Association) certifies window treatments that meet strict child safety standards. Look for the 'Best for Kids' certification which indicates the product has no accessible cords that could pose a strangulation hazard."
      }
    },
    {
      "@type": "Question",
      "name": "What are the safest blinds for nurseries?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The safest options for nurseries are cordless cellular shades (also provide blackout for sleep) or motorized blinds. Both eliminate cord hazards entirely. Cordless blackout cellular shades are particularly popular for helping babies sleep."
      }
    },
    {
      "@type": "Question",
      "name": "Are motorized blinds safer than cordless?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Both are equally safe from a cord-hazard perspective - neither has accessible cords. Motorized blinds offer additional convenience and are better for high windows or multiple windows. Either choice eliminates the strangulation risk."
      }
    },
    {
      "@type": "Question",
      "name": "Do child-safe blinds cost more?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cordless blinds typically cost $10-30 more than corded versions. Motorized adds $100-300+ per blind. However, many manufacturers are making cordless standard at no extra charge. The safety benefit far outweighs any cost difference."
      }
    }
  ]
};

export default function ChildSafeBlindsLayout({
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
