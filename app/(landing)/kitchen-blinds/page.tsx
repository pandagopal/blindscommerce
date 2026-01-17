"use client";

import Link from "next/link";
import { FaFire, FaTint, FaSun, FaBroom, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function KitchenBlindsPage() {
  const priorities = [
    {
      icon: FaFire,
      title: "Heat Resistant",
      description: "Materials that withstand kitchen heat near stoves and ovens."
    },
    {
      icon: FaTint,
      title: "Moisture Resistant",
      description: "Handle splashes, steam, and humidity from cooking without damage."
    },
    {
      icon: FaSun,
      title: "Natural Light",
      description: "Maximize daylight for cooking and food prep while controlling glare."
    },
    {
      icon: FaBroom,
      title: "Easy to Clean",
      description: "Wipe-clean surfaces that resist grease, food splatters, and stains."
    }
  ];

  const recommendations = [
    {
      name: "Faux Wood Blinds",
      tag: "Best Overall",
      description: "Perfect balance of style and functionality. Resists moisture and easy to clean.",
      features: ["Moisture resistant", "Easy wipe clean", "Classic wood look", "Affordable"],
      priceFrom: "$39.99",
      href: "/products?category=faux-wood-blinds"
    },
    {
      name: "Aluminum Mini Blinds",
      tag: "Best Budget",
      description: "Durable, affordable, and completely moisture-proof. Ideal over sinks.",
      features: ["Budget friendly", "No warping", "Light control", "Many colors"],
      priceFrom: "$19.99",
      href: "/products?category=aluminum-blinds"
    },
    {
      name: "Solar Roller Shades",
      tag: "Best for Glare",
      description: "Reduce glare while maintaining your view. Great for sunny kitchens.",
      features: ["UV protection", "View-through", "Heat reduction", "Modern look"],
      priceFrom: "$44.99",
      href: "/products?category=roller-shades&type=solar"
    },
    {
      name: "Vinyl Vertical Blinds",
      tag: "Sliding Doors",
      description: "Perfect for kitchen sliding doors and patio access. Easy to operate.",
      features: ["Patio door ready", "Wide coverage", "Light control", "Durable vinyl"],
      priceFrom: "$59.99",
      href: "/products?category=vertical-blinds"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 via-amber-500 to-orange-700 text-white py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Shop by Room
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Kitchen Blinds & Shades
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-8">
              Durable, easy-to-clean window treatments built for the busiest room
              in your home. Heat, moisture, and grease resistant options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?room=kitchen"
                className="bg-white text-orange-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Kitchen Blinds <FaArrowRight className="ml-2" />
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
            What Matters Most in a Kitchen
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            The kitchen is a high-traffic, high-mess environment. Choose blinds that can handle it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {priorities.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <item.icon className="text-5xl text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kitchen Window Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Solutions by Window Location
          </h2>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-orange-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Over the Sink</h3>
              <p className="text-gray-600 mb-4">
                Windows above the sink get splashed regularly. Choose materials that
                can handle water and are easy to wipe clean.
              </p>
              <p className="font-semibold text-orange-700">
                Recommended: Faux wood blinds or aluminum mini blinds
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Near the Stove</h3>
              <p className="text-gray-600 mb-4">
                Windows near cooking areas face heat, grease, and steam. Avoid
                fabric options and choose wipeable materials.
              </p>
              <p className="font-semibold text-orange-700">
                Recommended: Aluminum blinds or vinyl roller shades
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Breakfast Nook</h3>
              <p className="text-gray-600 mb-4">
                Eating areas benefit from natural light control. Solar shades
                reduce glare while maintaining views.
              </p>
              <p className="font-semibold text-orange-700">
                Recommended: Solar roller shades or cellular shades
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Patio Doors</h3>
              <p className="text-gray-600 mb-4">
                Kitchen sliding doors need window treatments that allow easy
                access while controlling light and privacy.
              </p>
              <p className="font-semibold text-orange-700">
                Recommended: Vertical blinds or sliding panel tracks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Recommendations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Best Blinds for Kitchens
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our top picks for kitchen-friendly window treatments.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {recommendations.map((product, index) => (
              <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
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
                  <span className="text-xl font-bold text-orange-600">From {product.priceFrom}</span>
                  <Link
                    href={product.href}
                    className="text-orange-600 hover:text-orange-800 font-semibold inline-flex items-center"
                  >
                    Shop Now <FaArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cleaning Tips */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Kitchen Blind Cleaning Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-green-800 text-xl mb-4">Weekly Maintenance</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-green-600 mt-1" />
                    <span>Dust with a microfiber cloth or duster</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-green-600 mt-1" />
                    <span>Wipe down near stove to prevent grease buildup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-green-600 mt-1" />
                    <span>Check for food splatters and spot clean</span>
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-blue-800 text-xl mb-4">Deep Cleaning</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-blue-600 mt-1" />
                    <span>Remove and soak in warm soapy water (aluminum)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-blue-600 mt-1" />
                    <span>Use degreaser for stubborn kitchen grime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-blue-600 mt-1" />
                    <span>Rinse thoroughly and dry before rehanging</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Kitchen Blinds FAQ
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 mt-12">
            {[
              {
                question: "What are the best blinds for above the kitchen sink?",
                answer: "Faux wood blinds or aluminum mini blinds are best over kitchen sinks. They're completely moisture-resistant and won't be damaged by water splashes. Both are easy to wipe clean and won't warp or mold."
              },
              {
                question: "Are fabric blinds OK for kitchens?",
                answer: "Fabric blinds are generally not recommended for kitchens, especially near cooking areas. They can absorb grease, odors, and moisture, and are harder to clean. If you prefer fabric, choose roller shades with vinyl coating for easier maintenance."
              },
              {
                question: "How do I clean grease off kitchen blinds?",
                answer: "For faux wood or aluminum blinds, use warm water with dish soap or a degreasing cleaner. For stubborn grease, remove the blinds and soak in the bathtub. Vinyl roller shades can be wiped with a damp cloth and mild cleaner."
              },
              {
                question: "What blinds work best for kitchen sliding doors?",
                answer: "Vertical blinds or sliding panel tracks are ideal for kitchen sliding doors. They allow easy access, provide good light control, and come in materials that resist moisture and grease. Avoid long curtains that can get dirty."
              },
              {
                question: "Should I get cordless blinds for my kitchen?",
                answer: "Cordless blinds are a great choice for kitchens. They're safer (no cords near food prep), cleaner-looking, and easier to operate when your hands might be wet or dirty. Motorized options are even more convenient."
              },
              {
                question: "Can kitchen blinds help reduce heat from windows?",
                answer: "Yes! Solar roller shades can block up to 90% of heat and UV rays, keeping your kitchen cooler during sunny hours. Cellular shades also provide good insulation. This can help reduce air conditioning costs in summer."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow">
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-orange-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Kitchen-Tough Window Treatments
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Durable, easy-to-clean blinds that stand up to kitchen life. Free shipping over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?room=kitchen"
              className="bg-white hover:bg-gray-100 text-orange-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Shop Kitchen Blinds
            </Link>
            <Link
              href="/customer/samples"
              className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Free Samples
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
