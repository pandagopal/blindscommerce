'use client';

import Link from 'next/link';
import { ArrowRight, Check, Home, Shield, Clock, DollarSign, Star, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NoDrillBlindsApartmentsPage() {
  const benefits = [
    {
      icon: <Home className="h-8 w-8 text-red-600" />,
      title: 'Renter Friendly',
      description: 'No holes, no damage, no problem with your landlord. Perfect for apartments, dorms, and rentals.'
    },
    {
      icon: <Clock className="h-8 w-8 text-red-600" />,
      title: '5-Minute Install',
      description: 'Simply tension-mount or use adhesive strips. No tools required. Install and remove in minutes.'
    },
    {
      icon: <DollarSign className="h-8 w-8 text-yellow-500" />,
      title: 'Get Your Deposit Back',
      description: 'Remove blinds when you move out with zero wall damage. Keep your security deposit intact.'
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: 'Strong & Secure',
      description: 'Industrial-strength mounting options hold up to daily use. Won\'t fall or sag over time.'
    }
  ];

  const mountingOptions = [
    {
      name: 'Tension Mount',
      description: 'Spring-loaded brackets press against the inside of your window frame. Best for: Inside mount installations.',
      pros: ['No adhesive', 'Adjustable fit', 'Easy repositioning'],
      icon: '🔧'
    },
    {
      name: 'Adhesive Mount',
      description: '3M Command strip technology for a secure hold. Best for: Any flat surface including tile and glass.',
      pros: ['Works on any surface', 'Extra strong hold', 'Clean removal'],
      icon: '📎'
    },
    {
      name: 'Magnetic Mount',
      description: 'Powerful magnets attach to metal window frames. Best for: Steel window frames and doors.',
      pros: ['Instant on/off', 'No residue', 'Reusable'],
      icon: '🧲'
    }
  ];

  const faqs = [
    {
      question: 'Will no-drill blinds really hold up?',
      answer: 'Yes! Our tension-mount and adhesive blinds use commercial-grade hardware designed for daily use. Tension mounts support blinds up to 36" wide, while our 3M adhesive strips can hold blinds on windows up to 48" wide. Thousands of apartment dwellers use them daily.'
    },
    {
      question: 'Can I take them with me when I move?',
      answer: 'Absolutely! That\'s the beauty of no-drill blinds. Tension mounts simply release when you remove them, and adhesive strips peel off cleanly using the pull tabs. Your blinds and walls stay damage-free, so you can reinstall them at your new place.'
    },
    {
      question: 'Do no-drill blinds work on all window types?',
      answer: 'Most window types work great. Tension mounts require a flat window frame at least 1.5" deep. Adhesive mounts work on any clean, flat surface including drywall, tile, metal, and wood. Contact us if you\'re unsure about your specific windows.'
    },
    {
      question: 'Are no-drill blinds as good as regular blinds?',
      answer: 'Yes! We use the same premium materials and construction as our drill-mount blinds. The only difference is the mounting hardware. You get the same light control, privacy, and style—just easier to install and remove.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 via-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center bg-red-700/50 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-sm">#1 Choice for Renters</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              No-Drill Blinds for Apartments
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-3xl mx-auto">
              Custom window blinds that install without drilling or damaging walls.
              Perfect for renters, dorms, and anyone who wants an easy installation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild>
                <Link href="/products?features=no-drill">
                  Shop No-Drill Blinds <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-red-900" asChild>
                <Link href="/consultation">
                  Get Free Quote
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
              <span>Zero Wall Damage</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>5-Minute Install</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Take With You When Moving</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Free Shipping on eligible orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Beautiful Blinds, Zero Holes in Your Walls
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Living in an apartment shouldn't mean living with ugly windows. But most landlords
                  don't allow drilling, and you don't want to lose your security deposit.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  <strong>Our no-drill blinds solve this problem.</strong> Using tension-mount,
                  adhesive, or magnetic hardware, you get custom-fit blinds that install in minutes
                  without touching your walls—and remove just as easily when you move.
                </p>
                <ul className="space-y-3">
                  {['No tools required', 'No landlord approval needed', 'Removes cleanly—get your deposit back', 'Same quality as drill-mount blinds'].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-red-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">🏢</div>
                  <p className="text-gray-500">Apartment Living Made Easy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Renters Love No-Drill Blinds
            </h2>
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

      {/* Mounting Options */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Mounting Method
            </h2>
            <p className="text-xl text-gray-600">
              Multiple options to fit any window situation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {mountingOptions.map((option, index) => (
              <div key={index} className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{option.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{option.name}</h3>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <ul className="space-y-2">
                  {option.pros.map((pro, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-600" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Types */}
      <section className="py-16 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Available in All Popular Styles
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Roller Shades', icon: '🪟', link: '/products?category=8' },
              { name: 'Cellular Shades', icon: '🏠', link: '/products?category=7' },
              { name: 'Mini Blinds', icon: '📏', link: '/products?category=1' },
              { name: 'Roman Shades', icon: '🎭', link: '/products?category=4' },
            ].map((product, index) => (
              <Link
                key={index}
                href={product.link}
                className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-3">{product.icon}</div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Install in 3 Easy Steps
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Measure', description: 'Measure your window width and height. Our blinds come ready to install.' },
                { step: '2', title: 'Position', description: 'Hold the brackets in place and adjust tension or apply adhesive strips.' },
                { step: '3', title: 'Hang', description: 'Snap in your blinds and you\'re done! The whole process takes about 5 minutes.' },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
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
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Upgrade Your Apartment Windows?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Get custom no-drill blinds delivered to your door.
            Free shipping on orders over $100.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="outline" className="bg-white text-red-600 hover:bg-red-50 border-white" asChild>
              <Link href="/products?features=no-drill">
                Shop No-Drill Blinds
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
