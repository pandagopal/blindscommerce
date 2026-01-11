import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Office Blinds & Shades | Work From Home Window Treatments | Smart Blinds Hub",
  description: "Shop blinds and shades designed for home offices. Reduce screen glare, improve video call lighting, and stay productive with the right window treatments.",
  keywords: "home office blinds, work from home shades, office window treatments, reduce glare blinds, video call lighting, WFH blinds",
  openGraph: {
    title: "Home Office Blinds | Better Light for Working From Home",
    description: "Create the perfect home office environment with blinds that reduce glare, improve video calls, and help you stay focused.",
    type: "website",
    url: "https://smartblindshub.com/home-office-blinds",
  },
  alternates: {
    canonical: "https://smartblindshub.com/home-office-blinds",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the best blinds for a home office?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The best blinds for home offices are light filtering shades that reduce glare without making the room dark. Solar shades (3-5% openness), light filtering cellular shades, and sheer shades are excellent choices. For video calls, avoid backlit windows - use blackout or room darkening shades behind you to control lighting."
      }
    },
    {
      "@type": "Question",
      "name": "How do I reduce screen glare from windows?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To reduce screen glare: 1) Position your desk perpendicular to windows, not facing them. 2) Use solar shades with 3-5% openness to filter harsh light while maintaining your view. 3) Consider top-down bottom-up shades to block direct sunlight from specific angles. 4) Light filtering cellular shades diffuse light evenly without harsh shadows."
      }
    },
    {
      "@type": "Question",
      "name": "What blinds look best for video calls?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For video calls, the goal is controlled, flattering light on your face. Light filtering shades in neutral colors create a professional backdrop. Avoid sitting with a bright window behind you - use blackout or room darkening shades there. Motorized blinds let you adjust quickly between calls without leaving your seat."
      }
    },
    {
      "@type": "Question",
      "name": "Should I get motorized blinds for my home office?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Motorized blinds are highly recommended for home offices. They let you adjust light throughout the day without interrupting your work. You can set schedules to automatically adjust with the sun, use voice commands during calls, or control them via app. The convenience is especially valuable for multiple windows."
      }
    },
    {
      "@type": "Question",
      "name": "What openness percentage is best for home office solar shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For home offices, 3-5% openness is ideal. This range reduces glare significantly while maintaining your view of the outdoors. 1% openness blocks more light but reduces visibility. 10% preserves more view but may not reduce glare enough. Consider which direction your windows face - west-facing windows may need lower openness."
      }
    }
  ]
};

export default function HomeOfficeBlindsLayout({
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
