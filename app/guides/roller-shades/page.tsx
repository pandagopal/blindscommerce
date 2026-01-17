"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaStar, FaSun, FaEye, FaShieldAlt, FaCog } from "react-icons/fa";

export default function RollerShadesBuyingGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-500 hover:text-primary-red">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/guides" className="text-gray-500 hover:text-primary-red">Guides</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Roller Shades Buying Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg p-8 mb-10">
        <div className="container mx-auto">
          <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Buying Guide
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Roller Shades Buying Guide
          </h1>
          <p className="text-lg text-red-100 mb-4">
            The ultimate guide to roller shades - clean lines, modern style, and endless options.
            From solar shades to blackout, find the perfect roller shade for any room.
          </p>
          <div className="flex items-center gap-4 text-sm text-blue-200">
            <span>By <strong className="text-white">Mike Chen</strong>, Lead Window Consultant</span>
            <span>|</span>
            <span>8 min read</span>
          </div>
        </div>
      </div>

      {/* What Are Roller Shades */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Are Roller Shades?</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-4">
            Roller shades are window treatments made from a single piece of fabric that rolls up onto
            a tube at the top of the window. When lowered, they lay flat against your window, creating
            a clean, streamlined look. When raised, they roll up compactly into a small tube.
          </p>
          <p className="text-gray-700 mb-4">
            Their simplicity makes them one of the most versatile window treatments available. They're
            equally at home in modern minimalist spaces, traditional homes, and commercial settings.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800 font-medium">
              Pro Tip: Roller shades are ideal for layering. Pair sheer roller shades with blackout
              options for complete light control throughout the day.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Choose Roller Shades?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaSun className="text-4xl text-yellow-500 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Light Control</h3>
            <p className="text-sm text-gray-600">From view-through solar to complete blackout - control exactly how much light enters.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaEye className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Clean Aesthetics</h3>
            <p className="text-sm text-gray-600">Minimal, modern look with no slats or pleats. Perfect for contemporary spaces.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaCog className="text-4xl text-gray-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Easy Operation</h3>
            <p className="text-sm text-gray-600">Simple spring mechanism, cordless, or motorized for effortless control.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaShieldAlt className="text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">UV Protection</h3>
            <p className="text-sm text-gray-600">Solar shades block harmful UV rays while maintaining your view.</p>
          </div>
        </div>
      </section>

      {/* Types of Roller Shades */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Types of Roller Shades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-blue-700">Solar/Screen Shades</h3>
            <p className="text-gray-600 mb-3">
              Woven fabric that blocks UV rays and reduces glare while maintaining your view.
              Perfect for living rooms, offices, and spaces where you want to see outside.
            </p>
            <p className="text-sm text-gray-500">
              <strong>Openness Factor:</strong> 1% (more privacy) to 14% (more view)
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-purple-700">Light Filtering</h3>
            <p className="text-gray-600 mb-3">
              Softens and diffuses natural light while providing privacy. Creates a warm,
              inviting atmosphere without blocking all light.
            </p>
            <p className="text-sm text-gray-500">
              <strong>Best for:</strong> Living rooms, dining rooms, kitchens
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-gray-700">Room Darkening</h3>
            <p className="text-gray-600 mb-3">
              Blocks 95-99% of light. Great for bedrooms, media rooms, or anywhere you need
              significant light reduction but not complete darkness.
            </p>
            <p className="text-sm text-gray-500">
              <strong>Best for:</strong> Bedrooms, media rooms, nurseries
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-gray-900">Blackout</h3>
            <p className="text-gray-600 mb-3">
              Blocks 99%+ of light for complete darkness. Ideal for bedrooms, especially
              for shift workers or light-sensitive sleepers.
            </p>
            <p className="text-sm text-gray-500">
              <strong>Pro tip:</strong> Add side channels for complete light blocking
            </p>
          </div>
        </div>
      </section>

      {/* Solar Shade Openness */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Understanding Solar Shade Openness</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-6">
            Solar shades are rated by "openness factor" - the percentage of weave that allows light through.
            Lower numbers mean more light blocking and privacy; higher numbers provide better view-through.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium">Openness</th>
                  <th className="text-left p-4 font-medium">View</th>
                  <th className="text-left p-4 font-medium">UV Block</th>
                  <th className="text-left p-4 font-medium">Privacy</th>
                  <th className="text-left p-4 font-medium">Best For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-4 font-medium">1%</td>
                  <td className="p-4 text-gray-600">Minimal</td>
                  <td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">99%</span></td>
                  <td className="p-4 text-gray-600">Excellent</td>
                  <td className="p-4 text-gray-600">Maximum glare reduction</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">3%</td>
                  <td className="p-4 text-gray-600">Moderate</td>
                  <td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">97%</span></td>
                  <td className="p-4 text-gray-600">Very Good</td>
                  <td className="p-4 text-gray-600">Offices, living rooms</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">5%</td>
                  <td className="p-4 text-gray-600">Good</td>
                  <td className="p-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">95%</span></td>
                  <td className="p-4 text-gray-600">Good</td>
                  <td className="p-4 text-gray-600">Most popular - balanced</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">10-14%</td>
                  <td className="p-4 text-gray-600">Excellent</td>
                  <td className="p-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">86-90%</span></td>
                  <td className="p-4 text-gray-600">Moderate</td>
                  <td className="p-4 text-gray-600">Great views, scenic areas</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Features & Upgrades</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Lift Options</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Cordless Spring</p>
                  <p className="text-sm text-gray-600">Pull to lower, release to roll up</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Motorized</p>
                  <p className="text-sm text-gray-600">Remote or smart home control</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Continuous Loop</p>
                  <p className="text-sm text-gray-600">Bead chain for large shades</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Roll Direction</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Standard Roll</p>
                  <p className="text-sm text-gray-600">Fabric rolls behind the tube</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Reverse Roll</p>
                  <p className="text-sm text-gray-600">Fabric rolls in front - closer to window for better light seal</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Accessories</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Valance/Cassette</p>
                  <p className="text-sm text-gray-600">Covers the roller tube for a finished look</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Side Channels</p>
                  <p className="text-sm text-gray-600">Eliminate light gaps for blackout</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Bottom Bar Options</p>
                  <p className="text-sm text-gray-600">Standard, fabric-wrapped, or hidden</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Rooms for Roller Shades</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-green-700 mb-2">Excellent Choice</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Living Rooms (solar)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Bedrooms (blackout)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Home Offices (solar)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Commercial Spaces</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-yellow-700 mb-2">Good Choice</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Kitchens (vinyl)</li>
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Bathrooms (vinyl)</li>
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Dining Rooms</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-700 mb-2">Special Considerations</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Large Windows (motorized)</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Media Rooms (blackout)</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Sunrooms (solar)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pros and Cons */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Pros and Cons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-green-800 mb-4">Advantages</h3>
            <ul className="space-y-2 text-green-700">
              <li>+ Clean, modern, minimalist look</li>
              <li>+ Wide range of fabrics and opacities</li>
              <li>+ Easy to motorize</li>
              <li>+ Compact when raised</li>
              <li>+ Budget-friendly options available</li>
              <li>+ Easy to clean (especially vinyl)</li>
              <li>+ Great for large windows</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-800 mb-4">Limitations</h3>
            <ul className="space-y-2 text-red-700">
              <li>- No slat tilting for partial light control</li>
              <li>- Light gaps around edges (unless add channels)</li>
              <li>- Less insulation than cellular shades</li>
              <li>- Spring mechanism may need adjustment over time</li>
              <li>- Fabric can fade with sun exposure</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: "What are roller shades?",
              a: "Roller shades are window treatments made from a single piece of fabric that rolls up onto a tube at the top of the window. They offer a clean, minimalist look and are available in a wide range of fabrics from sheer to blackout."
            },
            {
              q: "What are solar shades?",
              a: "Solar shades are a type of roller shade made from specially woven fabric that blocks UV rays and reduces glare while maintaining your view of the outside. They're measured by 'openness factor' - lower percentages block more light and heat."
            },
            {
              q: "Are roller shades good for bedrooms?",
              a: "Yes, blackout roller shades are excellent for bedrooms. They block 99%+ of light for better sleep. For maximum darkness, choose outside mount and consider adding side channels."
            },
            {
              q: "Can roller shades be motorized?",
              a: "Yes, roller shades are ideal for motorization due to their simple rolling mechanism. Motorized roller shades can be controlled via remote, smartphone, or smart home systems."
            },
            {
              q: "How do I clean roller shades?",
              a: "Dust regularly with a soft cloth or vacuum with brush attachment. For spot cleaning, use a damp cloth with mild soap. Vinyl roller shades can be wiped down with a wet cloth."
            }
          ].map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-700 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Shop Roller Shades?</h2>
        <p className="text-red-200 mb-6 max-w-2xl mx-auto">
          Browse our collection of roller shades including solar, light filtering, and blackout options.
          Free shipping on orders over $99.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products?category=roller-shades"
            className="bg-white text-red-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
          >
            Shop Roller Shades <FaArrowRight className="ml-2" />
          </Link>
          <Link
            href="/samples"
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            Order Free Samples
          </Link>
        </div>
      </section>
    </div>
  );
}
