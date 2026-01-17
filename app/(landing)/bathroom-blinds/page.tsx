"use client";

import Link from "next/link";
import { FaTint, FaShieldAlt, FaSun, FaLeaf, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function BathroomBlindsPage() {
  const priorities = [
    {
      icon: FaTint,
      title: "Moisture Resistant",
      description: "Materials that withstand humidity, steam, and splashing without warping or mold."
    },
    {
      icon: FaShieldAlt,
      title: "Privacy",
      description: "Complete coverage for bathroom privacy, even in bright daylight."
    },
    {
      icon: FaSun,
      title: "Light Control",
      description: "Balance natural light for morning routines while maintaining privacy."
    },
    {
      icon: FaLeaf,
      title: "Easy to Clean",
      description: "Wipe-clean surfaces that resist mildew and soap residue."
    }
  ];

  const recommendations = [
    {
      name: "Faux Wood Blinds",
      tag: "Best Overall",
      description: "Look of real wood without moisture damage. Perfect for high-humidity bathrooms.",
      features: ["100% waterproof", "Won't warp or crack", "Easy wipe clean", "Multiple colors"],
      priceFrom: "$39.99",
      href: "/products?category=faux-wood-blinds"
    },
    {
      name: "Aluminum Mini Blinds",
      tag: "Best Budget",
      description: "Affordable and completely moisture-proof. Great for rental properties.",
      features: ["Rust-resistant", "Budget friendly", "Many colors", "Easy install"],
      priceFrom: "$19.99",
      href: "/products?category=aluminum-blinds"
    },
    {
      name: "Vinyl Roller Shades",
      tag: "Modern Look",
      description: "Sleek, modern appearance with excellent moisture resistance. Easy to clean.",
      features: ["Moisture resistant", "Light filtering options", "Smooth operation", "Custom sizes"],
      priceFrom: "$29.99",
      href: "/products?category=roller-shades&material=vinyl"
    },
    {
      name: "Composite Shutters",
      tag: "Premium Choice",
      description: "The look of plantation shutters with waterproof durability. Adds home value.",
      features: ["Completely waterproof", "Durable composite", "Classic style", "Easy clean"],
      priceFrom: "$149.99",
      href: "/products?category=shutters&material=composite"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-cyan-700 via-teal-600 to-cyan-800 text-white py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Shop by Room
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Bathroom Blinds & Shades
            </h1>
            <p className="text-xl md:text-2xl text-cyan-100 mb-8">
              Moisture-resistant window treatments built for bathroom humidity.
              Privacy, style, and durability that lasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?room=bathroom"
                className="bg-white text-cyan-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Bathroom Blinds <FaArrowRight className="ml-2" />
              </Link>
              <Link
                href="/customer/samples"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Order Free Samples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What Matters */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What Matters Most in a Bathroom
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Bathrooms require window treatments that handle moisture while providing privacy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {priorities.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <item.icon className="text-5xl text-cyan-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warning Section */}
      <section className="py-12 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-amber-500">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span className="text-amber-500 mr-3">⚠️</span>
                Avoid These in Bathrooms
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-red-700 mb-2">Not Recommended:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      Real wood blinds (will warp and crack)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      Fabric roman shades (mold risk)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      Standard cellular shades (moisture damage)
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-green-700 mb-2">Best Choices:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      Faux wood blinds (waterproof)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      Vinyl or PVC roller shades
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      Aluminum mini blinds (rust-resistant)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Best Blinds for Bathrooms
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our top moisture-resistant picks for bathroom windows.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {recommendations.map((product, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {product.tag}
                    </span>
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <ul className="space-y-2 mb-6">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <FaCheck className="text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-cyan-600">From {product.priceFrom}</span>
                  <Link
                    href={product.href}
                    className="text-cyan-600 hover:text-cyan-800 font-semibold inline-flex items-center"
                  >
                    Shop Now <FaArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bathroom Types */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Solutions by Bathroom Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                room: "Master Bath",
                recommendation: "Faux wood blinds or composite shutters",
                why: "Premium look that matches bedroom décor. Excellent light control for morning routines."
              },
              {
                room: "Kids' Bathroom",
                recommendation: "Aluminum mini blinds",
                why: "Durable, affordable, and easy to clean. Handles splashing and humidity."
              },
              {
                room: "Guest Bath",
                recommendation: "Vinyl roller shades",
                why: "Modern, clean appearance. Low maintenance for occasional use."
              },
              {
                room: "Powder Room",
                recommendation: "Top-down bottom-up shades",
                why: "Let light in from top while maintaining privacy below. Great for half baths."
              },
              {
                room: "Shower Window",
                recommendation: "Vinyl or PVC blinds",
                why: "Completely waterproof for direct moisture exposure. Won't mold or mildew."
              },
              {
                room: "Skylight",
                recommendation: "Motorized cellular shades",
                why: "Moisture-resistant cellular for skylights. Remote control for unreachable windows."
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.room}</h3>
                <p className="text-cyan-600 font-medium mb-2">{item.recommendation}</p>
                <p className="text-gray-600 text-sm">{item.why}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Bathroom Blinds FAQ
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 mt-12">
            {[
              {
                question: "Can I put wood blinds in my bathroom?",
                answer: "Real wood blinds are not recommended for bathrooms. The humidity and steam from showers will cause warping, cracking, and discoloration. Choose faux wood blinds instead - they look like real wood but are 100% waterproof."
              },
              {
                question: "What blinds are best for high humidity?",
                answer: "Faux wood blinds, aluminum mini blinds, vinyl roller shades, and composite shutters are all excellent for high humidity. They won't warp, crack, or develop mold. Avoid real wood, standard fabric shades, and paper blinds."
              },
              {
                question: "How do I clean bathroom blinds?",
                answer: "Faux wood and aluminum blinds can be wiped with a damp cloth or mild soap and water. For deeper cleaning, you can remove them and rinse in the bathtub. Vinyl shades can be wiped down. Regular cleaning prevents mildew buildup."
              },
              {
                question: "Are cellular shades OK for bathrooms?",
                answer: "Standard cellular shades can trap moisture and develop mold. However, some manufacturers offer moisture-resistant cellular shades specifically designed for bathrooms. Check product specifications before buying."
              },
              {
                question: "What about privacy with bathroom blinds?",
                answer: "All our bathroom blind recommendations offer excellent privacy. Faux wood blinds and shutters allow you to tilt slats for light while blocking views. Roller shades provide complete coverage. Top-down options let light in while maintaining lower privacy."
              },
              {
                question: "Will bathroom blinds get moldy?",
                answer: "Not if you choose the right materials. Faux wood, aluminum, vinyl, and composite materials resist mold and mildew. Ensure good bathroom ventilation (use exhaust fans) and occasionally wipe down blinds to prevent any buildup."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-cyan-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bathroom-Ready Window Treatments
          </h2>
          <p className="text-xl text-cyan-200 mb-8 max-w-2xl mx-auto">
            Moisture-resistant blinds built to last. Free shipping on orders over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?room=bathroom"
              className="bg-white hover:bg-gray-100 text-cyan-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Shop Bathroom Blinds
            </Link>
            <Link
              href="/customer/samples"
              className="bg-cyan-700 hover:bg-cyan-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Free Samples
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
