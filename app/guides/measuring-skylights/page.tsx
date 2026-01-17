"use client";

import Link from "next/link";
import { FaRuler, FaCheck, FaArrowRight, FaLightbulb, FaExclamationTriangle, FaSun, FaBolt, FaMobileAlt } from "react-icons/fa";

export default function MeasuringSkylightsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <Link href="/guides" className="text-red-200 hover:text-white mb-4 inline-block">
              ← Back to Guides
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How to Measure Skylights for Blinds
            </h1>
            <p className="text-xl text-red-100">
              Skylights let in beautiful natural light but can also bring heat and glare.
              Learn how to measure for the perfect skylight shade.
            </p>
          </div>
        </div>
      </section>

      {/* Before You Start */}
      <section className="py-12 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Before You Start</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold mb-3">Check for Brand Labels</h3>
                <p className="text-gray-600 mb-3">
                  Look for a manufacturer label on your skylight frame. Common brands:
                </p>
                <ul className="space-y-1 text-gray-700">
                  <li>• <strong>VELUX</strong> - Most common, offers matched blinds</li>
                  <li>• <strong>Fakro</strong> - European brand with own blinds</li>
                  <li>• <strong>Andersen</strong> - Check model number</li>
                  <li>• <strong>Marvin</strong> - Custom solutions available</li>
                </ul>
                <p className="text-sm text-red-700 mt-3">
                  If you have a model number, brand-matched blinds are often the easiest option.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold mb-3">Identify Your Skylight Type</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-green-500 mt-1" />
                    <div>
                      <strong>Fixed</strong>
                      <p className="text-gray-600 text-sm">Doesn&apos;t open - simplest to fit</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-green-500 mt-1" />
                    <div>
                      <strong>Vented/Opening</strong>
                      <p className="text-gray-600 text-sm">Opens for ventilation - needs clearance</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheck className="text-green-500 mt-1" />
                    <div>
                      <strong>Tubular/Sun Tunnel</strong>
                      <p className="text-gray-600 text-sm">Round - limited blind options</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Measuring Steps */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Step-by-Step Measuring Guide</h2>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-yellow-600 mt-1" />
                <div>
                  <h4 className="font-bold">Safety First</h4>
                  <p className="text-gray-700">Use a stable ladder and have someone spot you. If your skylight is very high, consider using a laser measure or hiring a professional.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Measure the Width</h3>
                    <p className="text-gray-600 mb-3">
                      Measure the <strong>inside width</strong> of the skylight frame at the glass edge - not the outer frame.
                    </p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Measure at top, middle, and bottom</li>
                      <li>• Record the <strong>smallest</strong> measurement</li>
                      <li>• Measure to nearest 1/8 inch</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Measure the Height</h3>
                    <p className="text-gray-600 mb-3">
                      Measure the <strong>inside height</strong> from glass edge to glass edge.
                    </p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Measure left side, center, and right side</li>
                      <li>• Record the <strong>longest</strong> measurement</li>
                      <li>• For vented skylights, note handle position</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Measure Frame Depth</h3>
                    <p className="text-gray-600 mb-3">
                      Check how deep the skylight frame is from the ceiling surface to the glass.
                    </p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Most skylight blinds need 1-2&quot; depth minimum</li>
                      <li>• Deeper frames may need spacer brackets</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Note the Height from Floor</h3>
                    <p className="text-gray-600 mb-3">
                      This determines how you&apos;ll operate the blinds.
                    </p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• <strong>Under 6 feet:</strong> Manual operation works</li>
                      <li>• <strong>6-10 feet:</strong> Extension pole recommended</li>
                      <li>• <strong>Over 10 feet:</strong> Motorized strongly recommended</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operation Options */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">How to Operate Out-of-Reach Skylights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <FaBolt className="text-4xl text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Motorized</h3>
                <p className="text-gray-600 text-sm mb-3">Remote, app, or voice controlled. Best for high skylights. Can be wired or battery powered.</p>
                <span className="text-red-600 font-medium text-sm">Recommended for 10ft+</span>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <FaSun className="text-4xl text-orange-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Solar Powered</h3>
                <p className="text-gray-600 text-sm mb-3">No wiring needed. Built-in solar panel charges the motor. Works with most skylights.</p>
                <span className="text-red-600 font-medium text-sm">Easy Installation</span>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <FaRuler className="text-4xl text-gray-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Extension Pole</h3>
                <p className="text-gray-600 text-sm mb-3">Manual blinds operated with a telescoping pole. Most affordable option.</p>
                <span className="text-red-600 font-medium text-sm">Budget Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Blind Types */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Best Blinds for Skylights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">Cellular Skylight Shades</h3>
                <p className="text-gray-600 mb-3">The most popular choice. Honeycomb cells provide insulation and come in light filtering or blackout.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Side tracks hold shade at any angle</li>
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Energy efficient</li>
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Blackout options available</li>
                </ul>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">Pleated Skylight Shades</h3>
                <p className="text-gray-600 mb-3">Affordable alternative to cellular. Crisp pleats in various colors and opacity levels.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Lower cost option</li>
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Many color choices</li>
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Light filtering or room darkening</li>
                </ul>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">Venetian Skylight Blinds</h3>
                <p className="text-gray-600 mb-3">Aluminum or wood slats that tilt for light control. Best for skylights you can reach.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Adjustable light control</li>
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Durable aluminum option</li>
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Easy to clean</li>
                </ul>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">Roller Skylight Blinds</h3>
                <p className="text-gray-600 mb-3">Simple, sleek option. Spring-loaded or motorized. Solar and blackout fabrics available.</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Clean, modern look</li>
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Solar fabric for heat/glare</li>
                  <li className="flex items-center gap-2"><FaCheck className="text-green-500" /> Easy motorization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VELUX Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Have a VELUX Skylight?</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-700 mb-4">
                VELUX is the most common skylight brand. If you have a VELUX skylight, you can often
                order blinds using just the model number - no measuring required!
              </p>
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <h4 className="font-bold mb-2">Find Your VELUX Model Number</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Look at the top of your skylight frame</li>
                  <li>Find the metal data plate with model info</li>
                  <li>The model number format is like: GGL C04 or VS M08</li>
                  <li>Use this number when ordering VELUX-compatible blinds</li>
                </ol>
              </div>
              <p className="text-sm text-gray-600">
                VELUX blinds click into place in the frame with no drilling. Available in blackout,
                light filtering, and solar options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "What blinds work best for skylights?", a: "Cellular skylight shades are most popular - lightweight, energy efficient, and available in blackout. They have side tracks to hold the shade in place at any angle." },
                { q: "Can I use regular blinds on a skylight?", a: "No, regular blinds won't work. Skylights need special blinds with side channels or tensioned systems to hold them in place at an angle." },
                { q: "How do I operate skylight blinds that are out of reach?", a: "Options include motorized blinds controlled by remote or app, manual blinds with an extension pole, or solar-powered options. Motorized is recommended for skylights over 10 feet high." },
                { q: "Do I need to measure the angle of my skylight?", a: "For most skylight blinds, the exact angle isn't needed - standard products work on pitches from 15-85 degrees. Only mention approximate angle for very flat or near-vertical installations." },
              ].map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-red-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Cover Your Skylights?</h2>
          <p className="text-red-200 mb-6 max-w-xl mx-auto">
            Shop skylight blinds and shades or get expert help choosing the right solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?type=skylight"
              className="bg-white text-red-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Shop Skylight Blinds <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/consultation"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Get Expert Help
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
