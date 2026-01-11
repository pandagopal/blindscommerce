"use client";

import Link from "next/link";
import Image from "next/image";
import { FaRuler, FaPalette, FaTruck, FaShieldAlt, FaStar, FaCheck } from "react-icons/fa";

export default function CustomBlindsPage() {
  const features = [
    {
      icon: FaRuler,
      title: "Made to Measure",
      description: "Every blind custom cut to your exact window dimensions for a perfect fit"
    },
    {
      icon: FaPalette,
      title: "Endless Options",
      description: "Choose from hundreds of colors, materials, and styles to match your decor"
    },
    {
      icon: FaTruck,
      title: "Free Shipping",
      description: "Enjoy free delivery on all orders over $99 across the continental US"
    },
    {
      icon: FaShieldAlt,
      title: "Lifetime Warranty",
      description: "Our blinds are backed by an industry-leading lifetime warranty"
    }
  ];

  const blindTypes = [
    {
      name: "Wood Blinds",
      description: "Classic elegance with genuine hardwood slats. Perfect for traditional and modern homes.",
      image: "/images/products/wood-blinds.jpg",
      href: "/products?category=wood-blinds",
      features: ["Real hardwood", "Multiple stain options", "Cordless available"]
    },
    {
      name: "Faux Wood Blinds",
      description: "The look of real wood with superior durability. Ideal for high-humidity areas.",
      image: "/images/products/faux-wood-blinds.jpg",
      href: "/products?category=faux-wood-blinds",
      features: ["Moisture resistant", "Budget-friendly", "Easy maintenance"]
    },
    {
      name: "Cellular Shades",
      description: "Maximum energy efficiency with honeycomb design. Reduce heating and cooling costs.",
      image: "/images/products/cellular-shades.jpg",
      href: "/products?category=cellular-shades",
      features: ["Energy efficient", "Light filtering", "Sound dampening"]
    },
    {
      name: "Roller Shades",
      description: "Clean, modern lines with smooth operation. Available in blackout and light filtering.",
      image: "/images/products/roller-shades.jpg",
      href: "/products?category=roller-shades",
      features: ["Minimalist design", "Blackout options", "Motorized available"]
    },
    {
      name: "Roman Shades",
      description: "Soft fabric folds create elegant window treatments. Timeless sophistication.",
      image: "/images/products/roman-shades.jpg",
      href: "/products?category=roman-shades",
      features: ["Luxurious fabrics", "Cordless lift", "Custom patterns"]
    },
    {
      name: "Vertical Blinds",
      description: "Perfect for sliding doors and large windows. Easy light and privacy control.",
      image: "/images/products/vertical-blinds.jpg",
      href: "/products?category=vertical-blinds",
      features: ["Sliding door ready", "Wide coverage", "Vinyl or fabric"]
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      location: "Austin, TX",
      rating: 5,
      text: "The custom blinds fit perfectly! The ordering process was easy and they arrived faster than expected."
    },
    {
      name: "Michael R.",
      location: "Denver, CO",
      rating: 5,
      text: "Great quality at a fair price. The faux wood blinds look amazing in our living room."
    },
    {
      name: "Jennifer L.",
      location: "Seattle, WA",
      rating: 5,
      text: "Customer service helped me choose the perfect shades. Will definitely order again!"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Custom Blinds Made for Your Windows
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Premium quality window treatments, custom cut to fit perfectly.
              Save up to 50% compared to retail stores.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-primary-red hover:bg-primary-red-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Shop All Blinds
              </Link>
              <Link
                href="/customer/samples"
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors border border-white/30"
              >
                Order Free Samples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <feature.icon className="text-4xl text-primary-red mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blind Types Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Shop Custom Blinds by Type
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From classic wood blinds to modern roller shades, find the perfect window treatment for every room.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blindTypes.map((type, index) => (
              <Link
                key={index}
                href={type.href}
                className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-video bg-gray-200 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-2xl font-bold">{type.name}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-700">
                        <FaCheck className="text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-primary-red font-semibold group-hover:underline">
                    Shop {type.name} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How Custom Blinds Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Measure", desc: "Use our easy measuring guide or schedule a free consultation" },
              { step: "2", title: "Choose", desc: "Select your style, color, and features from our wide selection" },
              { step: "3", title: "Order", desc: "Place your order online with our secure checkout" },
              { step: "4", title: "Install", desc: "Easy DIY installation or professional help available" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-red rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-gray-500">{testimonial.location}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-red text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Windows?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Get started with free samples or shop our collection today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-primary-red px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/consultation"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Free Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "How do I measure for custom blinds?",
                a: "We provide a detailed measuring guide with your order. For inside mount, measure the width and height at three points and use the smallest measurement. For outside mount, add 2-3 inches on each side."
              },
              {
                q: "How long does it take to receive custom blinds?",
                a: "Most custom blinds ship within 5-7 business days. Standard shipping takes an additional 3-5 days. Expedited options are available at checkout."
              },
              {
                q: "Can I return custom blinds?",
                a: "Yes! We offer a satisfaction guarantee. If your blinds don't fit or you're not happy, contact us within 30 days for a full refund or replacement."
              },
              {
                q: "Do you offer installation services?",
                a: "Yes, professional installation is available in most areas. You can also easily install yourself using our step-by-step guides and video tutorials."
              }
            ].map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
