'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';

interface CompanyInfo {
  emergencyHotline: string;
  salesEmail: string;
  supportEmail: string;
}

export default function SalesSupportPage() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    emergencyHotline: '1-800-BLINDS',
    salesEmail: 'sales@smartblindshub.com',
    supportEmail: 'support@smartblindshub.com'
  });

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company-info');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.companyInfo) {
            setCompanyInfo({
              emergencyHotline: data.companyInfo.emergencyHotline || '1-800-BLINDS',
              salesEmail: data.companyInfo.salesEmail || 'sales@smartblindshub.com',
              supportEmail: data.companyInfo.supportEmail || 'support@smartblindshub.com'
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch company info:', error);
      }
    };

    fetchCompanyInfo();
  }, []);
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales Support</h1>
        <p className="text-gray-600 mt-2">Get help and resources for your sales activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Knowledge Base */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Knowledge Base</h2>
          <p className="text-gray-600 mb-4">
            Find answers to common questions and learn best practices
          </p>
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
            Browse Articles →
          </a>
        </div>

        {/* Training Resources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Training Resources</h2>
          <p className="text-gray-600 mb-4">
            Access training videos and sales documentation
          </p>
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
            View Resources →
          </a>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Contact Support</h2>
          <p className="text-gray-600 mb-4">
            Need help? Reach out to our support team
          </p>
          <a href="mailto:sales-support@smartblindshub.com" className="text-purple-600 hover:text-purple-700 font-medium">
            Email Support →
          </a>
        </div>

        {/* Product Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Product Information</h2>
          <p className="text-gray-600 mb-4">
            Detailed product specs and selling points
          </p>
          <a href="/products" className="text-purple-600 hover:text-purple-700 font-medium">
            View Products →
          </a>
        </div>

        {/* Sales Tools */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Sales Tools</h2>
          <p className="text-gray-600 mb-4">
            Calculators, configurators, and other tools
          </p>
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
            Access Tools →
          </a>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Frequently Asked Questions</h2>
          <p className="text-gray-600 mb-4">
            Quick answers to common sales questions
          </p>
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
            View FAQ →
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Sales Resources</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• <a href="#" className="hover:text-purple-600">Commission Structure</a></li>
              <li>• <a href="#" className="hover:text-purple-600">Sales Policies</a></li>
              <li>• <a href="#" className="hover:text-purple-600">Territory Maps</a></li>
              <li>• <a href="#" className="hover:text-purple-600">Lead Management Guide</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Support Contacts</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Sales Support: <a href={`mailto:${companyInfo.salesEmail}`} className="hover:text-purple-600">{companyInfo.salesEmail}</a></li>
              <li>• Technical Support: <a href={`mailto:${companyInfo.supportEmail}`} className="hover:text-purple-600">{companyInfo.supportEmail}</a></li>
              <li>• Emergency Hotline: <span className="font-mono">{companyInfo.emergencyHotline}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}