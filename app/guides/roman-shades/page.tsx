"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaStar, FaPalette, FaHome, FaLayerGroup } from "react-icons/fa";

export default function RomanShadesBuyingGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-500 hover:text-primary-red">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/guides" className="text-gray-500 hover:text-primary-red">Guides</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Roman Shades Buying Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg p-8 mb-10">
        <div className="max-w-3xl">
          <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Buying Guide
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Roman Shades Buying Guide
          </h1>
          <p className="text-lg text-red-100 mb-4">
            Elegant fabric folds that add warmth and sophistication to any room.
            Discover fold styles, fabrics, and find the perfect roman shades for your home.
          </p>
          <div className="flex items-center gap-4 text-sm text-purple-200">
            <span>By <strong className="text-white">Jennifer Adams</strong>, Interior Design Consultant</span>
            <span>|</span>
            <span>9 min read</span>
          </div>
        </div>
      </div>

      {/* What Are Roman Shades */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Are Roman Shades?</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-4">
            Roman shades are fabric window treatments that fold up in horizontal pleats when raised
            and lie flat (or with soft folds) against the window when lowered. They combine the
            softness and elegance of drapery with the clean functionality of a shade.
          </p>
          <p className="text-gray-700 mb-4">
            Dating back to the Roman Empire (hence the name), these shades were originally used to
            keep dust out while allowing air to circulate. Today, they're prized for their ability
            to add texture, color, and a custom look to any space.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
            <p className="text-purple-800 font-medium">
              Design Tip: Roman shades are the perfect middle ground between hard blinds and soft drapery,
              offering the best of both worlds - clean lines with fabric warmth.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Choose Roman Shades?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaPalette className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Elegant Design</h3>
            <p className="text-sm text-gray-600">Soft fabric folds add sophistication and warmth that hard blinds can't match.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaHome className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Custom Look</h3>
            <p className="text-sm text-gray-600">Endless fabric choices let you match any decor style or color scheme.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaLayerGroup className="text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Liner Options</h3>
            <p className="text-sm text-gray-600">Add blackout, thermal, or privacy liners to customize light control.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaStar className="text-4xl text-yellow-500 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Timeless Style</h3>
            <p className="text-sm text-gray-600">A classic design that works with traditional, transitional, and modern interiors.</p>
          </div>
        </div>
      </section>

      {/* Fold Styles */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Roman Shade Fold Styles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-16 bg-purple-200 rounded"></div>
                <p className="text-xs text-gray-500 mt-2">Flat when lowered</p>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Flat / Classic Roman</h3>
            <p className="text-gray-600 mb-3">
              The most popular style. Lies completely flat when lowered, creating a clean,
              tailored look. Folds stack neatly when raised.
            </p>
            <p className="text-sm text-purple-700 font-medium">Best for: Modern and contemporary spaces</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 space-y-1">
                  <div className="h-4 bg-purple-200 rounded"></div>
                  <div className="h-4 bg-purple-300 rounded"></div>
                  <div className="h-4 bg-purple-200 rounded"></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Soft folds when lowered</p>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Hobbled / Teardrop</h3>
            <p className="text-gray-600 mb-3">
              Features cascading, overlapping folds that remain visible even when lowered.
              Creates a soft, luxurious appearance.
            </p>
            <p className="text-sm text-purple-700 font-medium">Best for: Traditional and formal rooms</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-12 bg-purple-200 rounded-b-full"></div>
                <p className="text-xs text-gray-500 mt-2">Soft curved bottom</p>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Relaxed / European</h3>
            <p className="text-gray-600 mb-3">
              Features a gentle, curved bottom edge that creates a soft, casual appearance.
              Less structured than flat or hobbled styles.
            </p>
            <p className="text-sm text-purple-700 font-medium">Best for: Casual, cottage, or coastal styles</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-16 bg-purple-200 rounded-full"></div>
                <p className="text-xs text-gray-500 mt-2">Gathered, puffy look</p>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Balloon</h3>
            <p className="text-gray-600 mb-3">
              Gathers into billowy poufs at the bottom. Very decorative and dramatic.
              Typically stays partially raised.
            </p>
            <p className="text-sm text-purple-700 font-medium">Best for: Formal dining, bedrooms, Victorian style</p>
          </div>
        </div>
      </section>

      {/* Fabric & Liners */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Fabric Types & Liners</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Popular Fabric Types</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Cotton & Linen</p>
                  <p className="text-sm text-gray-600">Natural fibers with beautiful drape. May fade in direct sun.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Polyester Blends</p>
                  <p className="text-sm text-gray-600">Durable, fade-resistant, easy to clean. Great value.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Silk & Silk-Look</p>
                  <p className="text-sm text-gray-600">Luxurious sheen for formal spaces. Requires careful handling.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Textured Weaves</p>
                  <p className="text-sm text-gray-600">Adds visual interest and depth. Hides imperfections well.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Liner Options</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Unlined</p>
                  <p className="text-sm text-gray-600">Most light transmission. Shows fabric pattern backlit.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Privacy Lining</p>
                  <p className="text-sm text-gray-600">Light filtering while maintaining privacy. Most popular choice.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Blackout Lining</p>
                  <p className="text-sm text-gray-600">Blocks 99%+ light. Ideal for bedrooms and media rooms.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Thermal Lining</p>
                  <p className="text-sm text-gray-600">Adds insulation for energy efficiency. Reduces heat/cold transfer.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Rooms for Roman Shades</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-green-700 mb-2">Excellent Choice</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Living Rooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Dining Rooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Bedrooms (with blackout)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Home Offices</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-yellow-700 mb-2">Good Choice</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Foyers/Entryways</li>
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Dens</li>
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Guest Rooms</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-red-700 mb-2">Not Recommended</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Bathrooms (humidity)</li>
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Near kitchen stove</li>
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> High-humidity areas</li>
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
              <li>+ Elegant, custom appearance</li>
              <li>+ Endless fabric and pattern choices</li>
              <li>+ Multiple fold styles for any decor</li>
              <li>+ Adds warmth and texture to rooms</li>
              <li>+ Liner options for light control</li>
              <li>+ Works with traditional to modern styles</li>
              <li>+ Can be motorized</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-800 mb-4">Limitations</h3>
            <ul className="space-y-2 text-red-700">
              <li>- Not suitable for high-humidity rooms</li>
              <li>- Requires professional cleaning</li>
              <li>- Fabric can fade in direct sunlight</li>
              <li>- Higher price than basic blinds</li>
              <li>- Larger stack when raised</li>
              <li>- Heavier than other shade types</li>
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
              q: "What are roman shades?",
              a: "Roman shades are fabric window treatments that fold up in horizontal pleats when raised and lie flat (or with soft folds) against the window when lowered. They combine the softness of drapery with the functionality of a shade."
            },
            {
              q: "What are the different styles of roman shades?",
              a: "The main styles are: Flat/Classic (smooth when lowered), Hobbled/Teardrop (cascading folds), Relaxed/European (soft curve at bottom), and Balloon (puffy, gathered). Flat is most popular for modern homes."
            },
            {
              q: "Are roman shades good for insulation?",
              a: "Roman shades provide moderate insulation, especially with lined fabrics. For better energy efficiency, choose roman shades with thermal or blackout lining."
            },
            {
              q: "How do I clean roman shades?",
              a: "Regular dusting with a vacuum brush attachment keeps roman shades clean. Spot clean by blotting (not rubbing) with a damp cloth. Most should be professionally cleaned for deep cleaning."
            },
            {
              q: "Can roman shades be motorized?",
              a: "Yes, roman shades can be motorized. Because they're heavier than other shade types, make sure to choose a motor rated for the shade weight."
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
        <h2 className="text-2xl font-bold mb-4">Ready to Shop Roman Shades?</h2>
        <p className="text-red-200 mb-6 max-w-2xl mx-auto">
          Browse our collection of elegant roman shades in various fold styles, fabrics, and colors.
          Free shipping on orders over $99.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products?category=roman-shades"
            className="bg-white text-red-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
          >
            Shop Roman Shades <FaArrowRight className="ml-2" />
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
