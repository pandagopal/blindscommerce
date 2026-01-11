"use client";

import Link from "next/link";
import { FaCheck, FaArrowRight, FaDesktop, FaVideo, FaSun, FaLightbulb, FaVolumeUp, FaCog, FaClock, FaThermometerHalf } from "react-icons/fa";

export default function HomeOfficeBlindsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-700 to-slate-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Work From Home
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Home Office Blinds & Shades
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Create the perfect workspace with window treatments that reduce glare, improve video call lighting,
              and help you stay productive all day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?room=office"
                className="bg-white text-slate-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Office Blinds <FaArrowRight className="ml-2" />
              </Link>
              <Link
                href="/consultation"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Free Design Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Challenges */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Common Home Office Light Challenges</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            The right blinds solve these everyday work-from-home frustrations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaDesktop className="text-2xl text-red-600" />
              </div>
              <h3 className="font-bold mb-2">Screen Glare</h3>
              <p className="text-gray-600 text-sm">Harsh light on your monitor causing eye strain and headaches</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaVideo className="text-2xl text-red-600" />
              </div>
              <h3 className="font-bold mb-2">Bad Video Lighting</h3>
              <p className="text-gray-600 text-sm">Backlit windows making you look like a silhouette on calls</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSun className="text-2xl text-red-600" />
              </div>
              <h3 className="font-bold mb-2">Changing Light</h3>
              <p className="text-gray-600 text-sm">Sun position shifts throughout the day requiring constant adjustment</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaThermometerHalf className="text-2xl text-red-600" />
              </div>
              <h3 className="font-bold mb-2">Heat Buildup</h3>
              <p className="text-gray-600 text-sm">Direct sun making your office uncomfortably warm</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Solutions for Home Offices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                  <FaSun className="text-xl text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Solar Shades</h3>
              </div>
              <p className="text-gray-600 mb-4">
                The #1 choice for home offices. Solar shades reduce glare and heat while maintaining your view.
                Choose 3-5% openness for the perfect balance of light control and visibility.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Reduces glare by up to 90%</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Maintain your outdoor view</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Blocks heat from direct sun</span>
                </li>
              </ul>
              <Link href="/products?category=solar-shades" className="text-blue-600 font-medium hover:underline">
                Shop Solar Shades →
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                  <FaLightbulb className="text-xl text-purple-600" />
                </div>
                <h3 className="text-xl font-bold">Light Filtering Cellular Shades</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Diffuse harsh sunlight into soft, even illumination. Great for video calls where you want
                natural light without harsh shadows on your face.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Soft, diffused natural light</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Energy efficient honeycomb design</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Cordless and motorized options</span>
                </li>
              </ul>
              <Link href="/products?category=cellular-shades&opacity=light-filtering" className="text-purple-600 font-medium hover:underline">
                Shop Light Filtering →
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
                  <FaCog className="text-xl text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Motorized Blinds</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Adjust your blinds without leaving your desk. Schedule automatic adjustments throughout
                the day or use voice commands during video calls.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Adjust with app, remote, or voice</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Schedule based on time of day</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Works with Alexa, Google, HomeKit</span>
                </li>
              </ul>
              <Link href="/guides/motorized-blinds" className="text-green-600 font-medium hover:underline">
                Learn About Motorized →
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center">
                  <FaVideo className="text-xl text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Top-Down Bottom-Up</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Block direct sunlight from specific angles while keeping other areas open. Perfect for
                controlling exactly where light enters your office.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Block sun at specific heights</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Keep room bright overall</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <FaCheck className="text-green-500" />
                  <span>Privacy from street level</span>
                </li>
              </ul>
              <Link href="/top-down-bottom-up-shades" className="text-indigo-600 font-medium hover:underline">
                Learn About TDBU →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video Call Tips */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Video Call Lighting Tips</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Look professional on every Zoom, Teams, or Google Meet call
          </p>
          <div className="max-w-4xl mx-auto bg-slate-50 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4 text-green-700">✓ Do This</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <FaCheck className="text-green-500 mt-1" />
                    <span><strong>Face a window</strong> with light filtering shades for soft, flattering light</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheck className="text-green-500 mt-1" />
                    <span><strong>Use blackout shades</strong> behind you to prevent backlit silhouette</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheck className="text-green-500 mt-1" />
                    <span><strong>Choose neutral colors</strong> for a professional background</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheck className="text-green-500 mt-1" />
                    <span><strong>Get motorized blinds</strong> to adjust quickly between calls</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4 text-red-700">✗ Avoid This</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Sitting with a bright window directly behind you</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Harsh, direct sunlight hitting your face</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Busy patterns that distract from your face</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Uneven lighting creating harsh shadows</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Top Picks for Home Offices</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 h-40 flex items-center justify-center">
                <span className="text-white text-6xl">☀️</span>
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold text-blue-600 uppercase">Best for Glare</span>
                <h3 className="text-lg font-bold mt-1 mb-2">Solar Roller Shades</h3>
                <p className="text-gray-600 text-sm mb-4">3-5% openness blocks glare while maintaining view</p>
                <Link href="/products?category=solar-shades" className="text-blue-600 font-medium text-sm hover:underline">
                  Shop Now →
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 h-40 flex items-center justify-center">
                <span className="text-white text-6xl">🎥</span>
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold text-purple-600 uppercase">Best for Video</span>
                <h3 className="text-lg font-bold mt-1 mb-2">Light Filtering Cellular</h3>
                <p className="text-gray-600 text-sm mb-4">Soft, diffused light perfect for video calls</p>
                <Link href="/products?category=cellular-shades&opacity=light-filtering" className="text-purple-600 font-medium text-sm hover:underline">
                  Shop Now →
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-green-400 to-green-600 h-40 flex items-center justify-center">
                <span className="text-white text-6xl">🔋</span>
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold text-green-600 uppercase">Best Convenience</span>
                <h3 className="text-lg font-bold mt-1 mb-2">Motorized Shades</h3>
                <p className="text-gray-600 text-sm mb-4">Adjust without leaving your desk or interrupting work</p>
                <Link href="/products?feature=motorized" className="text-green-600 font-medium text-sm hover:underline">
                  Shop Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { q: "What are the best blinds for a home office?", a: "Light filtering shades that reduce glare without making the room dark are ideal. Solar shades (3-5% openness), light filtering cellular shades, and sheer shades are excellent choices." },
              { q: "How do I reduce screen glare from windows?", a: "Position your desk perpendicular to windows. Use solar shades with 3-5% openness to filter harsh light. Consider top-down bottom-up shades to block direct sunlight from specific angles." },
              { q: "What blinds look best for video calls?", a: "Light filtering shades in neutral colors create a professional backdrop. Avoid sitting with a bright window behind you - use blackout shades there instead." },
              { q: "Should I get motorized blinds for my home office?", a: "Highly recommended. They let you adjust light throughout the day without interrupting work. Set schedules to automatically adjust with the sun." },
              { q: "What openness percentage is best for office solar shades?", a: "3-5% openness is ideal - reduces glare significantly while maintaining your view. West-facing windows may need lower openness (1-3%)." },
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Create Your Perfect Home Office</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Shop blinds and shades designed for productivity. Free shipping on orders over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?room=office"
              className="bg-white text-slate-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Shop Office Blinds <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/consultation"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Get Free Advice
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
