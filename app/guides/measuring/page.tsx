"use client";

import Link from "next/link";
import Image from "next/image";

export default function MeasuringGuidePage() {
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
          <li className="text-gray-900 font-medium">Measuring Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-100 rounded-lg p-8 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            How to Measure Your Windows for Blinds & Shades
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Follow our step-by-step guide to get accurate measurements for a perfect fit.
            Proper measuring ensures your window treatments look great and function properly.
          </p>
          {/* Author & Date */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>Written by <strong className="text-gray-700">Mike Chen</strong>, Lead Window Consultant</span>
            <span>|</span>
            <span>Last updated: January 2024</span>
            <span>|</span>
            <span>5 min read</span>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mb-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Before You Start
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              Use a steel tape measure for accuracy (cloth tapes can stretch)
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              Measure each window individually - even if they look the same, sizes can vary
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              Measure to the nearest 1/8 inch for the most accurate fit
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              Double-check all measurements before ordering
            </li>
          </ul>
        </div>
      </div>

      {/* Mount Type Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Step 1: Choose Your Mount Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inside Mount */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto text-gray-400" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                  <rect x="10" y="10" width="80" height="80" strokeWidth="3" />
                  <rect x="20" y="15" width="60" height="70" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                </svg>
                <p className="text-sm text-gray-500 mt-2">Inside Mount</p>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Inside Mount</h3>
            <p className="text-gray-600 mb-4">
              The blind or shade is installed inside the window frame, giving a clean,
              built-in look. Best for windows with decorative trim you want to showcase.
            </p>
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">Requirements:</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Minimum 1.5" depth for most blinds</li>
                <li>• Minimum 2.5" depth for most shades</li>
                <li>• Square window frame (no warping)</li>
              </ul>
            </div>
          </div>

          {/* Outside Mount */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto text-gray-400" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                  <rect x="20" y="20" width="60" height="60" strokeWidth="3" />
                  <rect x="5" y="10" width="90" height="85" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                </svg>
                <p className="text-sm text-gray-500 mt-2">Outside Mount</p>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Outside Mount</h3>
            <p className="text-gray-600 mb-4">
              The blind or shade is mounted on the wall or trim above the window.
              Ideal for maximizing light blockage and making windows appear larger.
            </p>
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">Best for:</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Shallow window frames</li>
                <li>• Windows with obstructions (handles, cranks)</li>
                <li>• When you want to make windows look larger</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Inside Mount Instructions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Step 2: Measuring for Inside Mount</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Width Measurement</h3>
              <ol className="space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">1</span>
                  <div>
                    <p className="font-medium">Measure the inside width</p>
                    <p className="text-gray-600 text-sm">Measure from the inside left edge to the inside right edge of the window frame.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">2</span>
                  <div>
                    <p className="font-medium">Take three measurements</p>
                    <p className="text-gray-600 text-sm">Measure at the top, middle, and bottom of the window.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">3</span>
                  <div>
                    <p className="font-medium">Use the smallest measurement</p>
                    <p className="text-gray-600 text-sm">Record the smallest of the three width measurements.</p>
                  </div>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Height Measurement</h3>
              <ol className="space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">1</span>
                  <div>
                    <p className="font-medium">Measure the inside height</p>
                    <p className="text-gray-600 text-sm">Measure from the top inside edge to the windowsill.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">2</span>
                  <div>
                    <p className="font-medium">Take three measurements</p>
                    <p className="text-gray-600 text-sm">Measure on the left, center, and right side of the window.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">3</span>
                  <div>
                    <p className="font-medium">Use the smallest measurement</p>
                    <p className="text-gray-600 text-sm">Record the smallest of the three height measurements.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> For inside mount, we will make standard deductions to ensure proper fit.
              Do not make any deductions yourself - provide the exact measurements.
            </p>
          </div>
        </div>
      </div>

      {/* Outside Mount Instructions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Step 3: Measuring for Outside Mount</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Width Measurement</h3>
              <ol className="space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">1</span>
                  <div>
                    <p className="font-medium">Determine desired coverage</p>
                    <p className="text-gray-600 text-sm">Decide how much wall or trim you want to cover on each side.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">2</span>
                  <div>
                    <p className="font-medium">Add 3-4 inches per side</p>
                    <p className="text-gray-600 text-sm">For optimal light control, add 3-4 inches to each side of the window opening.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">3</span>
                  <div>
                    <p className="font-medium">Measure total desired width</p>
                    <p className="text-gray-600 text-sm">Provide the exact width you want the blind or shade to be.</p>
                  </div>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Height Measurement</h3>
              <ol className="space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">1</span>
                  <div>
                    <p className="font-medium">Determine mounting position</p>
                    <p className="text-gray-600 text-sm">Decide where above the window you want to mount the bracket.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">2</span>
                  <div>
                    <p className="font-medium">Add 3-4 inches above</p>
                    <p className="text-gray-600 text-sm">Mount at least 3-4 inches above the window to maximize the view when open.</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-3">3</span>
                  <div>
                    <p className="font-medium">Measure total desired height</p>
                    <p className="text-gray-600 text-sm">Measure from where you'll mount to the windowsill (or below for full coverage).</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              <strong>Tip:</strong> For outside mount, we manufacture to the exact size you provide.
              Make sure to include any overlap you desire in your measurements.
            </p>
          </div>
        </div>
      </div>

      {/* Depth Measurement */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Step 4: Measuring Depth (Inside Mount Only)</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-4">
            For inside mount installations, you need to ensure your window frame is deep enough to
            accommodate the blind or shade.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3">How to Measure Depth</h3>
              <ol className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="font-medium text-gray-900 mr-2">1.</span>
                  Open the window if possible
                </li>
                <li className="flex items-start">
                  <span className="font-medium text-gray-900 mr-2">2.</span>
                  Measure from the front edge of the window frame to the glass
                </li>
                <li className="flex items-start">
                  <span className="font-medium text-gray-900 mr-2">3.</span>
                  Check for any obstructions (handles, locks, cranks)
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">Minimum Depth Requirements</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Wood/Faux Wood Blinds</span>
                  <span className="font-medium">2.5"</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Aluminum Mini Blinds</span>
                  <span className="font-medium">1.5"</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Roller Shades</span>
                  <span className="font-medium">1.5"</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Cellular Shades</span>
                  <span className="font-medium">1.75"</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Roman Shades</span>
                  <span className="font-medium">3"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Measurement Worksheet */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Measurement Worksheet</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-4">
            Use this worksheet to record your measurements. Print it out or save it for reference when ordering.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-medium">Window Location</th>
                  <th className="text-left p-3 font-medium">Mount Type</th>
                  <th className="text-left p-3 font-medium">Width</th>
                  <th className="text-left p-3 font-medium">Height</th>
                  <th className="text-left p-3 font-medium">Depth</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="border-b border-gray-100">
                    <td className="p-3">
                      <div className="w-32 h-8 border border-gray-300 rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="w-24 h-8 border border-gray-300 rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-8 border border-gray-300 rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-8 border border-gray-300 rounded"></div>
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-8 border border-gray-300 rounded"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => window.print()}
            className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Print Worksheet
          </button>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Need Help Measuring?</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          If you're unsure about measuring or have uniquely shaped windows,
          our professional measuring service can help ensure a perfect fit.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/measure-install"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Book Professional Measuring
          </Link>
          <Link
            href="/contact"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
