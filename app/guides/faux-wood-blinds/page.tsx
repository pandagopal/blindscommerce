"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaStar, FaTint, FaDollarSign, FaShieldAlt, FaHome } from "react-icons/fa";

export default function FauxWoodBlindsBuyingGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-500 hover:text-primary-red">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/guides" className="text-gray-500 hover:text-primary-red">Guides</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Faux Wood Blinds Buying Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-600 to-stone-800 text-white rounded-lg p-8 mb-10">
        <div className="max-w-3xl">
          <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Buying Guide
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Faux Wood Blinds Buying Guide
          </h1>
          <p className="text-lg text-stone-200 mb-4">
            The look of real wood with superior durability and moisture resistance.
            Perfect for bathrooms, kitchens, and budget-conscious projects.
          </p>
          <div className="flex items-center gap-4 text-sm text-stone-300">
            <span>By <strong className="text-white">Mike Chen</strong>, Lead Window Consultant</span>
            <span>|</span>
            <span>7 min read</span>
          </div>
        </div>
      </div>

      {/* What Are Faux Wood Blinds */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Are Faux Wood Blinds?</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-4">
            Faux wood blinds are horizontal window treatments designed to look like real wood but
            made from synthetic materials. They offer the warm, classic appearance of wood blinds
            with added benefits like moisture resistance, durability, and lower cost.
          </p>
          <p className="text-gray-700 mb-4">
            Modern manufacturing techniques have made faux wood blinds nearly indistinguishable from
            real wood, with realistic grain patterns and textures that fool most eyes.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800 font-medium">
              Best Value: Faux wood blinds offer the best combination of aesthetics, durability,
              and price - making them our most popular blind type.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Choose Faux Wood Blinds?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaTint className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Moisture Resistant</h3>
            <p className="text-sm text-gray-600">Won't warp, crack, or mold in humid areas like bathrooms and kitchens.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaDollarSign className="text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Cost Effective</h3>
            <p className="text-sm text-gray-600">30-50% less expensive than real wood with similar appearance.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaShieldAlt className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Durable</h3>
            <p className="text-sm text-gray-600">Resists fading, warping, and cracking. Lasts 10-15+ years.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaHome className="text-4xl text-amber-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Realistic Look</h3>
            <p className="text-sm text-gray-600">Wood-grain textures that closely mimic real wood appearance.</p>
          </div>
        </div>
      </section>

      {/* Material Types */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Faux Wood Material Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-blue-700">PVC / Vinyl</h3>
            <p className="text-gray-600 mb-3">
              100% synthetic material. Most moisture-resistant option. Ideal for bathrooms
              and high-humidity areas.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>+ Best moisture resistance</li>
              <li>+ Most affordable</li>
              <li>- Heavier weight</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-green-700">Composite / Wood-Poly</h3>
            <p className="text-gray-600 mb-3">
              Mix of real wood particles and synthetic polymers. Balances realistic
              appearance with durability.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>+ Most realistic look</li>
              <li>+ Lighter than PVC</li>
              <li>- Less moisture resistant than PVC</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-purple-700">Foam Core</h3>
            <p className="text-gray-600 mb-3">
              Foam interior wrapped in vinyl. Lightweight option that's easier to
              operate on large windows.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>+ Lightest weight</li>
              <li>+ Good moisture resistance</li>
              <li>- Less rigid feeling</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Faux Wood vs Real Wood */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Faux Wood vs Real Wood Comparison</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Feature</th>
                <th className="text-center p-4 font-medium">Faux Wood</th>
                <th className="text-center p-4 font-medium">Real Wood</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4 font-medium">Price</td>
                <td className="p-4 text-center"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">$$ Lower</span></td>
                <td className="p-4 text-center"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">$$$ Higher</span></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Moisture Resistance</td>
                <td className="p-4 text-center"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Excellent</span></td>
                <td className="p-4 text-center"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Poor</span></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Weight</td>
                <td className="p-4 text-center">Heavier</td>
                <td className="p-4 text-center">Lighter</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Authentic Look</td>
                <td className="p-4 text-center">Very Good</td>
                <td className="p-4 text-center"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Authentic</span></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Can Be Refinished</td>
                <td className="p-4 text-center"><span className="text-red-500">No</span></td>
                <td className="p-4 text-center"><span className="text-green-500">Yes</span></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Durability</td>
                <td className="p-4 text-center"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Excellent</span></td>
                <td className="p-4 text-center">Good (in dry areas)</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Best For</td>
                <td className="p-4 text-center text-sm">Bathrooms, kitchens, any room</td>
                <td className="p-4 text-center text-sm">Dry rooms only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Slat Sizes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Available Slat Sizes</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-20 flex items-center justify-center mb-4">
                <div className="space-y-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-24 h-3 bg-stone-300 rounded"></div>
                  ))}
                </div>
              </div>
              <h3 className="font-bold mb-2">2" Slats</h3>
              <p className="text-sm text-gray-600">Most popular. Balanced look for most windows.</p>
            </div>
            <div className="text-center">
              <div className="h-20 flex items-center justify-center mb-4">
                <div className="space-y-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-24 h-4 bg-stone-400 rounded"></div>
                  ))}
                </div>
              </div>
              <h3 className="font-bold mb-2">2.5" Slats</h3>
              <p className="text-sm text-gray-600">Bolder look. Great for large windows.</p>
            </div>
            <div className="text-center">
              <div className="h-20 flex items-center justify-center mb-4">
                <div className="space-y-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-24 h-2 bg-stone-200 rounded"></div>
                  ))}
                </div>
              </div>
              <h3 className="font-bold mb-2">1" Slats</h3>
              <p className="text-sm text-gray-600">Traditional look. Best for smaller windows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Rooms for Faux Wood Blinds</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-green-700 mb-3">Excellent Choice - Any Room!</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Bathrooms (moisture resistant!)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Kitchens (easy to clean)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Living Rooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Bedrooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Home Offices</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Laundry Rooms</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-700 mb-3">Special Considerations</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Large windows - consider foam core (lighter)</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> High humidity - choose PVC over composite</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Kids' rooms - durable and easy to clean</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Rental properties - affordable and durable</li>
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
              <li>+ Moisture and humidity resistant</li>
              <li>+ 30-50% less than real wood</li>
              <li>+ Won't warp, crack, or fade</li>
              <li>+ Realistic wood-grain appearance</li>
              <li>+ Easy to clean</li>
              <li>+ Can use in any room</li>
              <li>+ Long lasting (10-15+ years)</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-800 mb-4">Limitations</h3>
            <ul className="space-y-2 text-red-700">
              <li>- Heavier than real wood</li>
              <li>- Cannot be refinished or painted</li>
              <li>- Not as authentic as real wood up close</li>
              <li>- May sag on very wide windows</li>
              <li>- Limited to factory colors</li>
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
              q: "What are faux wood blinds made of?",
              a: "Faux wood blinds are made from PVC (vinyl), composite materials (wood particles with synthetic polymers), or foam core wrapped in vinyl."
            },
            {
              q: "Are faux wood blinds good for bathrooms?",
              a: "Yes! Faux wood blinds are excellent for bathrooms. They resist moisture, humidity, and won't warp or develop mold."
            },
            {
              q: "Do faux wood blinds look cheap?",
              a: "Quality faux wood blinds closely mimic real wood with realistic grain textures. Most people can't tell the difference."
            },
            {
              q: "Are faux wood blinds heavier than real wood?",
              a: "Yes, they're typically heavier. For very large windows, consider foam-core faux wood or motorization."
            },
            {
              q: "How long do faux wood blinds last?",
              a: "10-15 years or longer. They're very durable and resist warping, cracking, and fading."
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
      <section className="bg-stone-800 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Shop Faux Wood Blinds?</h2>
        <p className="text-stone-300 mb-6 max-w-2xl mx-auto">
          Browse our collection of durable faux wood blinds in multiple colors and slat sizes.
          Free shipping on orders over $99.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products?category=faux-wood-blinds"
            className="bg-white text-stone-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
          >
            Shop Faux Wood Blinds <FaArrowRight className="ml-2" />
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
