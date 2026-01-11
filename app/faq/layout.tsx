import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | Smart Blinds Hub",
  description: "Find answers to common questions about window blinds, shades, and shutters. Learn about ordering, measuring, installation, care, and shipping.",
  keywords: "blinds FAQ, window blinds questions, how to measure blinds, blinds installation, blinds care, custom blinds help",
  openGraph: {
    title: "Frequently Asked Questions | Smart Blinds Hub",
    description: "Get answers to all your questions about window blinds, shades, measuring, installation, and more.",
    type: "website",
    url: "https://smartblindshub.com/faq",
  },
  alternates: {
    canonical: "https://smartblindshub.com/faq",
  },
};

// Comprehensive FAQ Schema with all questions
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    // Ordering & Products
    {
      "@type": "Question",
      "name": "How do I order custom blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Browse our products, select your blind type, enter your exact measurements, choose your options (color, mount type, lift system), and add to cart. Our configurator guides you through each step. Need help? Use our free consultation service."
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between blinds and shades?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blinds have individual slats (horizontal or vertical) that tilt to control light and privacy. Shades are made from continuous material that rolls, folds, or stacks when raised. Blinds offer more precise light control; shades typically provide better insulation and a softer look."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer free samples?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! We offer free samples of our most popular materials and colors. Order up to 10 samples at no cost to see how they look in your space before ordering. Samples typically arrive within 5-7 business days."
      }
    },
    {
      "@type": "Question",
      "name": "What's your return policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We offer a 30-day satisfaction guarantee on all orders. If you're not happy with your blinds, contact us for a return or remake. Custom-sized products may be subject to a restocking fee. See our Returns page for full details."
      }
    },
    // Measuring
    {
      "@type": "Question",
      "name": "How do I measure my windows for blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For inside mount: Measure width at top, middle, and bottom - use the smallest. Measure height at left, center, and right - use the smallest. For outside mount: Measure the area you want to cover, adding 3-4 inches on each side for light blocking. Use a metal tape measure for accuracy."
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between inside mount and outside mount?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Inside mount fits within your window frame for a clean, built-in look. Outside mount attaches above the window opening and covers more area. Choose inside mount to showcase trim and save space. Choose outside mount for maximum light blocking or shallow windows."
      }
    },
    {
      "@type": "Question",
      "name": "What if my measurements are wrong?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We'll work with you to make it right. Minor errors may be correctable with bracket adjustments. For significant errors, we offer remake programs at reduced cost. Our SureFit guarantee covers manufacturing defects. Always double-check measurements before ordering."
      }
    },
    {
      "@type": "Question",
      "name": "How much window depth do I need for inside mount?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Minimum depth varies by product: Mini blinds need 1.5\", faux wood blinds need 2\", wood blinds need 2.5\", cellular shades need 1.75\", and roman shades need 3\". Check product pages for specific requirements. If depth is insufficient, use outside mount."
      }
    },
    // Installation
    {
      "@type": "Question",
      "name": "Can I install blinds myself?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Most blinds can be installed in 15-30 minutes with basic tools (drill, screwdriver, level). We include detailed instructions and mounting hardware. Inside mount is generally easier than outside mount. Our video tutorials walk you through each step."
      }
    },
    {
      "@type": "Question",
      "name": "What tools do I need to install blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You'll need: a drill with appropriate bits, Phillips screwdriver, level, pencil, and measuring tape. For heavier blinds or outside mount on drywall, you may need wall anchors. A step ladder is helpful for high windows."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer professional installation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we partner with professional installers nationwide. Professional installation is recommended for motorized blinds, large windows, specialty shapes, or if you're not comfortable with DIY. Contact us for a quote."
      }
    },
    // Product Types
    {
      "@type": "Question",
      "name": "What blinds are best for bedrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blackout cellular shades or room darkening roller shades are best for bedrooms. They block 99%+ of light for better sleep. Outside mount provides maximum light blocking. Cordless or motorized options are safest for children's rooms."
      }
    },
    {
      "@type": "Question",
      "name": "What blinds work best in bathrooms?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Faux wood blinds, vinyl shutters, and moisture-resistant cellular shades work best in bathrooms. Avoid real wood blinds as humidity can cause warping. Aluminum mini blinds are a budget-friendly moisture-resistant option."
      }
    },
    {
      "@type": "Question",
      "name": "Which blinds provide the best insulation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cellular (honeycomb) shades provide the best insulation. Their honeycomb structure traps air, creating an insulating barrier. Double-cell shades offer even more energy savings. Studies show they can reduce heat loss through windows by up to 40%."
      }
    },
    {
      "@type": "Question",
      "name": "Are cordless blinds safer than corded blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, cordless blinds are significantly safer for homes with children and pets. Corded blinds pose strangulation hazards and have been involved in child injuries. All major safety organizations recommend cordless or motorized options. Many areas now require cordless by law for new construction."
      }
    },
    // Motorization & Smart Home
    {
      "@type": "Question",
      "name": "How do motorized blinds work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Motorized blinds have a small motor in the headrail that raises and lowers the blinds at the touch of a button. They can be controlled via remote, smartphone app, voice commands (Alexa, Google Home), or scheduled automations. Power options include rechargeable batteries, hardwired, or solar panels."
      }
    },
    {
      "@type": "Question",
      "name": "Are motorized blinds worth the extra cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Motorized blinds are worth it for: hard-to-reach windows, skylights, large/heavy blinds, smart home integration, and child safety. They add convenience with scheduling (open at sunrise) and can increase home value. Consider them especially for living rooms and bedrooms."
      }
    },
    {
      "@type": "Question",
      "name": "How long do motorized blind batteries last?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Rechargeable batteries typically last 6-12 months with normal use (1-2 operations per day). Battery life varies based on blind size and usage frequency. Solar panels can extend battery life indefinitely in sunny locations. Hardwired options never need battery changes."
      }
    },
    // Care & Maintenance
    {
      "@type": "Question",
      "name": "How do I clean my blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dust weekly with a microfiber cloth or feather duster. Vacuum monthly with a brush attachment on low suction. For deep cleaning, wipe with a damp cloth and mild soap. Aluminum blinds can be soaked in a bathtub. Never soak wood blinds or fabric shades."
      }
    },
    {
      "@type": "Question",
      "name": "How often should I clean my blinds?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dust your blinds weekly to prevent buildup. Vacuum with brush attachment monthly. Deep clean every 3-6 months depending on dust levels in your home. Kitchen blinds near cooking may need more frequent cleaning."
      }
    },
    {
      "@type": "Question",
      "name": "Why won't my blinds stay up?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For corded blinds, the cord lock mechanism may be worn - try cleaning it or replacing the lock. For cordless blinds, the internal spring may need resetting - gently pull down fully and release to reset tension. If problems persist, contact customer support."
      }
    },
    // Shipping & Delivery
    {
      "@type": "Question",
      "name": "How long does shipping take?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standard shipping is 7-14 business days for custom blinds. Rush processing (3-5 business days) is available for an additional fee. In-stock items ship within 1-2 business days. Free shipping on orders over $99."
      }
    },
    {
      "@type": "Question",
      "name": "Do you ship internationally?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Currently, we ship within the United States, including Alaska and Hawaii. International shipping is not available at this time. Contact us for large commercial orders which may have different options."
      }
    },
    {
      "@type": "Question",
      "name": "What if my blinds arrive damaged?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Inspect your blinds upon delivery. If damaged, take photos and contact us within 48 hours. We'll arrange a replacement at no cost. Do not attempt to install damaged blinds. Keep all packaging materials until the claim is resolved."
      }
    },
    // Pricing & Warranty
    {
      "@type": "Question",
      "name": "Do you price match?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! We offer price matching on identical products from major competitors. Contact us with the competitor's price and product details. Some exclusions apply for clearance items and membership-only pricing."
      }
    },
    {
      "@type": "Question",
      "name": "What warranty do you offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We offer a limited lifetime warranty on most blinds covering manufacturing defects in materials and workmanship. Motorized components typically have 3-5 year warranties. Normal wear and tear, improper installation, and misuse are not covered. See our Warranty page for full details."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer financing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we offer financing options for qualifying orders through our partner Affirm. Split your purchase into monthly payments with rates as low as 0% APR for qualified buyers. Check rates at checkout with no impact to your credit score."
      }
    }
  ]
};

export default function FAQLayout({
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
