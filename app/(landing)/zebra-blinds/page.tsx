'use client';

import Link from 'next/link';
import { ArrowRight, Check, Sun, Moon, Sparkles, Ruler, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ZebraBlindsPage() {
  const benefits = [
    {
      icon: <Sun className="h-8 w-8 text-yellow-500" />,
      title: 'Versatile Light Control',
      description: 'Transition seamlessly from full light to complete privacy by simply adjusting the alignment of the stripes.'
    },
    {
      icon: <Moon className="h-8 w-8 text-red-600" />,
      title: 'Day & Night Privacy',
      description: 'Solid stripes provide complete privacy when aligned, sheer stripes allow filtered light when open.'
    },
    {
      icon: <Sparkles className="h-8 w-8 text-red-600" />,
      title: 'Modern Aesthetic',
      description: 'Sleek, contemporary design that complements modern interiors. Available in 50+ colors and patterns.'
    },
    {
      icon: <Ruler className="h-8 w-8 text-red-600" />,
      title: 'Custom Fit',
      description: 'Made-to-measure for your exact window dimensions. Perfect fit guaranteed or we remake free.'
    }
  ];

  const colorOptions = [
    { name: 'Pure White', hex: '#FFFFFF' },
    { name: 'Ivory', hex: '#FFFFF0' },
    { name: 'Light Gray', hex: '#D3D3D3' },
    { name: 'Charcoal', hex: '#36454F' },
    { name: 'Navy', hex: '#000080' },
    { name: 'Taupe', hex: '#483C32' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Black', hex: '#000000' },
  ];

  const faqs = [
    {
      question: 'What are zebra blinds?',
      answer: 'Zebra blinds (also called dual shades or layered shades) feature alternating sheer and solid horizontal stripes on a single piece of fabric. By adjusting the blinds, you can align the solid stripes for privacy or offset them to allow light through the sheer sections.'
    },
    {
      question: 'Are zebra blinds good for bedrooms?',
      answer: 'Yes! When the solid stripes are aligned, zebra blinds provide excellent privacy and significant light blocking. For complete blackout in bedrooms, we recommend our zebra blinds with blackout fabric option, which blocks 99% of light.'
    },
    {
      question: 'How do you clean zebra blinds?',
      answer: 'Zebra blinds are easy to maintain. Regular dusting with a soft cloth or vacuum with a brush attachment keeps them clean. For spots, use a damp cloth with mild soap. The polyester fabric is stain-resistant and durable.'
    },
    {
      question: 'Can zebra blinds be motorized?',
      answer: 'Absolutely! We offer motorized zebra blinds that can be controlled via remote, smartphone app, or voice commands through Alexa and Google Home. Perfect for hard-to-reach windows or smart home integration.'
    },
    {
      question: 'How much do custom zebra blinds cost?',
      answer: 'Our custom zebra blinds start at $49 for standard sizes. Prices vary based on window dimensions, fabric choice, and features like motorization. Use our online configurator for instant pricing or request a free quote.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-600 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-sm">Most Popular Modern Blind Style</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Zebra Blinds & Dual Shades
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The perfect blend of style and function. Alternating sheer and solid stripes give you
              complete control over light and privacy. Custom-made to fit your windows perfectly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild>
                <Link href="/products?search=zebra">
                  Shop Zebra Blinds <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900" asChild>
                <Link href="/samples">
                  Get Free Samples
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
              <span>Starting at $49</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Free Shipping on eligible orders</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>50+ Colors Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Perfect Fit Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* What Are Zebra Blinds */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-full max-w-xs mx-auto">
                    {/* Zebra stripe illustration */}
                    <div className="space-y-2">
                      {[1,2,3,4,5,6].map((i) => (
                        <div key={i} className="flex">
                          <div className="h-6 flex-1 bg-white rounded"></div>
                          <div className="h-6 flex-1 bg-gray-400 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-500 mt-4">Zebra Blind Pattern</p>
                </div>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  What Makes Zebra Blinds Special?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Zebra blinds feature a unique dual-layer design with alternating sheer and opaque
                  horizontal stripes. This innovative construction lets you:
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <strong className="text-gray-900">Filter Light:</strong>
                      <span className="text-gray-600"> Offset the stripes to let soft, diffused light through the sheer sections</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <strong className="text-gray-900">Block Light:</strong>
                      <span className="text-gray-600"> Align the solid stripes for privacy and significant light reduction</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-1 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <strong className="text-gray-900">Maintain View:</strong>
                      <span className="text-gray-600"> Enjoy outside views while maintaining daytime privacy</span>
                    </div>
                  </li>
                </ul>
                <Button asChild>
                  <Link href="/products?search=zebra">
                    Explore Zebra Blinds <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
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
              Why Choose Zebra Blinds?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The modern window treatment that does it all
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

      {/* Color Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              50+ Colors & Patterns
            </h2>
            <p className="text-xl text-gray-600">
              Find the perfect match for your décor
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto mb-8">
            {colorOptions.map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-16 h-16 rounded-full border-4 border-white shadow-md mb-2"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-sm text-gray-600">{color.name}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href="/samples">
                Order Free Color Samples
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Room Ideas */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every Room
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                room: 'Living Room',
                description: 'Create a bright, airy feel while maintaining privacy from neighbors.',
                icon: '🛋️'
              },
              {
                room: 'Bedroom',
                description: 'Choose blackout zebra blinds for restful sleep and complete darkness.',
                icon: '🛏️'
              },
              {
                room: 'Home Office',
                description: 'Reduce screen glare while keeping your workspace naturally lit.',
                icon: '💻'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.room}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Windows?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get custom zebra blinds made to your exact measurements.
            Free shipping on orders over $100.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild>
              <Link href="/products?search=zebra">
                Shop Zebra Blinds
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900" asChild>
              <Link href="/consultation">
                Get Free Quote
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
