"use client";

import Link from "next/link";

export default function CareMaintenancePage() {
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
          <li className="text-gray-900 font-medium">Care & Maintenance</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-100 rounded-lg p-8 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Care & Maintenance Guide
          </h1>
          <p className="text-lg text-gray-600">
            Keep your window treatments looking beautiful and functioning properly
            with our comprehensive care and maintenance tips.
          </p>
          {/* Author & Date */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mt-4">
            <span>Written by <strong className="text-gray-700">Sarah Mitchell</strong>, Product Care Expert</span>
            <span>|</span>
            <span>Last updated: January 2024</span>
            <span>|</span>
            <span>6 min read</span>
          </div>
        </div>
      </div>

      {/* General Care Tips */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">General Care Tips</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ul className="space-y-4">
            <li className="flex items-start">
              <svg className="w-6 h-6 text-primary-red mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Dust regularly</p>
                <p className="text-gray-600 text-sm">Use a feather duster or microfiber cloth weekly to prevent dust buildup</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-primary-red mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Vacuum with brush attachment</p>
                <p className="text-gray-600 text-sm">Monthly vacuuming with a soft brush attachment removes deeper dust</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-primary-red mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Address stains promptly</p>
                <p className="text-gray-600 text-sm">The sooner you treat a stain, the easier it will be to remove</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-primary-red mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Operate gently</p>
                <p className="text-gray-600 text-sm">Raise and lower blinds smoothly to prevent cord wear and slat damage</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Product-Specific Care */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Care by Product Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wood & Faux Wood Blinds */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="w-3 h-3 bg-amber-600 rounded-full mr-2"></span>
              Wood & Faux Wood Blinds
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Dusting</p>
                <p className="text-gray-600">Use a soft cloth or duster. Wipe in the direction of the wood grain.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Deep Cleaning</p>
                <p className="text-gray-600">Wipe with a damp cloth and mild soap. Dry immediately to prevent warping.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Avoid</p>
                <p className="text-gray-600">Excess moisture, harsh chemicals, and direct sunlight on real wood.</p>
              </div>
            </div>
          </div>

          {/* Aluminum Mini Blinds */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
              Aluminum Mini Blinds
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Dusting</p>
                <p className="text-gray-600">Close blinds and dust with a microfiber cloth or duster.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Deep Cleaning</p>
                <p className="text-gray-600">Remove and soak in bathtub with mild soap, rinse and dry completely.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Tip</p>
                <p className="text-gray-600">Wear cotton gloves and run fingers along slats for quick cleaning.</p>
              </div>
            </div>
          </div>

          {/* Cellular Shades */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
              Cellular/Honeycomb Shades
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Dusting</p>
                <p className="text-gray-600">Use a vacuum with brush attachment on low suction.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Spot Cleaning</p>
                <p className="text-gray-600">Dab stains gently with a damp cloth and mild detergent.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Deep Cleaning</p>
                <p className="text-gray-600">Some can be gently hand washed - check manufacturer guidelines.</p>
              </div>
            </div>
          </div>

          {/* Roller Shades */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              Roller Shades
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Dusting</p>
                <p className="text-gray-600">Unroll completely and dust with a soft cloth or vacuum.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Spot Cleaning</p>
                <p className="text-gray-600">Use a damp cloth with mild soap for vinyl/PVC shades.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Note</p>
                <p className="text-gray-600">Fabric roller shades may require professional cleaning.</p>
              </div>
            </div>
          </div>

          {/* Roman Shades */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
              Roman Shades
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Dusting</p>
                <p className="text-gray-600">Vacuum regularly with upholstery attachment.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Spot Cleaning</p>
                <p className="text-gray-600">Blot stains with a clean, damp cloth. Don't rub.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Professional Cleaning</p>
                <p className="text-gray-600">Recommended for deep cleaning to maintain fabric integrity.</p>
              </div>
            </div>
          </div>

          {/* Shutters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
              Shutters
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Dusting</p>
                <p className="text-gray-600">Wipe louvers with a dry or slightly damp cloth.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Deep Cleaning</p>
                <p className="text-gray-600">Use mild soap and water, then dry thoroughly.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Maintenance</p>
                <p className="text-gray-600">Check hinges and tension rods periodically for smooth operation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Common Issues & Solutions</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Problem</th>
                <th className="text-left p-4 font-medium">Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4 text-gray-900">Blinds won't stay up</td>
                <td className="p-4 text-gray-600">Check cord lock mechanism or replace worn cords</td>
              </tr>
              <tr>
                <td className="p-4 text-gray-900">Slats won't tilt properly</td>
                <td className="p-4 text-gray-600">Inspect tilt mechanism and wand connection</td>
              </tr>
              <tr>
                <td className="p-4 text-gray-900">Shade rolls unevenly</td>
                <td className="p-4 text-gray-600">Adjust roller tension or realign brackets</td>
              </tr>
              <tr>
                <td className="p-4 text-gray-900">Yellowing fabric</td>
                <td className="p-4 text-gray-600">UV damage - consider UV-resistant replacement</td>
              </tr>
              <tr>
                <td className="p-4 text-gray-900">Stuck cordless mechanism</td>
                <td className="p-4 text-gray-600">Gently pull down to reset spring tension</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Section */}
      <div className="mb-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center text-yellow-800">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Things to Avoid
          </h2>
          <ul className="space-y-2 text-yellow-700">
            <li>• Never use abrasive cleaners or scrub pads</li>
            <li>• Avoid bleach and harsh chemicals</li>
            <li>• Don't soak wood blinds or allow moisture to sit</li>
            <li>• Never machine wash fabric shades unless specified</li>
            <li>• Don't use excessive force when operating mechanisms</li>
          </ul>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Need Repair or Replacement?</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          If your window treatments need professional attention, our team can help
          with repairs, part replacements, or new installations.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/contact"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Contact Support
          </Link>
          <Link
            href="/products"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Shop Replacements
          </Link>
        </div>
      </div>
    </div>
  );
}
