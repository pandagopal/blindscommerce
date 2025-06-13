'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Edit, Eye, Plus, Store, Globe, Settings, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface StorefrontData {
  storefrontId: number;
  subdomain: string;
  storefrontName: string;
  description: string;
  isActive: boolean;
  isApproved: boolean;
  url: string;
}

export default function VendorStorefrontPage() {
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStorefront, setHasStorefront] = useState(false);
  const [vendorCompanyName, setVendorCompanyName] = useState<string>('');

  useEffect(() => {
    fetchStorefront();
  }, []);

  const fetchStorefront = async () => {
    try {
      // Get vendor profile first to get company name
      const profileRes = await fetch('/api/vendor/profile');
      let companyName = 'Your Company';
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        companyName = profileData.profile?.businessName || 'Your Company';
        setVendorCompanyName(companyName);
      }

      // Get storefront data
      const res = await fetch('/api/vendor/storefront');
      const data = await res.json();
      
      if (res.ok && data.hasStorefront) {
        setStorefront({
          storefrontId: data.storefront.storefrontId,
          subdomain: data.storefront.subdomain,
          storefrontName: data.storefront.storefrontName,
          description: data.storefront.description,
          isActive: data.storefront.isActive,
          isApproved: data.storefront.isApproved,
          url: `/storefront/${data.storefront.subdomain}`
        });
        setHasStorefront(true);
      } else {
        setHasStorefront(false);
      }
    } catch (error) {
      console.error('Error fetching storefront:', error);
      setHasStorefront(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (!hasStorefront) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <Store className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Create {vendorCompanyName} Storefront</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Set up your own branded storefront for {vendorCompanyName} to showcase your products and reach more customers.
          </p>
          <button
            onClick={() => {/* TODO: Open create storefront modal */}}
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Storefront
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Custom Domain</h3>
            <p className="text-gray-600 text-sm">
              Get your own subdomain like {vendorCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.blindscommerce.com
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Full Customization</h3>
            <p className="text-gray-600 text-sm">
              Customize colors, logos, and content to match your brand
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Store className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Your Products</h3>
            <p className="text-gray-600 text-sm">
              All your products automatically displayed in your storefront
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Storefront</h1>
          <p className="text-gray-600">Manage your branded storefront and customer experience</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={storefront.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Link>
          <button
            onClick={() => {/* TODO: Open edit storefront modal */}}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Storefront
          </button>
        </div>
      </div>

      {/* Storefront Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <Store className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{storefront.storefrontName}</h3>
              <p className="text-gray-600">{storefront.description}</p>
              <div className="flex items-center mt-2 space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  storefront.isApproved 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {storefront.isApproved ? 'Approved' : 'Pending Approval'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  storefront.isActive 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {storefront.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Your Storefront URL</p>
            <Link
              href={storefront.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              {window.location.origin}{storefront.url}
              <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={storefront.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors group"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Preview Storefront</h3>
          <p className="text-sm text-gray-600">See how your storefront looks to customers</p>
        </Link>

        <button
          onClick={() => {/* TODO: Open edit modal */}}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors group text-left"
        >
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
            <Edit className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Edit Details</h3>
          <p className="text-sm text-gray-600">Update name, description, and branding</p>
        </button>

        <Link
          href="/vendor/products"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors group"
        >
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
            <ShoppingBag className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Manage Products</h3>
          <p className="text-sm text-gray-600">Add and edit products in your catalog</p>
        </Link>

        <button
          onClick={() => {/* TODO: Open settings modal */}}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors group text-left"
        >
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Settings</h3>
          <p className="text-sm text-gray-600">Configure SEO, themes, and advanced options</p>
        </button>
      </div>
    </div>
  );
}