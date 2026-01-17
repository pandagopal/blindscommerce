"use client";

import Link from "next/link";
import { FaSun, FaPalette, FaHome, FaShieldAlt, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function LivingRoomBlindsPage() {
  const priorities = [
    {
      icon: FaPalette,
      title: "Style & Design",
      description: "Make a statement with window treatments that complement your living room décor."
    },
    {
      icon: FaSun,
      title: "Light Control",
      description: "Balance natural light for TV viewing, reading, and entertaining."
    },
    {
      icon: FaHome,
      title: "Room Enhancement",
      description: "Window treatments that make your living room feel larger and more inviting."
    },
    {
      icon: FaShieldAlt,
      title: "Privacy Options",
      description: "Control visibility from outside while enjoying natural light inside."
    }
  ];

  const recommendations = [
    {
      name: "Roman Shades",
      tag: "Most Stylish",
      description: "Elegant fabric folds add sophistication and texture to living rooms.",
      features: ["Premium fabrics", "Elegant folds", "Multiple patterns", "Blackout available"],
      priceFrom: "$79.99",
      href: "/products?category=roman-shades"
    },
    {
      name: "Wood & Faux Wood Blinds",
      tag: "Classic Choice",
      description: "Timeless warmth and charm. Perfect for traditional and transitional styles.",
      features: ["Natural beauty", "Adjustable light", "Many stains", "Durable"],
      priceFrom: "$49.99",
      href: "/products?category=wood-blinds"
    },
    {
      name: "Cellular Shades",
      tag: "Best Value",
      description: "Energy-efficient with clean lines. Great for any living room style.",
      features: ["Energy savings", "Light options", "Clean look", "Child safe"],
      priceFrom: "$54.99",
      href: "/products?category=cellular-shades"
    },
    {
      name: "Sheer Roller Shades",
      tag: "Modern Look",
      description: "Maintain your view while filtering light. Perfect for sunny living rooms.",
      features: ["View-through", "Light filtering", "UV protection", "Sleek design"],
      priceFrom: "$44.99",
      href: "/products?category=roller-shades&opacity=sheer"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800 text-white py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Shop by Room
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Living Room Blinds & Shades
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Make a statement in your home's central gathering space. Stylish window
              treatments that enhance your living room's beauty and comfort.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?room=living-room"
                className="bg-white text-blue-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Living Room Blinds <FaArrowRight className="ml-2" />
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
            What Matters Most in a Living Room
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Your living room is where style meets function. Choose window treatments that do both.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {priorities.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <item.icon className="text-5xl text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Style Guide */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Match Your Living Room Style
          </h2>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Traditional</h3>
              <p className="text-gray-600 mb-4">
                Classic elegance with rich textures and warm colors.
              </p>
              <p className="font-semibold text-blue-700">
                Best choices: Wood blinds, roman shades, shutters
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Modern</h3>
              <p className="text-gray-600 mb-4">
                Clean lines, minimalist design, and neutral colors.
              </p>
              <p className="font-semibold text-blue-700">
                Best choices: Roller shades, cellular shades, panel tracks
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Transitional</h3>
              <p className="text-gray-600 mb-4">
                Blend of traditional and modern for timeless appeal.
              </p>
              <p className="font-semibold text-blue-700">
                Best choices: Faux wood blinds, woven shades, layered treatments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Recommendations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Best Blinds for Living Rooms
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our top picks that combine style and functionality.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {recommendations.map((product, index) => (
              <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
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
                  <span className="text-xl font-bold text-blue-600">From {product.priceFrom}</span>
                  <Link
                    href={product.href}
                    className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center"
                  >
                    Shop Now <FaArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Large Windows Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Solutions for Large Living Room Windows
            </h2>
            <div className="bg-blue-50 rounded-xl p-8">
              <p className="text-lg text-gray-700 mb-6">
                Many living rooms feature large windows, picture windows, or sliding glass doors.
                Here's what works best:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-blue-800 mb-3">For Wide Windows (60"+)</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-blue-600 mt-1" />
                      <span>Motorized cellular shades for easy control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-blue-600 mt-1" />
                      <span>Roller shades with spring assist</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-blue-600 mt-1" />
                      <span>Vertical blinds for sliding doors</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 mb-3">For Bay/Bow Windows</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-blue-600 mt-1" />
                      <span>Individual shades for each section</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-blue-600 mt-1" />
                      <span>Café style for bottom half only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-blue-600 mt-1" />
                      <span>Shutters for architectural interest</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Living Room Blinds FAQ
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 mt-12">
            {[
              {
                question: "What blinds make a living room look bigger?",
                answer: "Light-colored blinds and shades make rooms appear larger. White or cream cellular shades, sheer roller shades that let light through, and mounting blinds at ceiling height all create the illusion of more space."
              },
              {
                question: "Should living room blinds match the furniture?",
                answer: "Blinds don't need to exactly match furniture, but should complement the room's color palette. Neutral blinds (white, cream, gray) work with any decor. For a cohesive look, pull colors from your accent pieces or wall color."
              },
              {
                question: "What's the best light level for a living room?",
                answer: "Most living rooms benefit from light filtering options that soften harsh sunlight while maintaining brightness. For media rooms or TV viewing areas, consider room darkening or blackout for glare control."
              },
              {
                question: "Are motorized blinds worth it for living rooms?",
                answer: "For large windows, hard-to-reach windows, or multiple windows, motorized blinds add convenience and can be controlled with your phone or voice. They're especially popular for living rooms where you want seamless control."
              },
              {
                question: "What's the best choice for sliding glass doors in living rooms?",
                answer: "Vertical blinds are the classic choice for easy access. Sliding panel tracks offer a modern alternative. Motorized roller shades that can be stacked are also popular for a clean look."
              },
              {
                question: "How do I block afternoon sun in my living room?",
                answer: "Solar roller shades block UV rays while maintaining your view. Cellular shades in room darkening provide more coverage. For complete sun blocking, blackout roller shades or lined roman shades work well."
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

      {/* Reviews */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Customer Favorites
          </h2>
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-2xl" />
              ))}
            </div>
            <span className="text-xl font-semibold">4.8 out of 5</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Michael T.",
                text: "The roman shades completely transformed our living room. So many compliments from guests!",
                product: "Roman Shades"
              },
              {
                name: "Amanda S.",
                text: "Love how the cellular shades look and they've noticeably reduced our energy bills too.",
                product: "Cellular Shades"
              },
              {
                name: "Robert J.",
                text: "Wood blinds were exactly what our traditional living room needed. Great quality.",
                product: "Wood Blinds"
              }
            ].map((review, index) => (
              <div key={index} className="bg-blue-800 rounded-xl p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-blue-100 mb-4">"{review.text}"</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{review.name}</span>
                  <span className="text-blue-300 text-sm">{review.product}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Transform Your Living Room
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find the perfect window treatments for your home's gathering space. Free shipping over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?room=living-room"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Shop Living Room Blinds
            </Link>
            <Link
              href="/consultation"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Design Help
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
