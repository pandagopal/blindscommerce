"use client";

import Link from "next/link";
import { FaWater, FaSun, FaDollarSign, FaTools, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function FauxWoodBlindsPage() {
  const benefits = [
    {
      icon: FaWater,
      title: "Moisture Resistant",
      description: "Perfect for bathrooms, kitchens, and humid climates. Won't warp or crack like real wood."
    },
    {
      icon: FaSun,
      title: "UV Resistant",
      description: "Won't fade or yellow from sun exposure. Maintains color and finish for years."
    },
    {
      icon: FaDollarSign,
      title: "Affordable Luxury",
      description: "Get the look of real wood at a fraction of the price. Best value for your money."
    },
    {
      icon: FaTools,
      title: "Easy Maintenance",
      description: "Simple to clean with a damp cloth. No special treatments or conditioning required."
    }
  ];

  const slatSizes = [
    {
      size: "1\" Slats",
      description: "Ideal for smaller windows and a more traditional look",
      priceFrom: "$24.99"
    },
    {
      size: "2\" Slats",
      description: "Most popular choice - perfect balance of style and light control",
      priceFrom: "$29.99"
    },
    {
      size: "2.5\" Slats",
      description: "Modern, contemporary look with better outside view",
      priceFrom: "$34.99"
    }
  ];

  const colors = [
    { name: "White", hex: "#FFFFFF" },
    { name: "Off-White", hex: "#F5F5DC" },
    { name: "Oak", hex: "#C4A35A" },
    { name: "Maple", hex: "#D4A04A" },
    { name: "Cherry", hex: "#9B2335" },
    { name: "Walnut", hex: "#5C4033" },
    { name: "Espresso", hex: "#3C280D" },
    { name: "Gray", hex: "#808080" }
  ];

  const comparisonData = [
    { feature: "Price", faux: "$$", real: "$$$$" },
    { feature: "Moisture Resistance", faux: "Excellent", real: "Poor" },
    { feature: "Appearance", faux: "Very Good", real: "Excellent" },
    { feature: "Durability", faux: "Excellent", real: "Good" },
    { feature: "Weight", faux: "Lighter", real: "Heavier" },
    { feature: "Maintenance", faux: "Easy", real: "Moderate" },
    { feature: "Best For", faux: "Any room", real: "Dry rooms" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              #1 Best Seller
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Faux Wood Blinds
            </h1>
            <p className="text-xl md:text-2xl text-amber-100 mb-8">
              The look of real wood with superior durability. Perfect for every room,
              including bathrooms and kitchens. Starting at just $24.99.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?category=faux-wood-blinds"
                className="bg-white text-amber-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Faux Wood Blinds <FaArrowRight className="ml-2" />
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
            Why Choose Faux Wood Blinds?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <benefit.icon className="text-5xl text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slat Sizes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Choose Your Slat Size
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Select the perfect slat width for your windows and style preference.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {slatSizes.map((slat, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 border-2 ${
                  index === 1 ? "border-amber-500 bg-amber-50" : "border-gray-200"
                }`}
              >
                {index === 1 && (
                  <span className="inline-block bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-2">{slat.size}</h3>
                <p className="text-gray-600 mb-4">{slat.description}</p>
                <div className="text-2xl font-bold text-amber-600">
                  {slat.priceFrom}
                </div>
                <Link
                  href={`/products?category=faux-wood-blinds&slat=${slat.size}`}
                  className="mt-4 block text-center bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Shop {slat.size}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Popular Colors & Finishes
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From crisp whites to rich wood tones, find the perfect color for your decor.
          </p>
          <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
            {colors.map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-20 h-20 rounded-full shadow-lg border-4 border-white mx-auto mb-2"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-sm font-medium">{color.name}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/customer/samples"
              className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center"
            >
              Order Free Color Samples <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Faux Wood vs. Real Wood Blinds
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            See how faux wood blinds compare to real wood options.
          </p>
          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-4 px-4 text-left">Feature</th>
                  <th className="py-4 px-4 text-center bg-amber-50">Faux Wood</th>
                  <th className="py-4 px-4 text-center">Real Wood</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center bg-amber-50 font-semibold text-amber-700">
                      {row.faux}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.real}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 bg-amber-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              What's Included
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Custom cut to your exact measurements",
                "Tilt wand for easy operation",
                "Cordless lift option available",
                "Valance included at no extra cost",
                "Mounting hardware included",
                "Detailed installation instructions",
                "Inside or outside mount options",
                "Lifetime warranty on all components"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <FaCheck className="text-amber-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
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
            <span className="text-gray-500">(2,450+ reviews)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "David K.",
                text: "These faux wood blinds look amazing! You can't tell they're not real wood. Perfect for my bathroom.",
                rating: 5
              },
              {
                name: "Amanda S.",
                text: "Great value for the price. Easy to install and they fit perfectly. Will order more for other rooms.",
                rating: 5
              },
              {
                name: "Robert M.",
                text: "Ordered 6 blinds for our entire first floor. Excellent quality and the customer service was top notch.",
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

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Windows?
          </h2>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Order your custom faux wood blinds today. Free shipping on orders over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?category=faux-wood-blinds"
              className="bg-white text-amber-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/customer/samples"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Get Free Samples
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
