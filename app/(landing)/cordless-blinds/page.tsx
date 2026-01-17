"use client";

import Link from "next/link";
import { FaChild, FaCheck, FaArrowRight, FaStar, FaPaw, FaHome, FaHandPaper } from "react-icons/fa";

export default function CordlessBlindsPage() {
  const benefits = [
    { icon: FaChild, title: "Child Safe", description: "No dangling cords that pose strangulation hazards to children." },
    { icon: FaPaw, title: "Pet Friendly", description: "Cats and dogs can't get tangled in cords or pull them down." },
    { icon: FaHome, title: "Clean Look", description: "No visible cords for a streamlined, modern appearance." },
    { icon: FaHandPaper, title: "Easy Operation", description: "Simple push up / pull down operation anyone can use." },
  ];

  const products = [
    { name: "Cordless Cellular Shades", tag: "Most Popular", description: "Energy-efficient honeycomb design with safe cordless operation.", price: "$54.99", href: "/products?category=cellular-shades&lift=cordless" },
    { name: "Cordless Faux Wood Blinds", tag: "Best for Bathrooms", description: "Moisture-resistant with realistic wood grain look.", price: "$49.99", href: "/products?category=faux-wood-blinds&lift=cordless" },
    { name: "Cordless Roller Shades", tag: "Modern Choice", description: "Sleek, minimal design with spring-assisted lift.", price: "$44.99", href: "/products?category=roller-shades&lift=cordless" },
    { name: "Cordless Roman Shades", tag: "Elegant Style", description: "Soft fabric folds with cordless convenience.", price: "$79.99", href: "/products?category=roman-shades&lift=cordless" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-700 to-teal-900 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Safety First
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Cordless Blinds & Shades
            </h1>
            <p className="text-xl text-teal-100 mb-8">
              Safe, stylish, and simple. Cordless blinds eliminate dangerous dangling cords
              while providing a clean, modern look. The smart choice for families with children and pets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products?lift=cordless"
                className="bg-white text-teal-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Cordless Blinds <FaArrowRight className="ml-2" />
              </Link>
              <Link
                href="/samples"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Order Free Samples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Alert */}
      <section className="bg-red-50 border-y border-red-200 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Cord Safety Is Critical</h2>
            <p className="text-red-700">
              Window cord incidents have caused hundreds of child injuries. The Consumer Product Safety Commission
              and pediatric safety groups strongly recommend cordless or motorized blinds for homes with young children.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Cordless?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <item.icon className="text-5xl text-teal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Cordless Blinds Work</h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-teal-700">1</span>
                </div>
                <h3 className="font-bold mb-2">To Lower</h3>
                <p className="text-gray-600">Gently pull down on the bottom rail to your desired position.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-teal-700">2</span>
                </div>
                <h3 className="font-bold mb-2">To Raise</h3>
                <p className="text-gray-600">Push up on the bottom rail and release at your desired height.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-teal-700">3</span>
                </div>
                <h3 className="font-bold mb-2">It Stays</h3>
                <p className="text-gray-600">Internal spring mechanism holds the blind at any position.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Cordless Options</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Almost every blind type is available in cordless. Here are our most popular.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {products.map((product, index) => (
              <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
                <span className="inline-block bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  {product.tag}
                </span>
                <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-teal-600">From {product.price}</span>
                  <Link href={product.href} className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center">
                    Shop Now <FaArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { q: "How do cordless blinds work?", a: "Cordless blinds use an internal spring mechanism. Pull down to lower, push up to raise. The spring tension holds the blind at any height." },
              { q: "Are cordless blinds safer than corded?", a: "Yes, significantly safer. Corded blinds pose strangulation hazards. All major safety organizations recommend cordless for homes with children." },
              { q: "Do cordless blinds cost more?", a: "Typically $10-30 more per blind. The safety benefits and cleaner look make it worthwhile." },
              { q: "Are cordless blinds available for large windows?", a: "Yes, up to about 72\" wide depending on type. For very large windows, motorized may be easier to operate." },
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
      <section className="py-16 bg-teal-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Make the Safe Choice</h2>
          <p className="text-xl text-teal-200 mb-8 max-w-2xl mx-auto">
            Protect your family with cordless blinds. Free shipping on orders over $99.
          </p>
          <Link
            href="/products?lift=cordless"
            className="bg-white text-teal-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Shop All Cordless Blinds <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
