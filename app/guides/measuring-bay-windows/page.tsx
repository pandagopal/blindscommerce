"use client";

import Link from "next/link";
import { FaRuler, FaCheck, FaArrowRight, FaExclamationTriangle, FaLightbulb } from "react-icons/fa";

export default function MeasuringBayWindowsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-700 to-red-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <Link href="/guides" className="text-red-200 hover:text-white mb-4 inline-block">
              ← Back to Guides
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How to Measure Bay Windows for Blinds
            </h1>
            <p className="text-xl text-red-100">
              Bay windows require special attention when measuring. This guide walks you through
              measuring each section correctly for a perfect fit.
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Need */}
      <section className="py-12 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">What You&apos;ll Need</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                <FaRuler className="text-red-600 text-xl" />
                <span>Steel tape measure (25ft+)</span>
              </div>
              <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <span>Paper and pen</span>
              </div>
              <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                <span className="text-2xl">🪜</span>
                <span>Step stool (if needed)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Bay Windows */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Understanding Bay Window Configurations</h2>
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <p className="text-gray-700 mb-4">
                    Bay windows project outward from the wall, creating a cozy alcove. They typically consist of:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <FaCheck className="text-green-500" />
                      <span><strong>3-section:</strong> One center + two angled sides (most common)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheck className="text-green-500" />
                      <span><strong>5-section:</strong> One center + two sides + two corners</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheck className="text-green-500" />
                      <span><strong>Bow window:</strong> 4-6 curved sections (measure each)</span>
                    </li>
                  </ul>
                </div>
                <div className="w-64 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-end justify-center p-4">
                  <div className="flex">
                    <div className="w-12 h-32 border-2 border-red-500 bg-red-100 transform -skew-y-12"></div>
                    <div className="w-20 h-36 border-2 border-red-500 bg-red-100"></div>
                    <div className="w-12 h-32 border-2 border-red-500 bg-red-100 transform skew-y-12"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8">
              <div className="flex items-start gap-3">
                <FaLightbulb className="text-yellow-600 mt-1" />
                <div>
                  <h4 className="font-bold">Key Insight</h4>
                  <p className="text-gray-700">Each window section is measured independently - treat each as its own window. You&apos;ll order separate blinds for each section.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step by Step */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Step-by-Step Measuring Guide</h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Choose Your Mount Type</h3>
                    <p className="text-gray-600 mb-4">
                      <strong>Inside mount</strong> (recommended for bay windows): Blinds fit inside the window frame, preserving architectural detail.
                      <br /><strong>Outside mount:</strong> Blinds mount on the wall/frame and cover the entire window.
                    </p>
                    <p className="text-gray-600">
                      Inside mount requires at least 1.5&quot; depth in the window frame. Check each section.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Label Each Section</h3>
                    <p className="text-gray-600 mb-4">
                      Before measuring, label your sections clearly. Standing inside looking out:
                    </p>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>L</strong> = Far left section</li>
                      <li>• <strong>LC</strong> = Left center (if 5-section)</li>
                      <li>• <strong>C</strong> = Center section</li>
                      <li>• <strong>RC</strong> = Right center (if 5-section)</li>
                      <li>• <strong>R</strong> = Far right section</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Measure Width (Each Section)</h3>
                    <p className="text-gray-600 mb-4">
                      For <strong>inside mount</strong>: Measure the inside width at three points - top, middle, and bottom. Record the <strong>smallest</strong> measurement to ensure the blind fits.
                    </p>
                    <p className="text-gray-600">
                      For <strong>outside mount</strong>: Measure the width you want to cover, adding 2-3 inches on each side.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Measure Height (Each Section)</h3>
                    <p className="text-gray-600 mb-4">
                      For <strong>inside mount</strong>: Measure height at three points - left, center, right. Record the <strong>longest</strong> measurement.
                    </p>
                    <p className="text-gray-600">
                      For <strong>outside mount</strong>: Measure from where you want the top of the blind to start to where you want it to end. Add 3-4 inches above and below window frame.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">5</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Check for Obstructions</h3>
                    <p className="text-gray-600 mb-4">
                      Look for anything that might interfere with blinds:
                    </p>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Window cranks or handles</li>
                      <li>• Locks or latches</li>
                      <li>• AC units or vents</li>
                      <li>• Molding or trim</li>
                    </ul>
                    <p className="text-gray-600 mt-2">Note these on your measurement sheet.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">6</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Double-Check Everything</h3>
                    <p className="text-gray-600">
                      Measure each section twice. Record width × height for each section. Confirm your mount type. Remember: measure twice, order once!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Recording Sheet */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Sample Measurement Recording</h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Section</th>
                    <th className="text-left py-2">Width</th>
                    <th className="text-left py-2">Height</th>
                    <th className="text-left py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 font-medium">Left (L)</td>
                    <td className="py-2">24 1/4&quot;</td>
                    <td className="py-2">48&quot;</td>
                    <td className="py-2 text-gray-600">Crank handle on right</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Center (C)</td>
                    <td className="py-2">36 1/2&quot;</td>
                    <td className="py-2">48&quot;</td>
                    <td className="py-2 text-gray-600">Fixed window</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Right (R)</td>
                    <td className="py-2">24 1/8&quot;</td>
                    <td className="py-2">48 1/4&quot;</td>
                    <td className="py-2 text-gray-600">Crank handle on left</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-sm text-gray-500 mt-4">Mount type: Inside mount | Frame depth: 2.5&quot;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-12 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-500" />
              Common Mistakes to Avoid
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="font-medium text-red-700">❌ Measuring all sections together</p>
                <p className="text-gray-600 text-sm">Each section needs its own measurement</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-medium text-red-700">❌ Using a cloth tape measure</p>
                <p className="text-gray-600 text-sm">Cloth stretches - use steel tape only</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-medium text-red-700">❌ Assuming sections are identical</p>
                <p className="text-gray-600 text-sm">Angles often make sections slightly different</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-medium text-red-700">❌ Forgetting window hardware</p>
                <p className="text-gray-600 text-sm">Cranks and handles affect blind operation</p>
              </div>
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
                { q: "Should I use one blind or multiple blinds for a bay window?", a: "Multiple blinds (one per section) is recommended. Each fits properly within its angled section and provides better light control." },
                { q: "What's the best blind type for bay windows?", a: "Cellular shades, roman shades, and roller shades work well. They mount easily in angled openings. Avoid vertical blinds." },
                { q: "How do I measure the angles in a bay window?", a: "You don't need to measure angles. Each window section is a standard rectangle - measure each independently." },
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
          <h2 className="text-2xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-red-200 mb-6 max-w-xl mx-auto">
            Shop blinds perfect for bay windows or get free samples to see colors in your space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-red-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Shop Now <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/samples"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Order Free Samples
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
