"use client";

import Link from "next/link";

export default function ChoosingBlindsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-500 hover:text-primary-red">
              Home
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/guides" className="text-gray-500 hover:text-primary-red">
              Guides
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Choosing the Right Blinds</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-100 rounded-lg p-8 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            How to Choose the Right Window Treatments
          </h1>
          <p className="text-lg text-gray-600">
            Find the perfect blinds or shades for your home. Consider light control,
            privacy, style, and functionality to make the best choice.
          </p>
        </div>
      </div>

      {/* Quick Decision Guide */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Quick Decision Guide</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-6">Answer these questions to narrow down your options:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900 mb-2">What's your primary goal?</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Block light:</strong> Blackout shades, room darkening blinds</li>
                  <li>• <strong>Filter light:</strong> Sheer shades, light filtering cellular</li>
                  <li>• <strong>Privacy:</strong> Top-down/bottom-up shades, blinds</li>
                  <li>• <strong>Insulation:</strong> Cellular/honeycomb shades</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">What room is this for?</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Bedroom:</strong> Blackout options recommended</li>
                  <li>• <strong>Living room:</strong> Style-focused, light control</li>
                  <li>• <strong>Bathroom/Kitchen:</strong> Moisture-resistant materials</li>
                  <li>• <strong>Office:</strong> Glare reduction, light filtering</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900 mb-2">What's your budget?</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Budget-friendly:</strong> Aluminum mini blinds, vinyl</li>
                  <li>• <strong>Mid-range:</strong> Faux wood, cellular shades</li>
                  <li>• <strong>Premium:</strong> Real wood, motorized, shutters</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">Do you have children or pets?</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Yes:</strong> Cordless options for safety</li>
                  <li>• <strong>Consider:</strong> Durable materials, easy cleaning</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Comparison */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Product Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Product Type</th>
                <th className="text-center p-4 font-medium">Light Control</th>
                <th className="text-center p-4 font-medium">Privacy</th>
                <th className="text-center p-4 font-medium">Insulation</th>
                <th className="text-center p-4 font-medium">Price Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4 font-medium">Wood Blinds</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Good</span>
                </td>
                <td className="p-4 text-center">$$$</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Faux Wood Blinds</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Good</span>
                </td>
                <td className="p-4 text-center">$$</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Cellular Shades</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Best</span>
                </td>
                <td className="p-4 text-center">$$-$$$</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Roller Shades</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Good</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Good</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Fair</span>
                </td>
                <td className="p-4 text-center">$-$$</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Roman Shades</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Good</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Good</span>
                </td>
                <td className="p-4 text-center">$$-$$$</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Shutters</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Excellent</span>
                </td>
                <td className="p-4 text-center">$$$$</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Aluminum Mini Blinds</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Good</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Good</span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Fair</span>
                </td>
                <td className="p-4 text-center">$</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Room by Room Guide */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Room-by-Room Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-3">Bedroom</h3>
            <p className="text-gray-600 text-sm mb-4">
              Prioritize light blocking for better sleep.
            </p>
            <p className="font-medium text-sm mb-2">Best choices:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Blackout cellular shades</li>
              <li>• Room darkening roller shades</li>
              <li>• Wood blinds with blackout option</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-3">Living Room</h3>
            <p className="text-gray-600 text-sm mb-4">
              Balance style, light control, and functionality.
            </p>
            <p className="font-medium text-sm mb-2">Best choices:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Roman shades for elegance</li>
              <li>• Wood/faux wood blinds</li>
              <li>• Layered shades for versatility</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-3">Kitchen</h3>
            <p className="text-gray-600 text-sm mb-4">
              Choose moisture and grease-resistant options.
            </p>
            <p className="font-medium text-sm mb-2">Best choices:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Faux wood blinds</li>
              <li>• Aluminum mini blinds</li>
              <li>• Vinyl roller shades</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-3">Bathroom</h3>
            <p className="text-gray-600 text-sm mb-4">
              Humidity resistance is essential.
            </p>
            <p className="font-medium text-sm mb-2">Best choices:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Faux wood blinds</li>
              <li>• Vinyl shutters</li>
              <li>• Moisture-resistant cellular</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-3">Home Office</h3>
            <p className="text-gray-600 text-sm mb-4">
              Reduce glare while maintaining light.
            </p>
            <p className="font-medium text-sm mb-2">Best choices:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Light filtering cellular shades</li>
              <li>• Solar roller shades</li>
              <li>• Adjustable blinds</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-3">Nursery/Kids Room</h3>
            <p className="text-gray-600 text-sm mb-4">
              Safety and light blocking are priorities.
            </p>
            <p className="font-medium text-sm mb-2">Best choices:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Cordless blackout shades</li>
              <li>• Motorized options</li>
              <li>• Cordless cellular shades</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features to Consider */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Features to Consider</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-4">Lift Options</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">Cordless</p>
                <p className="text-sm text-gray-600">Safest for homes with children and pets. Clean look.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Motorized</p>
                <p className="text-sm text-gray-600">Ultimate convenience. Great for hard-to-reach windows.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Continuous Loop</p>
                <p className="text-sm text-gray-600">Easy operation for larger, heavier shades.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Standard Cord</p>
                <p className="text-sm text-gray-600">Traditional, budget-friendly option.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-4">Light Control Options</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">Blackout</p>
                <p className="text-sm text-gray-600">Blocks 99%+ of light. Ideal for bedrooms.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Room Darkening</p>
                <p className="text-sm text-gray-600">Blocks most light while allowing some ambient glow.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Light Filtering</p>
                <p className="text-sm text-gray-600">Softens light while maintaining privacy.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Sheer</p>
                <p className="text-sm text-gray-600">Maximum light with daytime privacy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Shop?</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Browse our collection of blinds, shades, and shutters to find the perfect
          match for your home.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/products"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Shop All Products
          </Link>
          <Link
            href="/consultation"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Free Consultation
          </Link>
        </div>
      </div>
    </div>
  );
}
