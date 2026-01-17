"use client";

import Link from "next/link";
import { FaCheck, FaTimes, FaStar, FaArrowRight } from "react-icons/fa";

export default function CellularVsRollerShadesPage() {
  const comparisonData = [
    {
      feature: "Energy Efficiency",
      cellular: { value: "Excellent", score: 5, note: "Honeycomb air pockets provide superior insulation" },
      roller: { value: "Good", score: 3, note: "Single layer fabric, moderate insulation" }
    },
    {
      feature: "Light Blocking",
      cellular: { value: "Excellent", score: 5, note: "Blackout options block 99-100% light" },
      roller: { value: "Excellent", score: 5, note: "Blackout options equally effective" }
    },
    {
      feature: "Price Range",
      cellular: { value: "$45-150", score: 3, note: "Higher cost due to complex construction" },
      roller: { value: "$25-100", score: 5, note: "More affordable, simpler design" }
    },
    {
      feature: "Sound Dampening",
      cellular: { value: "Excellent", score: 5, note: "Up to 50% noise reduction" },
      roller: { value: "Minimal", score: 2, note: "Single layer provides less soundproofing" }
    },
    {
      feature: "Modern Aesthetic",
      cellular: { value: "Good", score: 4, note: "Soft, textured appearance" },
      roller: { value: "Excellent", score: 5, note: "Clean, minimalist, sleek look" }
    },
    {
      feature: "Durability",
      cellular: { value: "Good", score: 4, note: "Fabric cells can wear over time" },
      roller: { value: "Excellent", score: 5, note: "Simple mechanism, fewer parts to break" }
    },
    {
      feature: "Cleaning Ease",
      cellular: { value: "Moderate", score: 3, note: "Dust can collect in honeycomb cells" },
      roller: { value: "Easy", score: 5, note: "Flat surface, easy to wipe clean" }
    },
    {
      feature: "Smart Home Options",
      cellular: { value: "Available", score: 4, note: "Motorization available" },
      roller: { value: "Excellent", score: 5, note: "Wide range of smart integrations" }
    }
  ];

  const renderStars = (score: number) => {
    return [...Array(5)].map((_, i) => (
      <FaStar key={i} className={i < score ? "text-yellow-400" : "text-gray-300"} />
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Buying Guide
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Cellular Shades vs Roller Shades: Which is Right for You?
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Compare features, benefits, and costs to make the best choice for your home.
              Our expert guide helps you decide between these two popular window treatments.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Answer Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Quick Answer</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Choose Cellular Shades If:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>Energy efficiency is your top priority</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>You want to reduce outside noise</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>You live in extreme hot or cold climates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>You prefer a softer, textured look</span>
                    </li>
                  </ul>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">Choose Roller Shades If:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-red-500 mt-1 flex-shrink-0" />
                      <span>You want a modern, minimalist look</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-red-500 mt-1 flex-shrink-0" />
                      <span>Budget is a primary concern</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-red-500 mt-1 flex-shrink-0" />
                      <span>Easy maintenance is important</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-red-500 mt-1 flex-shrink-0" />
                      <span>You want smart home integration</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Feature-by-Feature Comparison
          </h2>
          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold bg-green-50 rounded-tl-lg">
                    <span className="text-green-700">Cellular Shades</span>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold bg-red-50 rounded-tr-lg">
                    <span className="text-red-700">Roller Shades</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 bg-green-50/50">
                      <div className="text-center">
                        <div className="font-semibold text-green-700">{row.cellular.value}</div>
                        <div className="flex justify-center my-1">{renderStars(row.cellular.score)}</div>
                        <div className="text-xs text-gray-500">{row.cellular.note}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 bg-red-50/50">
                      <div className="text-center">
                        <div className="font-semibold text-red-700">{row.roller.value}</div>
                        <div className="flex justify-center my-1">{renderStars(row.roller.score)}</div>
                        <div className="text-xs text-gray-500">{row.roller.note}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Breakdown */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              In-Depth Analysis
            </h2>

            {/* Energy Efficiency */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-4">Energy Efficiency: Winner - Cellular Shades</h3>
              <p className="text-gray-600 mb-4">
                Cellular shades are the clear winner for energy efficiency. Their unique honeycomb structure
                creates air pockets that act as insulation, reducing heat transfer through your windows by
                up to 40%. Double and triple cell options provide even more insulation.
              </p>
              <div className="bg-white p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Cellular Shades:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Save up to 25% on energy bills</li>
                      <li>• R-value of 3-5 depending on cell type</li>
                      <li>• Best for extreme climates</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Roller Shades:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Moderate energy savings (5-10%)</li>
                      <li>• Single layer provides basic insulation</li>
                      <li>• Solar roller shades help with heat</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-4">Cost: Winner - Roller Shades</h3>
              <p className="text-gray-600 mb-4">
                Roller shades are generally more affordable due to their simpler construction. However,
                consider the long-term energy savings of cellular shades when calculating total cost of ownership.
              </p>
              <div className="bg-white p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Cellular Shades Pricing:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Single cell: $45-80 per window</li>
                      <li>• Double cell: $60-100 per window</li>
                      <li>• Triple cell: $80-150 per window</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Roller Shades Pricing:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Basic: $25-50 per window</li>
                      <li>• Light filtering: $35-70 per window</li>
                      <li>• Blackout: $45-100 per window</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Style */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-4">Style & Aesthetics: It Depends</h3>
              <p className="text-gray-600 mb-4">
                Style preference is subjective. Roller shades offer a sleek, modern look while cellular
                shades provide a softer, more textured appearance. Consider your home's decor style.
              </p>
              <div className="bg-white p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Cellular Shade Style:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Soft, textured appearance</li>
                      <li>• Classic, traditional feel</li>
                      <li>• Stacks thicker when raised</li>
                      <li>• 50+ colors available</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Roller Shade Style:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Clean, minimalist look</li>
                      <li>• Contemporary, modern feel</li>
                      <li>• Rolls up compactly</li>
                      <li>• 100+ fabrics and patterns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Best Choice by Room
          </h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { room: "Bedroom", winner: "Tie", reason: "Both offer blackout options. Cellular for energy savings, roller for modern look." },
              { room: "Living Room", winner: "Roller", reason: "Clean aesthetics and more fabric/pattern options to match decor." },
              { room: "Home Office", winner: "Cellular", reason: "Sound dampening helps with focus, energy savings for comfort." },
              { room: "Kitchen", winner: "Roller", reason: "Easier to clean, moisture-resistant options available." },
              { room: "Nursery", winner: "Cellular", reason: "Superior noise reduction for baby sleep, excellent blackout." },
              { room: "Sunroom", winner: "Roller", reason: "Solar roller shades reduce glare while maintaining view." }
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-2">{item.room}</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                  item.winner === "Cellular" ? "bg-green-100 text-green-700" :
                  item.winner === "Roller" ? "bg-red-100 text-red-700" :
                  "bg-gray-200 text-gray-700"
                }`}>
                  Best: {item.winner}
                </div>
                <p className="text-gray-600 text-sm">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "Can I use both cellular and roller shades in the same house?",
                answer: "Absolutely! Many homeowners use cellular shades in bedrooms for energy efficiency and noise reduction, while using roller shades in living areas for their modern aesthetic. The key is choosing complementary colors and styles."
              },
              {
                question: "Which lasts longer, cellular or roller shades?",
                answer: "Roller shades typically have a slight edge in durability due to their simpler mechanism. However, both can last 7-10+ years with proper care. Cellular shade fabric cells can wear over time, while roller shade mechanisms are straightforward and reliable."
              },
              {
                question: "Are cellular shades worth the extra cost?",
                answer: "If energy efficiency is important to you, yes. Cellular shades can pay for themselves in energy savings over 3-5 years, especially in extreme climates. They also provide superior noise reduction, which is valuable for bedrooms and home offices."
              },
              {
                question: "Which is better for blocking light?",
                answer: "Both are equally effective at blocking light when you choose blackout options. The blackout capability depends on the fabric, not the shade style. Both cellular and roller shades can block 99-100% of light with blackout fabrics."
              },
              {
                question: "Can both types be motorized?",
                answer: "Yes! Both cellular and roller shades are available with motorization. However, roller shades tend to have more smart home integration options and are generally easier and less expensive to motorize due to their simpler mechanism."
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
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Choose Your Perfect Window Treatment?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Shop our collection of cellular and roller shades. Free samples available to see the quality firsthand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?category=cellular-shades"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Shop Cellular Shades <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/products?category=roller-shades"
              className="bg-white text-red-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Shop Roller Shades <FaArrowRight className="ml-2" />
            </Link>
          </div>
          <p className="mt-6 text-red-200">
            <Link href="/customer/samples" className="underline hover:text-white">
              Order free samples
            </Link> to compare both styles at home
          </p>
        </div>
      </section>
    </div>
  );
}
