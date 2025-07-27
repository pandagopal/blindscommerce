'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Star, Shield, Home, Phone, Ruler } from 'lucide-react';

export default function ShuttersPage() {
  const [selectedMaterial, setSelectedMaterial] = useState('all');

  const shutterTypes = [
    {
      id: 'plantation-wood',
      name: 'Wood Plantation Shutters',
      description: 'Premium hardwood shutters for timeless elegance',
      image: '/images/shutters/wood-plantation.jpg',
      features: ['Real Wood', 'Custom Staining', 'Superior Insulation'],
      priceRange: '$350 - $650',
      material: 'wood',
      durability: 'Excellent',
      maintenance: 'Medium'
    },
    {
      id: 'composite-shutters',
      name: 'Composite Shutters',
      description: 'Moisture-resistant shutters perfect for kitchens and baths',
      image: '/images/shutters/composite.jpg',
      features: ['Moisture Resistant', 'Durable', 'Easy Clean'],
      priceRange: '$280 - $480',
      material: 'composite',
      durability: 'Excellent',
      maintenance: 'Low'
    },
    {
      id: 'vinyl-shutters',
      name: 'Vinyl Shutters',
      description: 'Affordable, durable shutters for any room',
      image: '/images/shutters/vinyl.jpg',
      features: ['Affordable', 'Easy Maintenance', 'Fade Resistant'],
      priceRange: '$180 - $320',
      material: 'vinyl',
      durability: 'Good',
      maintenance: 'Very Low'
    },
    {
      id: 'aluminum-shutters',
      name: 'Aluminum Shutters',
      description: 'Lightweight, rust-proof shutters for modern homes',
      image: '/images/shutters/aluminum.jpg',
      features: ['Rust Proof', 'Lightweight', 'Modern Look'],
      priceRange: '$220 - $420',
      material: 'aluminum',
      durability: 'Excellent',
      maintenance: 'Very Low'
    }
  ];

  const benefits = [
    {
      icon: <Home className="h-8 w-8 text-blue-600" />,
      title: 'Increase Home Value',
      description: 'Add 5-10% to your home value with custom shutters'
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: 'Superior Insulation',
      description: 'Reduce energy costs by up to 30% year-round'
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-500" />,
      title: 'Lifetime Beauty',
      description: 'Timeless style that never goes out of fashion'
    }
  ];

  const features = [
    'Custom measured and manufactured',
    'Professional installation included',
    'Lifetime warranty on materials',
    '1-8 week delivery window',
    'Child-safe tilt rod options',
    'Multiple louver sizes available'
  ];

  const filteredShutters = selectedMaterial === 'all' 
    ? shutterTypes 
    : shutterTypes.filter(shutter => shutter.material === selectedMaterial);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">
                Custom Plantation Shutters
              </h1>
              <p className="text-xl mb-8 text-orange-100">
                Transform your home with our premium plantation shutters. Handcrafted 
                for perfect fit, superior light control, and timeless elegance that 
                increases your home's value.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/products?category=12"
                  className="bg-white text-orange-900 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-center"
                >
                  Shop Shutters
                </Link>
                <Link 
                  href="/measure-install"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-900 transition-colors text-center"
                >
                  Free Measure
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Smart Blinds Advantage</h3>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <ChevronRight className="h-5 w-5 text-orange-300 mr-3 flex-shrink-0" />
                      <span className="text-orange-100">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Showcase */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Shutter Material
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From classic wood to modern composites, we offer the perfect shutter 
            material for every room, style, and budget.
          </p>
        </div>

        {/* Material Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedMaterial('all')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              selectedMaterial === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Materials
          </button>
          <button
            onClick={() => setSelectedMaterial('wood')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              selectedMaterial === 'wood'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Wood
          </button>
          <button
            onClick={() => setSelectedMaterial('composite')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              selectedMaterial === 'composite'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Composite
          </button>
          <button
            onClick={() => setSelectedMaterial('vinyl')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              selectedMaterial === 'vinyl'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Vinyl
          </button>
        </div>

        {/* Shutter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredShutters.map((shutter) => (
            <div key={shutter.id} className="bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <div className="w-full h-64 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
                  <span className="text-orange-800 font-medium">{shutter.name}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{shutter.name}</h3>
                <p className="text-gray-600 mb-4">{shutter.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Durability:</span>
                    <span className="ml-2 text-gray-600">{shutter.durability}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Maintenance:</span>
                    <span className="ml-2 text-gray-600">{shutter.maintenance}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {shutter.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">{shutter.priceRange}</span>
                  <span className="text-sm text-gray-500">per sq ft</span>
                </div>
                
                <div className="space-y-2">
                  <Link
                    href={`/products?category=${shutter.material === 'wood' ? '14' : shutter.material === 'composite' ? '15' : '13'}`}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors text-center block"
                  >
                    Shop {shutter.name}
                  </Link>
                  <Link
                    href="/samples"
                    className="w-full border border-orange-600 text-orange-600 py-2 px-4 rounded-lg font-medium hover:bg-orange-50 transition-colors text-center block"
                  >
                    Get Free Sample
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Smart Blinds Plantation Shutters?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Feature Comparison */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Smart Blinds vs. Big Box Stores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-bold text-green-600 mb-4">✓ Smart Blinds Advantage</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Custom measured by professionals</li>
                  <li>• Premium materials and hardware</li>
                  <li>• Professional installation included</li>
                  <li>• Lifetime warranty coverage</li>
                  <li>• Expert design consultation</li>
                  <li>• Made in America quality</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold text-red-600 mb-4">✗ Big Box Limitations</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Self-measure (often inaccurate)</li>
                  <li>• Lower quality materials</li>
                  <li>• DIY installation only</li>
                  <li>• Limited warranty terms</li>
                  <li>• No design expertise</li>
                  <li>• Generic, one-size-fits-all</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="bg-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Simple 4-Step Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Free Consultation</h3>
              <p className="text-gray-600">Schedule your free in-home design consultation</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Professional Measure</h3>
              <p className="text-gray-600">Expert measurement for perfect fit</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Custom Manufacturing</h3>
              <p className="text-gray-600">Handcrafted to your exact specifications</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Expert Installation</h3>
              <p className="text-gray-600">Professional installation and final inspection</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready for Custom Plantation Shutters?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Schedule your free consultation today and discover why Smart Blinds is America's #1 choice for custom shutters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/consultation"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center"
            >
              <Ruler className="h-5 w-5 mr-2" />
              Free In-Home Consultation
            </Link>
            <a
              href="tel:+1-316-530-2635"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors flex items-center justify-center"
            >
              <Phone className="h-5 w-5 mr-2" />
              Call (316) 530-2635
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}