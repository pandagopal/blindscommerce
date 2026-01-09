'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Star, Clock, Home } from 'lucide-react';

export default function SamplesPage() {
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const sampleCategories = [
    {
      id: 'cellular-shades',
      name: 'Cellular Shades',
      description: 'Energy-efficient honeycomb designs',
      samples: [
        { id: 'cellular-white', name: 'White Cellular', color: '#ffffff' },
        { id: 'cellular-cream', name: 'Cream Cellular', color: '#f5f5dc' },
        { id: 'cellular-gray', name: 'Gray Cellular', color: '#808080' },
        { id: 'cellular-beige', name: 'Beige Cellular', color: '#d2b48c' }
      ]
    },
    {
      id: 'roller-shades',
      name: 'Roller Shades',
      description: 'Clean, modern window treatments',
      samples: [
        { id: 'roller-white', name: 'White Roller', color: '#ffffff' },
        { id: 'roller-natural', name: 'Natural Roller', color: '#deb887' },
        { id: 'roller-charcoal', name: 'Charcoal Roller', color: '#36454f' },
        { id: 'roller-navy', name: 'Navy Roller', color: '#000080' }
      ]
    },
    {
      id: 'roman-shades',
      name: 'Roman Shades',
      description: 'Elegant fabric window treatments',
      samples: [
        { id: 'roman-linen', name: 'Natural Linen', color: '#faf0e6' },
        { id: 'roman-cotton', name: 'Cotton Weave', color: '#f8f8ff' },
        { id: 'roman-silk', name: 'Silk Blend', color: '#e6e6fa' },
        { id: 'roman-bamboo', name: 'Bamboo Texture', color: '#daa520' }
      ]
    },
    {
      id: 'wood-shutters',
      name: 'Wood Shutters',
      description: 'Premium plantation shutters',
      samples: [
        { id: 'wood-white', name: 'Pure White', color: '#ffffff' },
        { id: 'wood-ivory', name: 'Ivory', color: '#fffff0' },
        { id: 'wood-natural', name: 'Natural Stain', color: '#deb887' },
        { id: 'wood-espresso', name: 'Espresso', color: '#654321' }
      ]
    },
    {
      id: 'solar-shades',
      name: 'Solar Shades',
      description: 'UV protection with view-through',
      samples: [
        { id: 'solar-bronze', name: 'Bronze Mesh', color: '#cd7f32' },
        { id: 'solar-charcoal', name: 'Charcoal Mesh', color: '#36454f' },
        { id: 'solar-white', name: 'White Mesh', color: '#ffffff' },
        { id: 'solar-beige', name: 'Beige Mesh', color: '#d2b48c' }
      ]
    },
    {
      id: 'woven-wood',
      name: 'Woven Wood',
      description: 'Natural bamboo and wood materials',
      samples: [
        { id: 'woven-natural', name: 'Natural Bamboo', color: '#daa520' },
        { id: 'woven-mahogany', name: 'Mahogany Stain', color: '#c04000' },
        { id: 'woven-walnut', name: 'Walnut Finish', color: '#8b4513' },
        { id: 'woven-cherry', name: 'Cherry Wood', color: '#de3163' }
      ]
    }
  ];

  const handleSampleToggle = (sampleId: string) => {
    setSelectedSamples(prev => 
      prev.includes(sampleId) 
        ? prev.filter(id => id !== sampleId)
        : [...prev, sampleId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Samples Ordered!</h2>
          <p className="text-gray-600 mb-6">
            Your free samples are on their way! Expect delivery within 3-5 business days.
          </p>
          <div className="space-y-3">
            <Link 
              href="/consultation"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors block"
            >
              Schedule Consultation
            </Link>
            <Link 
              href="/products"
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors block"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-900 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Free Sample Program
            </h1>
            <p className="text-xl mb-8 text-green-100 max-w-3xl mx-auto">
              Experience the quality of Smart Blinds materials before you buy. Order up to 8 free samples 
              and see how our window treatments will look and feel in your home.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">100% Free</h3>
                <p className="text-green-100">No cost, no shipping fees, no obligations</p>
              </div>
              <div className="text-center">
                <Truck className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Fast Delivery</h3>
                <p className="text-green-100">Delivered to your door in 3-5 business days</p>
              </div>
              <div className="text-center">
                <Star className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Premium Quality</h3>
                <p className="text-green-100">Real materials from our actual product lines</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Selection */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Free Samples
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select up to 8 samples from our most popular window treatment collections. 
            Each sample is 4" x 4" so you can truly feel the quality and see the colors.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Selected: {selectedSamples.length}/8 samples
          </div>
        </div>

        <div className="space-y-12">
          {sampleCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                <p className="text-gray-600">{category.description}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {category.samples.map((sample) => (
                    <div
                      key={sample.id}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedSamples.includes(sample.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${selectedSamples.length >= 8 && !selectedSamples.includes(sample.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (selectedSamples.length < 8 || selectedSamples.includes(sample.id)) {
                          handleSampleToggle(sample.id);
                        }
                      }}
                    >
                      <div 
                        className="w-full h-20 rounded mb-3 border shadow-inner"
                        style={{ backgroundColor: sample.color }}
                      />
                      <h4 className="font-medium text-gray-900 text-sm">{sample.name}</h4>
                      {selectedSamples.includes(sample.id) && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Form */}
      {selectedSamples.length > 0 && (
        <div className="bg-white py-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
                <h2 className="text-2xl font-bold mb-2">Shipping Information</h2>
                <p className="text-green-100">Enter your details to receive your free samples.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any specific questions or requests about your samples..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Package className="h-5 w-5 mr-2" />
                  Order {selectedSamples.length} Free Sample{selectedSamples.length !== 1 ? 's' : ''}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Order Samples from Smart Blinds?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">See Before You Buy</h3>
              <p className="text-gray-600">
                Touch, feel, and see exactly how our materials will look in your home's lighting.
              </p>
            </div>
            <div className="text-center">
              <Home className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Match Your Decor</h3>
              <p className="text-gray-600">
                Compare colors and textures against your walls, furniture, and existing decor.
              </p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Assurance</h3>
              <p className="text-gray-600">
                Experience the superior quality and craftsmanship that makes Smart Blinds the best choice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How many samples can I order?</h3>
              <p className="text-gray-600">You can order up to 8 free samples per household. If you need more, please contact our design consultants.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How long does shipping take?</h3>
              <p className="text-gray-600">Samples are shipped within 1 business day and typically arrive within 3-5 business days via standard shipping.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do I need to return the samples?</h3>
              <p className="text-gray-600">No, the samples are yours to keep! Use them to make your decision and keep them for future reference.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What size are the samples?</h3>
              <p className="text-gray-600">All samples are 4" x 4" pieces of the actual materials used in our products, so you get a true representation of quality and appearance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Order your free samples today and take the first step toward beautiful new window treatments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/consultation"
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Schedule Free Consultation
            </Link>
            <Link
              href="/products"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}