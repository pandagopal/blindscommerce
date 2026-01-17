"use client";

import Link from "next/link";
import { FaChild, FaShieldAlt, FaCheck, FaArrowRight, FaExclamationTriangle, FaCertificate } from "react-icons/fa";

export default function ChildSafeBlindsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Family Safety
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Child-Safe Window Treatments
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Protect your little ones with cordless and motorized blinds that eliminate
              dangerous cord hazards. Safe, stylish options for every room in your home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?lift=cordless"
                className="bg-white text-red-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Child-Safe Blinds <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Warning Section */}
      <section className="bg-red-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex items-start gap-4">
            <FaExclamationTriangle className="text-3xl flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">Window Cords Are Dangerous</h2>
              <p className="text-red-100">
                Since 1990, hundreds of children have been injured or killed by window covering cords.
                The Consumer Product Safety Commission (CPSC) and pediatric safety organizations strongly
                recommend cordless or motorized blinds for all homes with children under 8 years old.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safe Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Your Safe Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-red-500">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <FaChild className="text-3xl text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cordless Blinds</h3>
              <p className="text-gray-600 mb-4">
                No cords at all. Simple push up/pull down operation using an internal spring mechanism.
                The most affordable child-safe option.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" /> No strangulation hazard
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" /> Easy to operate
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" /> Clean, modern look
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" /> Affordable upgrade
                </li>
              </ul>
              <Link
                href="/products?lift=cordless"
                className="block w-full bg-red-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Shop Cordless
              </Link>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-red-500">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <FaShieldAlt className="text-3xl text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Motorized Blinds</h3>
              <p className="text-gray-600 mb-4">
                Control via remote, phone app, or voice. Perfect for high windows and smart homes.
                Ultimate convenience plus complete safety.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" /> No cords whatsoever
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" /> Remote & voice control
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" /> Smart home integration
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" /> Great for high windows
                </li>
              </ul>
              <Link
                href="/products?category=motorized"
                className="block w-full bg-red-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Shop Motorized
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Best for Nurseries */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Best for Nurseries & Kids' Rooms</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Top picks that combine safety with functionality for children's spaces.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                #1 for Nurseries
              </span>
              <h3 className="text-xl font-bold mb-2">Blackout Cellular Shades</h3>
              <p className="text-gray-600 mb-4">
                Cordless operation + complete darkness for better sleep. Energy efficient too.
              </p>
              <Link href="/products?category=cellular-shades&opacity=blackout&lift=cordless" className="text-red-600 font-semibold inline-flex items-center">
                Shop Now <FaArrowRight className="ml-2" />
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                Easy Clean
              </span>
              <h3 className="text-xl font-bold mb-2">Cordless Faux Wood Blinds</h3>
              <p className="text-gray-600 mb-4">
                Durable, wipeable slats. Great for messy fingers and easy maintenance.
              </p>
              <Link href="/products?category=faux-wood-blinds&lift=cordless" className="text-red-600 font-semibold inline-flex items-center">
                Shop Now <FaArrowRight className="ml-2" />
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                Smart Choice
              </span>
              <h3 className="text-xl font-bold mb-2">Motorized Roller Shades</h3>
              <p className="text-gray-600 mb-4">
                Schedule to close at naptime. Control from anywhere. No reachable parts.
              </p>
              <Link href="/products?category=roller-shades&lift=motorized" className="text-red-600 font-semibold inline-flex items-center">
                Shop Now <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WCMA Certification */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-red-50 rounded-xl p-8">
            <div className="flex items-start gap-6">
              <FaCertificate className="text-5xl text-red-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-3">Look for WCMA "Best for Kids" Certification</h2>
                <p className="text-gray-700 mb-4">
                  The Window Covering Manufacturers Association (WCMA) certifies window treatments that meet
                  strict child safety standards. Products with this certification have no accessible cords
                  that could pose a strangulation hazard.
                </p>
                <p className="text-gray-600">
                  All our cordless and motorized products meet or exceed WCMA child safety standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Checklist */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Child Safety Checklist</h2>
          <div className="max-w-2xl mx-auto">
            <ul className="space-y-4">
              {[
                "Replace all corded blinds with cordless or motorized",
                "Move cribs and beds away from windows",
                "Remove any retrofit cord safety devices (they're not reliable)",
                "Check all rooms including guest rooms and vacation homes",
                "Educate caregivers and babysitters about cord dangers",
                "Choose WCMA 'Best for Kids' certified products",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaCheck className="text-green-600" />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { q: "Why are corded blinds dangerous?", a: "Dangling cords pose strangulation hazards. Young children can become entangled when playing near windows. The CPSC reports hundreds of cord-related child injuries and deaths." },
              { q: "What is WCMA 'Best for Kids' certification?", a: "It's a certification from the Window Covering Manufacturers Association indicating the product has no accessible cords that could pose a strangulation hazard." },
              { q: "What are the safest blinds for nurseries?", a: "Cordless blackout cellular shades are ideal - they provide complete darkness for sleep and have no cord hazards." },
              { q: "Are motorized blinds safer than cordless?", a: "Both are equally safe - neither has accessible cords. Motorized offers more convenience but costs more." },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-red-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Protect Your Family Today</h2>
          <p className="text-xl text-red-200 mb-8 max-w-2xl mx-auto">
            Every window in your home can be made safe. Free shipping on orders over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?lift=cordless"
              className="bg-white text-red-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Shop Cordless Blinds
            </Link>
            <Link
              href="/products?category=motorized"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Shop Motorized Blinds
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
