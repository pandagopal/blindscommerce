"use client";

import Link from "next/link";
import { FaRuler, FaCheck, FaArrowRight, FaLightbulb, FaExclamationTriangle } from "react-icons/fa";

export default function MeasuringSlidingDoorsPage() {
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
              How to Measure Sliding Glass Doors for Blinds
            </h1>
            <p className="text-xl text-red-100">
              Sliding doors and patio doors need special consideration for window treatments.
              This guide covers measuring for vertical blinds, panel tracks, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Best Options */}
      <section className="py-12 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Best Blind Options for Sliding Doors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2">Vertical Blinds</h3>
                <p className="text-gray-600 text-sm mb-3">Classic choice for sliding doors. Individual vanes rotate for light control and slide open for door access.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Most Affordable</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Easy to Operate</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2">Panel Track Blinds</h3>
                <p className="text-gray-600 text-sm mb-3">Modern alternative to verticals. Wide fabric panels slide on a track. Clean, contemporary look.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Modern Look</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Many Fabrics</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2">Cellular Vertical Shades</h3>
                <p className="text-gray-600 text-sm mb-3">Vertical orientation of honeycomb shades. Energy efficient with a soft, fabric look.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Energy Efficient</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Soft Look</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2">Sheer Vertical Shades</h3>
                <p className="text-gray-600 text-sm mb-3">Fabric vanes between sheer layers. Elegant, diffused light with privacy and view-through options.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Elegant</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Light Filtering</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mount Types */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Inside vs Outside Mount</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3 text-green-700">Outside Mount (Recommended)</h3>
                <p className="text-gray-700 mb-4">
                  Blinds mount on the wall above the door frame and extend beyond the sides.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <FaCheck className="text-green-600 mt-0.5" />
                    <span>Better light blockage</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <FaCheck className="text-green-600 mt-0.5" />
                    <span>Door operates freely</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <FaCheck className="text-green-600 mt-0.5" />
                    <span>Makes door appear larger</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <FaCheck className="text-green-600 mt-0.5" />
                    <span>Covers frame imperfections</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">Inside Mount</h3>
                <p className="text-gray-700 mb-4">
                  Blinds fit inside the door frame. Requires deep frames (3+ inches).
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <FaCheck className="text-gray-600 mt-0.5" />
                    <span>Clean, built-in look</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <FaCheck className="text-gray-600 mt-0.5" />
                    <span>Shows off trim work</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-yellow-700">
                    <FaExclamationTriangle className="mt-0.5" />
                    <span>May interfere with door</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-yellow-700">
                    <FaExclamationTriangle className="mt-0.5" />
                    <span>Needs 3&quot;+ frame depth</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Measuring Steps */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Step-by-Step Measuring (Outside Mount)</h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Measure the Width</h3>
                    <p className="text-gray-600 mb-3">
                      Measure the width of the door frame, then add overlap:
                    </p>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="font-mono text-lg">
                        <strong>Width</strong> = Door frame width + 6-8 inches
                      </p>
                      <p className="text-sm text-gray-600 mt-2">Add 3-4&quot; on each side for overlap</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      <strong>Example:</strong> 72&quot; door frame + 8&quot; overlap = 80&quot; total width
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Measure the Height</h3>
                    <p className="text-gray-600 mb-3">
                      Measure from where blinds will mount to just above the floor:
                    </p>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="font-mono text-lg">
                        <strong>Height</strong> = Top of headrail to 1/2&quot; above floor
                      </p>
                      <p className="text-sm text-gray-600 mt-2">Mount 3-4&quot; above door frame</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      <strong>Example:</strong> If mounting 4&quot; above a 80&quot; door opening, and door opening starts 1/2&quot; from floor: Height = 84&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Check Headrail Clearance</h3>
                    <p className="text-gray-600 mb-3">
                      Ensure there&apos;s space above for the headrail:
                    </p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Vertical blinds need 4-6&quot; above mounting point</li>
                      <li>• Panel tracks need 3-4&quot; clearance</li>
                      <li>• Check for crown molding, vents, or lights</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Determine Stack Direction</h3>
                    <p className="text-gray-600 mb-3">
                      Where should the blinds stack when open?
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-start mb-2">
                          <div className="w-8 h-12 bg-red-300 rounded"></div>
                          <div className="flex-1 h-12 border-2 border-dashed border-gray-300 rounded ml-1"></div>
                        </div>
                        <p className="text-sm font-medium">Stack Left</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-end mb-2">
                          <div className="flex-1 h-12 border-2 border-dashed border-gray-300 rounded mr-1"></div>
                          <div className="w-8 h-12 bg-red-300 rounded"></div>
                        </div>
                        <p className="text-sm font-medium">Stack Right</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-center mb-2">
                          <div className="w-6 h-12 bg-red-300 rounded"></div>
                          <div className="flex-1 h-12 border-2 border-dashed border-gray-300 rounded mx-1"></div>
                          <div className="w-6 h-12 bg-red-300 rounded"></div>
                        </div>
                        <p className="text-sm font-medium">Split Center</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Choose based on which side your door opens from - stack blinds on the fixed panel side.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" />
              Pro Tips for Sliding Door Blinds
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium">Match stack to door operation</p>
                <p className="text-gray-600 text-sm">If door slides right to open, stack blinds on the left (fixed panel) side</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium">Consider split draw for wide doors</p>
                <p className="text-gray-600 text-sm">For doors over 96&quot;, split draw opens from center for easier operation</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium">Add wand control for safety</p>
                <p className="text-gray-600 text-sm">Cordless wand operation is safer with kids and pets near doors</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium">Consider motorization</p>
                <p className="text-gray-600 text-sm">Remote control is convenient for large, heavy blinds</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium">Check vane/panel width options</p>
                <p className="text-gray-600 text-sm">Wider vanes (3.5&quot;) or panels look more modern than narrow ones</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium">Measure floor to mounting point</p>
                <p className="text-gray-600 text-sm">Vanes should hang 1/2&quot; above floor - not dragging</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "What are the best blinds for sliding glass doors?", a: "Vertical blinds (affordable, easy), panel track blinds (modern look), cellular vertical shades (energy efficient), or sheer vertical shades (elegant). Your choice depends on style and budget." },
                { q: "Should sliding door blinds go inside or outside the frame?", a: "Outside mount is recommended. It provides better light blockage, doesn't interfere with door operation, and makes the door appear larger." },
                { q: "How much should blinds overlap a sliding door?", a: "Extend 3-4 inches beyond each side of the door frame and 3-4 inches above for proper light blockage and a finished look." },
                { q: "Can I use regular horizontal blinds on a sliding door?", a: "While possible, horizontal blinds aren't ideal. They can be heavy, may sag, and the door can't be used when lowered. Vertical options are better suited." },
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-xl p-6">
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
          <h2 className="text-2xl font-bold mb-4">Ready to Cover Your Sliding Doors?</h2>
          <p className="text-red-200 mb-6 max-w-xl mx-auto">
            Shop vertical blinds, panel tracks, and more for your sliding doors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?type=vertical"
              className="bg-white text-red-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Shop Vertical Blinds <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/products?type=panel-track"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Shop Panel Tracks
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
