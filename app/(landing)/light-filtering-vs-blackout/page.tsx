"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaSun, FaMoon, FaBed, FaCouch, FaTv, FaBaby, FaUtensils, FaBath, FaBriefcase } from "react-icons/fa";

export default function LightFilteringVsBlackoutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-500 to-orange-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Buying Guide
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Light Filtering vs Room Darkening vs Blackout
            </h1>
            <p className="text-xl text-amber-100 mb-8">
              Not sure which opacity level you need? This guide explains the differences
              and helps you choose the right blinds for every room in your home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="bg-white text-amber-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop By Opacity <FaArrowRight className="ml-2" />
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

      {/* Visual Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Light Blocking Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Light Filtering */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-xl"></div>
                <div className="absolute inset-4 bg-amber-100/80 rounded-lg flex items-center justify-center">
                  <FaSun className="text-6xl text-amber-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Light Filtering</h3>
              <p className="text-2xl font-bold text-amber-600 mb-2">40-70% Blocked</p>
              <p className="text-gray-600">Lets in natural light while providing daytime privacy</p>
            </div>

            {/* Room Darkening */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl"></div>
                <div className="absolute inset-4 bg-gray-500/80 rounded-lg flex items-center justify-center">
                  <FaSun className="text-6xl text-gray-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Room Darkening</h3>
              <p className="text-2xl font-bold text-gray-600 mb-2">85-95% Blocked</p>
              <p className="text-gray-600">Significantly reduces light, good for sleeping</p>
            </div>

            {/* Blackout */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl"></div>
                <div className="absolute inset-4 bg-gray-900/90 rounded-lg flex items-center justify-center">
                  <FaMoon className="text-6xl text-gray-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Blackout</h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">99%+ Blocked</p>
              <p className="text-gray-600">Near-total darkness, maximum privacy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Detailed Comparison</h2>
          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold text-amber-600">Light Filtering</th>
                  <th className="text-center p-4 font-semibold text-gray-600">Room Darkening</th>
                  <th className="text-center p-4 font-semibold text-gray-800">Blackout</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium">Light Blocked</td>
                  <td className="p-4 text-center">40-70%</td>
                  <td className="p-4 text-center">85-95%</td>
                  <td className="p-4 text-center">99%+</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 font-medium">Daytime Privacy</td>
                  <td className="p-4 text-center"><span className="text-green-600 font-bold">Excellent</span></td>
                  <td className="p-4 text-center"><span className="text-green-600 font-bold">Excellent</span></td>
                  <td className="p-4 text-center"><span className="text-green-600 font-bold">Complete</span></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Nighttime Privacy</td>
                  <td className="p-4 text-center"><span className="text-yellow-600">Limited*</span></td>
                  <td className="p-4 text-center"><span className="text-green-600 font-bold">Good</span></td>
                  <td className="p-4 text-center"><span className="text-green-600 font-bold">Complete</span></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 font-medium">View Through</td>
                  <td className="p-4 text-center">Yes (muted)</td>
                  <td className="p-4 text-center">Minimal</td>
                  <td className="p-4 text-center">No</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">UV Protection</td>
                  <td className="p-4 text-center">Good (75-90%)</td>
                  <td className="p-4 text-center">Excellent (95%+)</td>
                  <td className="p-4 text-center">Maximum (99%+)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 font-medium">Energy Efficiency</td>
                  <td className="p-4 text-center">Moderate</td>
                  <td className="p-4 text-center">Good</td>
                  <td className="p-4 text-center">Best</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Best For</td>
                  <td className="p-4 text-center">Living rooms, offices</td>
                  <td className="p-4 text-center">Bedrooms, dens</td>
                  <td className="p-4 text-center">Nurseries, media rooms</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm text-gray-500 mt-4">*Light filtering provides daytime privacy but silhouettes may be visible at night with interior lights on</p>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Which Opacity for Each Room?</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our expert recommendations based on typical room usage
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaCouch className="text-3xl text-amber-500" />
                <h3 className="text-lg font-bold">Living Room</h3>
              </div>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Light Filtering Recommended
              </div>
              <p className="text-gray-600 text-sm">Enjoy natural light and maintain daytime privacy. Consider dual shades if you watch TV during the day.</p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaBed className="text-3xl text-gray-600" />
                <h3 className="text-lg font-bold">Master Bedroom</h3>
              </div>
              <div className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Room Darkening or Blackout
              </div>
              <p className="text-gray-600 text-sm">Room darkening is usually sufficient. Choose blackout if you&apos;re a light sleeper or have street lights nearby.</p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaBaby className="text-3xl text-gray-800" />
                <h3 className="text-lg font-bold">Nursery</h3>
              </div>
              <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Blackout Essential
              </div>
              <p className="text-gray-600 text-sm">Maximum darkness helps babies nap during the day and sleep through the night.</p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaTv className="text-3xl text-gray-800" />
                <h3 className="text-lg font-bold">Media Room</h3>
              </div>
              <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Blackout Essential
              </div>
              <p className="text-gray-600 text-sm">Complete darkness prevents screen glare and creates theater-like viewing experience.</p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaBriefcase className="text-3xl text-amber-500" />
                <h3 className="text-lg font-bold">Home Office</h3>
              </div>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Light Filtering Recommended
              </div>
              <p className="text-gray-600 text-sm">Natural light boosts productivity. Use solar shades for glare control with your view intact.</p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaUtensils className="text-3xl text-amber-500" />
                <h3 className="text-lg font-bold">Kitchen</h3>
              </div>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Light Filtering Recommended
              </div>
              <p className="text-gray-600 text-sm">Bright, natural light for cooking and prep. Choose moisture-resistant materials.</p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaBath className="text-3xl text-gray-600" />
                <h3 className="text-lg font-bold">Bathroom</h3>
              </div>
              <div className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Room Darkening Recommended
              </div>
              <p className="text-gray-600 text-sm">Privacy is key. Top-down bottom-up lets in light while maintaining privacy.</p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaBed className="text-3xl text-gray-600" />
                <h3 className="text-lg font-bold">Guest Room</h3>
              </div>
              <div className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Room Darkening Recommended
              </div>
              <p className="text-gray-600 text-sm">Versatile choice that works for sleeping while keeping the room from feeling cave-like.</p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaCouch className="text-3xl text-amber-500" />
                <h3 className="text-lg font-bold">Dining Room</h3>
              </div>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                Light Filtering Recommended
              </div>
              <p className="text-gray-600 text-sm">Natural light enhances meals. Sheer or light filtering creates an inviting atmosphere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pro Tips */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pro Tips for Maximum Light Control</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">For Maximum Blackout</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span>Choose inside mount with minimal gaps</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span>Add side channels to block edge light</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span>Select darker fabric colors</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span>Use cassette valance at top</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span>Consider dual shades with blackout layer</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Best of Both Worlds</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span><strong>Dual shades:</strong> Sheer front + blackout back</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span><strong>Day/night cellular:</strong> Two fabrics in one shade</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span><strong>Layer with curtains:</strong> Shades + drapes for flexibility</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheck className="text-green-500 mt-1" />
                  <span><strong>Zebra shades:</strong> Adjust opacity by aligning stripes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { q: "What's the difference between light filtering and blackout blinds?", a: "Light filtering allows natural light while providing daytime privacy (blocks 40-70%). Blackout blocks 99%+ of light and provides complete privacy day and night. Room darkening is in between at 85-95%." },
              { q: "Which rooms need blackout blinds?", a: "Blackout is essential for nurseries, media rooms, and shift workers' bedrooms. It's also good for west-facing windows to reduce heat gain." },
              { q: "Are room darkening and blackout the same thing?", a: "No. Room darkening blocks 85-95% of light - rooms get significantly darker but not completely dark. Blackout blocks 99%+ for near-total darkness." },
              { q: "Can light filtering blinds provide privacy at night?", a: "Light filtering provides excellent daytime privacy but limited nighttime privacy. When interior lights are on, silhouettes may be visible. For nighttime privacy, choose room darkening or blackout." },
              { q: "What is the best opacity for a living room?", a: "Light filtering is usually best - provides daytime privacy while letting in natural light. If you watch TV during the day, consider dual shades or room darkening." },
              { q: "Do blackout blinds make a room completely dark?", a: "Blackout fabric blocks 99%+ of light, but some light may enter around edges. For maximum darkness, use inside mount, side channels, and darker fabric colors." },
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Find Your Perfect Light Level</h2>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Shop blinds by opacity level or get free samples to compare in your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-amber-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Shop All Blinds <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/samples"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Order Free Samples
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
