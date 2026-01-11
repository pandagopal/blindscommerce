import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motorized vs Cordless Blinds: Which is Better? | Comparison Guide",
  description: "Compare motorized blinds vs cordless blinds. Learn about smart home integration, cost differences, convenience, and which option is right for your windows.",
  keywords: "motorized blinds vs cordless, motorized shades, cordless blinds, smart blinds, automated blinds, child safe blinds, motorized window treatments",
  openGraph: {
    title: "Motorized vs Cordless Blinds: Complete Comparison",
    description: "Both eliminate cords for child safety. Compare cost, smart home features, and convenience to choose the right lift system.",
    type: "article",
    url: "https://smartblindshub.com/motorized-vs-cordless-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/motorized-vs-cordless-blinds",
  },
};

// FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Are motorized blinds worth the extra cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For hard-to-reach windows, skylights, or smart home enthusiasts, motorized blinds provide real daily value through one-touch or voice control and scheduling capabilities. For standard accessible windows, cordless may be sufficient."
      }
    },
    {
      "@type": "Question",
      "name": "How long do motorized blind batteries last?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most motorized blinds with rechargeable batteries last 6-12 months on a single charge with normal use. Solar-powered options can last indefinitely. Hardwired motorized blinds never need battery changes."
      }
    },
    {
      "@type": "Question",
      "name": "Which is safer for children - motorized or cordless?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Both are equally safe as neither has dangling cords. Cordless blinds operate with a push/pull mechanism, while motorized blinds use remotes or apps. Both are certified child-safe and meet WCMA standards."
      }
    },
    {
      "@type": "Question",
      "name": "Can I convert cordless blinds to motorized later?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Some brands offer motor retrofit kits, but it's usually more cost-effective to buy motorized from the start. Converting typically requires replacing the entire headrail."
      }
    },
    {
      "@type": "Question",
      "name": "Do motorized blinds work during power outages?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Battery-powered and rechargeable motorized blinds work independently of home power. Hardwired options may include battery backup. Most also have manual override options."
      }
    }
  ]
};

// Article Schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Motorized vs Cordless Blinds: Which Should You Choose?",
  "description": "Complete comparison between motorized and cordless blinds covering cost, smart home integration, convenience, and child safety features.",
  "author": {
    "@type": "Person",
    "name": "David Thompson",
    "jobTitle": "Smart Home Technology Specialist"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Smart Blinds Hub",
    "url": "https://smartblindshub.com"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-15"
};

export default function MotorizedVsCordlessLayout({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {children}
    </>
  );
}
