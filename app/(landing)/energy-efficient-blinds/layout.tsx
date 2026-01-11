import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Energy Efficient Blinds & Shades | Insulating Window Treatments | Smart Blinds Hub",
  description: "Shop energy-efficient cellular shades and insulating blinds. Reduce heating and cooling costs by up to 25%. Save money while staying comfortable.",
  keywords: "energy efficient blinds, insulating blinds, cellular shades energy, save energy blinds, thermal blinds, honeycomb shades insulation",
  openGraph: {
    title: "Energy Efficient Window Treatments | Save on Energy Bills",
    description: "Cellular shades can reduce energy costs by up to 25%. Trap air for natural insulation year-round.",
    type: "website",
    url: "https://smartblindshub.com/energy-efficient-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/energy-efficient-blinds",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Which blinds are most energy efficient?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular (honeycomb) shades are the most energy-efficient window treatment. Their unique honeycomb structure traps air to create insulation. Double-cell shades provide even more efficiency. Studies show they can reduce heat loss through windows by up to 40% and cut energy bills by up to 25%."
      }
    },
    {
      "@type": "Question",
      "name": "How do cellular shades save energy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular shades have honeycomb-shaped pockets that trap air, creating an insulating barrier between your window and the room. In winter, they prevent heat from escaping through windows. In summer, they block heat from entering. This reduces the workload on your heating and cooling systems."
      }
    },
    {
      "@type": "Question",
      "name": "Are double cell shades worth the extra cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If energy efficiency is your priority, yes. Double cell shades have two layers of honeycomb cells, providing roughly 30% more insulation than single cell. They're especially worthwhile in extreme climates, for large windows, or in rooms you use frequently."
      }
    },
    {
      "@type": "Question",
      "name": "Do energy efficient blinds qualify for tax credits?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Some energy-efficient window treatments may qualify for federal or state energy tax credits. Requirements vary by year and product specifications. Check current IRS guidelines and look for ENERGY STAR certified products for potential eligibility."
      }
    },
    {
      "@type": "Question",
      "name": "What R-value do cellular shades provide?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "R-value measures insulation effectiveness. Single cell shades typically provide R-2 to R-3. Double cell shades can reach R-4 to R-5. For comparison, single-pane windows are about R-1, and double-pane windows are R-2 to R-3. Adding cellular shades significantly improves window insulation."
      }
    }
  ]
};

export default function EnergyEfficientBlindsLayout({
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
