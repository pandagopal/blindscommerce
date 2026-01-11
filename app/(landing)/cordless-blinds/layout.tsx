import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cordless Blinds & Shades | Child-Safe Window Treatments | Smart Blinds Hub",
  description: "Shop cordless blinds and shades for a clean look and child safety. No cords to tangle or pose hazards. Easy push/pull operation. Free shipping available.",
  keywords: "cordless blinds, cordless shades, child safe blinds, no cord blinds, cordless window treatments, safe blinds for kids",
  openGraph: {
    title: "Cordless Blinds & Shades | Safe & Stylish",
    description: "Child-safe cordless blinds with easy push/pull operation. No dangling cords means safety for kids and pets, plus a cleaner look.",
    type: "website",
    url: "https://smartblindshub.com/cordless-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/cordless-blinds",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do cordless blinds work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cordless blinds use an internal spring mechanism. To lower, gently pull down on the bottom rail. To raise, push up on the bottom rail and release - the spring tension will hold the blind at your desired height. No cords needed."
      }
    },
    {
      "@type": "Question",
      "name": "Are cordless blinds safer than corded blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, cordless blinds are significantly safer. Corded blinds pose strangulation hazards - cords have been linked to child injuries and deaths. All major safety organizations recommend cordless or motorized options for homes with children and pets."
      }
    },
    {
      "@type": "Question",
      "name": "Do cordless blinds cost more than corded blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cordless blinds typically cost $10-30 more per blind than corded versions. However, the safety benefits and cleaner appearance make them worth the small premium. Many manufacturers are making cordless the standard option."
      }
    },
    {
      "@type": "Question",
      "name": "Can cordless blinds be repaired if the spring breaks?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, cordless mechanisms can often be repaired or replaced. If the spring tension becomes too loose or too tight, you can usually reset it by fully extending the blind and re-rolling. If the mechanism fails, replacement parts are available for most brands."
      }
    },
    {
      "@type": "Question",
      "name": "Are cordless blinds available for large windows?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, but with limitations. Cordless springs can handle windows up to about 72 inches wide depending on the shade type. For very large or heavy shades, motorized is often recommended as it's easier to operate and still cord-free."
      }
    }
  ]
};

export default function CordlessBlindsLayout({
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
