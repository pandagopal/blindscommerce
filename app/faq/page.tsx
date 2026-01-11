"use client";

import { useState } from "react";
import Link from "next/link";
import { FaChevronDown, FaChevronUp, FaShoppingCart, FaRuler, FaTools, FaHome, FaCog, FaSprayCan, FaTruck, FaDollarSign } from "react-icons/fa";

type FAQCategory = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  questions: { q: string; a: string }[];
};

const faqCategories: FAQCategory[] = [
  {
    id: "ordering",
    name: "Ordering & Products",
    icon: FaShoppingCart,
    questions: [
      {
        q: "How do I order custom blinds?",
        a: "Browse our products, select your blind type, enter your exact measurements, choose your options (color, mount type, lift system), and add to cart. Our configurator guides you through each step. Need help? Use our free consultation service."
      },
      {
        q: "What's the difference between blinds and shades?",
        a: "Blinds have individual slats (horizontal or vertical) that tilt to control light and privacy. Shades are made from continuous material that rolls, folds, or stacks when raised. Blinds offer more precise light control; shades typically provide better insulation and a softer look."
      },
      {
        q: "Do you offer free samples?",
        a: "Yes! We offer free samples of our most popular materials and colors. Order up to 10 samples at no cost to see how they look in your space before ordering. Samples typically arrive within 5-7 business days."
      },
      {
        q: "What's your return policy?",
        a: "We offer a 30-day satisfaction guarantee on all orders. If you're not happy with your blinds, contact us for a return or remake. Custom-sized products may be subject to a restocking fee. See our Returns page for full details."
      },
      {
        q: "Can I order blinds for specialty-shaped windows?",
        a: "Yes! We offer solutions for arched windows, skylights, bay windows, corner windows, and other specialty shapes. Some products are better suited than others - contact us for recommendations for your specific window shape."
      }
    ]
  },
  {
    id: "measuring",
    name: "Measuring",
    icon: FaRuler,
    questions: [
      {
        q: "How do I measure my windows for blinds?",
        a: "For inside mount: Measure width at top, middle, and bottom - use the smallest. Measure height at left, center, and right - use the smallest. For outside mount: Measure the area you want to cover, adding 3-4 inches on each side for light blocking. Use a metal tape measure for accuracy."
      },
      {
        q: "What's the difference between inside mount and outside mount?",
        a: "Inside mount fits within your window frame for a clean, built-in look. Outside mount attaches above the window opening and covers more area. Choose inside mount to showcase trim and save space. Choose outside mount for maximum light blocking or shallow windows."
      },
      {
        q: "What if my measurements are wrong?",
        a: "We'll work with you to make it right. Minor errors may be correctable with bracket adjustments. For significant errors, we offer remake programs at reduced cost. Our SureFit guarantee covers manufacturing defects. Always double-check measurements before ordering."
      },
      {
        q: "How much window depth do I need for inside mount?",
        a: "Minimum depth varies by product: Mini blinds need 1.5\", faux wood blinds need 2\", wood blinds need 2.5\", cellular shades need 1.75\", and roman shades need 3\". Check product pages for specific requirements. If depth is insufficient, use outside mount."
      },
      {
        q: "Should I round up or round down my measurements?",
        a: "For inside mount, we recommend recording exact measurements to the nearest 1/8 inch - we'll make the necessary deductions. For outside mount, round up slightly if between sizes to ensure adequate coverage."
      }
    ]
  },
  {
    id: "installation",
    name: "Installation",
    icon: FaTools,
    questions: [
      {
        q: "Can I install blinds myself?",
        a: "Yes! Most blinds can be installed in 15-30 minutes with basic tools (drill, screwdriver, level). We include detailed instructions and mounting hardware. Inside mount is generally easier than outside mount. Our video tutorials walk you through each step."
      },
      {
        q: "What tools do I need to install blinds?",
        a: "You'll need: a drill with appropriate bits, Phillips screwdriver, level, pencil, and measuring tape. For heavier blinds or outside mount on drywall, you may need wall anchors. A step ladder is helpful for high windows."
      },
      {
        q: "Do you offer professional installation?",
        a: "Yes, we partner with professional installers nationwide. Professional installation is recommended for motorized blinds, large windows, specialty shapes, or if you're not comfortable with DIY. Contact us for a quote."
      },
      {
        q: "How do I install outside mount blinds on drywall?",
        a: "Use wall anchors rated for your blind's weight. Mark and pre-drill holes, insert anchors, then secure brackets with screws. For heavier blinds, try to hit at least one stud. Consider toggle bolts for extra holding power."
      },
      {
        q: "Can I install blinds without drilling?",
        a: "Yes, some options include tension-mounted blinds for doors, magnetic blinds for metal frames, and adhesive brackets for lightweight shades. These are great for rentals but may not support heavier blinds."
      }
    ]
  },
  {
    id: "products",
    name: "Product Types & Rooms",
    icon: FaHome,
    questions: [
      {
        q: "What blinds are best for bedrooms?",
        a: "Blackout cellular shades or room darkening roller shades are best for bedrooms. They block 99%+ of light for better sleep. Outside mount provides maximum light blocking. Cordless or motorized options are safest for children's rooms."
      },
      {
        q: "What blinds work best in bathrooms?",
        a: "Faux wood blinds, vinyl shutters, and moisture-resistant cellular shades work best in bathrooms. Avoid real wood blinds as humidity can cause warping. Aluminum mini blinds are a budget-friendly moisture-resistant option."
      },
      {
        q: "Which blinds provide the best insulation?",
        a: "Cellular (honeycomb) shades provide the best insulation. Their honeycomb structure traps air, creating an insulating barrier. Double-cell shades offer even more energy savings. Studies show they can reduce heat loss through windows by up to 40%."
      },
      {
        q: "Are cordless blinds safer than corded blinds?",
        a: "Yes, cordless blinds are significantly safer for homes with children and pets. Corded blinds pose strangulation hazards. All major safety organizations recommend cordless or motorized options. Many areas now require cordless by law for new construction."
      },
      {
        q: "What's best for large windows or sliding glass doors?",
        a: "For sliding doors: vertical blinds, panel tracks, or motorized roller shades. For large windows: consider motorized options for easy operation. Wide windows may need multiple blinds mounted side by side."
      },
      {
        q: "Do you have options for light filtering vs. room darkening?",
        a: "Yes, most of our products come in multiple opacity levels: Sheer (view-through, daytime privacy), Light Filtering (softens light, privacy), Room Darkening (blocks most light), and Blackout (99%+ light blocking)."
      }
    ]
  },
  {
    id: "motorized",
    name: "Motorization & Smart Home",
    icon: FaCog,
    questions: [
      {
        q: "How do motorized blinds work?",
        a: "Motorized blinds have a small motor in the headrail that raises and lowers the blinds at the touch of a button. They can be controlled via remote, smartphone app, voice commands (Alexa, Google Home), or scheduled automations. Power options include rechargeable batteries, hardwired, or solar panels."
      },
      {
        q: "Are motorized blinds worth the extra cost?",
        a: "Motorized blinds are worth it for: hard-to-reach windows, skylights, large/heavy blinds, smart home integration, and child safety. They add convenience with scheduling (open at sunrise) and can increase home value. Consider them especially for living rooms and bedrooms."
      },
      {
        q: "How long do motorized blind batteries last?",
        a: "Rechargeable batteries typically last 6-12 months with normal use (1-2 operations per day). Battery life varies based on blind size and usage frequency. Solar panels can extend battery life indefinitely in sunny locations. Hardwired options never need battery changes."
      },
      {
        q: "Do motorized blinds work during power outages?",
        a: "Battery-powered and rechargeable motorized blinds work independently of home power. Hardwired options may include battery backup. Most motorized blinds also have manual override options for emergencies."
      },
      {
        q: "What smart home systems are compatible?",
        a: "Our motorized blinds work with Amazon Alexa, Google Home, Apple HomeKit (select models), SmartThings, and IFTTT. Check product pages for specific compatibility. Most connect via Wi-Fi or a hub."
      }
    ]
  },
  {
    id: "care",
    name: "Care & Maintenance",
    icon: FaSprayCan,
    questions: [
      {
        q: "How do I clean my blinds?",
        a: "Dust weekly with a microfiber cloth or feather duster. Vacuum monthly with a brush attachment on low suction. For deep cleaning, wipe with a damp cloth and mild soap. Aluminum blinds can be soaked in a bathtub. Never soak wood blinds or fabric shades."
      },
      {
        q: "How often should I clean my blinds?",
        a: "Dust your blinds weekly to prevent buildup. Vacuum with brush attachment monthly. Deep clean every 3-6 months depending on dust levels in your home. Kitchen blinds near cooking may need more frequent cleaning."
      },
      {
        q: "Why won't my blinds stay up?",
        a: "For corded blinds, the cord lock mechanism may be worn - try cleaning it or replacing the lock. For cordless blinds, the internal spring may need resetting - gently pull down fully and release to reset tension. If problems persist, contact customer support."
      },
      {
        q: "Can I repair broken blinds or do I need to replace them?",
        a: "Many issues are repairable: broken cords, worn mechanisms, and damaged slats can often be fixed with replacement parts. We offer repair kits and individual slat replacements. For extensive damage, replacement may be more cost-effective."
      },
      {
        q: "How do I remove yellow stains from blinds?",
        a: "Yellow stains are often from nicotine or UV damage. Try cleaning with warm water and white vinegar solution. For severe yellowing on white vinyl, diluted bleach may help. UV yellowing is usually permanent and may require replacement."
      }
    ]
  },
  {
    id: "shipping",
    name: "Shipping & Delivery",
    icon: FaTruck,
    questions: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping is 7-14 business days for custom blinds. Rush processing (3-5 business days) is available for an additional fee. In-stock items ship within 1-2 business days. Free shipping on orders over $99."
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we ship within the United States, including Alaska and Hawaii. International shipping is not available at this time. Contact us for large commercial orders which may have different options."
      },
      {
        q: "What if my blinds arrive damaged?",
        a: "Inspect your blinds upon delivery. If damaged, take photos and contact us within 48 hours. We'll arrange a replacement at no cost. Do not attempt to install damaged blinds. Keep all packaging materials until the claim is resolved."
      },
      {
        q: "Can I track my order?",
        a: "Yes! You'll receive tracking information via email once your order ships. You can also log into your account to view order status. For custom orders, you'll see updates as your blinds move through production."
      }
    ]
  },
  {
    id: "pricing",
    name: "Pricing & Warranty",
    icon: FaDollarSign,
    questions: [
      {
        q: "Do you price match?",
        a: "Yes! We offer price matching on identical products from major competitors. Contact us with the competitor's price and product details. Some exclusions apply for clearance items and membership-only pricing."
      },
      {
        q: "What warranty do you offer?",
        a: "We offer a limited lifetime warranty on most blinds covering manufacturing defects in materials and workmanship. Motorized components typically have 3-5 year warranties. Normal wear and tear, improper installation, and misuse are not covered. See our Warranty page for full details."
      },
      {
        q: "Do you offer financing?",
        a: "Yes, we offer financing options for qualifying orders through our partner Affirm. Split your purchase into monthly payments with rates as low as 0% APR for qualified buyers. Check rates at checkout with no impact to your credit score."
      },
      {
        q: "Are there any hidden fees?",
        a: "No hidden fees! The price you see includes standard options. Upgrades like motorization, premium fabrics, or specialty shapes are clearly priced. Shipping is free on orders over $99. We're transparent about all costs."
      },
      {
        q: "Do you offer discounts for large orders?",
        a: "Yes! We offer volume discounts for whole-home orders and commercial projects. The more you order, the more you save. Contact our commercial team for a custom quote on orders of 10+ windows."
      }
    ]
  }
];

