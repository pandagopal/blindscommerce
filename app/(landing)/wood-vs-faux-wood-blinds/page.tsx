"use client";

import Link from "next/link";
import { FaCheck, FaTimes, FaStar, FaArrowRight } from "react-icons/fa";

export default function WoodVsFauxWoodBlindsPage() {
  const comparisonData = [
    {
      feature: "Material",
      wood: "Natural hardwood (basswood, oak)",
      fauxWood: "PVC, vinyl, or composite materials",
    },
    {
      feature: "Price Range",
      wood: "$$$$ (Premium)",
      fauxWood: "$$ - $$$ (Affordable)",
    },
    {
      feature: "Moisture Resistance",
      wood: "Low - Can warp in humidity",
      fauxWood: "Excellent - Ideal for humid areas",
    },
    {
      feature: "Weight",
      wood: "Heavier - Not ideal for large windows",
      fauxWood: "Lighter - Works on any window size",
    },
    {
      feature: "Durability",
      wood: "Very durable with proper care",
      fauxWood: "Extremely durable, less maintenance",
    },
    {
      feature: "Appearance",
      wood: "Authentic, rich natural grain",
      fauxWood: "Wood-like appearance, consistent finish",
    },
    {
      feature: "Eco-Friendly",
      wood: "Renewable, biodegradable",
      fauxWood: "Made from recycled materials (some)",
    },
    {
      feature: "Best Rooms",
      wood: "Living rooms, bedrooms, offices",
      fauxWood: "Bathrooms, kitchens, laundry rooms",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 text-white py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Buying Guide
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Wood vs Faux Wood Blinds
            </h1>
            <p className="text-xl md:text-2xl text-amber-100 mb-8">
              Choosing between natural wood and faux wood blinds? This comprehensive
              guide compares durability, cost, appearance, and best use cases.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Answer */}
      <section className="py-12 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-amber-600">
              <h2 className="text-2xl font-bold mb-4">Quick Answer</h2>
              <p className="text-lg text-gray-700 mb-4">
                <strong>Choose Real Wood Blinds</strong> if you want the most authentic,
                luxurious look with natural wood grain variations, and your windows are
                in dry areas like living rooms or bedrooms.
              </p>
              <p className="text-lg text-gray-700">
                <strong>Choose Faux Wood Blinds</strong> if you need moisture resistance
                for bathrooms or kitchens, want a lower-cost alternative that still looks
                great, or have large windows where weight matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Side-by-Side Comparison
          </h2>
          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-left p-4 font-semibold text-amber-800">
                    <span className="flex items-center gap-2">
                      Real Wood Blinds
                    </span>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    <span className="flex items-center gap-2">
                      Faux Wood Blinds
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-gray-700">{row.wood}</td>
                    <td className="p-4 text-gray-700">{row.fauxWood}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Analysis */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            In-Depth Analysis
          </h2>
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Appearance */}
            <div className="bg-white rounded-xl p-8 shadow">
              <h3 className="text-2xl font-bold mb-4">Appearance & Aesthetics</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">Real Wood</h4>
                  <p className="text-gray-600">
                    Natural wood blinds offer unmatched authenticity with unique grain
                    patterns in each slat. The warmth and character of real wood adds
                    a premium, sophisticated look that's hard to replicate. Available
                    in stains from light oak to dark walnut.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Faux Wood</h4>
                  <p className="text-gray-600">
                    Modern faux wood blinds closely mimic real wood grain patterns.
                    While lacking the subtle variations of natural wood, they offer
                    consistent coloring and finish. Most visitors can't tell the
                    difference from a distance.
                  </p>
                </div>
              </div>
            </div>

            {/* Durability */}
            <div className="bg-white rounded-xl p-8 shadow">
              <h3 className="text-2xl font-bold mb-4">Durability & Maintenance</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">Real Wood</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>Lasts decades with proper care</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaTimes className="text-red-500 mt-1 flex-shrink-0" />
                      <span>Can warp, crack, or fade in humid conditions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaTimes className="text-red-500 mt-1 flex-shrink-0" />
                      <span>Requires occasional refinishing</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Faux Wood</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>Resistant to warping, cracking, fading</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>Easy to clean with damp cloth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>No special maintenance required</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cost */}
            <div className="bg-white rounded-xl p-8 shadow">
              <h3 className="text-2xl font-bold mb-4">Cost Comparison</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-amber-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">Real Wood Blinds</h4>
                  <p className="text-3xl font-bold text-amber-900 mb-2">$80 - $200+</p>
                  <p className="text-sm text-gray-600">per window (average 36" x 48")</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Faux Wood Blinds</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">$40 - $100</p>
                  <p className="text-sm text-gray-600">per window (average 36" x 48")</p>
                </div>
              </div>
              <p className="text-gray-600 mt-4">
                Faux wood blinds typically cost 40-60% less than real wood, making them
                an attractive option for whole-home installations or budget-conscious buyers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Best Choice by Room
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            The right choice depends on where you're installing them.
          </p>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { room: "Bathrooms", winner: "Faux Wood", reason: "100% moisture resistant - won't warp from shower steam" },
              { room: "Kitchens", winner: "Faux Wood", reason: "Easy to clean grease and food splatter" },
              { room: "Living Rooms", winner: "Real Wood", reason: "Premium appearance for high-visibility areas" },
              { room: "Bedrooms", winner: "Either", reason: "Both work well - choose based on budget and style" },
              { room: "Home Office", winner: "Real Wood", reason: "Professional, sophisticated appearance" },
              { room: "Laundry Room", winner: "Faux Wood", reason: "Handles humidity from washer/dryer" },
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{item.room}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.winner === "Faux Wood"
                      ? "bg-gray-200 text-gray-800"
                      : item.winner === "Real Wood"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {item.winner}
                  </span>
                </div>
                <p className="text-gray-600">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 mt-12">
            {[
              {
                question: "Can you tell the difference between wood and faux wood blinds?",
                answer: "Up close, yes - real wood has unique grain variations and a warmer feel. From a distance (beyond 5-6 feet), most people cannot tell the difference. High-quality faux wood blinds are designed to closely mimic the look of real wood."
              },
              {
                question: "Are faux wood blinds cheaper than real wood?",
                answer: "Yes, faux wood blinds typically cost 40-60% less than comparable real wood blinds. For a whole-home installation, this can mean savings of hundreds or even thousands of dollars while still achieving a wood-like appearance."
              },
              {
                question: "Will real wood blinds warp in my bathroom?",
                answer: "Yes, real wood blinds are not recommended for bathrooms or other high-humidity areas. The moisture from showers and baths can cause warping, cracking, and discoloration over time. Choose faux wood or another moisture-resistant option for bathrooms."
              },
              {
                question: "Which lasts longer - wood or faux wood blinds?",
                answer: "In dry conditions, real wood blinds can last 20+ years with proper care. However, faux wood blinds are more durable overall because they resist moisture, fading, and don't require special maintenance. In humid environments, faux wood will significantly outlast real wood."
              },
              {
                question: "Are faux wood blinds better for large windows?",
                answer: "Yes, faux wood blinds are generally better for large windows. Real wood slats are heavier and can sag on wider windows. Faux wood is lighter and can span larger widths without the structural issues that affect heavy natural wood blinds."
              },
              {
                question: "Which is more eco-friendly - wood or faux wood?",
                answer: "It depends on your perspective. Real wood from sustainable forests is renewable and biodegradable. Some faux wood blinds are made from recycled materials. However, faux wood lasts longer and doesn't require the tree harvesting that real wood does."
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

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Shop?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse our selection of wood and faux wood blinds. Free shipping on orders over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?category=wood-blinds"
              className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Shop Wood Blinds <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/products?category=faux-wood-blinds"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Shop Faux Wood Blinds <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
