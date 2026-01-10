"use client";

import Link from "next/link";

export default function MountingGuidePage() {
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
          <li className="text-gray-900 font-medium">Inside vs Outside Mount</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-100 rounded-lg p-8 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Inside Mount vs Outside Mount
          </h1>
          <p className="text-lg text-gray-600">
            Learn the differences between inside and outside mounting to choose
            the best option for your windows and style preferences.
          </p>
        </div>
      </div>

      {/* Comparison Overview */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inside Mount */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 p-6 border-b border-blue-100">
              <div className="w-full h-48 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-32 h-32 text-blue-300" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                  <rect x="10" y="10" width="80" height="80" strokeWidth="4" />
                  <rect x="18" y="15" width="64" height="70" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
                  <text x="50" y="55" textAnchor="middle" fontSize="12" fill="currentColor">INSIDE</text>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center">Inside Mount</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Inside mount places the blinds or shades within the window frame opening,
                creating a clean, built-in appearance.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-green-700 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Advantages
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 ml-7">
                    <li>• Clean, streamlined appearance</li>
                    <li>• Shows off decorative window trim</li>
                    <li>• Doesn't protrude into the room</li>
                    <li>• Less material needed (lower cost)</li>
                    <li>• Professional, built-in look</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-red-700 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Considerations
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 ml-7">
                    <li>• Requires minimum depth (varies by product)</li>
                    <li>• Small light gaps on sides</li>
                    <li>• Window frame must be square</li>
                    <li>• May conflict with window handles/cranks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Outside Mount */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-amber-50 p-6 border-b border-amber-100">
              <div className="w-full h-48 bg-amber-100 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-32 h-32 text-amber-300" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                  <rect x="20" y="20" width="60" height="60" strokeWidth="4" />
                  <rect x="5" y="10" width="90" height="80" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
                  <text x="50" y="55" textAnchor="middle" fontSize="10" fill="currentColor">OUTSIDE</text>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center">Outside Mount</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Outside mount attaches the blinds or shades to the wall or window trim
                above and around the window opening.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-green-700 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Advantages
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 ml-7">
                    <li>• Better light blocking (covers gaps)</li>
                    <li>• Makes windows appear larger</li>
                    <li>• Works with any window depth</li>
                    <li>• Hides unattractive window frames</li>
                    <li>• Works around obstructions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-red-700 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Considerations
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 ml-7">
                    <li>• Protrudes from wall/window</li>
                    <li>• May cover window trim</li>
                    <li>• More material needed (higher cost)</li>
                    <li>• Requires wall anchors for heavy blinds</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* When to Choose Each */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">When to Choose Each Option</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Scenario</th>
                <th className="text-center p-4 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4">You have beautiful window trim to showcase</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">Inside Mount</span>
                </td>
              </tr>
              <tr>
                <td className="p-4">Maximum light blocking is needed (bedrooms)</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">Outside Mount</span>
                </td>
              </tr>
              <tr>
                <td className="p-4">Window frame depth is less than 2 inches</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">Outside Mount</span>
                </td>
              </tr>
              <tr>
                <td className="p-4">You want a clean, modern look</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">Inside Mount</span>
                </td>
              </tr>
              <tr>
                <td className="p-4">Window has cranks, handles, or locks in the way</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">Outside Mount</span>
                </td>
              </tr>
              <tr>
                <td className="p-4">You want to make small windows look larger</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">Outside Mount</span>
                </td>
              </tr>
              <tr>
                <td className="p-4">Window frame is perfectly square and flat</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">Inside Mount</span>
                </td>
              </tr>
              <tr>
                <td className="p-4">Wall space above window is limited</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">Inside Mount</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Depth Requirements */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Minimum Depth for Inside Mount</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-4">
            If you're considering inside mount, make sure your window frame has sufficient depth.
            Here are typical requirements:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="font-bold text-2xl text-primary-red mb-1">1.5"</p>
              <p className="text-sm text-gray-600">Mini Blinds</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="font-bold text-2xl text-primary-red mb-1">2.5"</p>
              <p className="text-sm text-gray-600">Wood Blinds</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="font-bold text-2xl text-primary-red mb-1">1.75"</p>
              <p className="text-sm text-gray-600">Cellular Shades</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="font-bold text-2xl text-primary-red mb-1">3"</p>
              <p className="text-sm text-gray-600">Roman Shades</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            * These are typical requirements. Check specific product pages for exact depth requirements.
          </p>
        </div>
      </div>

      {/* Measuring Tips */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Measuring Tips by Mount Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-800 mb-4">Inside Mount Measuring</h3>
            <ol className="space-y-2 text-blue-700 text-sm">
              <li>1. Measure width at top, middle, and bottom - use smallest</li>
              <li>2. Measure height at left, center, and right - use smallest</li>
              <li>3. Measure depth to ensure product fits</li>
              <li>4. Do NOT make any deductions - we handle that</li>
            </ol>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="font-bold text-amber-800 mb-4">Outside Mount Measuring</h3>
            <ol className="space-y-2 text-amber-700 text-sm">
              <li>1. Add 3-4" to each side for light block</li>
              <li>2. Add 3-4" above the window opening</li>
              <li>3. Measure to windowsill or below for full coverage</li>
              <li>4. Provide exact size you want - we make it to order</li>
            </ol>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Need Help Deciding?</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Our experts can help you determine the best mounting option for your windows
          and guide you through the measuring process.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/guides/measuring"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            View Measuring Guide
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
