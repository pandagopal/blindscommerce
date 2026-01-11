"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaStar, FaEye, FaEyeSlash, FaSun, FaShieldAlt, FaBed, FaBath } from "react-icons/fa";

export default function TopDownBottomUpShadesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Ultimate Versatility
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Top Down Bottom Up Shades
            </h1>
            <p className="text-xl text-indigo-100 mb-8">
              The best of both worlds. Lower from the top for natural light while maintaining privacy,
              or raise from the bottom like traditional shades. You control every inch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?feature=top-down-bottom-up"
                className="bg-white text-indigo-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop TDBU Shades <FaArrowRight className="ml-2" />
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

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Top Down Bottom Up Works</h2>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="bg-indigo-100 w-32 h-48 mx-auto mb-4 rounded-lg relative">
                  <div className="absolute inset-x-2 top-2 bottom-1/2 bg-white border-2 border-indigo-300 rounded"></div>
                  <div className="absolute inset-x-2 top-1/2 bottom-2 bg-indigo-300 rounded"></div>
                </div>
                <h3 className="font-bold text-lg mb-2">Top Down Position</h3>
                <p className="text-gray-600 text-sm">Lower from the top to let light in while maintaining privacy at eye level</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="bg-indigo-100 w-32 h-48 mx-auto mb-4 rounded-lg relative">
                  <div className="absolute inset-x-2 top-2 bottom-2 bg-indigo-300 rounded"></div>
                </div>
                <h3 className="font-bold text-lg mb-2">Fully Closed</h3>
                <p className="text-gray-600 text-sm">Complete coverage for maximum privacy and light blocking</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="bg-indigo-100 w-32 h-48 mx-auto mb-4 rounded-lg relative">
                  <div className="absolute inset-x-2 top-2 h-1/3 bg-indigo-300 rounded"></div>
                  <div className="absolute inset-x-2 bottom-2 top-1/2 bg-white border-2 border-indigo-300 rounded"></div>
                </div>
                <h3 className="font-bold text-lg mb-2">Bottom Up Position</h3>
                <p className="text-gray-600 text-sm">Raise from the bottom like traditional shades for full light</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Top Down Bottom Up?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <FaEyeSlash className="text-5xl text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Privacy Control</h3>
              <p className="text-gray-600">Block views at eye level while letting light in from above</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <FaSun className="text-5xl text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Natural Light</h3>
              <p className="text-gray-600">Enjoy daylight without sacrificing your privacy</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <FaShieldAlt className="text-5xl text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">UV Protection</h3>
              <p className="text-gray-600">Block harmful rays while maintaining an open feel</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <FaStar className="text-5xl text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Versatility</h3>
              <p className="text-gray-600">Infinite positions for any time of day or situation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect For These Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <FaBath className="text-4xl text-blue-500" />
                <h3 className="text-xl font-bold">Bathrooms</h3>
              </div>
              <p className="text-gray-600 mb-4">
                The #1 room for TDBU shades. Lower from the top to let in natural light and ventilation
                while you shower or bathe. Neighbors and passersby can&apos;t see in at eye level.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Privacy while showering</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Natural light without exposure</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Moisture-resistant options available</span>
                </li>
              </ul>
            </div>
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <FaBed className="text-4xl text-purple-500" />
                <h3 className="text-xl font-bold">Bedrooms</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Wake up to natural light without feeling exposed. Lower from the top to let morning
                sun brighten the room while keeping the lower portion closed for privacy.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Morning light without exposure</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Sleep-friendly when fully closed</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Blackout options available</span>
                </li>
              </ul>
            </div>
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <FaEye className="text-4xl text-amber-500" />
                <h3 className="text-xl font-bold">Street-Facing Windows</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Block the view from the sidewalk or street while still enjoying natural light.
                Perfect for ground floor apartments and townhomes.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Block street-level views</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Maintain connection to outdoors</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Security without feeling closed in</span>
                </li>
              </ul>
            </div>
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <FaSun className="text-4xl text-orange-500" />
                <h3 className="text-xl font-bold">Home Offices</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Reduce screen glare by blocking direct sunlight while keeping the room bright
                and maintaining your view of the outdoors.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Reduce monitor glare</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Control direct sunlight</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Better video call lighting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Available Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">TDBU Available In These Styles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-3">Cellular Shades</h3>
              <p className="text-gray-600 mb-4">Most popular for TDBU. Energy-efficient honeycomb design with smooth operation.</p>
              <Link href="/products?category=cellular-shades&feature=top-down-bottom-up" className="text-indigo-600 font-medium hover:underline">
                Shop Cellular TDBU →
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-3">Pleated Shades</h3>
              <p className="text-gray-600 mb-4">Affordable option with crisp pleats. Great for bathrooms and utility rooms.</p>
              <Link href="/products?category=pleated-shades&feature=top-down-bottom-up" className="text-indigo-600 font-medium hover:underline">
                Shop Pleated TDBU →
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-3">Roman Shades</h3>
              <p className="text-gray-600 mb-4">Elegant fabric folds with TDBU functionality for a sophisticated look.</p>
              <Link href="/products?category=roman-shades&feature=top-down-bottom-up" className="text-indigo-600 font-medium hover:underline">
                Shop Roman TDBU →
              </Link>
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
              { q: "What are top down bottom up shades?", a: "TDBU shades can be operated from both the top and bottom. Lower from the top for light while maintaining privacy, or raise from the bottom like traditional shades. This gives you complete control over light and privacy." },
              { q: "Where should I use top down bottom up shades?", a: "TDBU shades are ideal for bathrooms (privacy while showering), bedrooms (morning light without exposure), street-facing windows (block views from outside), and home offices (reduce glare while maintaining light)." },
              { q: "How do cordless TDBU shades work?", a: "Cordless TDBU shades have two rails that you move by gently pushing or pulling. Spring mechanisms hold the rails in place at any position. No cords needed." },
              { q: "Are TDBU shades more expensive?", a: "Yes, typically 15-25% more than standard shades due to additional hardware. Most customers find the extra versatility worth the investment." },
              { q: "Can I get motorized TDBU shades?", a: "Yes! Motorized TDBU shades let you control both positions with a remote, app, or voice commands. Great for hard-to-reach windows." },
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
      <section className="py-16 bg-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Get the Best of Both Worlds</h2>
          <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">
            Shop top down bottom up shades and take control of your light and privacy. Free shipping on orders over $99.
          </p>
          <Link
            href="/products?feature=top-down-bottom-up"
            className="bg-white text-indigo-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Shop TDBU Shades <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
