"use client";

import Link from "next/link";
import { FaHome, FaBuilding, FaSun, FaMoon, FaLeaf, FaChild, FaStar, FaCheck, FaArrowRight } from "react-icons/fa";

export default function WindowBlindsPage() {
  const categories = [
    {
      title: "By Material",
      items: [
        { name: "Wood Blinds", href: "/products?category=wood-blinds", desc: "Natural elegance" },
        { name: "Faux Wood Blinds", href: "/products?category=faux-wood-blinds", desc: "Durable & affordable" },
        { name: "Aluminum Blinds", href: "/products?category=aluminum-blinds", desc: "Modern & sleek" },
        { name: "Vinyl Blinds", href: "/products?category=vinyl-blinds", desc: "Budget-friendly" },
      ]
    },
    {
      title: "By Style",
      items: [
        { name: "Horizontal Blinds", href: "/products?style=horizontal", desc: "Classic design" },
        { name: "Vertical Blinds", href: "/products?style=vertical", desc: "Great for doors" },
        { name: "Roller Shades", href: "/products?category=roller-shades", desc: "Clean lines" },
        { name: "Roman Shades", href: "/products?category=roman-shades", desc: "Elegant fabric" },
      ]
    },
    {
      title: "By Room",
      items: [
        { name: "Living Room", href: "/products?room=living-room", desc: "Style & comfort" },
        { name: "Bedroom", href: "/products?room=bedroom", desc: "Privacy & blackout" },
        { name: "Kitchen", href: "/products?room=kitchen", desc: "Easy to clean" },
        { name: "Bathroom", href: "/products?room=bathroom", desc: "Moisture resistant" },
      ]
    }
  ];

  const benefits = [
    {
      icon: FaSun,
      title: "Light Control",
      description: "Precisely adjust natural light to create the perfect ambiance in any room"
    },
    {
      icon: FaMoon,
      title: "Privacy",
      description: "Control visibility from outside while maintaining your view when desired"
    },
    {
      icon: FaLeaf,
      title: "Energy Efficiency",
      description: "Reduce heat gain in summer and heat loss in winter to lower energy bills"
    },
    {
      icon: FaChild,
      title: "Child Safety",
      description: "Cordless and motorized options keep children and pets safe"
    }
  ];

  const popularProducts = [
    {
      name: "2\" Faux Wood Blinds",
      price: "From $29.99",
      rating: 4.8,
      reviews: 1250,
      features: ["Moisture resistant", "Cordless option", "25 colors"],
      href: "/products?category=faux-wood-blinds"
    },
    {
      name: "Cordless Cellular Shades",
      price: "From $45.99",
      rating: 4.9,
      reviews: 890,
      features: ["Energy efficient", "Light filtering", "Child safe"],
      href: "/products?category=cellular-shades"
    },
    {
      name: "Premium Wood Blinds",
      price: "From $59.99",
      rating: 4.7,
      reviews: 650,
      features: ["Real hardwood", "Custom stains", "Lifetime warranty"],
      href: "/products?category=wood-blinds"
    },
    {
      name: "Blackout Roller Shades",
      price: "From $34.99",
      rating: 4.8,
      reviews: 780,
      features: ["100% blackout", "Motorized available", "Modern design"],
      href: "/products?category=roller-shades"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Window Blinds for Every Home
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Transform your space with premium window blinds. Custom made,
              professionally designed, delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop All Blinds <FaArrowRight className="ml-2" />
              </Link>
              <Link
                href="/customer/samples"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Get Free Samples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <FaCheck className="text-green-500" />
              <span>Free Shipping Over $99</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheck className="text-green-500" />
              <span>Lifetime Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheck className="text-green-500" />
              <span>Made in USA</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheck className="text-green-500" />
              <span>Easy Returns</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Choose Window Blinds?
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Window blinds offer the perfect combination of style, functionality, and value.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <benefit.icon className="text-5xl text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Shop Window Blinds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-6 text-center border-b pb-4">
                  {category.title}
                </h3>
                <ul className="space-y-4">
                  {category.items.map((item, idx) => (
                    <li key={idx}>
                      <Link
                        href={item.href}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div>
                          <div className="font-semibold group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">{item.desc}</div>
                        </div>
                        <FaArrowRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Best-Selling Window Blinds
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our most popular window blinds, loved by thousands of customers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.map((product, index) => (
              <Link
                key={index}
                href={product.href}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"}
                          size={14}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">({product.reviews})</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600 mb-3">{product.price}</div>
                  <ul className="space-y-1">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center">
                        <FaCheck className="text-green-500 mr-2 text-xs" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
            >
              View All Products <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Window Blinds for Every Space
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <FaHome className="text-4xl text-blue-300 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Residential</h3>
                <p className="text-blue-200">
                  From cozy bedrooms to expansive living rooms, our window blinds
                  add style and function to every room in your home.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <FaBuilding className="text-4xl text-blue-300 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Commercial</h3>
                <p className="text-blue-200">
                  Outfit your office, restaurant, or retail space with durable,
                  professional window treatments built to last.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Perfect Blinds?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Browse our collection or get personalized recommendations from our design experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/consultation"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Book Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">
            The Complete Guide to Window Blinds
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Window blinds are one of the most versatile and popular window treatment options
              available today. Whether you're looking to control light, enhance privacy, improve
              energy efficiency, or simply update your home's aesthetic, there's a window blind
              style perfect for your needs.
            </p>
            <h3 className="text-2xl font-semibold mt-8 mb-4">Types of Window Blinds</h3>
            <p>
              <strong>Horizontal Blinds:</strong> The classic choice featuring slats that run
              horizontally across the window. Available in wood, faux wood, aluminum, and vinyl.
              Perfect for standard windows and offers excellent light control.
            </p>
            <p>
              <strong>Vertical Blinds:</strong> Ideal for sliding glass doors and large windows.
              The vertical slats can be tilted for light control or drawn to one side for full
              access to doors and windows.
            </p>
            <p>
              <strong>Roller Shades:</strong> A modern, minimalist option that rolls up into a
              compact cylinder. Available in various opacities from sheer to complete blackout.
            </p>
            <h3 className="text-2xl font-semibold mt-8 mb-4">Choosing the Right Window Blinds</h3>
            <p>
              When selecting window blinds, consider these key factors: the room's function,
              light control needs, privacy requirements, moisture exposure (especially for
              kitchens and bathrooms), and your overall design aesthetic. Our design consultants
              are available to help you make the perfect choice for your home.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
