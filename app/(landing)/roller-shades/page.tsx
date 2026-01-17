"use client";

import Link from "next/link";
import { FaWifi, FaSun, FaEye, FaPaintBrush, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function RollerShadesPage() {
  const benefits = [
    {
      icon: FaWifi,
      title: "Smart Home Ready",
      description: "Motorized options integrate with Alexa, Google Home, and smart home systems."
    },
    {
      icon: FaSun,
      title: "Light Control",
      description: "From sheer to blackout - choose your perfect level of light control."
    },
    {
      icon: FaEye,
      title: "Clean Aesthetic",
      description: "Minimalist design with smooth operation. Perfect for modern interiors."
    },
    {
      icon: FaPaintBrush,
      title: "Endless Styles",
      description: "100+ fabrics, colors, and patterns to match any decor style."
    }
  ];

  const opacityOptions = [
    {
      name: "Sheer",
      light: "80-90%",
      description: "Soft light diffusion, maintains outside view",
      bestFor: "Living rooms, offices with glare concerns"
    },
    {
      name: "Light Filtering",
      light: "40-60%",
      description: "Balanced light with daytime privacy",
      bestFor: "Most living spaces, general use"
    },
    {
      name: "Room Darkening",
      light: "5-10%",
      description: "Significant light blocking, high privacy",
      bestFor: "Bedrooms, media rooms"
    },
    {
      name: "Blackout",
      light: "0%",
      description: "Complete light blocking",
      bestFor: "Bedrooms, nurseries, home theaters"
    }
  ];

  const liftOptions = [
    {
      name: "Cordless",
      description: "Safe, clean look. Simply push up or pull down.",
      priceFrom: "+$15"
    },
    {
      name: "Continuous Loop",
      description: "Classic chain operation. Smooth and reliable.",
      priceFrom: "Included"
    },
    {
      name: "Motorized",
      description: "Remote control or smart home integration.",
      priceFrom: "+$89"
    },
    {
      name: "Spring Assist",
      description: "Lightweight touch to raise. Great for large shades.",
      priceFrom: "+$25"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-600 to-red-700 text-white py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Modern & Minimalist
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Roller Shades
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              Clean lines, smooth operation, endless possibilities. The perfect
              blend of form and function for contemporary homes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?category=roller-shades"
                className="bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Roller Shades <FaArrowRight className="ml-2" />
              </Link>
              <Link
                href="/customer/samples"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Order Free Samples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Roller Shades?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <benefit.icon className="text-5xl text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opacity Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Choose Your Light Level
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From sun-filtering sheer to complete blackout - control exactly how much light enters.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {opacityOptions.map((option, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-1">{option.name}</h3>
                <div className="text-slate-600 text-sm mb-3">Light: {option.light}</div>
                <p className="text-gray-600 mb-4 text-sm">{option.description}</p>
                <div className="text-sm">
                  <span className="font-semibold">Best for: </span>
                  {option.bestFor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lift Options */}
      <section className="py-16 bg-red-600 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Lift System Options
          </h2>
          <p className="text-xl text-slate-300 text-center mb-12 max-w-2xl mx-auto">
            Choose how you want to operate your shades - from manual to fully automated.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {liftOptions.map((option, index) => (
              <div key={index} className="bg-red-600 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2">{option.name}</h3>
                <p className="text-slate-300 mb-4 text-sm">{option.description}</p>
                <div className="text-slate-400 text-sm">{option.priceFrom}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Home Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-slate-100 text-slate-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
                  Smart Home Integration
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Voice Control Your Shades
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Our motorized roller shades work seamlessly with your smart home ecosystem.
                  Control with your voice or set automated schedules.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Works with Amazon Alexa",
                    "Compatible with Google Home",
                    "Apple HomeKit ready",
                    "Set sunrise/sunset schedules",
                    "Create scenes and routines"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <FaCheck className="text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/products?category=roller-shades&feature=motorized"
                  className="inline-flex items-center text-slate-700 font-semibold hover:text-slate-900"
                >
                  Shop Motorized Shades <FaArrowRight className="ml-2" />
                </Link>
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <FaWifi className="text-8xl text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">"Alexa, close the shades"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Fabrics */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Popular Fabric Collections
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Premium fabrics in textures and patterns to complement any style.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Solid Colors", count: "50+ colors" },
              { name: "Textures", count: "30+ options" },
              { name: "Patterns", count: "25+ designs" },
              { name: "Solar Screens", count: "15+ colors" }
            ].map((collection, index) => (
              <Link
                key={index}
                href={`/products?category=roller-shades&fabric=${collection.name.toLowerCase()}`}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-4" />
                <h3 className="font-semibold mb-1">{collection.name}</h3>
                <p className="text-sm text-gray-500">{collection.count}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/customer/samples"
              className="text-slate-700 hover:text-slate-900 font-semibold inline-flex items-center"
            >
              Order Free Fabric Samples <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Customer Reviews
          </h2>
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-2xl" />
              ))}
            </div>
            <span className="text-xl font-semibold">4.8 out of 5</span>
            <span className="text-gray-500">(2,100+ reviews)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Kevin T.",
                text: "The motorized shades are incredible. Love controlling them with Alexa. So convenient!",
                rating: 5
              },
              {
                name: "Rachel B.",
                text: "Clean, modern look that matches our minimalist decor perfectly. Great quality fabrics.",
                rating: 5
              },
              {
                name: "Steve M.",
                text: "Ordered solar shades for our sunroom - they cut the glare without blocking the view. Perfect!",
                rating: 5
              }
            ].map((review, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{review.text}"</p>
                <div className="font-semibold">{review.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to know about roller shades
          </p>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "What are roller shades?",
                answer: "Roller shades are window coverings made from a single piece of fabric that rolls up onto a tube at the top of the window. They offer a clean, minimalist look and smooth operation. Roller shades come in various opacity levels from sheer to blackout, and can be operated manually (cordless or chain) or with motorization."
              },
              {
                question: "What's the difference between roller shades and roller blinds?",
                answer: "Roller shades and roller blinds are often used interchangeably. Technically, 'shades' refers to fabric window coverings while 'blinds' typically means slatted coverings like venetian blinds. Roller shades use continuous fabric, providing a smooth, seamless appearance compared to horizontal slats."
              },
              {
                question: "Are roller shades good for bedrooms?",
                answer: "Yes! Roller shades come in blackout options that block 99-100% of light, making them excellent for bedrooms. Blackout roller shades help you sleep better by creating complete darkness. For bedrooms, we recommend cordless or motorized options for convenience and child safety."
              },
              {
                question: "Can roller shades be motorized?",
                answer: "Absolutely! Our motorized roller shades can be controlled via remote, smartphone app, or voice commands through Amazon Alexa, Google Home, and Apple HomeKit. You can set schedules for automatic opening and closing, and integrate them with your smart home system."
              },
              {
                question: "How do I clean roller shades?",
                answer: "Most roller shades can be cleaned with a soft cloth, feather duster, or vacuum with a brush attachment. For spot cleaning, use a damp cloth with mild soap. Some fabrics are washable - check the care instructions. Avoid harsh chemicals and excessive moisture. Regular dusting prevents buildup and extends the life of your shades."
              },
              {
                question: "What opacity level should I choose?",
                answer: "Sheer (80-90% light) - Great for living rooms where you want natural light and a view. Light Filtering (40-60% light) - Best for most spaces, provides privacy while allowing soft light. Room Darkening (5-10% light) - Ideal for bedrooms and media rooms. Blackout (0% light) - Perfect for complete darkness in bedrooms or home theaters."
              },
              {
                question: "How do I measure for roller shades?",
                answer: "For inside mount, measure the width at the top, middle, and bottom of the window opening - use the narrowest measurement. Measure height on the left, center, and right - use the longest. For outside mount, measure the total area you want to cover and add 2-3 inches on each side for light gap coverage."
              },
              {
                question: "Are roller shades child-safe?",
                answer: "Yes! We offer cordless roller shades that eliminate dangling cords, making them certified child-safe. Cordless shades operate with a simple push-up or pull-down motion. Motorized options are also completely cordless and can be controlled remotely, providing the safest option for homes with children or pets."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow">
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Modern Shades for Modern Homes
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Transform your space with sleek roller shades. Free shipping on orders over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?category=roller-shades"
              className="bg-white text-slate-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Shop Roller Shades
            </Link>
            <Link
              href="/consultation"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Get Design Help
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
