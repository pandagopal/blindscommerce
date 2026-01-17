"use client";

import Link from "next/link";
import { FaRuler, FaCheck, FaArrowRight, FaLightbulb } from "react-icons/fa";

export default function MeasuringArchedWindowsPage() {
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
              How to Measure Arched Windows for Blinds
            </h1>
            <p className="text-xl text-red-100">
              Arched and specialty shaped windows add architectural beauty but require careful
              measuring. This guide covers all arch types and shapes.
            </p>
          </div>
        </div>
      </section>

      {/* Arch Types */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Types of Arched Windows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-white border-2 border-red-500 rounded-t-full"></div>
                <h3 className="font-bold">Perfect Half-Circle</h3>
                <p className="text-sm text-gray-600">Height = half of width</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-24 h-16 mx-auto mb-4 bg-white border-2 border-red-500 rounded-t-full"></div>
                <h3 className="font-bold">Eyebrow Arch</h3>
                <p className="text-sm text-gray-600">Shallower curve</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-16 h-24 mx-auto mb-4 bg-white border-2 border-red-500" style={{ borderTopLeftRadius: '100%' }}></div>
                <h3 className="font-bold">Quarter Circle</h3>
                <p className="text-sm text-gray-600">Corner windows</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-20 h-28 mx-auto mb-4 bg-white border-2 border-red-500" style={{ borderRadius: '50% 50% 0 0 / 80% 80% 0 0' }}></div>
                <h3 className="font-bold">Gothic/Pointed</h3>
                <p className="text-sm text-gray-600">Peaked top</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect Half-Circle */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Measuring Perfect Half-Circle Arches</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-4">
                    A perfect half-circle arch is the easiest to measure because only one measurement
                    is needed - the width determines the height automatically.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                      <p>Measure the <strong>width</strong> at the widest point (base of the arch)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                      <p>Verify it&apos;s a perfect half-circle: height should equal half the width</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                      <p>Order using just the width - manufacturer calculates the rest</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-40 h-20 bg-red-100 border-2 border-red-500 rounded-t-full"></div>
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-sm font-medium">
                      <span>|</span>
                      <span className="text-red-700">Width</span>
                      <span>|</span>
                    </div>
                    <div className="absolute top-0 -right-12 h-full flex flex-col justify-between text-sm">
                      <span>_</span>
                      <span className="text-red-700 -rotate-90 transform origin-center">Height</span>
                      <span>_</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-red-50 rounded-lg p-4">
                <p className="text-sm"><strong>Example:</strong> If your arch is 48&quot; wide, a perfect half-circle would be 24&quot; tall. Measure the actual height to confirm.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eyebrow/Non-Standard Arches */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Measuring Eyebrow & Non-Standard Arches</h2>
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <p className="text-gray-700 mb-6">
                If your arch height doesn&apos;t equal half the width, you have an eyebrow or elliptical arch.
                These require more detailed measurements.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="font-medium">Measure the width</p>
                    <p className="text-gray-600 text-sm">At the widest point (base of arch)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <p className="font-medium">Measure the height</p>
                    <p className="text-gray-600 text-sm">From base to highest point of curve</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <p className="font-medium">Create a template</p>
                    <p className="text-gray-600 text-sm">Trace the exact curve onto cardboard or paper</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shrink-0">4</div>
                  <div>
                    <p className="font-medium">Contact us with your template</p>
                    <p className="text-gray-600 text-sm">We&apos;ll help ensure a perfect custom fit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Combination Windows */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Arch Over Rectangle (Combination Windows)</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-700 mb-4">
                    Many windows have an arched top over a rectangular bottom. You have two options:
                  </p>
                  <div className="space-y-4">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4">
                      <h4 className="font-bold text-green-700">Option 1: Treat Separately</h4>
                      <p className="text-sm text-gray-700">Cover the rectangular portion with blinds and leave the arch open or with a stationary shade. Most affordable option.</p>
                    </div>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                      <h4 className="font-bold text-red-700">Option 2: Full Coverage</h4>
                      <p className="text-sm text-gray-700">Order matching arch shade + rectangular blind. Measure each portion separately.</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center items-center">
                  <div>
                    <div className="w-32 h-16 bg-red-100 border-2 border-red-500 rounded-t-full"></div>
                    <div className="w-32 h-40 bg-red-100 border-2 border-red-500 border-t-0 flex items-center justify-center text-sm text-gray-600">
                      Rectangle
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-bold mb-2">Measuring Combination Windows:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-500" />
                    <span><strong>Arch:</strong> Width at base, height from base to top of curve</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-500" />
                    <span><strong>Rectangle:</strong> Width and height of rectangular portion only</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Options */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Window Treatment Options for Arches</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">Cellular Arch Shades</h3>
                <p className="text-gray-600 text-sm mb-3">Custom-made to follow your exact curve. Energy efficient. Available in perfect arch and eyebrow shapes.</p>
                <span className="text-green-600 font-medium text-sm">Most Popular</span>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">Plantation Shutters</h3>
                <p className="text-gray-600 text-sm mb-3">Elegant sunburst design for arches. Operable or stationary. Premium look.</p>
                <span className="text-red-600 font-medium text-sm">Premium Option</span>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3">Leave Arch Open</h3>
                <p className="text-gray-600 text-sm mb-3">Cover only the rectangular portion. Showcases architectural detail. Most affordable.</p>
                <span className="text-red-600 font-medium text-sm">Budget Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-12 bg-yellow-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaLightbulb className="text-yellow-600" />
              Pro Tips for Arched Windows
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="font-medium">Use a steel tape measure</p>
                <p className="text-gray-600 text-sm">Cloth tapes stretch and give inaccurate measurements</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-medium">Measure to nearest 1/8 inch</p>
                <p className="text-gray-600 text-sm">Precision matters for custom arch shades</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-medium">Note frame depth</p>
                <p className="text-gray-600 text-sm">Inside mount needs at least 1&quot; depth</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-medium">Take photos</p>
                <p className="text-gray-600 text-sm">Helpful when discussing with our team</p>
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
                { q: "Can you put blinds on arched windows?", a: "Yes! Options include custom arch-shaped cellular shades, shutters with sunburst pattern, stationary fabric shades, or covering just the rectangular portion." },
                { q: "How do I know if my arch is a perfect half circle?", a: "Measure width and height. If height equals exactly half the width (e.g., 36\" wide = 18\" tall), it's a perfect half-circle." },
                { q: "What's the best window treatment for arched windows?", a: "Cellular arch shades are most popular - energy efficient and available in multiple shapes. Plantation shutters with sunburst design are elegant but pricier." },
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
          <h2 className="text-2xl font-bold mb-4">Need Help With Your Arched Windows?</h2>
          <p className="text-red-200 mb-6 max-w-xl mx-auto">
            Our experts specialize in custom solutions for specialty shaped windows. Get free advice!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/consultation"
              className="bg-white text-red-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Free Consultation <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/products?shape=arch"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Shop Arch Shades
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
