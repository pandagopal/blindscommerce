"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaStar, FaMobileAlt, FaMicrophone, FaBatteryFull, FaPlug, FaSun, FaChild } from "react-icons/fa";

export default function MotorizedBlindsBuyingGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-500 hover:text-primary-red">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/guides" className="text-gray-500 hover:text-primary-red">Guides</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Motorized Blinds Buying Guide</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-lg p-8 mb-10">
        <div className="max-w-3xl">
          <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Buying Guide
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Motorized & Smart Blinds Buying Guide
          </h1>
          <p className="text-lg text-indigo-100 mb-4">
            The future of window treatments is here. Control your blinds with your voice,
            phone, or automated schedules. Perfect for hard-to-reach windows and smart homes.
          </p>
          <div className="flex items-center gap-4 text-sm text-indigo-200">
            <span>By <strong className="text-white">David Thompson</strong>, Smart Home Technology Specialist</span>
            <span>|</span>
            <span>12 min read</span>
          </div>
        </div>
      </div>

      {/* What Are Motorized Blinds */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">What Are Motorized Blinds?</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-4">
            Motorized blinds have a small, quiet motor built into the headrail that raises and
            lowers the blinds at the touch of a button. No more pulling cords or reaching for
            hard-to-access windows.
          </p>
          <p className="text-gray-700 mb-4">
            Modern motorized blinds can connect to your smart home ecosystem, allowing control
            via voice commands, smartphone apps, and automated schedules. They can open at
            sunrise, close at sunset, or respond to temperature and light sensors.
          </p>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
            <p className="text-indigo-800 font-medium">
              Smart Home Ready: Most motorized blinds work with Amazon Alexa, Google Home,
              Apple HomeKit, SmartThings, and more. Create scenes like "Good Morning" that
              open all your blinds at once.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Choose Motorized Blinds?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaMobileAlt className="text-4xl text-indigo-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">App Control</h3>
            <p className="text-sm text-gray-600">Control all your blinds from your phone, anywhere in the world.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaMicrophone className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Voice Control</h3>
            <p className="text-sm text-gray-600">"Alexa, close the bedroom blinds" - it's that easy.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaSun className="text-4xl text-yellow-500 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Automation</h3>
            <p className="text-sm text-gray-600">Schedule blinds to open at sunrise, close at sunset automatically.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaChild className="text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Child Safe</h3>
            <p className="text-sm text-gray-600">No dangerous cords. Safest option for homes with children and pets.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaBatteryFull className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Easy Install</h3>
            <p className="text-sm text-gray-600">Battery-powered options install just like regular blinds. No electrician needed.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaPlug className="text-4xl text-red-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Hard-to-Reach</h3>
            <p className="text-sm text-gray-600">Perfect for skylights, high windows, and behind furniture.</p>
          </div>
        </div>
      </section>

      {/* Power Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Power Options Explained</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FaBatteryFull className="text-2xl text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Rechargeable Battery</h3>
            <p className="text-gray-600 mb-3">
              Built-in rechargeable battery lasts 6-12 months on a single charge.
              Recharge via USB cable without removing the blind.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>+ Easy DIY installation</li>
              <li>+ No wiring required</li>
              <li>+ Portable / moveable</li>
              <li>- Needs periodic charging</li>
            </ul>
            <p className="text-sm font-medium text-green-700 mt-3">Most Popular Choice</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FaPlug className="text-2xl text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Hardwired</h3>
            <p className="text-gray-600 mb-3">
              Connected directly to your home's electrical system. Never needs
              charging or battery replacement.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>+ Never needs charging</li>
              <li>+ Most reliable</li>
              <li>+ Best for new construction</li>
              <li>- Requires electrician</li>
              <li>- Higher installation cost</li>
            </ul>
            <p className="text-sm font-medium text-blue-700 mt-3">Best for New Construction</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <FaSun className="text-2xl text-yellow-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Solar Powered</h3>
            <p className="text-gray-600 mb-3">
              Small solar panel mounts in window to keep batteries charged
              indefinitely using natural light.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>+ Self-charging</li>
              <li>+ Eco-friendly</li>
              <li>+ Easy installation</li>
              <li>- Needs sun exposure</li>
              <li>- Panel visible in window</li>
            </ul>
            <p className="text-sm font-medium text-yellow-700 mt-3">Best for Sunny Windows</p>
          </div>
        </div>
      </section>

      {/* Smart Home Integration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Smart Home Integration</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 mb-6">
            Modern motorized blinds integrate with major smart home platforms, allowing you to
            control them alongside your other smart devices.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🔵</span>
              </div>
              <p className="font-medium">Amazon Alexa</p>
              <p className="text-xs text-gray-500">"Alexa, open blinds"</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🔴</span>
              </div>
              <p className="font-medium">Google Home</p>
              <p className="text-xs text-gray-500">"Hey Google, close shades"</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🍎</span>
              </div>
              <p className="font-medium">Apple HomeKit</p>
              <p className="text-xs text-gray-500">"Hey Siri, bedroom blinds"</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📱</span>
              </div>
              <p className="font-medium">SmartThings</p>
              <p className="text-xs text-gray-500">Automations & scenes</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-bold text-indigo-800 mb-2">Popular Automations:</h4>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• "Good Morning" scene - Open all blinds at sunrise</li>
              <li>• "Movie Time" scene - Close living room blinds</li>
              <li>• "Away Mode" - Random open/close while on vacation</li>
              <li>• Temperature trigger - Close when it gets hot</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Which Blinds Can Be Motorized */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Which Blinds Can Be Motorized?</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Blind/Shade Type</th>
                <th className="text-center p-4 font-medium">Motorization</th>
                <th className="text-left p-4 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4 font-medium">Roller Shades</td>
                <td className="p-4 text-center"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Excellent</span></td>
                <td className="p-4 text-gray-600">Most popular for motorization</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Cellular Shades</td>
                <td className="p-4 text-center"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Excellent</span></td>
                <td className="p-4 text-gray-600">Great for bedrooms, energy efficiency</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Roman Shades</td>
                <td className="p-4 text-center"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Good</span></td>
                <td className="p-4 text-gray-600">Heavier - check motor capacity</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Wood/Faux Wood Blinds</td>
                <td className="p-4 text-center"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Good</span></td>
                <td className="p-4 text-gray-600">Lifts and tilts available</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Shutters</td>
                <td className="p-4 text-center"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Limited</span></td>
                <td className="p-4 text-gray-600">Motorized louver tilt available</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Vertical Blinds</td>
                <td className="p-4 text-center"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Good</span></td>
                <td className="p-4 text-gray-600">Great for sliding doors</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Best Rooms */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Best Applications for Motorized Blinds</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-green-700 mb-3">Highly Recommended</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Skylights (can't reach manually)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> High windows / 2-story foyers</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Behind furniture / beds</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Large/heavy shades</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Nurseries (no cords)</li>
                <li className="flex items-center gap-2"><FaStar className="text-green-500" /> Multiple windows to control together</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-700 mb-3">Great Convenience</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Master bedrooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Living rooms</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Home theaters</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Smart home setups</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Vacation homes (remote control)</li>
                <li className="flex items-center gap-2"><FaStar className="text-blue-500" /> Accessibility needs</li>
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
              <li>+ Ultimate convenience</li>
              <li>+ Smart home integration</li>
              <li>+ Voice control capable</li>
              <li>+ Scheduling & automation</li>
              <li>+ Child and pet safe (no cords)</li>
              <li>+ Perfect for hard-to-reach windows</li>
              <li>+ Control from anywhere via app</li>
              <li>+ Increases home value</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-800 mb-4">Limitations</h3>
            <ul className="space-y-2 text-red-700">
              <li>- Higher cost ($100-300+ per blind)</li>
              <li>- Battery options need charging</li>
              <li>- Hardwired needs electrician</li>
              <li>- Motor can fail (rare)</li>
              <li>- May require hub/bridge for smart features</li>
              <li>- Setup can be complex initially</li>
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
              q: "How do motorized blinds work?",
              a: "A small motor in the headrail raises and lowers the blinds. Control via remote, phone app, voice commands, or automation schedules."
            },
            {
              q: "Are motorized blinds worth the extra cost?",
              a: "For hard-to-reach windows, skylights, smart home users, and child safety - absolutely. The daily convenience adds up quickly."
            },
            {
              q: "How long do motorized blind batteries last?",
              a: "Rechargeable batteries typically last 6-12 months with normal use. Solar panels can keep them charged indefinitely."
            },
            {
              q: "Do they work with Alexa and Google Home?",
              a: "Yes! Most modern motorized blinds work with Alexa, Google Home, Apple HomeKit, and other smart home platforms."
            },
            {
              q: "Can I install them myself?",
              a: "Battery-powered options install just like regular blinds - no electrician needed. Only hardwired options require professional installation."
            },
            {
              q: "What happens during a power outage?",
              a: "Battery-powered blinds work independently. Most also have manual override options for emergencies."
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
      <section className="bg-indigo-900 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Go Smart?</h2>
        <p className="text-indigo-200 mb-6 max-w-2xl mx-auto">
          Browse our collection of motorized and smart blinds. Easy DIY installation with
          battery-powered options. Free shipping on orders over $99.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products?category=motorized"
            className="bg-white text-indigo-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
          >
            Shop Motorized Blinds <FaArrowRight className="ml-2" />
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
