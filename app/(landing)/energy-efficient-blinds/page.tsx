"use client";

import Link from "next/link";
import { FaLeaf, FaDollarSign, FaThermometerHalf, FaCheck, FaArrowRight, FaStar, FaSnowflake, FaSun } from "react-icons/fa";

export default function EnergyEfficientBlindsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-700 to-emerald-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Save Money
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Energy Efficient Blinds & Shades
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Cut your energy bills by up to 25% with insulating window treatments.
              Cellular shades trap air to keep your home comfortable year-round while saving money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?category=cellular-shades"
                className="bg-white text-green-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Cellular Shades <FaArrowRight className="ml-2" />
              </Link>
              <Link
                href="/samples"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Order Free Samples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <p className="text-4xl font-bold text-green-700">Up to 25%</p>
              <p className="text-gray-600">Reduction in energy bills</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-700">Up to 40%</p>
              <p className="text-gray-600">Less heat loss through windows</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-700">R-4 to R-5</p>
              <p className="text-gray-600">Insulation value (double cell)</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Cellular Shades Save Energy</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-xl font-bold mb-4">The Honeycomb Structure</h3>
                  <p className="text-gray-700 mb-4">
                    Cellular shades get their name from their honeycomb-shaped cells. When viewed
                    from the side, you can see these pockets that trap air.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Air is a natural insulator. By trapping pockets of air between your window
                    and the room, cellular shades create a barrier that slows heat transfer.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-gray-700">
                      <FaSnowflake className="text-blue-500" />
                      <span><strong>Winter:</strong> Keeps warm air inside</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <FaSun className="text-yellow-500" />
                      <span><strong>Summer:</strong> Blocks heat from entering</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg">
                  <div className="space-y-4">
                    <div className="border-2 border-green-500 rounded-lg p-4">
                      <h4 className="font-bold text-green-700 mb-2">Double Cell (Most Efficient)</h4>
                      <div className="flex justify-center">
                        <div className="grid grid-cols-4 gap-1">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-8 h-4 bg-green-200 rounded"></div>
                          ))}
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-8 h-4 bg-green-300 rounded"></div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Two layers = More air pockets = Better insulation</p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <h4 className="font-bold text-gray-700 mb-2">Single Cell</h4>
                      <div className="flex justify-center">
                        <div className="grid grid-cols-4 gap-1">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-8 h-5 bg-gray-200 rounded"></div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Good insulation, lower cost</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Benefits of Energy Efficient Blinds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <FaDollarSign className="text-5xl text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lower Bills</h3>
              <p className="text-gray-600">Save up to 25% on heating and cooling costs year-round.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <FaThermometerHalf className="text-5xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Year-Round Comfort</h3>
              <p className="text-gray-600">Stay warmer in winter, cooler in summer without cranking the thermostat.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <FaLeaf className="text-5xl text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Eco-Friendly</h3>
              <p className="text-gray-600">Reduce your carbon footprint by using less energy.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <FaStar className="text-5xl text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Quick ROI</h3>
              <p className="text-gray-600">Energy savings can pay for the blinds within a few years.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Compare Energy Efficiency</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-center p-4 font-medium">Insulation</th>
                    <th className="text-center p-4 font-medium">Energy Savings</th>
                    <th className="text-center p-4 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="bg-green-50">
                    <td className="p-4 font-medium">Double Cell Cellular Shades</td>
                    <td className="p-4 text-center"><span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Best</span></td>
                    <td className="p-4 text-center">Up to 25%</td>
                    <td className="p-4 text-center">$$$</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Single Cell Cellular Shades</td>
                    <td className="p-4 text-center"><span className="bg-green-400 text-white px-3 py-1 rounded-full text-sm">Excellent</span></td>
                    <td className="p-4 text-center">Up to 20%</td>
                    <td className="p-4 text-center">$$</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Roman Shades (lined)</td>
                    <td className="p-4 text-center"><span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">Good</span></td>
                    <td className="p-4 text-center">10-15%</td>
                    <td className="p-4 text-center">$$-$$$</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Shutters</td>
                    <td className="p-4 text-center"><span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">Good</span></td>
                    <td className="p-4 text-center">10-15%</td>
                    <td className="p-4 text-center">$$$$</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Wood/Faux Wood Blinds</td>
                    <td className="p-4 text-center"><span className="bg-gray-400 text-white px-3 py-1 rounded-full text-sm">Moderate</span></td>
                    <td className="p-4 text-center">5-10%</td>
                    <td className="p-4 text-center">$$</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Roller Shades</td>
                    <td className="p-4 text-center"><span className="bg-gray-400 text-white px-3 py-1 rounded-full text-sm">Minimal</span></td>
                    <td className="p-4 text-center">5% or less</td>
                    <td className="p-4 text-center">$</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { q: "Which blinds are most energy efficient?", a: "Cellular (honeycomb) shades are the most energy-efficient. Their honeycomb structure traps air for insulation. Double-cell shades provide even more efficiency." },
              { q: "How do cellular shades save energy?", a: "They trap air in honeycomb pockets, creating an insulating barrier. In winter, they prevent heat escape. In summer, they block heat from entering." },
              { q: "Are double cell shades worth it?", a: "If energy efficiency is a priority, yes. They provide ~30% more insulation than single cell and are especially worthwhile in extreme climates." },
              { q: "Do energy efficient blinds qualify for tax credits?", a: "Some may qualify for federal or state energy tax credits. Check current IRS guidelines and look for ENERGY STAR certified products." },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Saving Energy Today</h2>
          <p className="text-xl text-green-200 mb-8 max-w-2xl mx-auto">
            Shop cellular shades and start cutting your energy bills. Free shipping on orders over $99.
          </p>
          <Link
            href="/products?category=cellular-shades"
            className="bg-white text-green-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Shop Cellular Shades <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
