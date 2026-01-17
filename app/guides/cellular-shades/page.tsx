"use client";

import Link from "next/link";
import { FaLeaf, FaSun, FaShieldAlt, FaChild, FaCheck, FaArrowRight, FaStar } from "react-icons/fa";

export default function CellularShadesBuyingGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-500 hover:text-primary-red">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/guides" className="text-gray-500 hover:text-primary-red">Guides</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Cellular Shades Buying Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg p-8 mb-10">
        <div className="max-w-3xl">
          <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Buying Guide
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Cellular Shades Buying Guide
          </h1>
          <p className="text-lg text-red-100 mb-4">
            Everything you need to know about honeycomb shades - the most energy-efficient
            window treatment for your home. Learn about cell sizes, opacity levels, and features.
          </p>
          <div className="flex items-center gap-4 text-sm text-green-200">
            <span>By <strong className="text-white">Jennifer Adams</strong>, Interior Design Consultant</span>
            <span>|</span>
            <span>10 min read</span>
          </div>
        </div>
      </div>

      {/* What Are Cellular Shades */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Are Cellular Shades?</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-4">
            Cellular shades, also known as <strong>honeycomb shades</strong>, are window treatments
            made from pleated fabric that forms honeycomb-shaped pockets when viewed from the side.
            These air-trapping cells provide superior insulation compared to other window treatments.
          </p>
          <p className="text-gray-700 mb-4">
            Originally developed in the 1980s, cellular shades have become one of the most popular
            window treatment choices due to their energy efficiency, clean appearance, and versatility.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <p className="text-green-800 font-medium">
              Energy Fact: Cellular shades can reduce heat loss through windows by up to 40% and
              cut overall energy costs by up to 25%.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Key Benefits of Cellular Shades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaLeaf className="text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Energy Efficient</h3>
            <p className="text-sm text-gray-600">Honeycomb cells trap air for superior insulation, reducing heating and cooling costs.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaSun className="text-4xl text-yellow-500 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Light Control</h3>
            <p className="text-sm text-gray-600">Available in sheer to blackout options for complete control over natural light.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaShieldAlt className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Sound Dampening</h3>
            <p className="text-sm text-gray-600">The cellular structure helps absorb sound, reducing outside noise.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaChild className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Child Safe Options</h3>
            <p className="text-sm text-gray-600">Cordless and motorized options eliminate cord hazards for families.</p>
          </div>
        </div>
      </section>

      {/* Cell Sizes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Understanding Cell Sizes</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Cell Size</th>
                <th className="text-left p-4 font-medium">Best For</th>
                <th className="text-left p-4 font-medium">Insulation</th>
                <th className="text-left p-4 font-medium">Appearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4 font-medium">3/8" (Single Cell)</td>
                <td className="p-4 text-gray-600">Small windows, sleek modern look</td>
                <td className="p-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Good</span></td>
                <td className="p-4 text-gray-600">Compact, minimal stack</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">1/2" (Single Cell)</td>
                <td className="p-4 text-gray-600">Most windows, versatile choice</td>
                <td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Better</span></td>
                <td className="p-4 text-gray-600">Balanced proportions</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">3/4" (Single Cell)</td>
                <td className="p-4 text-gray-600">Large windows, maximum insulation</td>
                <td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Better</span></td>
                <td className="p-4 text-gray-600">Bold, dramatic pleats</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Double Cell</td>
                <td className="p-4 text-gray-600">Extreme climates, energy savings priority</td>
                <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Best</span></td>
                <td className="p-4 text-gray-600">Two layers of cells, thicker profile</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Opacity Levels */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Choosing Your Opacity Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-full h-16 bg-gradient-to-b from-white to-gray-100 rounded mb-4 border"></div>
            <h3 className="font-bold mb-2">Sheer</h3>
            <p className="text-sm text-gray-600 mb-3">Allows natural light to pass through while providing daytime privacy. Not recommended for bedrooms.</p>
            <p className="text-xs text-gray-500">Light blocking: ~15-25%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-full h-16 bg-gradient-to-b from-gray-100 to-gray-200 rounded mb-4 border"></div>
            <h3 className="font-bold mb-2">Light Filtering</h3>
            <p className="text-sm text-gray-600 mb-3">Softly diffuses light for a warm glow. Provides privacy day and night. Most popular choice.</p>
            <p className="text-xs text-gray-500">Light blocking: ~40-70%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-full h-16 bg-gradient-to-b from-gray-300 to-gray-400 rounded mb-4 border"></div>
            <h3 className="font-bold mb-2">Room Darkening</h3>
            <p className="text-sm text-gray-600 mb-3">Blocks most light while allowing some ambient glow. Great for media rooms and bedrooms.</p>
            <p className="text-xs text-gray-500">Light blocking: ~95-99%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-full h-16 bg-gradient-to-b from-gray-600 to-gray-800 rounded mb-4 border"></div>
            <h3 className="font-bold mb-2">Blackout</h3>
            <p className="text-sm text-gray-600 mb-3">Blocks virtually all light. Ideal for bedrooms, nurseries, and shift workers.</p>
            <p className="text-xs text-gray-500">Light blocking: ~99%+</p>
          </div>
        </div>
      </section>

      {/* Features & Upgrades */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Popular Features & Upgrades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Lift Options</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Cordless</p>
                  <p className="text-sm text-gray-600">Push up/pull down operation. Safest for homes with children.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Motorized</p>
                  <p className="text-sm text-gray-600">Remote or smart home control. Perfect for high or hard-to-reach windows.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Top-Down Bottom-Up</p>
                  <p className="text-sm text-gray-600">Lower from top OR raise from bottom for flexible light and privacy.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Special Features</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Day/Night Shades</p>
                  <p className="text-sm text-gray-600">Two shades in one - light filtering on top, blackout on bottom.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Skylight Shades</p>
                  <p className="text-sm text-gray-600">Specially designed for angled and overhead windows.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Specialty Shapes</p>
                  <p className="text-sm text-gray-600">Arched, angled, and custom shapes available.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Rooms for Cellular Shades</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-green-700 mb-2">Excellent Choice</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Bedrooms (blackout)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Living Rooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Home Offices</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Nurseries (cordless)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-yellow-700 mb-2">Good Choice</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Dining Rooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Sunrooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Hallways</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-red-700 mb-2">Not Recommended</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Bathrooms (high humidity)</li>
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Above kitchen sink</li>
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Near hot tubs/pools</li>
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
              <li>+ Best-in-class energy efficiency</li>
              <li>+ Wide range of colors and textures</li>
              <li>+ Multiple opacity levels available</li>
              <li>+ Sound dampening properties</li>
              <li>+ Clean, modern appearance</li>
              <li>+ Child-safe cordless options</li>
              <li>+ Available for specialty shapes</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-800 mb-4">Limitations</h3>
            <ul className="space-y-2 text-red-700">
              <li>- Not moisture-resistant (avoid bathrooms)</li>
              <li>- Can be harder to clean than hard blinds</li>
              <li>- Fabric may fade over time with sun exposure</li>
              <li>- Higher price point than basic blinds</li>
              <li>- Cells can trap dust</li>
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
              q: "What are cellular shades?",
              a: "Cellular shades, also called honeycomb shades, are window treatments made from pleated fabric that forms honeycomb-shaped cells when viewed from the side. These cells trap air, providing excellent insulation that can help reduce energy costs by up to 25%."
            },
            {
              q: "Are cellular shades energy efficient?",
              a: "Yes, cellular shades are among the most energy-efficient window treatments available. The honeycomb cells trap air to create insulation. Single cell shades offer good insulation, while double cell shades provide even better energy savings. Studies show they can reduce heat loss through windows by up to 40%."
            },
            {
              q: "What cell size should I choose?",
              a: "Cell size affects both appearance and insulation. 3/8\" cells are best for small windows and a sleek look. 1/2\" cells are versatile and work on most windows. 3/4\" cells provide maximum insulation and suit larger windows. Double cell shades offer the best energy efficiency."
            },
            {
              q: "Do cellular shades block light completely?",
              a: "It depends on the opacity level. Light filtering shades diffuse light for a soft glow. Room darkening shades block about 95-99% of light. Blackout shades block nearly all light, though some light may enter around edges depending on mount type."
            },
            {
              q: "How long do cellular shades last?",
              a: "Quality cellular shades typically last 7-10 years with proper care. Factors affecting lifespan include fabric quality, sun exposure, frequency of use, and maintenance."
            },
            {
              q: "Can cellular shades be motorized?",
              a: "Yes, cellular shades are excellent candidates for motorization. Motorized cellular shades can be controlled via remote, smartphone app, or voice assistants like Alexa and Google Home."
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
      <section className="bg-green-900 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Shop Cellular Shades?</h2>
        <p className="text-green-200 mb-6 max-w-2xl mx-auto">
          Browse our collection of energy-efficient cellular shades in a variety of colors,
          cell sizes, and opacity levels. Free shipping on orders over $99.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products?category=cellular-shades"
            className="bg-white text-green-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
          >
            Shop Cellular Shades <FaArrowRight className="ml-2" />
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