export default function FAQPage() {
  const [openCategory, setOpenCategory] = useState<string | null>("ordering");
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  const toggleQuestion = (questionKey: string) => {
    setOpenQuestions(prev => ({
      ...prev,
      [questionKey]: !prev[questionKey]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-300">
              Find answers to common questions about ordering, measuring, installing,
              and caring for your window blinds and shades.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-white border-b border-gray-200 py-6 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setOpenCategory(category.id);
                  document.getElementById(category.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  openCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <category.icon className="text-sm" />
                <span className="hidden sm:inline">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {faqCategories.map((category) => (
              <div
                key={category.id}
                id={category.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <category.icon className="text-xl text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                      <p className="text-sm text-gray-500">{category.questions.length} questions</p>
                    </div>
                  </div>
                  {openCategory === category.id ? (
                    <FaChevronUp className="text-gray-400" />
                  ) : (
                    <FaChevronDown className="text-gray-400" />
                  )}
                </button>

                {/* Questions */}
                {openCategory === category.id && (
                  <div className="border-t border-gray-200">
                    {category.questions.map((faq, index) => {
                      const questionKey = `${category.id}-${index}`;
                      const isOpen = openQuestions[questionKey];

                      return (
                        <div key={index} className="border-b border-gray-100 last:border-b-0">
                          <button
                            onClick={() => toggleQuestion(questionKey)}
                            className="w-full flex items-start justify-between p-4 pl-6 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                            {isOpen ? (
                              <FaChevronUp className="text-gray-400 flex-shrink-0 mt-1" />
                            ) : (
                              <FaChevronDown className="text-gray-400 flex-shrink-0 mt-1" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Our window treatment experts are here to help. Get personalized advice
            for your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/consultation"
              className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Free Consultation
            </Link>
            <Link
              href="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Helpful Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Link
              href="/guides/measuring"
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
            >
              <FaRuler className="text-3xl text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Measuring Guide</h3>
              <p className="text-sm text-gray-500">Step-by-step instructions</p>
            </Link>
            <Link
              href="/guides/installation"
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
            >
              <FaTools className="text-3xl text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Installation Guide</h3>
              <p className="text-sm text-gray-500">DIY installation tips</p>
            </Link>
            <Link
              href="/guides/choosing-blinds"
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
            >
              <FaHome className="text-3xl text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Buyer's Guide</h3>
              <p className="text-sm text-gray-500">Find the right blinds</p>
            </Link>
            <Link
              href="/samples"
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
            >
              <FaShoppingCart className="text-3xl text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Free Samples</h3>
              <p className="text-sm text-gray-500">Order up to 10 free</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
