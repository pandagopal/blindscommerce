'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Zap, Shield, Sun, Smartphone, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MotorizedBlindsHighWindowsPage() {
  const benefits = [
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: 'Easy Remote Control',
      description: 'Control hard-to-reach windows with a remote, smartphone app, or voice commands through Alexa or Google Home.'
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: 'Child & Pet Safe',
      description: 'No dangling cords mean safer homes for children and pets. Meets all child safety standards.'
    },
    {
      icon: <Sun className="h-8 w-8 text-yellow-500" />,
      title: 'Energy Efficient',
      description: 'Program blinds to adjust automatically based on time of day, saving on heating and cooling costs.'
    },
    {
      icon: <Smartphone className="h-8 w-8 text-purple-600" />,
      title: 'Smart Home Ready',
      description: 'Integrates seamlessly with your existing smart home ecosystem for automated control.'
    }
  ];

  const faqs = [
    {
      question: 'How do motorized blinds work for high windows?',
      answer: 'Motorized blinds use a quiet motor built into the headrail that raises and lowers the blinds with the push of a button. They can be controlled via remote control, smartphone app, wall switch, or voice commands through smart home devices like Alexa or Google Home.'
    },
    {
      question: 'What power options are available for motorized blinds?',
      answer: 'We offer three power options: hardwired (connected to your home electrical), rechargeable battery (lasts 6-12 months per charge), and solar-powered panels. Battery and solar options are perfect for retrofitting existing windows without electrical work.'
    },
    {
      question: 'Can I install motorized blinds myself?',
      answer: 'Yes! Our motorized blinds come with easy-to-follow installation instructions. Battery-powered options require no electrical work. However, for hardwired installations or very high windows, we recommend our professional installation service.'
    },
    {
      question: 'How much do motorized blinds for high windows cost?',
      answer: 'Motorized blinds typically start at $150-300 per window depending on size and style. For high windows, we recommend roller shades or cellular shades with motorization, which offer the best value. We offer free quotes for custom sizing.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-blue-700/50 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-sm">Rated 4.9/5 by 2,500+ customers</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Motorized Blinds for High Windows
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Control hard-to-reach windows effortlessly. Smart motorized blinds with remote, app,
              and voice control. Free shipping on orders over $100.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild>
                <Link href="/products?category=22">
                  Shop Motorized Blinds <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-900" asChild>
                <Link href="/consultation">
                  Get Free Quote
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="bg-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Free Shipping $100+</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>5-Year Motor Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Easy DIY Installation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Smart Home Compatible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Tired of Climbing Ladders to Adjust Your High Windows?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  High windows in vaulted ceilings, stairwells, and two-story living rooms are beautiful
                  but impractical to operate with traditional blinds. You shouldn't need a ladder every
                  time you want to adjust the light.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  <strong>Motorized blinds solve this problem completely.</strong> With the touch of a
                  button, you can raise, lower, or tilt your blinds from anywhere in the room—or anywhere
                  in the world with our smartphone app.
                </p>
                <ul className="space-y-3">
                  {['Control windows up to 30+ feet high', 'No ladders or reaching required', 'Works with Alexa, Google Home & Apple HomeKit', 'Program schedules for automatic adjustment'].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏠</div>
                  <p className="text-gray-500">High Window Illustration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Motorized Blinds for High Windows?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Beyond convenience, motorized blinds offer safety, energy savings, and smart home integration.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Recommendations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Best Motorized Blinds for High Windows
            </h2>
            <p className="text-xl text-gray-600">
              Our top picks for hard-to-reach windows
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Motorized Roller Shades',
                description: 'Clean, modern look perfect for large windows. Available in blackout and light filtering.',
                price: 'From $159',
                features: ['Quiet motor', 'App control', 'Solar power option'],
                link: '/products?category=8&features=motorized'
              },
              {
                name: 'Motorized Cellular Shades',
                description: 'Best energy efficiency with honeycomb design. Ideal for temperature control.',
                price: 'From $199',
                features: ['Energy efficient', 'Cordless design', 'Multiple opacity levels'],
                link: '/products?category=7&features=motorized'
              },
              {
                name: 'Motorized Roman Shades',
                description: 'Elegant fabric folds for a sophisticated look. Perfect for formal spaces.',
                price: 'From $249',
                features: ['Premium fabrics', 'Soft fold design', 'Room darkening options'],
                link: '/products?category=4&features=motorized'
              }
            ].map((product, index) => (
              <div key={index} className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                  <div className="text-4xl">🪟</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <p className="text-2xl font-bold text-primary-red mb-4">{product.price}</p>
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href={product.link}>
                      Shop Now <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-red to-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Upgrade Your High Windows?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Get a free quote for motorized blinds custom-sized for your windows.
            Our experts will help you choose the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="outline" className="bg-white text-primary-red hover:bg-gray-100 border-white" asChild>
              <Link href="/consultation">
                Schedule Free Consultation
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/samples">
                Order Free Samples
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
