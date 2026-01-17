"use client";

import Link from "next/link";
import { FaLeaf, FaSnowflake, FaSun, FaVolumeDown, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function CellularShadesPage() {
  const benefits = [
    {
      icon: FaLeaf,
      title: "Energy Savings",
      description: "Honeycomb design traps air to insulate windows. Save up to 25% on heating and cooling."
    },
    {
      icon: FaSnowflake,
      title: "Temperature Control",
      description: "Keep rooms cooler in summer and warmer in winter with superior insulation."
    },
    {
      icon: FaSun,
      title: "Light Filtering Options",
      description: "Choose from sheer, light filtering, room darkening, or complete blackout."
    },
    {
      icon: FaVolumeDown,
      title: "Sound Dampening",
      description: "Reduce outside noise for a quieter, more peaceful home environment."
    }
  ];

  const cellTypes = [
    {
      name: "Single Cell",
      description: "One layer of honeycomb cells. Great value with good insulation.",
      bestFor: "Mild climates, budget-conscious",
      priceFrom: "$45.99"
    },
    {
      name: "Double Cell",
      description: "Two layers of cells for maximum insulation. Best energy efficiency.",
      bestFor: "Extreme climates, maximum savings",
      priceFrom: "$59.99"
    },
    {
      name: "Triple Cell",
      description: "Ultimate insulation with three cell layers. Premium performance.",
      bestFor: "Large windows, premium projects",
      priceFrom: "$79.99"
    }
  ];

  const opacityLevels = [
    {
      name: "Sheer",
      light: "90%",
      privacy: "Low",
      description: "Maximum natural light while reducing glare"
    },
    {
      name: "Light Filtering",
      light: "50%",
      privacy: "Moderate",
      description: "Soft, diffused light with daytime privacy"
    },
    {
      name: "Room Darkening",
      light: "10%",
      privacy: "High",
      description: "Blocks most light, ideal for media rooms"
    },
    {
      name: "Blackout",
      light: "0%",
      privacy: "Complete",
      description: "Total darkness, perfect for bedrooms"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-800 via-red-700 to-red-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Most Energy Efficient
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Cellular Shades
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8">
              Honeycomb design provides superior insulation. Save up to 25% on energy
              bills while adding style to your windows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?category=cellular-shades"
                className="bg-white text-red-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Cellular Shades <FaArrowRight className="ml-2" />
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

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
              How Cellular Shades Work
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              The unique honeycomb structure creates air pockets that insulate your windows,
              keeping your home comfortable year-round.
            </p>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-5xl font-bold text-red-600 mb-2">25%</div>
                  <div className="text-gray-600">Energy Savings</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-red-600 mb-2">R-5</div>
                  <div className="text-gray-600">Insulation Value</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-red-600 mb-2">50%</div>
                  <div className="text-gray-600">Noise Reduction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Cellular Shades?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <benefit.icon className="text-5xl text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cell Types */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Choose Your Cell Type
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            More cells = more insulation. Choose based on your climate and energy goals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {cellTypes.map((cell, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 border-2 bg-white ${
                  index === 1 ? "border-red-500 shadow-lg" : "border-gray-200"
                }`}
              >
                {index === 1 && (
                  <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                    Best Value
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-2">{cell.name}</h3>
                <p className="text-gray-600 mb-4">{cell.description}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <strong>Best for:</strong> {cell.bestFor}
                </div>
                <div className="text-2xl font-bold text-red-600 mb-4">
                  From {cell.priceFrom}
                </div>
                <Link
                  href={`/products?category=cellular-shades&type=${cell.name.toLowerCase().replace(' ', '-')}`}
                  className="block text-center bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Shop {cell.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opacity Levels */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Light Control Options
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From sheer to complete blackout, control exactly how much light enters your room.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {opacityLevels.map((level, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-gray-200"
                  style={{
                    background: `linear-gradient(to bottom,
                      rgba(255,255,0,${100 - parseInt(level.light)}/100) 0%,
                      rgba(0,0,0,${parseInt(level.light)}/100) 100%)`
                  }}
                />
                <h3 className="text-xl font-semibold mb-2">{level.name}</h3>
                <div className="text-sm text-gray-500 mb-2">
                  Light: {level.light} | Privacy: {level.privacy}
                </div>
                <p className="text-gray-600 text-sm">{level.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-red-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Premium Features Included
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Cordless lift for child safety",
                "Top-down/bottom-up option available",
                "Day/night dual shade option",
                "Motorization compatible",
                "Custom sizes up to 144\" wide",
                "50+ colors and patterns",
                "Inside or outside mount",
                "Lifetime warranty"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <FaCheck className="text-red-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Room Ideas */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect For Every Room
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                room: "Bedrooms",
                desc: "Blackout cellular shades ensure complete darkness for better sleep.",
                recommendation: "Double cell blackout"
              },
              {
                room: "Living Rooms",
                desc: "Light filtering options provide privacy while maintaining natural light.",
                recommendation: "Single cell light filtering"
              },
              {
                room: "Home Office",
                desc: "Reduce glare on screens while keeping rooms bright and comfortable.",
                recommendation: "Double cell light filtering"
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-3">{item.room}</h3>
                <p className="text-gray-600 mb-4">{item.desc}</p>
                <div className="text-sm">
                  <span className="font-semibold text-red-600">Recommended: </span>
                  {item.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-2xl" />
              ))}
            </div>
            <span className="text-xl font-semibold">4.9 out of 5</span>
            <span className="text-gray-500">(1,890+ reviews)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Lisa T.",
                text: "Our energy bills dropped noticeably after installing these in every room. They look beautiful too!",
                rating: 5
              },
              {
                name: "James W.",
                text: "The blackout cellular shades in our bedroom are amazing. Finally getting good sleep!",
                rating: 5
              },
              {
                name: "Maria G.",
                text: "Love the cordless design. Safe for the kids and so easy to operate. Highly recommend!",
                rating: 5
              }
            ].map((review, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to know about cellular shades
          </p>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "What are cellular shades and how do they work?",
                answer: "Cellular shades, also called honeycomb shades, feature a unique honeycomb-shaped cell structure that traps air to create insulation. This design acts as a barrier between your window and room, keeping heat out in summer and warmth in during winter. The trapped air pockets provide superior insulation compared to other window treatments."
              },
              {
                question: "How much can I save on energy bills with cellular shades?",
                answer: "Cellular shades can reduce heat loss through windows by up to 40% and lower overall energy costs by up to 25%. Double and triple cell options provide even greater savings. The Department of Energy estimates that windows account for 25-30% of heating and cooling energy use, making cellular shades one of the most cost-effective home improvements."
              },
              {
                question: "What's the difference between single, double, and triple cell shades?",
                answer: "Single cell shades have one layer of honeycomb cells and offer good insulation at an affordable price. Double cell shades have two layers stacked together for approximately 50% more insulation. Triple cell shades provide maximum insulation for extreme climates or large windows. Most homeowners find double cell shades offer the best balance of performance and value."
              },
              {
                question: "Are cellular shades good for bedrooms?",
                answer: "Yes! Cellular shades are excellent for bedrooms. Blackout cellular shades block 99-100% of light for optimal sleep conditions. The honeycomb structure also provides sound dampening, reducing outside noise by up to 50%. Cordless options are available for child safety in nurseries and kids' rooms."
              },
              {
                question: "How do I measure for cellular shades?",
                answer: "For inside mount, measure the width at the top, middle, and bottom of your window opening, using the narrowest measurement. Measure height on the left, center, and right, using the longest measurement. For outside mount, add 2-3 inches on each side for optimal light blocking. We offer free measuring guides and professional measurement services."
              },
              {
                question: "Can cellular shades be motorized?",
                answer: "Yes! Our cellular shades are available with motorization options including battery-powered and hardwired systems. Motorized shades work with smart home systems like Amazon Alexa, Google Home, and Apple HomeKit. You can set schedules, create scenes, and control shades with your voice or smartphone app."
              },
              {
                question: "How long do cellular shades last?",
                answer: "High-quality cellular shades typically last 7-10 years with proper care. Our cellular shades come with a lifetime warranty covering manufacturing defects. To maximize lifespan, dust regularly with a soft brush or vacuum attachment and avoid excessive moisture exposure."
              },
              {
                question: "What colors and styles are available?",
                answer: "We offer cellular shades in over 50 colors and patterns, from classic whites and neutrals to bold designer colors. Options include smooth and textured fabrics, and opacity levels from sheer to blackout. Many styles are available in coordinating colors for a cohesive look throughout your home."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Saving Energy Today
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Shop cellular shades and enjoy better comfort, lower energy bills, and beautiful windows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?category=cellular-shades"
              className="bg-white text-red-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Shop Cellular Shades
            </Link>
            <Link
              href="/consultation"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Get Expert Help
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
