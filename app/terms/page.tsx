'use client';

import Link from 'next/link';
import { FileText, Scale, Shield, AlertTriangle, Mail, Phone } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: [
        'By accessing and using the Smart Blinds website and services, you accept and agree to be bound by the terms and provision of this agreement.',
        'If you do not agree to abide by the above, please do not use this service.',
        'These terms apply to all visitors, users, and others who access or use our services.',
        'We reserve the right to update these terms at any time without prior notice.'
      ]
    },
    {
      title: 'Use License',
      content: [
        'Permission is granted to temporarily access our website for personal, non-commercial transitory viewing only.',
        'This license does not include the right to download, copy, modify, or distribute any portion of our website without our express written consent.',
        'You may not use our website for any commercial purpose without written authorization.',
        'This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.'
      ]
    },
    {
      title: 'Product Information and Pricing',
      content: [
        'We strive to provide accurate product descriptions, specifications, and pricing information.',
        'However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.',
        'Prices are subject to change without notice and are displayed in U.S. dollars.',
        'We reserve the right to limit quantities of products offered and to discontinue products at any time.',
        'Color representations are approximate and may vary from actual products due to monitor and device differences.'
      ]
    },
    {
      title: 'Order Acceptance and Payment',
      content: [
        'All orders are subject to acceptance by Smart Blinds and availability of products.',
        'We reserve the right to refuse or cancel any order for any reason at any time.',
        'Payment must be received before products are manufactured or shipped.',
        'We accept major credit cards and other payment methods as displayed during checkout.',
        'All payments are processed securely through encrypted payment systems.'
      ]
    },
    {
      title: 'Custom Products and Returns',
      content: [
        'Custom-made window treatments are manufactured specifically for your order and are generally non-returnable.',
        'Standard products may be returned within 30 days of delivery in original condition.',
        'Return shipping costs are the responsibility of the customer unless the return is due to our error.',
        'Refunds will be processed within 5-10 business days after we receive and inspect returned items.',
        'Installation services are final and non-refundable once completed to satisfaction.'
      ]
    },
    {
      title: 'Installation Services',
      content: [
        'Installation services are provided by certified Smart Blinds installers or authorized contractors.',
        'Installation appointments must be scheduled in advance and are subject to availability.',
        'Customer must be present during installation and provide reasonable access to installation areas.',
        'Any modifications to installation plans may result in additional charges.',
        'Installation warranty covers workmanship for one year from completion date.'
      ]
    },
    {
      title: 'Warranties and Disclaimers',
      content: [
        'Product warranties are provided by manufacturers and vary by product type and brand.',
        'Smart Blinds provides additional service warranties as specified in individual product descriptions.',
        'We disclaim all warranties not expressly stated, including implied warranties of merchantability and fitness for particular purpose.',
        'Our liability is limited to the purchase price of products or services.',
        'We are not responsible for damages resulting from improper use, maintenance, or installation by non-authorized personnel.'
      ]
    },
    {
      title: 'Privacy and Data Protection',
      content: [
        'Your privacy is important to us. Please review our Privacy Policy for information about data collection and use.',
        'We collect only necessary information to process orders and provide services.',
        'Personal information is not shared with third parties except as necessary to fulfill orders.',
        'You have the right to access, correct, or delete your personal information.',
        'We implement appropriate security measures to protect your personal data.'
      ]
    },
    {
      title: 'Limitation of Liability',
      content: [
        'Smart Blinds shall not be liable for any indirect, incidental, special, consequential, or punitive damages.',
        'Our total liability shall not exceed the amount paid for the specific product or service giving rise to the claim.',
        'We are not responsible for delays or failures due to circumstances beyond our control.',
        'Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.',
        'These limitations apply regardless of the legal theory on which the claim is based.'
      ]
    },
    {
      title: 'Intellectual Property',
      content: [
        'All content on our website, including text, graphics, logos, and images, is owned by Smart Blinds or our licensors.',
        'Our trademarks and trade names may not be used without our express written permission.',
        'Unauthorized use of our intellectual property may result in legal action.',
        'You may not reproduce, distribute, or create derivative works from our content.',
        'Customer reviews and submissions become our property and may be used for marketing purposes.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
              These terms and conditions govern your use of Smart Blinds services and products. 
              Please read them carefully before using our website or making any purchases.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Clear Terms</h3>
                <p className="text-blue-100">Straightforward terms that protect both parties</p>
              </div>
              <div className="text-center">
                <Scale className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fair Policies</h3>
                <p className="text-blue-100">Reasonable policies for products and services</p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your Rights</h3>
                <p className="text-blue-100">Clear information about your rights and protections</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-600">
            <strong>Last Updated:</strong> January 15, 2024
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-amber-900 mb-2">Important Notice</h2>
                <p className="text-amber-800">
                  By using Smart Blinds' website, products, or services, you agree to these terms of service. 
                  If you do not agree with any part of these terms, please do not use our services. 
                  For questions about these terms, please contact our customer service team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Sections */}
      <div className="bg-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.title}</h2>
                <div className="space-y-4">
                  {section.content.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Governing Law */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Governing Law and Disputes</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800 mb-4">
              <strong>Governing Law:</strong> These terms shall be governed by and construed in accordance with the laws of the State of Washington, 
              without regard to its conflict of law provisions.
            </p>
            <p className="text-blue-800 mb-4">
              <strong>Dispute Resolution:</strong> Any disputes arising from these terms or your use of our services shall be resolved through 
              binding arbitration in Redmond, Washington, in accordance with the rules of the American Arbitration Association.
            </p>
            <p className="text-blue-800">
              <strong>Jurisdiction:</strong> You agree to submit to the personal jurisdiction of the courts located in Sedgwick County, Washington, 
              for any actions not subject to arbitration.
            </p>
          </div>
        </div>
      </div>

      {/* Severability */}
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Severability and Contact</h2>
          <p className="text-gray-700 mb-4">
            If any provision of these terms is found to be unenforceable or invalid under any applicable law, such unenforceability 
            or invalidity shall not render these terms unenforceable or invalid as a whole. Such provisions shall be deleted without 
            affecting the remaining provisions.
          </p>
          <p className="text-gray-700 mb-4">
            These terms constitute the entire agreement between you and Smart Blinds regarding the use of our services and supersede 
            all prior and contemporaneous written or oral agreements.
          </p>
          <p className="text-gray-700">
            Our failure to enforce any provision of these terms shall not be deemed a waiver of such provision nor the right to 
            enforce such provision.
          </p>
        </div>
      </div>

      {/* Changes to Terms */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes to Terms</h2>
          <p className="text-gray-700 mb-4">
            Smart Blinds reserves the right to modify these terms at any time. Changes will be effective immediately upon posting 
            on our website. We will update the "Last Updated" date at the top of this page when changes are made.
          </p>
          <p className="text-gray-700 mb-4">
            We encourage you to review these terms periodically to stay informed of any updates. Your continued use of our services 
            after any changes constitutes acceptance of the new terms.
          </p>
          <p className="text-gray-700">
            If we make material changes to these terms, we will notify you by email (if you have provided an email address) or 
            by posting a prominent notice on our website.
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Questions About These Terms?
          </h2>
          <p className="text-center text-gray-600 mb-8">
            If you have questions about these Terms of Service, please contact us using the information below.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 text-center">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Send us your legal questions</p>
              <a 
                href="mailto:legal@smartblinds.com"
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                legal@smartblinds.com
              </a>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center">
              <Phone className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Service</h3>
              <p className="text-gray-600 mb-4">Speak with our team</p>
              <a 
                href="tel:+1-316-530-2635"
                className="text-green-600 font-medium hover:text-green-700"
              >
                (316) 530-2635
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Legal Department</h3>
            <div className="text-center text-gray-700">
              <p>Smart Blinds Legal Team</p>
              <p>1234 Window Way</p>
              <p>Redmond, KS 67202</p>
              <p>United States</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Links */}
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Related Information</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/privacy"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/warranty"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Warranty Information
            </Link>
            <Link
              href="/contact"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}