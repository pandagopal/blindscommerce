"use client";

import Link from "next/link";
import { FaCheck, FaTimes, FaArrowRight } from "react-icons/fa";

export default function BlindsVsShuttersPage() {
  const comparisonData = [
    {
      feature: "Average Cost",
      blinds: "$30 - $150 per window",
      shutters: "$200 - $500+ per window",
    },
    {
      feature: "Installation",
      blinds: "DIY friendly, quick install",
      shutters: "Professional recommended",
    },
    {
      feature: "Lifespan",
      blinds: "5-10 years typical",
      shutters: "20-30+ years with care",
    },
    {
      feature: "Light Control",
      blinds: "Good to excellent",
      shutters: "Excellent, precise control",
    },
    {
      feature: "Home Value",
      blinds: "Minimal impact",
      shutters: "Increases resale value",
    },
    {
      feature: "Style Options",
      blinds: "Hundreds of colors/materials",
      shutters: "Limited colors, classic styles",
    },
    {
      feature: "Energy Efficiency",
      blinds: "Good (cellular shades best)",
      shutters: "Excellent insulation",
    },
    {
      feature: "Maintenance",
      blinds: "Regular dusting required",
      shutters: "Easy to clean, low maintenance",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Buying Guide
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Blinds vs Shutters
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              Blinds or shutters? Compare cost, durability, style, and functionality
              to find the perfect window treatment for your home.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Answer */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-slate-700">
              <h2 className="text-2xl font-bold mb-4">Quick Answer</h2>
              <p className="text-lg text-gray-700 mb-4">
                <strong>Choose Blinds</strong> if you want affordable window treatments
                with lots of style options, plan to change decor frequently, or need
                a quick DIY installation.
              </p>
              <p className="text-lg text-gray-700">
                <strong>Choose Shutters</strong> if you're making a long-term investment,
                want to increase home value, prefer a classic permanent look, and
                don't mind the higher upfront cost.
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
                  <th className="text-left p-4 font-semibold text-red-700">
                    Blinds
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Shutters
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-gray-700">{row.blinds}</td>
                    <td className="p-4 text-gray-700">{row.shutters}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pros and Cons */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Pros & Cons
          </h2>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Blinds */}
            <div className="bg-white rounded-xl p-8 shadow">
              <h3 className="text-2xl font-bold mb-6 text-red-700">Blinds</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-3">Advantages</h4>
                  <ul className="space-y-2">
                    {[
                      "More affordable option",
                      "Huge variety of styles, colors, materials",
                      "Easy DIY installation",
                      "Simple to replace or update",
                      "Works with any decor style",
                      "Many light control options",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-3">Disadvantages</h4>
                  <ul className="space-y-2">
                    {[
                      "Shorter lifespan than shutters",
                      "Cords can be safety hazard (cordless available)",
                      "May need more frequent replacement",
                      "Don't add to home value",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <FaTimes className="text-red-500 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Shutters */}
            <div className="bg-white rounded-xl p-8 shadow">
              <h3 className="text-2xl font-bold mb-6 text-slate-700">Shutters</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-3">Advantages</h4>
                  <ul className="space-y-2">
                    {[
                      "Extremely durable and long-lasting",
                      "Increases home resale value",
                      "Timeless, classic appearance",
                      "Excellent insulation",
                      "Very low maintenance",
                      "No cords - child safe",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-3">Disadvantages</h4>
                  <ul className="space-y-2">
                    {[
                      "Significantly higher cost",
                      "Limited color and style options",
                      "Professional installation usually needed",
                      "Permanent fixture - can't easily change",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <FaTimes className="text-red-500 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Breakdown */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Cost Comparison
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-800 text-xl mb-4">Blinds (10 Windows)</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>Aluminum Mini Blinds: $200 - $400</li>
                    <li>Faux Wood Blinds: $400 - $800</li>
                    <li>Real Wood Blinds: $800 - $1,500</li>
                    <li>Cellular Shades: $500 - $1,200</li>
                  </ul>
                </div>
                <div className="bg-slate-50 p-6 rounded-lg">
                  <h3 className="font-bold text-slate-800 text-xl mb-4">Shutters (10 Windows)</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>Vinyl Shutters: $2,000 - $3,000</li>
                    <li>Composite Shutters: $2,500 - $4,000</li>
                    <li>Wood Shutters: $3,500 - $5,500</li>
                    <li>+ Installation: $500 - $1,000</li>
                  </ul>
                </div>
              </div>
              <p className="text-gray-600 text-center">
                <strong>Bottom Line:</strong> Shutters cost 3-5x more than blinds upfront,
                but can last 3-4x longer and add value to your home at resale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Best Choice by Situation
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Different scenarios call for different solutions.
          </p>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { situation: "Rental Property", winner: "Blinds", reason: "Affordable, easy to install and remove when moving" },
              { situation: "Forever Home", winner: "Shutters", reason: "Long-term investment that adds lasting value" },
              { situation: "Planning to Sell", winner: "Shutters", reason: "Increase curb appeal and home value" },
              { situation: "Tight Budget", winner: "Blinds", reason: "Get quality window treatments at lower cost" },
              { situation: "Historic Home", winner: "Shutters", reason: "Traditional look that complements architecture" },
              { situation: "Modern Design", winner: "Either", reason: "Roller shades or clean-line shutters both work" },
              { situation: "Kids' Rooms", winner: "Cordless Blinds", reason: "Safe, affordable, easy to replace if damaged" },
              { situation: "High-End Renovation", winner: "Shutters", reason: "Premium look that matches upscale finishes" },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{item.situation}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.winner === "Blinds" || item.winner === "Cordless Blinds"
                      ? "bg-red-100 text-red-800"
                      : item.winner === "Shutters"
                      ? "bg-slate-200 text-slate-800"
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 mt-12">
            {[
              {
                question: "Do shutters increase home value more than blinds?",
                answer: "Yes, plantation shutters are considered a home improvement that can increase resale value by 3-5%. They're seen as permanent fixtures rather than window coverings. Blinds, while functional and attractive, don't typically add to home value."
              },
              {
                question: "Which is better for energy efficiency?",
                answer: "Both can be energy efficient, but they work differently. Cellular (honeycomb) shades offer the best insulation among blinds with R-values up to 5. Shutters provide excellent insulation due to their solid construction and create an air gap when closed."
              },
              {
                question: "Are shutters worth the extra cost?",
                answer: "If you plan to stay in your home long-term, shutters are often worth it. They last 20-30 years vs 5-10 for blinds, require less maintenance, and add home value. For rentals or short-term situations, blinds make more financial sense."
              },
              {
                question: "Can I install shutters myself?",
                answer: "While DIY shutter installation is possible, it's more challenging than blinds. Shutters require precise measurements, level mounting, and often custom fitting. Professional installation is recommended for the best results and to avoid costly mistakes."
              },
              {
                question: "Which provides better light control?",
                answer: "Both offer excellent light control but in different ways. Shutters have adjustable louvers that provide precise control and block light effectively when closed. Blinds offer more variety - from sheer to blackout options - and some styles like top-down/bottom-up provide more flexibility."
              },
              {
                question: "What's the maintenance difference?",
                answer: "Shutters are easier to maintain - just wipe the louvers occasionally. Blinds require more frequent dusting and can be harder to clean depending on the style. Fabric shades may need vacuuming or professional cleaning."
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

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Choose?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Explore our full selection of blinds and shutters. Free samples available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Shop Blinds <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/products?category=shutters"
              className="bg-white hover:bg-gray-100 text-slate-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Shop Shutters <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
