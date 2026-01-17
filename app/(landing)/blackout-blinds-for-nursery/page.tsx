'use client';

import Link from 'next/link';
import { ArrowRight, Check, Moon, Shield, Baby, Thermometer, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlackoutBlindsNurseryPage() {
  const safetyFeatures = [
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: '100% Cordless Design',
      description: 'No dangerous cords or chains. Meets all CPSC child safety standards for complete peace of mind.'
    },
    {
      icon: <Moon className="h-8 w-8 text-red-600" />,
      title: '99.9% Light Blocking',
      description: 'Create the perfect dark environment for naps and bedtime. Helps regulate baby\'s sleep cycle.'
    },
    {
      icon: <Thermometer className="h-8 w-8 text-orange-500" />,
      title: 'Temperature Control',
      description: 'Insulating cellular design keeps nursery comfortable year-round and reduces energy costs.'
    },
    {
      icon: <Baby className="h-8 w-8 text-pink-500" />,
      title: 'Non-Toxic Materials',
      description: 'GREENGUARD Gold certified fabrics. Safe for your baby\'s room with no harmful VOCs.'
    }
  ];

  const productOptions = [
    {
      name: 'Cordless Blackout Cellular Shades',
      description: 'Our #1 pick for nurseries. Honeycomb cells trap air for insulation while blocking 99.9% of light.',
      price: 'From $59',
      features: ['Best insulation', 'Whisper quiet', 'Easy lift'],
      recommended: true,
      link: '/products?category=7'
    },
    {
      name: 'Cordless Blackout Roller Shades',
      description: 'Sleek, modern option with complete blackout. Spring-assisted for easy operation.',
      price: 'From $49',
      features: ['Modern look', 'Easy to clean', 'Compact design'],
      recommended: false,
      link: '/products?category=8'
    },
    {
      name: 'Motorized Blackout Blinds',
      description: 'Control with remote or app. Lower blinds without entering the room and waking baby.',
      price: 'From $149',
      features: ['Remote control', 'Schedule automation', 'Silent motor'],
      recommended: false,
      link: '/products?category=22'
    }
  ];

  const faqs = [
    {
      question: 'Why do babies need blackout blinds?',
      answer: 'Blackout blinds help regulate your baby\'s circadian rhythm by creating a dark sleep environment. This is especially important for daytime naps and during summer months when the sun sets late. Studies show babies sleep longer and more soundly in darker rooms.'
    },
    {
      question: 'Are cordless blinds really safer for nurseries?',
      answer: 'Yes, cordless blinds eliminate the strangulation hazard posed by blind cords, which are responsible for numerous child injuries each year. The CPSC recommends cordless window coverings in all homes with young children. All our nursery blinds are 100% cordless.'
    },
    {
      question: 'What\'s the difference between blackout and room darkening?',
      answer: 'Blackout blinds block 99-100% of light, creating near-total darkness. Room darkening blocks about 95-99% of light. For nurseries, we recommend true blackout blinds to ensure the best sleep environment for your baby.'
    },
    {
      question: 'How do I measure for nursery blinds?',
      answer: 'Measure the inside width at the top, middle, and bottom of the window frame. Use the smallest measurement. For height, measure left, center, and right sides and use the longest measurement. We offer free virtual measuring assistance if needed.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center bg-red-700/50 rounded-full px-4 py-2 mb-6">
              <Heart className="h-4 w-4 text-pink-400 mr-2" />
              <span className="text-sm">Designed for Baby's Safety & Sleep</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Blackout Blinds for Nursery
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-3xl mx-auto">
              Help your baby sleep better with 100% cordless, child-safe blackout blinds.
              Block 99.9% of light for perfect naps and peaceful nights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild>
                <Link href="/products?category=7">
                  Shop Nursery Blinds <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-red-900" asChild>
                <Link href="/samples">
                  Order Free Samples
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="bg-red-50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>100% Cordless & Child Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>GREENGUARD Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>99.9% Light Blocking</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Free Shipping on eligible orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Why Blackout for Nursery */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Better Sleep Starts with Better Darkness
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Light is the #1 enemy of baby sleep. Even small amounts of light can disrupt your
                  baby's natural sleep hormones and make naps shorter and nights more restless.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  Our blackout blinds create the perfect dark environment that pediatric sleep
                  experts recommend—helping your baby (and you!) get the rest you need.
                </p>
                <div className="bg-red-50 rounded-lg p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <Star className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900 mb-2">"A game changer for our family!"</p>
                      <p className="text-gray-600 text-sm">
                        "Our 6-month-old went from 30-minute naps to 2+ hours after installing these
                        blackout blinds. Worth every penny!"
                      </p>
                      <p className="text-gray-500 text-sm mt-2">— Sarah M., Verified Buyer</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-red-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">👶</div>
                  <p className="text-gray-500">Sleeping Baby</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Safety Features Parents Trust
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every nursery blind we sell is designed with your child's safety as the top priority.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Best Blackout Blinds for Nurseries
            </h2>
            <p className="text-xl text-gray-600">
              All options are cordless and child-safe
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {productOptions.map((product, index) => (
              <div key={index} className={`border rounded-xl overflow-hidden hover:shadow-lg transition-shadow ${product.recommended ? 'ring-2 ring-red-500' : ''}`}>
                {product.recommended && (
                  <div className="bg-red-500 text-white text-center py-2 text-sm font-medium">
                    ⭐ Most Popular for Nurseries
                  </div>
                )}
                <div className="bg-red-50 h-48 flex items-center justify-center">
                  <div className="text-4xl">🪟</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <p className="text-2xl font-bold text-red-600 mb-4">{product.price}</p>
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={product.recommended ? 'default' : 'outline'} asChild>
                    <Link href={product.link}>
                      Shop Now
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nursery Color Ideas */}
      <section className="py-16 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Nursery Colors
            </h2>
            <p className="text-xl text-gray-600">
              Soft, soothing shades that complement any nursery décor
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
            {[
              { name: 'Soft White', color: '#F8F8F8' },
              { name: 'Blush Pink', color: '#FFB6C1' },
              { name: 'Baby Blue', color: '#89CFF0' },
              { name: 'Sage Green', color: '#B2AC88' },
              { name: 'Lavender', color: '#E6E6FA' },
              { name: 'Cream', color: '#FFFDD0' },
              { name: 'Gray', color: '#D3D3D3' },
              { name: 'Mint', color: '#98FF98' },
            ].map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-20 h-20 rounded-full border-4 border-white shadow-md mb-2"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-sm text-gray-600">{color.name}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/samples">
                Order Free Color Samples
              </Link>
            </Button>
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
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Give Your Baby the Gift of Better Sleep
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Custom blackout blinds, made safely for your nursery.
            Free shipping on orders over $100.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="outline" className="bg-white text-red-600 hover:bg-red-50 border-white" asChild>
              <Link href="/products?category=7">
                Shop Nursery Blinds
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/consultation">
                Get Expert Help
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
