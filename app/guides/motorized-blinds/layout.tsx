import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata({
  title: 'Motorized Blinds Buying Guide - Smart Window Treatments',
  description: 'Complete guide to motorized blinds and smart shades. Learn about power options, smart home integration, voice control, and find the best motorized window treatments.',
  keywords: [
    'motorized blinds',
    'smart blinds',
    'motorized shades',
    'automated blinds',
    'smart home blinds',
    'voice controlled blinds',
  ],
  path: '/guides/motorized-blinds',
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do motorized blinds work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Motorized blinds have a small, quiet motor built into the headrail that raises and lowers the blinds at the touch of a button. They can be controlled via handheld remote, wall switch, smartphone app, voice commands (Alexa, Google Home), or automated schedules."
      }
    },
    {
      "@type": "Question",
      "name": "Are motorized blinds worth the extra cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Motorized blinds are worth it for hard-to-reach windows, skylights, large or heavy blinds, smart home enthusiasts, child safety (no cords), and convenience. They typically add $100-300+ per blind but provide daily value through one-touch control and scheduling capabilities."
      }
    },
    {
      "@type": "Question",
      "name": "What power options are available for motorized blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Three main options: Rechargeable batteries (6-12 month life, USB charging), hardwired (professional installation, never needs charging), and solar-powered (solar panel keeps batteries charged indefinitely). Battery-powered is most popular for easy DIY installation."
      }
    },
    {
      "@type": "Question",
      "name": "Do motorized blinds work with Alexa and Google Home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, most modern motorized blinds integrate with Amazon Alexa, Google Home, and Apple HomeKit. You can control them with voice commands like 'Alexa, close the bedroom blinds' or include them in smart home routines and scenes."
      }
    },
    {
      "@type": "Question",
      "name": "What happens if the motor fails or batteries die?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most motorized blinds have a manual override option so you can operate them without power. Rechargeable batteries last 6-12 months and take a few hours to charge. Motors typically have 3-5 year warranties and can be replaced if needed."
      }
    },
    {
      "@type": "Question",
      "name": "Can I install motorized blinds myself?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Battery-powered and rechargeable motorized blinds install just like regular blinds - mount the brackets and hang the blinds. No electrician needed. Only hardwired options require professional installation."
      }
    }
  ]
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Motorized Blinds Buying Guide: Smart Home Window Treatments",
  "description": "Everything you need to know about motorized and smart blinds including power options, smart home integration, and which rooms benefit most.",
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

export default function MotorizedBlindsBuyingGuideLayout({
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
