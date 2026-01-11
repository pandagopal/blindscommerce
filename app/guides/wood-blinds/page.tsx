"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaStar, FaTree, FaHome, FaPalette, FaShieldAlt } from "react-icons/fa";

export default function WoodBlindsBuyingGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-500 hover:text-primary-red">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/guides" className="text-gray-500 hover:text-primary-red">Guides</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Wood Blinds Buying Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-700 to-amber-900 text-white rounded-lg p-8 mb-10">
        <div className="max-w-3xl">
          <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Buying Guide
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Wood Blinds Buying Guide
          </h1>
          <p className="text-lg text-amber-100 mb-4">
            Timeless natural beauty for your windows. Learn about wood types, slat sizes,
            stain finishes, and how to choose the perfect real wood blinds.
          </p>
          <div className="flex items-center gap-4 text-sm text-amber-200">
            <span>By <strong className="text-white">David Thompson</strong>, Senior Installation Specialist</span>
            <span>|</span>
            <span>8 min read</span>
          </div>
        </div>
      </div>

      {/* What Are Wood Blinds */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Are Real Wood Blinds?</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-4">
            Real wood blinds are horizontal window treatments made from natural wood slats connected
            by cords or decorative tape. Each slat can be tilted to control light and privacy, or
            raised entirely to let in full light.
          </p>
          <p className="text-gray-700 mb-4">
            The warmth, natural grain patterns, and rich tones of real wood create an elegant,
            timeless look that complements virtually any interior design style from traditional
            to contemporary.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-amber-800 font-medium">
              Quality Indicator: Premium wood blinds use basswood, which is known for its strength,
              light weight, and ability to accept stain evenly. Look for this when shopping.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Choose Real Wood Blinds?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaTree className="text-4xl text-amber-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Natural Beauty</h3>
            <p className="text-sm text-gray-600">Authentic wood grain and texture that synthetic materials can't replicate.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaPalette className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Rich Stain Options</h3>
            <p className="text-sm text-gray-600">Multiple stains from light oak to dark walnut to match any decor.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaHome className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Home Value</h3>
            <p className="text-sm text-gray-600">Real wood is a premium feature that can increase perceived home value.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaShieldAlt className="text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Lightweight</h3>
            <p className="text-sm text-gray-600">Lighter than faux wood, making them easier to operate on large windows.</p>
          </div>
        </div>
      </section>

      {/* Wood Types */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Types of Wood</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Wood Type</th>
                <th className="text-left p-4 font-medium">Characteristics</th>
                <th className="text-left p-4 font-medium">Price</th>
                <th className="text-left p-4 font-medium">Best For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4 font-medium">Basswood</td>
                <td className="p-4 text-gray-600">Lightweight, smooth grain, takes stain well</td>
                <td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Most Popular</span></td>
                <td className="p-4 text-gray-600">All rooms (except wet areas)</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Bamboo</td>
                <td className="p-4 text-gray-600">Eco-friendly, unique grain, very lightweight</td>
                <td className="p-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Mid-range</span></td>
                <td className="p-4 text-gray-600">Natural/eco-conscious decor</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Oak</td>
                <td className="p-4 text-gray-600">Strong, prominent grain, heavier</td>
                <td className="p-4"><span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Premium</span></td>
                <td className="p-4 text-gray-600">Traditional/rustic styles</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Ash</td>
                <td className="p-4 text-gray-600">Durable, light color, visible grain</td>
                <td className="p-4"><span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Premium</span></td>
                <td className="p-4 text-gray-600">Scandinavian/modern styles</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Slat Sizes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Choosing Slat Size</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-24 flex items-center justify-center mb-4">
              <div className="space-y-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-32 h-2 bg-amber-300 rounded"></div>
                ))}
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">1" Slats</h3>
            <p className="text-gray-600 mb-3">
              Smaller slats for a delicate, traditional look. Best for small windows
              and spaces where you want subtle window treatments.
            </p>
            <p className="text-sm text-amber-700 font-medium">Best for: Small windows, traditional decor</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 ring-2 ring-amber-500">
            <div className="absolute -mt-10 ml-20">
              <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded">Most Popular</span>
            </div>
            <div className="h-24 flex items-center justify-center mb-4">
              <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-32 h-4 bg-amber-400 rounded"></div>
                ))}
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">2" Slats</h3>
            <p className="text-gray-600 mb-3">
              The most versatile choice. Balances view-through capability with privacy
              when closed. Works with most window sizes and styles.
            </p>
            <p className="text-sm text-amber-700 font-medium">Best for: Most windows, versatile use</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-24 flex items-center justify-center mb-4">
              <div className="space-y-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-32 h-5 bg-amber-500 rounded"></div>
                ))}
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">2.5" Slats</h3>
            <p className="text-gray-600 mb-3">
              Bold, statement-making slats. Provide better view when open and show
              off wood grain more prominently.
            </p>
            <p className="text-sm text-amber-700 font-medium">Best for: Large windows, modern spaces</p>
          </div>
        </div>
      </section>

      {/* Stain Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Popular Stain & Paint Options</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Natural", color: "bg-amber-200" },
              { name: "Golden Oak", color: "bg-amber-400" },
              { name: "Maple", color: "bg-amber-500" },
              { name: "Cherry", color: "bg-red-700" },
              { name: "Walnut", color: "bg-amber-800" },
              { name: "Espresso", color: "bg-amber-900" },
              { name: "White", color: "bg-white border" },
              { name: "Off-White", color: "bg-gray-100" },
              { name: "Gray", color: "bg-gray-400" },
              { name: "Black", color: "bg-gray-900" },
              { name: "Driftwood", color: "bg-gray-300" },
              { name: "Weathered", color: "bg-stone-400" },
            ].map((stain) => (
              <div key={stain.name} className="text-center">
                <div className={`w-full h-12 ${stain.color} rounded-lg mb-2`}></div>
                <p className="text-sm text-gray-600">{stain.name}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            * Stain appearance varies based on wood type. Order free samples to see actual colors.
          </p>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Rooms for Wood Blinds</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-green-700 mb-2">Excellent Choice</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Living Rooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Bedrooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Home Offices</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Dining Rooms</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-yellow-700 mb-2">Use With Caution</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Kitchens (away from sink/stove)</li>
                <li className="flex items-center gap-2"><FaStar className="text-yellow-500" /> Sunrooms (may fade)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-red-700 mb-2">Not Recommended</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Bathrooms (humidity)</li>
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Laundry rooms</li>
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Pool houses</li>
                <li className="flex items-center gap-2"><span className="text-red-500">✕</span> Near hot tubs</li>
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
              <li>+ Natural beauty and authentic grain</li>
              <li>+ Lighter weight than faux wood</li>
              <li>+ Rich, warm aesthetic</li>
              <li>+ Can be refinished/restained</li>
              <li>+ Increases perceived home value</li>
              <li>+ Environmentally friendly option</li>
              <li>+ Many stain/paint options</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-800 mb-4">Limitations</h3>
            <ul className="space-y-2 text-red-700">
              <li>- Not moisture-resistant (avoid wet areas)</li>
              <li>- Can warp in humidity</li>
              <li>- May fade in direct sunlight</li>
              <li>- Higher cost than faux wood</li>
              <li>- Requires careful cleaning</li>
              <li>- Limited width per blind</li>
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
              q: "What are real wood blinds made of?",
              a: "Quality real wood blinds are typically made from basswood, which is lightweight, strong, and takes stain beautifully. Other options include bamboo, ash, and oak."
            },
            {
              q: "Are wood blinds better than faux wood?",
              a: "Real wood offers natural beauty and lighter weight. Faux wood is better for humid areas and costs less. Choose real wood for dry rooms where aesthetics are priority."
            },
            {
              q: "Can wood blinds be used in bathrooms?",
              a: "No, real wood blinds are not recommended for bathrooms. Moisture can cause warping, cracking, or mold. Use faux wood blinds instead."
            },
            {
              q: "What slat size should I choose?",
              a: "2-inch slats are most popular for homes. 1-inch suits smaller windows, 2.5-inch creates a bolder statement on large windows."
            },
            {
              q: "How do I clean wood blinds?",
              a: "Dust weekly with a soft cloth in the direction of the grain. For deeper cleaning, use a slightly damp cloth with mild wood cleaner and dry immediately."
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
      <section className="bg-amber-900 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Shop Wood Blinds?</h2>
        <p className="text-amber-200 mb-6 max-w-2xl mx-auto">
          Browse our collection of premium real wood blinds in multiple wood types, slat sizes,
          and stain finishes. Free shipping on orders over $99.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products?category=wood-blinds"
            className="bg-white text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
          >
            Shop Wood Blinds <FaArrowRight className="ml-2" />
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
