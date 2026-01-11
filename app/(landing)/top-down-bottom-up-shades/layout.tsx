import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Down Bottom Up Shades | Versatile Light Control | Smart Blinds Hub",
  description: "Shop top down bottom up shades for ultimate privacy and light control. Lower from the top for light while maintaining privacy, or raise from the bottom. Free shipping.",
  keywords: "top down bottom up shades, TDBU blinds, privacy blinds, light control shades, versatile window treatments, dual operation blinds",
  openGraph: {
    title: "Top Down Bottom Up Shades | Versatile Privacy & Light Control",
    description: "The best of both worlds - top down bottom up shades let you control light and privacy independently. Perfect for bathrooms, bedrooms, and street-facing windows.",
    type: "website",
    url: "https://smartblindshub.com/top-down-bottom-up-shades",
  },
  alternates: {
    canonical: "https://smartblindshub.com/top-down-bottom-up-shades",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are top down bottom up shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Top down bottom up (TDBU) shades can be operated from both the top and bottom. You can lower them from the top to let in natural light while maintaining privacy at eye level, or raise them from the bottom like traditional shades. This dual operation gives you complete control over light and privacy."
      }
    },
    {
      "@type": "Question",
      "name": "Where should I use top down bottom up shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TDBU shades are ideal for bathrooms (privacy while showering with light from above), bedrooms (light control without sacrificing privacy), street-facing windows (prevent people from seeing in), home offices (reduce glare while maintaining natural light), and any room where you want flexible light and privacy control."
      }
    },
    {
      "@type": "Question",
      "name": "How do cordless top down bottom up shades work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cordless TDBU shades have two rails - one at the top and one in the middle. You can move either rail independently by gently pushing or pulling it. Move the middle rail up to raise the shade from the bottom, or move the top rail down to lower it from the top. Spring mechanisms hold the rails in place at any position."
      }
    },
    {
      "@type": "Question",
      "name": "Are top down bottom up shades more expensive?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TDBU shades typically cost 15-25% more than standard single-operation shades due to the additional hardware required for dual operation. However, many customers find the extra versatility worth the investment, especially for bathrooms and bedrooms where privacy is important."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get motorized top down bottom up shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, motorized TDBU shades are available. They allow you to control both the top and bottom positions with a remote, smartphone app, or voice commands. This is especially convenient for hard-to-reach windows or for integrating with smart home systems."
      }
    }
  ]
};

export default function TopDownBottomUpShadesLayout({
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
