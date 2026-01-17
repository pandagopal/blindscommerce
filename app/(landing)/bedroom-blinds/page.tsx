"use client";

import Link from "next/link";
import { FaMoon, FaShieldAlt, FaThermometerHalf, FaVolumeDown, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function BedroomBlindsPage() {
  const priorities = [
    {
      icon: FaMoon,
      title: "Light Blocking",
      description: "Blackout options block 99-100% of light for optimal sleep conditions any time of day."
    },
    {
      icon: FaShieldAlt,
      title: "Privacy",
      description: "Complete privacy from neighbors and street views, day and night."
    },
    {
      icon: FaThermometerHalf,
      title: "Temperature Control",
      description: "Insulating blinds keep bedrooms comfortable year-round and reduce energy costs."
    },
    {
      icon: FaVolumeDown,
      title: "Noise Reduction",
      description: "Cellular shades can reduce outside noise by up to 50% for peaceful sleep."
    }
  ];

  const recommendations = [
    {
      name: "Blackout Cellular Shades",
      tag: "Best Overall",
      description: "The ultimate bedroom choice. Complete darkness plus energy efficiency and noise reduction.",
      features: ["100% blackout", "R-5 insulation value", "50% noise reduction", "Cordless options"],
      priceFrom: "$54.99",
      href: "/products?category=cellular-shades&opacity=blackout"
    },
    {
      name: "Blackout Roller Shades",
      tag: "Best Value",
      description: "Clean, modern look with complete light blocking. Great for contemporary bedrooms.",
      features: ["99-100% blackout", "Motorized available", "100+ colors", "Easy to clean"],
      priceFrom: "$34.99",
      href: "/products?category=roller-shades&opacity=blackout"
    },
    {
      name: "Room Darkening Roman Shades",
      tag: "Most Stylish",
      description: "Elegant fabric folds add sophistication. Excellent for master bedrooms.",
      features: ["Blackout lining", "Premium fabrics", "Custom patterns", "Thermal backed"],
      priceFrom: "$79.99",
      href: "/products?category=roman-shades&opacity=blackout"
    },
    {
      name: "Wood & Faux Wood Blinds",
      tag: "Classic Look",
      description: "Timeless appeal with adjustable light control. Great for traditional bedrooms.",
      features: ["Tilt for privacy", "Natural warmth", "Durable", "Multiple stains"],
      priceFrom: "$49.99",
      href: "/products?category=wood-blinds"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-600 text-white py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Shop by Room
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Bedroom Blinds & Shades
            </h1>
            <p className="text-xl md:text-2xl text-indigo-200 mb-8">
              Create the perfect sleep environment. Blackout blinds, room darkening shades,
              and insulating options designed for better rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?room=bedroom"
                className="bg-white text-red-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Bedroom Blinds <FaArrowRight className="ml-2" />
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

      {/* What Matters */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What Matters Most in a Bedroom
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Your bedroom is your sanctuary. Choose window treatments that promote restful sleep.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {priorities.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <item.icon className="text-5xl text-indigo-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sleep Science */}
      <section className="py-16 bg-red-700 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            The Science of Better Sleep
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-5xl font-bold text-indigo-300 mb-2">73%</div>
              <div className="text-indigo-200">of people sleep better in complete darkness</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-indigo-300 mb-2">45 min</div>
              <div className="text-indigo-200">extra sleep per night with blackout blinds</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-indigo-300 mb-2">25%</div>
              <div className="text-indigo-200">energy savings with insulated shades</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Best Blinds for Bedrooms
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our top picks for creating the perfect sleep environment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {recommendations.map((product, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {product.tag}
                    </span>
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <ul className="space-y-2 mb-6">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <FaCheck className="text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-indigo-600">From {product.priceFrom}</span>
                  <Link
                    href={product.href}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center"
                  >
                    Shop Now <FaArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bedroom Types */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Solutions for Every Bedroom
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                room: "Master Bedroom",
                recommendation: "Motorized blackout cellular shades",
                why: "Premium comfort with smart home integration. Control shades from bed with voice or app."
              },
              {
                room: "Nursery",
                recommendation: "Cordless blackout cellular shades",
                why: "Complete darkness for nap time. Cordless design certified child-safe."
              },
              {
                room: "Guest Room",
                recommendation: "Room darkening roman shades",
                why: "Stylish appearance that impresses guests while providing excellent sleep conditions."
              },
              {
                room: "Kids' Room",
                recommendation: "Cordless blackout roller shades",
                why: "Durable, easy to clean, and completely safe. Fun colors available."
              },
              {
                room: "Teen Room",
                recommendation: "Motorized roller shades",
                why: "Tech-savvy solution they'll actually use. Set schedules for consistent sleep."
              },
              {
                room: "Shift Worker",
                recommendation: "Double cell blackout with side channels",
                why: "Maximum light blocking for daytime sleeping. Zero light gaps."
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.room}</h3>
                <p className="text-indigo-600 font-medium mb-2">{item.recommendation}</p>
                <p className="text-gray-600 text-sm">{item.why}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Bedroom-Friendly Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Blackout fabrics block 99-100% light",
                "Cordless lift for child safety",
                "Motorized options for convenience",
                "Insulating materials for comfort",
                "Noise-reducing cellular structure",
                "Side channels eliminate light gaps",
                "Custom sizes for any window",
                "Lifetime warranty included"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                  <FaCheck className="text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Bedroom Blinds FAQ
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 mt-12">
            {[
              {
                question: "What are the best blinds for sleeping?",
                answer: "Blackout cellular shades or blackout roller shades are the best options for sleep. They block 99-100% of light, creating complete darkness. Cellular shades add the bonus of noise reduction and temperature control."
              },
              {
                question: "Do blackout blinds really block all light?",
                answer: "Quality blackout blinds block 99-100% of incoming light through the fabric. For complete darkness, consider adding side channels or choosing outside mount installation to eliminate light gaps around the edges."
              },
              {
                question: "Are blackout blinds safe for nurseries?",
                answer: "Yes, when you choose cordless options. We recommend cordless blackout cellular shades for nurseries - they're certified child-safe with no dangling cords, and they create the perfect dark environment for nap time."
              },
              {
                question: "What's better for bedrooms - blinds or shades?",
                answer: "Shades (especially cellular or roller) are generally better for bedrooms because they offer complete coverage without slats that can let light through. Cellular shades are our top recommendation for their light blocking, insulation, and noise reduction."
              },
              {
                question: "Can bedroom blinds help with energy bills?",
                answer: "Yes! Cellular shades can reduce heat loss through windows by up to 40%, lowering energy costs by up to 25%. They keep bedrooms cooler in summer and warmer in winter for year-round comfort."
              },
              {
                question: "What's the difference between room darkening and blackout?",
                answer: "Room darkening blocks 95-99% of light - some ambient glow remains. Blackout blocks 99-100% of light for complete darkness. For bedrooms, especially for shift workers or light-sensitive sleepers, we recommend true blackout options."
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

      {/* Reviews */}
      <section className="py-16 bg-red-700 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-2xl" />
              ))}
            </div>
            <span className="text-xl font-semibold">4.9 out of 5</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Sarah M.",
                text: "Finally sleeping through the night! These blackout shades make my bedroom pitch black. Life changing for this light-sensitive sleeper.",
                room: "Master Bedroom"
              },
              {
                name: "David K.",
                text: "Work night shifts and these shades let me sleep during the day. Complete darkness at noon. Worth every penny.",
                room: "Shift Worker"
              },
              {
                name: "Emily R.",
                text: "Got these for my baby's nursery. She naps so much better now. Cordless design gives peace of mind too.",
                room: "Nursery"
              }
            ].map((review, index) => (
              <div key={index} className="bg-red-600 rounded-xl p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-indigo-100 mb-4">"{review.text}"</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{review.name}</span>
                  <span className="text-indigo-300 text-sm">{review.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sleep Better Tonight
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your bedroom into a sleep sanctuary. Free shipping on orders over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?room=bedroom&opacity=blackout"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Shop Blackout Blinds
            </Link>
            <Link
              href="/consultation"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Expert Help
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
