'use client';

import Link from 'next/link';
import { Shield, Clock, CheckCircle, Phone, Mail, FileText, Award, Users, Wrench } from 'lucide-react';

export default function WarrantyPage() {
  const warrantyPlans = [
    {
      name: 'Lifetime Warranty',
      description: 'Premium coverage for wood shutters and select products',
      coverage: [
        'Manufacturing defects',
        'Material warping or cracking',
        'Hardware failure',
        'Color fading (indoor use)',
        'Cord and chain mechanisms'
      ],
      duration: 'Lifetime of product',
      icon: <Award className="h-8 w-8 text-gold-500" />
    },
    {
      name: '10-Year Limited Warranty',
      description: 'Comprehensive coverage for most window treatments',
      coverage: [
        'Manufacturing defects',
        'Material breakdown',
        'Operating mechanism failure',
        'Hardware defects',
        'Installation-related issues'
      ],
      duration: '10 years from purchase',
      icon: <Shield className="h-8 w-8 text-red-500" />
    },
    {
      name: '5-Year Basic Warranty',
      description: 'Essential protection for all Smart Blinds products',
      coverage: [
        'Manufacturing defects',
        'Material defects',
        'Basic hardware issues',
        'Installation problems',
        'Customer service support'
      ],
      duration: '5 years from purchase',
      icon: <CheckCircle className="h-8 w-8 text-red-500" />
    }
  ];

  const warrantyProcess = [
    {
      step: 1,
      title: 'Contact Customer Service',
      description: 'Call or email our warranty team with your concern',
      icon: <Phone className="h-6 w-6" />
    },
    {
      step: 2,
      title: 'Product Assessment',
      description: 'We evaluate your warranty claim and product condition',
      icon: <FileText className="h-6 w-6" />
    },
    {
      step: 3,
      title: 'Resolution Options',
      description: 'Repair, replacement, or credit based on warranty terms',
      icon: <Wrench className="h-6 w-6" />
    },
    {
      step: 4,
      title: 'Service Completion',
      description: 'Fast resolution to get your windows working perfectly',
      icon: <CheckCircle className="h-6 w-6" />
    }
  ];

  const faqItems = [
    {
      question: 'What does the lifetime warranty cover?',
      answer: 'Our lifetime warranty covers manufacturing defects, material warping, hardware failure, and normal wear issues for wood shutters and select premium products. It does not cover damage from misuse, accidents, or normal wear from pets or children.'
    },
    {
      question: 'How do I file a warranty claim?',
      answer: 'Contact our customer service team at (316) 530-2635 or email warranty@smartblinds.com with your order number, photos of the issue, and description of the problem. We\'ll guide you through the process.'
    },
    {
      question: 'Is professional installation covered?',
      answer: 'Yes! Installation-related issues are covered under warranty when installed by Smart Blinds certified installers. This includes mounting problems, measurement errors, and installation defects.'
    },
    {
      question: 'What about motorized products?',
      answer: 'Motorized window treatments have a 5-year warranty on motors and electronic components, plus the standard product warranty on materials and mechanisms.'
    },
    {
      question: 'Does the warranty transfer to new homeowners?',
      answer: 'Yes, our warranties are transferable to new homeowners with proper documentation. The warranty period continues from the original purchase date.'
    },
    {
      question: 'What is not covered by warranty?',
      answer: 'Normal wear from daily use, damage from pets or children, improper cleaning, modification of products, or damage from extreme weather conditions are not covered.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-900 to-red-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Smart Blinds Warranty Protection
            </h1>
            <p className="text-xl mb-8 text-red-100 max-w-3xl mx-auto">
              We stand behind every product with comprehensive warranty coverage. 
              From lifetime protection on premium shutters to 5-year coverage on all products, 
              your investment is protected.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <Shield className="h-12 w-12 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comprehensive Coverage</h3>
                <p className="text-red-100">Protection against manufacturing defects and material failures</p>
              </div>
              <div className="text-center">
                <Clock className="h-12 w-12 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fast Resolution</h3>
                <p className="text-red-100">Quick warranty claims processing and service</p>
              </div>
              <div className="text-center">
                <Users className="h-12 w-12 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Expert Support</h3>
                <p className="text-red-100">Dedicated warranty team ready to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warranty Plans */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Warranty Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every Smart Blinds product comes with warranty protection tailored to the product type and quality level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {warrantyPlans.map((plan, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary-red to-primary-dark text-white p-6 text-center">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-red-100">{plan.description}</p>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Coverage Includes:</h4>
                  <ul className="space-y-2">
                    {plan.coverage.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">{plan.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warranty Process */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple Warranty Claims Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {warrantyProcess.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need Warranty Support?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Our warranty team is ready to help with any questions or claims.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/10 rounded-lg p-6">
              <Phone className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Call Us</h3>
              <p className="text-gray-300 mb-4">Speak directly with our warranty specialists</p>
              <a 
                href="tel:+1-316-530-2635"
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors inline-block"
              >
                (316) 530-2635
              </a>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <Mail className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="text-gray-300 mb-4">Send us your warranty claim details</p>
              <a 
                href="mailto:warranty@smartblinds.com"
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors inline-block"
              >
                warranty@smartblinds.com
              </a>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Warranty hours: Monday-Friday 8AM-6PM CST, Saturday 9AM-4PM CST
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Warranty FAQ
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Registration CTA */}
      <div className="bg-red-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Register Your Products
          </h2>
          <p className="text-xl mb-8 text-red-100">
            Register your Smart Blinds products to ensure full warranty coverage and faster service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account/products/register"
              className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Register Products
            </Link>
            <Link
              href="/consultation"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
            >
              Schedule Service Call
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Benefits */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Additional Warranty Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Wrench className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free Repairs</h3>
              <p className="text-gray-600">
                Covered repairs are performed at no cost, including parts and labor.
              </p>
            </div>
            <div className="text-center">
              <Clock className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Turnaround</h3>
              <p className="text-gray-600">
                Most warranty claims are resolved within 5-7 business days.
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-primary-red mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Satisfaction Guarantee</h3>
              <p className="text-gray-600">
                If we can't fix it under warranty, we'll replace it or provide store credit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}