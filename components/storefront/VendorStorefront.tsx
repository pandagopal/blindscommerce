'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Menu, X, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface StorefrontData {
  storefrontId: number;
  vendorId: number;
  subdomain: string;
  customDomain: string | null;
  storefrontName: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  themeSettings: any;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  socialLinks: any;
  contactInfo: any;
  businessHours: any;
  isActive: boolean;
  isApproved: boolean;
  companyName: string;
}

interface VendorStorefrontProps {
  storefront: StorefrontData;
  children: React.ReactNode;
}

export default function VendorStorefront({ storefront, children }: VendorStorefrontProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Get CSS variable value at runtime
  const getPrimaryColor = () => {
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary-red').trim() || '#0071dc';
    }
    return '#0071dc';
  };

  // Default theme settings - uses CSS variable as fallback
  const theme = {
    primaryColor: getPrimaryColor(),
    secondaryColor: '#1F2937',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    ...storefront.themeSettings
  };

  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Custom CSS for theme */}
      <style jsx global>{`
        :root {
          --vendor-primary: ${theme.primaryColor};
          --vendor-secondary: ${theme.secondaryColor};
          --vendor-accent: ${theme.accentColor};
          --vendor-bg: ${theme.backgroundColor};
          --vendor-text: ${theme.textColor};
        }
        .vendor-primary { color: var(--vendor-primary) !important; }
        .vendor-bg-primary { background-color: var(--vendor-primary) !important; }
        .vendor-border-primary { border-color: var(--vendor-primary) !important; }
        .vendor-hover-primary:hover { background-color: var(--vendor-primary) !important; color: white !important; }
      `}</style>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        {/* Top Bar */}
        <div className="vendor-bg-primary text-white">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                {storefront.contactInfo?.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>{storefront.contactInfo.phone}</span>
                  </div>
                )}
                {storefront.contactInfo?.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{storefront.contactInfo.email}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {storefront.businessHours?.display && (
                  <span>{storefront.businessHours.display}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Store Name */}
            <Link href="/" className="flex items-center space-x-3">
              {storefront.logoUrl ? (
                <Image
                  src={storefront.logoUrl}
                  alt={storefront.storefrontName}
                  width={50}
                  height={50}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg vendor-bg-primary text-white font-bold text-lg">
                  {storefront.storefrontName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold vendor-primary">{storefront.storefrontName}</h1>
                {storefront.description && (
                  <p className="text-sm text-gray-600">{storefront.description}</p>
                )}
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors vendor-hover-primary px-3 py-2 rounded-md"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>

              {/* Cart */}
              <Button variant="outline" size="sm" className="vendor-border-primary vendor-hover-primary">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart (0)
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Mobile Search */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="search"
                        placeholder="Search products..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="space-y-4">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block text-gray-700 hover:text-gray-900 font-medium py-2 vendor-hover-primary px-3 rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Banner Image */}
      {storefront.bannerUrl && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <Image
            src={storefront.bannerUrl}
            alt={`${storefront.storefrontName} banner`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {storefront.storefrontName}
              </h2>
              {storefront.description && (
                <p className="text-lg md:text-xl max-w-2xl mx-auto">
                  {storefront.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="vendor-bg-primary text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Store Info */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">{storefront.storefrontName}</h3>
              <p className="text-gray-200 mb-4">
                {storefront.description || `Premium blinds and window treatments from ${storefront.storefrontName}`}
              </p>
              {storefront.contactInfo && (
                <div className="space-y-2">
                  {storefront.contactInfo.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{storefront.contactInfo.address}</span>
                    </div>
                  )}
                  {storefront.contactInfo.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{storefront.contactInfo.phone}</span>
                    </div>
                  )}
                  {storefront.contactInfo.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{storefront.contactInfo.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-gray-200 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Business Hours */}
            {storefront.businessHours && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Business Hours</h4>
                <div className="text-gray-200 text-sm space-y-1">
                  {Object.entries(storefront.businessHours).map(([day, hours]) => (
                    day !== 'display' && (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day}:</span>
                        <span>{hours as string}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-200">
            <p>&copy; 2024 {storefront.storefrontName}. All rights reserved.</p>
            <p className="text-sm mt-2">
              Powered by <Link href="/" className="hover:text-white">BlindsCommerce</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}