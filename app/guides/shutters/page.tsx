"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaStar, FaHome, FaDollarSign, FaShieldAlt, FaSun } from "react-icons/fa";

export default function ShuttersBuyingGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-500 hover:text-primary-red">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/guides" className="text-gray-500 hover:text-primary-red">Guides</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Shutters Buying Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-lg p-8 mb-10">
        <div className="max-w-3xl">
          <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Buying Guide
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Plantation Shutters Buying Guide
          </h1>
          <p className="text-lg text-slate-200 mb-4">
            The ultimate window treatment investment. Timeless elegance, superior light control,
            and lasting value that can increase your home's worth.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span>By <strong className="text-white">Jennifer Adams</strong>, Interior Design Consultant</span>
            <span>|</span>
            <span>10 min read</span>
          </div>
        </div>
      </div>

      {/* What Are Shutters */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Are Plantation Shutters?</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-4">
            Plantation shutters are interior window coverings featuring wide horizontal louvers
            (slats) that tilt to control light and privacy. Unlike blinds, shutters are mounted
            in a solid frame that becomes a permanent part of your window architecture.
          </p>
          <p className="text-gray-700 mb-4">
            The "plantation" name comes from their historical use on large Southern estates,
            where wide louvers helped manage the hot, humid climate. Today, they're prized for
            their classic elegance, durability, and the value they add to homes.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
            <p className="text-slate-800 font-medium">
              Investment Value: Quality shutters last 20-25+ years and can increase home value
              by up to 3-4%. They're one of the few window treatments that stay with the home
              when you sell.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Choose Shutters?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaHome className="text-4xl text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Home Value</h3>
            <p className="text-sm text-gray-600">One of the few window treatments that increase resale value.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaShieldAlt className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Durability</h3>
            <p className="text-sm text-gray-600">Last 20-25+ years with minimal maintenance. Built to last generations.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaSun className="text-4xl text-yellow-500 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Light Control</h3>
            <p className="text-sm text-gray-600">Wide louvers provide precise control from full light to near blackout.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaDollarSign className="text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Energy Savings</h3>
            <p className="text-sm text-gray-600">Solid construction provides excellent insulation year-round.</p>
          </div>
        </div>
      </section>

      {/* Material Types */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Shutter Materials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-amber-700">Real Wood</h3>
            <p className="text-gray-600 mb-3">
              Basswood or poplar. Natural beauty with authentic grain. Can be painted
              or stained to any color.
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mb-3">
              <li>+ Lightest weight option</li>
              <li>+ Can be refinished</li>
              <li>+ Unlimited color options</li>
              <li>- Not for high humidity</li>
              <li>- Highest price point</li>
            </ul>
            <p className="text-sm font-medium text-amber-700">Best for: Living rooms, bedrooms, dry climates</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-blue-700">Composite / Vinyl</h3>
            <p className="text-gray-600 mb-3">
              Engineered materials designed to look like painted wood. Excellent durability
              and moisture resistance.
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mb-3">
              <li>+ Moisture resistant</li>
              <li>+ Very durable</li>
              <li>+ Lower cost than wood</li>
              <li>- Limited to painted finishes</li>
              <li>- Heavier than wood</li>
            </ul>
            <p className="text-sm font-medium text-blue-700">Best for: Bathrooms, kitchens, humid climates</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-3 text-green-700">Hybrid</h3>
            <p className="text-gray-600 mb-3">
              Wood core with composite/vinyl coating. Combines lightweight wood with
              moisture-resistant exterior.
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mb-3">
              <li>+ Lighter than full composite</li>
              <li>+ Good moisture resistance</li>
              <li>+ Mid-range pricing</li>
              <li>- Limited color options</li>
            </ul>
            <p className="text-sm font-medium text-green-700">Best for: Any room, balanced performance</p>
          </div>
        </div>
      </section>

      {/* Louver Sizes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Choosing Louver Size</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Louver Size</th>
                <th className="text-left p-4 font-medium">Style</th>
                <th className="text-left p-4 font-medium">View When Open</th>
                <th className="text-left p-4 font-medium">Best For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4 font-medium">2.5"</td>
                <td className="p-4 text-gray-600">Traditional / Colonial</td>
                <td className="p-4">More obstructed</td>
                <td className="p-4 text-gray-600">Small windows, traditional homes</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="p-4 font-medium">3.5" <span className="text-blue-600 text-sm">(Most Popular)</span></td>
                <td className="p-4 text-gray-600">Transitional</td>
                <td className="p-4">Good balance</td>
                <td className="p-4 text-gray-600">Most windows, any style home</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">4.5"</td>
                <td className="p-4 text-gray-600">Modern / Contemporary</td>
                <td className="p-4">Maximum view</td>
                <td className="p-4 text-gray-600">Large windows, scenic views</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Tip: Larger louvers show more of the view when open and create a more contemporary look.
          Smaller louvers have a more traditional appearance but obstruct more view.
        </p>
      </section>

      {/* Frame Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frame & Mount Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Frame Styles</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">L-Frame (Standard)</p>
                  <p className="text-sm text-gray-600">Covers window casing. Most common for inside mount.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Z-Frame</p>
                  <p className="text-sm text-gray-600">Wraps around window for outside mount applications.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Deco Frame</p>
                  <p className="text-sm text-gray-600">Decorative frame for a furniture-like appearance.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">Panel Configurations</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Single Panel</p>
                  <p className="text-sm text-gray-600">For narrow windows. Swings open to one side.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Bi-Fold (Double)</p>
                  <p className="text-sm text-gray-600">Two panels that fold open. Most popular configuration.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Multi-Panel</p>
                  <p className="text-sm text-gray-600">3-4+ panels for wide windows or sliding doors.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Room Recommendations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Rooms for Shutters</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-green-700 mb-3">Excellent for Any Room</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Living Rooms (add elegance)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Bedrooms (light control)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Dining Rooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Home Offices</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Bathrooms (composite/vinyl)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Kitchens (composite/vinyl)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-700 mb-3">Especially Popular For</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Street-facing windows (curb appeal)</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Homes being sold (value add)</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Specialty window shapes</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Historic or traditional homes</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Coastal properties</li>
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
              <li>+ Increases home value</li>
              <li>+ Lasts 20-25+ years</li>
              <li>+ Timeless, never out of style</li>
              <li>+ Excellent light control</li>
              <li>+ Superior insulation</li>
              <li>+ Easy to clean</li>
              <li>+ Available for any window shape</li>
              <li>+ Architectural enhancement</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-800 mb-4">Limitations</h3>
            <ul className="space-y-2 text-red-700">
              <li>- Highest upfront cost</li>
              <li>- Permanent installation</li>
              <li>- Requires professional measuring</li>
              <li>- Longer lead time (custom made)</li>
              <li>- Wood not suitable for humid areas</li>
              <li>- Panels swing into room</li>
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
              q: "Are shutters worth the investment?",
              a: "Yes! Shutters increase home value, last 20-25+ years, provide excellent insulation, and never go out of style. The cost per year of use is often lower than cheaper window treatments that need replacing."
            },
            {
              q: "What's the difference between wood and composite shutters?",
              a: "Wood shutters offer natural beauty and can be stained any color. Composite/vinyl shutters are moisture-resistant, more affordable, and ideal for bathrooms. Both look similar when painted white."
            },
            {
              q: "What louver size should I choose?",
              a: "3.5-inch louvers are most popular, balancing style and function. 2.5-inch for traditional look, 4.5-inch for modern style and maximum view."
            },
            {
              q: "Can shutters be used on any window shape?",
              a: "Yes! Shutters can be custom-made for arched, circular, triangular, and specialty shapes."
            },
            {
              q: "How do I clean shutters?",
              a: "Simply dust regularly with a cloth or duster. For deeper cleaning, wipe with a damp cloth. They're one of the easiest window treatments to maintain."
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
      <section className="bg-slate-900 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Invest in Shutters?</h2>
        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
          Browse our collection of premium plantation shutters in wood and composite materials.
          Free in-home consultation available.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products?category=shutters"
            className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
          >
            Shop Shutters <FaArrowRight className="ml-2" />
          </Link>
          <Link
            href="/consultation"
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
