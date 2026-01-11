"use client";

import Link from "next/link";
import { FaMoon, FaBed, FaFilm, FaBaby, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function BlackoutBlindsPage() {
  const benefits = [
    {
      icon: FaMoon,
      title: "Complete Darkness",
      description: "Block 100% of light for optimal sleeping conditions any time of day."
    },
    {
      icon: FaBed,
      title: "Better Sleep",
      description: "Studies show dark rooms improve sleep quality and duration significantly."
    },
    {
      icon: FaFilm,
      title: "Home Theater Ready",
      description: "Create the perfect movie-watching environment with total light blockage."
    },
    {
      icon: FaBaby,
      title: "Nursery Perfect",
      description: "Help babies sleep better with consistent darkness for naps and bedtime."
    }
  ];

  const blackoutTypes = [
    {
      name: "Blackout Roller Shades",
      description: "Clean, modern design with complete light blocking. Easy to operate.",
      features: ["100% blackout", "Cordless option", "Motorized available"],
      priceFrom: "$34.99",
      href: "/products?category=roller-shades&opacity=blackout"
    },
    {
      name: "Blackout Cellular Shades",
      description: "Energy efficient with superior insulation plus complete darkness.",
      features: ["R-value insulation", "Sound dampening", "Child safe"],
      priceFrom: "$54.99",
      href: "/products?category=cellular-shades&opacity=blackout"
    },
    {
      name: "Blackout Roman Shades",
      description: "Elegant fabric folds with blackout lining. Sophisticated style.",
      features: ["Fabric options", "Custom patterns", "Thermal lined"],
      priceFrom: "$79.99",
      href: "/products?category=roman-shades&opacity=blackout"
    },
    {
      name: "Blackout Vertical Blinds",
      description: "Perfect for sliding doors and large windows. Complete coverage.",
      features: ["Sliding door ready", "Wide widths", "Wand control"],
      priceFrom: "$49.99",
      href: "/products?category=vertical-blinds&opacity=blackout"
    }
  ];

  const roomGuide = [
    {
      room: "Master Bedroom",
      recommendation: "Blackout roller or cellular shades",
      why: "Maximize sleep quality with complete darkness. Cellular adds temperature control."
    },
    {
      room: "Nursery",
      recommendation: "Cordless blackout cellular shades",
      why: "Safe for children with cordless design. Create consistent dark environment for naps."
    },
    {
      room: "Home Theater",
      recommendation: "Motorized blackout roller shades",
      why: "Control with remote for easy operation during movies. Sleek, modern look."
    },
    {
      room: "Guest Room",
      recommendation: "Blackout roman shades",
      why: "Stylish appearance that impresses guests while providing excellent sleep conditions."
    },
    {
      room: "Shift Worker Bedroom",
      recommendation: "Double cell blackout cellular",
      why: "Maximum light blocking plus noise reduction for daytime sleeping."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              100% Light Blocking
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Blackout Blinds & Shades
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Complete darkness when you need it. Perfect for bedrooms, nurseries,
              and home theaters. Sleep better starting tonight.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?opacity=blackout"
                className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Blackout Blinds <FaArrowRight className="ml-2" />
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
            Why Choose Blackout Blinds?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <benefit.icon className="text-5xl text-indigo-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sleep Stats */}
      <section className="py-16 bg-indigo-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            The Science of Better Sleep
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-5xl font-bold text-indigo-300 mb-2">73%</div>
              <div className="text-gray-300">of people sleep better in complete darkness</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-indigo-300 mb-2">45 min</div>
              <div className="text-gray-300">extra sleep per night on average</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-indigo-300 mb-2">30%</div>
              <div className="text-gray-300">improvement in sleep quality reported</div>
            </div>
          </div>
        </div>
      </section>

      {/* Types of Blackout */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Shop Blackout Blinds by Style
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Every style available with 100% blackout options. Choose what fits your aesthetic.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {blackoutTypes.map((type, index) => (
              <Link
                key={index}
                href={type.href}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow group"
              >
                <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">
                  {type.name}
                </h3>
                <p className="text-gray-600 mb-4">{type.description}</p>
                <ul className="space-y-2 mb-4">
                  {type.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <FaCheck className="text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-indigo-600">From {type.priceFrom}</span>
                  <span className="text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Shop <FaArrowRight className="ml-2" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Room Guide */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Blackout Guide by Room
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Expert recommendations for every room in your home.
          </p>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {roomGuide.map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{item.room}</h3>
                      <p className="text-indigo-600 font-medium">{item.recommendation}</p>
                    </div>
                    <p className="text-gray-600 mt-2 md:mt-0 md:max-w-md md:text-right">{item.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Premium Blackout Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "100% light blocking fabric",
                "Side channels eliminate light gaps",
                "Cordless and motorized options",
                "Child-safe certified",
                "Thermal insulation bonus",
                "Custom sizes up to 144\" wide",
                "Multiple mounting options",
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

      {/* Reviews */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Customers Love Our Blackout Blinds
          </h2>
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-2xl" />
              ))}
            </div>
            <span className="text-xl font-semibold">4.9 out of 5</span>
            <span className="text-gray-400">(3,200+ reviews)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Michelle P.",
                text: "Finally sleeping through the night! These blackout shades block every bit of light. Game changer.",
                rating: 5
              },
              {
                name: "Carlos R.",
                text: "Work night shift and these make my bedroom pitch black during the day. Best purchase ever.",
                rating: 5
              },
              {
                name: "Jennifer M.",
                text: "Installed in my baby's nursery - she naps so much better now. Worth every penny!",
                rating: 5
              }
            ].map((review, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6">
                <div className="flex mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{review.text}"</p>
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
            Everything you need to know about blackout blinds
          </p>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "Do blackout blinds block 100% of light?",
                answer: "True blackout blinds block 99-100% of incoming light when properly installed. For complete darkness, we recommend inside mount installation with side channels that eliminate light gaps around the edges. Our blackout fabrics are tested to meet strict light-blocking standards."
              },
              {
                question: "Are blackout blinds good for sleep?",
                answer: "Absolutely! Research shows that sleeping in complete darkness improves sleep quality, duration, and helps regulate your circadian rhythm. Blackout blinds are especially beneficial for shift workers, light-sensitive sleepers, and children who need daytime naps. Many customers report falling asleep faster and sleeping longer."
              },
              {
                question: "What's the best type of blackout blind for bedrooms?",
                answer: "For bedrooms, we recommend blackout cellular shades or blackout roller shades. Cellular shades offer the added benefit of energy efficiency and sound dampening. Roller shades provide a clean, modern look and are available with motorization for convenience. Both options come in cordless versions for child safety."
              },
              {
                question: "Do blackout blinds help with energy efficiency?",
                answer: "Yes! Blackout blinds provide excellent insulation. The thick, opaque fabric blocks heat transfer through windows, keeping rooms cooler in summer and warmer in winter. Blackout cellular shades offer the best energy efficiency due to their honeycomb air pockets. You can save 10-25% on heating and cooling costs."
              },
              {
                question: "Can blackout blinds reduce noise?",
                answer: "Blackout blinds do provide some sound dampening, typically reducing noise by 20-30%. For maximum noise reduction, choose blackout cellular shades which can reduce outside noise by up to 50% thanks to their honeycomb structure that absorbs sound waves."
              },
              {
                question: "Are blackout blinds safe for nurseries?",
                answer: "Yes, when you choose cordless options. We offer cordless blackout blinds that are certified child-safe with no dangling cords. These are ideal for nurseries, children's rooms, and homes with pets. Motorized options provide the ultimate in safety and convenience."
              },
              {
                question: "How do I clean blackout blinds?",
                answer: "Most blackout blinds can be cleaned with a soft cloth or vacuum brush attachment. For deeper cleaning, wipe with a damp cloth and mild soap. Avoid harsh chemicals or excessive water. Roller shades can usually be wiped down while cellular shades should be vacuumed gently. Always check care instructions for your specific product."
              },
              {
                question: "What colors do blackout blinds come in?",
                answer: "Blackout blinds are available in a wide range of colors, not just dark shades. You can get blackout performance in whites, creams, grays, and even lighter colors. The blackout coating is applied to the back of the fabric, so the room-facing side can be any color that matches your decor."
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
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sleep Better Starting Tonight
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Order blackout blinds today with free shipping and our satisfaction guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?opacity=blackout"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Shop Blackout Blinds
            </Link>
            <Link
              href="/customer/samples"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Free Samples
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
