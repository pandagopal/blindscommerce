'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Book, MessageSquare, Phone, Mail, ChevronDown, ChevronUp, HelpCircle, FileText, Wrench, Package } from 'lucide-react';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const helpCategories = [
    {
      icon: <Package className="h-8 w-8 text-primary-red" />,
      title: 'Orders & Products',
      description: 'Track orders, product information, and purchasing help',
      links: [
        { title: 'Track Your Order', href: '/account/orders' },
        { title: 'Product Catalog', href: '/products' },
        { title: 'Size Guide', href: '/help/sizing' },
        { title: 'Return Policy', href: '/help/returns' }
      ]
    },
    {
      icon: <Wrench className="h-8 w-8 text-green-600" />,
      title: 'Installation & Setup',
      description: 'Installation guides, troubleshooting, and maintenance',
      links: [
        { title: 'Installation Videos', href: '/help/installation' },
        { title: 'Measurement Guide', href: '/help/measuring' },
        { title: 'Troubleshooting', href: '/help/troubleshooting' },
        { title: 'Maintenance Tips', href: '/help/maintenance' }
      ]
    },
    {
      icon: <FileText className="h-8 w-8 text-primary-red" />,
      title: 'Account & Billing',
      description: 'Account management, billing, and payment questions',
      links: [
        { title: 'Manage Account', href: '/account' },
        { title: 'Payment Methods', href: '/help/payment' },
        { title: 'Billing Questions', href: '/help/billing' },
        { title: 'Warranty Claims', href: '/warranty' }
      ]
    },
    {
      icon: <HelpCircle className="h-8 w-8 text-primary-red" />,
      title: 'General Support',
      description: 'Contact options, policies, and general information',
      links: [
        { title: 'Contact Us', href: '/contact' },
        { title: 'Privacy Policy', href: '/privacy' },
        { title: 'Terms of Service', href: '/terms' },
        { title: 'About Smart Blinds', href: '/about' }
      ]
    }
  ];

  const faqItems = [
    {
      question: 'How do I measure my windows for custom blinds?',
      answer: 'Proper measurement is crucial for a perfect fit. Measure the width at three points (top, middle, bottom) and use the smallest measurement. For height, measure at three points (left, middle, right) and use the longest measurement. Our installation team provides professional measuring services to ensure accuracy.'
    },
    {
      question: 'How long does it take to receive my custom order?',
      answer: 'Custom window treatments typically take 3-6 weeks to manufacture and deliver, depending on the product type and complexity. Rush orders may be available for an additional fee. We\'ll provide you with a specific timeline when you place your order.'
    },
    {
      question: 'Do you offer installation services?',
      answer: 'Yes! We provide professional installation services throughout Washington and the Washington City metro area. Our certified installers ensure your window treatments are mounted correctly and function properly. Installation is included with most orders.'
    },
    {
      question: 'What if my blinds don\'t fit properly?',
      answer: 'If your blinds don\'t fit due to a measuring error on our part, we\'ll remake them at no charge. If it\'s due to incorrect measurements provided by the customer, we offer remake services at a reduced cost. This is why we recommend our professional measuring service.'
    },
    {
      question: 'Can I return custom-made products?',
      answer: 'Custom-made window treatments are typically non-returnable since they\'re made specifically for your windows. However, we will remake or refund products that don\'t meet our quality standards or don\'t match your order specifications.'
    },
    {
      question: 'How do I clean and maintain my window treatments?',
      answer: 'Maintenance varies by product type. Most blinds can be dusted regularly and cleaned with a damp cloth. Fabric shades may require professional cleaning. We provide specific care instructions with each product and offer maintenance services.'
    },
    {
      question: 'Do you offer motorized window treatments?',
      answer: 'Yes! We offer a full range of motorized blinds and shades with remote control, smartphone app control, and smart home integration. Motorization is available for most of our product lines.'
    },
    {
      question: 'What warranty coverage do you provide?',
      answer: 'We offer different warranty levels depending on the product. Premium products like wood shutters come with lifetime warranties, while most other products have 5-10 year warranties covering manufacturing defects and hardware failures.'
    },
    {
      question: 'Can I get samples before ordering?',
      answer: 'Absolutely! We offer free samples of most materials so you can see and feel the quality before ordering. You can order up to 8 samples through our website, and they\'ll be delivered within 3-5 business days.'
    },
    {
      question: 'Do you work with interior designers and contractors?',
      answer: 'Yes, we have a professional trade program for interior designers, contractors, and builders. We offer volume pricing, project management services, and dedicated support for trade professionals.'
    }
  ];

  const filteredFaqs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary-red text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              How Can We Help You?
            </h1>
            <p className="text-xl mb-8 text-white/80 max-w-3xl mx-auto">
              Find answers to common questions, browse our help resources, or contact our support team. 
              We're here to help you every step of the way.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for help topics, products, or questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contact Options */}
      <div className="bg-white py-12 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Phone className="h-12 w-12 text-primary-red mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Support</h3>
              <p className="text-gray-600 mb-4">Speak with our experts</p>
              <a 
                href="tel:+1-316-530-2635"
                className="bg-primary-red text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors inline-block"
              >
                (316) 530-2635
              </a>
            </div>
            <div className="text-center">
              <Mail className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Send us your questions</p>
              <a 
                href="mailto:support@smartblinds.com"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
              >
                Email Us
              </a>
            </div>
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-primary-red mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with us online</p>
              <button className="bg-primary-red text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors">
                Start Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Categories */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Browse Help Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {helpCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                {category.icon}
                <h3 className="text-xl font-bold text-gray-900 ml-3">{category.title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{category.description}</p>
              <div className="space-y-2">
                {category.links.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    className="block text-primary-red hover:text-primary-dark hover:underline"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          {searchTerm && (
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchTerm}"
              </p>
            </div>
          )}

          <div className="space-y-4">
            {filteredFaqs.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No results found for "{searchTerm}"</p>
              <p className="text-gray-500">Try different keywords or contact our support team for assistance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Popular Resources */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/help/measuring" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <Book className="h-12 w-12 text-primary-red mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Measuring Guide</h3>
              <p className="text-gray-600">Step-by-step instructions for accurate window measurements</p>
            </Link>
            
            <Link href="/help/installation" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <Wrench className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Installation Videos</h3>
              <p className="text-gray-600">Watch our professional installers demonstrate proper techniques</p>
            </Link>
            
            <Link href="/help/care" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <HelpCircle className="h-12 w-12 text-primary-red mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Care & Maintenance</h3>
              <p className="text-gray-600">Keep your window treatments looking their best</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Support Hours */}
      <div className="bg-red-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Support Hours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Phone & Chat Support</h3>
              <p className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM CST</p>
              <p className="text-gray-600">Saturday: 9:00 AM - 4:00 PM CST</p>
              <p className="text-gray-600">Sunday: Closed</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600">8:00AM (PST) to 7:00PM (PST) submission available</p>
              <p className="text-gray-600">Response within 24 hours</p>
              <p className="text-gray-600">Emergency support available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Still Need Help CTA */}
      <div className="bg-gradient-to-r from-primary-red to-primary-dark text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Still Need Help?
          </h2>
          <p className="text-xl mb-8 text-red-100">
            Our support team is ready to assist you with any questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-primary-red px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/consultation"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-red transition-colors"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}