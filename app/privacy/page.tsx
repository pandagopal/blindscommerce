'use client';

import Link from 'next/link';
import { Shield, Eye, Lock, FileText, Mail, Phone } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      title: 'Information We Collect',
      content: [
        'Personal Information: Name, email address, phone number, shipping and billing addresses when you make purchases or request consultations.',
        'Payment Information: Credit card details and billing information processed securely through our payment processors.',
        'Account Information: Username, password, and preferences when you create an account with us.',
        'Communication Data: Records of your communications with our customer service team and consultation requests.',
        'Usage Data: Information about how you use our website, including pages visited, time spent, and interactions.',
        'Device Information: IP address, browser type, operating system, and device identifiers when you visit our website.'
      ]
    },
    {
      title: 'How We Use Your Information',
      content: [
        'Order Processing: To process your orders, arrange consultations, and provide customer service.',
        'Communication: To respond to your inquiries, send order updates, and provide customer support.',
        'Service Improvement: To improve our website functionality, product offerings, and customer experience.',
        'Marketing: To send promotional emails and offers (with your consent and option to unsubscribe).',
        'Legal Compliance: To comply with applicable laws, regulations, and legal processes.',
        'Security: To protect against fraud, unauthorized access, and other security threats.'
      ]
    },
    {
      title: 'Information Sharing',
      content: [
        'Service Providers: We share information with trusted third parties who help us operate our business, including payment processors, shipping companies, and installation contractors.',
        'Legal Requirements: We may disclose information when required by law, court order, or to protect our rights and safety.',
        'Business Transfers: Information may be transferred in connection with mergers, acquisitions, or other business transactions.',
        'Consent: We may share information with your explicit consent for specific purposes.',
        'We do not sell, rent, or trade your personal information to third parties for their marketing purposes.'
      ]
    },
    {
      title: 'Data Security',
      content: [
        'Encryption: All sensitive data is encrypted during transmission using SSL/TLS technology.',
        'Secure Storage: Personal information is stored on secure servers with restricted access.',
        'Payment Security: We use PCI-compliant payment processors and do not store credit card information.',
        'Access Controls: Strict access controls limit who can view your personal information.',
        'Regular Updates: We regularly update our security measures to protect against emerging threats.',
        'While we implement strong security measures, no system is 100% secure, and we cannot guarantee absolute security.'
      ]
    },
    {
      title: 'Your Rights and Choices',
      content: [
        'Access: You can request access to the personal information we have about you.',
        'Correction: You can request correction of inaccurate or incomplete information.',
        'Deletion: You can request deletion of your personal information, subject to legal requirements.',
        'Portability: You can request a copy of your information in a portable format.',
        'Marketing Opt-out: You can unsubscribe from marketing emails at any time.',
        'Account Management: You can update your account information and preferences online.'
      ]
    },
    {
      title: 'Cookies and Tracking',
      content: [
        'Essential Cookies: Required for website functionality, including shopping cart and login features.',
        'Performance Cookies: Help us understand how visitors use our website to improve user experience.',
        'Marketing Cookies: Used to deliver relevant advertisements and track campaign effectiveness.',
        'Third-party Cookies: Some features may use third-party cookies from services like Google Analytics.',
        'Cookie Control: You can manage cookie preferences through your browser settings.',
        'Do Not Track: We respect browser "Do Not Track" signals where technically feasible.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary-red text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl mb-8 text-white/80 max-w-3xl mx-auto">
              Smart Blinds is committed to protecting your privacy and personal information. 
              This policy explains how we collect, use, and safeguard your data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <Shield className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Data Protection</h3>
                <p className="text-blue-100">Strong security measures to protect your information</p>
              </div>
              <div className="text-center">
                <Eye className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Transparency</h3>
                <p className="text-blue-100">Clear information about how we use your data</p>
              </div>
              <div className="text-center">
                <Lock className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your Control</h3>
                <p className="text-blue-100">Tools to manage your privacy preferences</p>
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

      {/* Introduction */}
      <div className="bg-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-3">Introduction</h2>
            <p className="text-blue-800">
              Smart Blinds ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, 
              use our services, or interact with us. Please read this policy carefully to understand our practices regarding your 
              personal data and how we will treat it.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Sections */}
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

      {/* Children's Privacy */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Children's Privacy</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 mb-4">
              <strong>Important:</strong> Our services are not intended for children under 13 years of age.
            </p>
            <p className="text-yellow-700">
              We do not knowingly collect personal information from children under 13. If you are a parent or guardian and 
              believe your child has provided us with personal information, please contact us immediately. If we become aware 
              that we have collected personal information from a child under 13 without parental consent, we will take steps 
              to remove that information from our servers.
            </p>
          </div>
        </div>
      </div>

      {/* International Users */}
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">International Users</h2>
          <p className="text-gray-700 mb-4">
            Smart Blinds is based in the United States and our services are primarily intended for users in the United States. 
            If you are accessing our website from outside the United States, please be aware that your information may be 
            transferred to, stored, and processed in the United States.
          </p>
          <p className="text-gray-700">
            By using our services, you consent to the transfer of your information to the United States and acknowledge that 
            U.S. privacy laws may be different from those in your country of residence.
          </p>
        </div>
      </div>

      {/* Changes to Policy */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, 
            or other factors. We will post the revised policy on this page and update the "Last Updated" date at the top of this policy.
          </p>
          <p className="text-gray-700 mb-4">
            We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information. 
            If we make material changes to this policy, we will notify you by email (if you have provided an email address) or 
            by posting a prominent notice on our website.
          </p>
          <p className="text-gray-700">
            Your continued use of our services after any changes to this Privacy Policy constitutes your acceptance of the revised policy.
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Questions About This Policy?
          </h2>
          <p className="text-center text-gray-600 mb-8">
            If you have questions about this Privacy Policy or our privacy practices, please contact us using the information below.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 text-center">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600 mb-4">Send us your privacy questions</p>
              <a 
                href="mailto:privacy@smartblinds.com"
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                privacy@smartblinds.com
              </a>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center">
              <Phone className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600 mb-4">Speak with our privacy team</p>
              <a 
                href="tel:+1-316-530-2635"
                className="text-green-600 font-medium hover:text-green-700"
              >
                (316) 530-2635
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Mailing Address</h3>
            <div className="text-center text-gray-700">
              <p>Smart Blinds Privacy Officer</p>
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
              href="/terms"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}