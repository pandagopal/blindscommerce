"use client";

import Link from "next/link";

export default function InstallationGuidePage() {
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
          <li className="text-gray-900 font-medium">Installation Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-100 rounded-lg p-8 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            How to Install Blinds & Shades
          </h1>
          <p className="text-lg text-gray-600">
            Follow our step-by-step installation guide to mount your window treatments
            like a professional. Most installations can be completed in 15-30 minutes per window.
          </p>
        </div>
      </div>

      {/* Tools Needed */}
      <div className="mb-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tools You'll Need
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              <span>Power drill</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              <span>Phillips screwdriver</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              <span>Tape measure</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              <span>Level</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              <span>Pencil</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              <span>Step ladder</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              <span>Safety glasses</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              <span>Wall anchors (if needed)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inside Mount Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Inside Mount Installation</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">1</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Mark Bracket Positions</h3>
                <p className="text-gray-600">
                  Hold the brackets at the top of the window frame, positioning them 2-3 inches from each end.
                  Use a pencil to mark the screw holes. Use a level to ensure the brackets are even.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">2</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Pre-Drill Holes</h3>
                <p className="text-gray-600">
                  Using a drill bit slightly smaller than your screws, pre-drill holes at the marked positions.
                  This prevents the wood from splitting and makes installation easier.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">3</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Attach Brackets</h3>
                <p className="text-gray-600">
                  Secure the brackets to the window frame using the provided screws.
                  Make sure the brackets are firmly attached and level with each other.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">4</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Install the Headrail</h3>
                <p className="text-gray-600">
                  Snap or slide the headrail into the brackets. For most blinds and shades,
                  you'll hear a click when it's properly secured. Test that it's firmly in place.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">5</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Attach Valance (if included)</h3>
                <p className="text-gray-600">
                  If your blinds came with a valance, attach the valance clips to the front of the headrail,
                  then snap the valance onto the clips.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">6</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Test Operation</h3>
                <p className="text-gray-600">
                  Raise and lower the blinds several times to ensure smooth operation.
                  Check that the slats tilt properly and the blind raises evenly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outside Mount Installation */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Outside Mount Installation</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">1</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Mark the Position</h3>
                <p className="text-gray-600">
                  Hold the blinds/shade at the desired height above the window. Mark where the brackets
                  will go, ensuring equal overhang on both sides. Use a level to ensure they're even.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">2</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Check for Studs</h3>
                <p className="text-gray-600">
                  Use a stud finder to locate wall studs. If mounting into drywall without studs,
                  you'll need to use wall anchors for proper support.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">3</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Install Wall Anchors (if needed)</h3>
                <p className="text-gray-600">
                  If not mounting into studs, drill holes for wall anchors and tap them in with a hammer
                  until flush with the wall surface.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">4</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Attach Brackets</h3>
                <p className="text-gray-600">
                  Secure the brackets to the wall using the provided screws. Double-check that
                  they're level before fully tightening.
                </p>
              </div>
            </div>

            <div className="flex">
              <span className="flex-shrink-0 w-10 h-10 bg-primary-red text-white rounded-full flex items-center justify-center font-bold mr-4">5</span>
              <div>
                <h3 className="text-lg font-bold mb-2">Mount the Blinds/Shade</h3>
                <p className="text-gray-600">
                  Follow the same process as inside mount: snap or slide the headrail into the brackets,
                  attach the valance if included, and test the operation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Pro Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-green-800 mb-2">Do This</h3>
            <ul className="space-y-2 text-green-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Always use a level for bracket alignment
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Pre-drill holes to prevent wood splitting
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Have a helper hold the blinds while marking
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Test operation before finishing up
              </li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-800 mb-2">Avoid This</h3>
            <ul className="space-y-2 text-red-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Don't skip pre-drilling in hardwood
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Don't overtighten screws
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Don't mount in drywall without anchors
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Don't force the headrail into brackets
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Need Professional Installation?</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          If you'd prefer to have a professional handle the installation,
          our certified installers are ready to help.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/measure-install"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Book Installation Service
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
