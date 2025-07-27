'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Share2, Eye, Filter, Grid, List } from 'lucide-react';

export default function InspirationPage() {
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const inspirationGallery = [
    {
      id: 1,
      title: 'Modern Living Room with Cellular Shades',
      room: 'living-room',
      style: 'modern',
      products: ['Cellular Shades', 'Motorized Controls'],
      image: '/images/inspiration/modern-living-cellular.jpg',
      description: 'Clean lines and energy efficiency meet in this contemporary living space featuring white cellular shades.',
      likes: 234,
      views: 1567
    },
    {
      id: 2,
      title: 'Rustic Kitchen with Wood Shutters',
      room: 'kitchen',
      style: 'rustic',
      products: ['Wood Shutters', 'Custom Stain'],
      image: '/images/inspiration/rustic-kitchen-shutters.jpg',
      description: 'Warm wood plantation shutters complement this farmhouse kitchen perfectly.',
      likes: 189,
      views: 1203
    },
    {
      id: 3,
      title: 'Elegant Bedroom with Roman Shades',
      room: 'bedroom',
      style: 'traditional',
      products: ['Roman Shades', 'Blackout Liner'],
      image: '/images/inspiration/elegant-bedroom-roman.jpg',
      description: 'Luxurious fabric roman shades create the perfect ambiance for rest and relaxation.',
      likes: 312,
      views: 2104
    },
    {
      id: 4,
      title: 'Contemporary Home Office with Roller Shades',
      room: 'office',
      style: 'contemporary',
      products: ['Solar Shades', 'Motorized'],
      image: '/images/inspiration/contemporary-office-roller.jpg',
      description: 'Reduce glare while maintaining your view with these sleek solar roller shades.',
      likes: 156,
      views: 934
    },
    {
      id: 5,
      title: 'Coastal Dining Room with Woven Wood',
      room: 'dining-room',
      style: 'coastal',
      products: ['Woven Wood Shades', 'Natural Bamboo'],
      image: '/images/inspiration/coastal-dining-woven.jpg',
      description: 'Natural woven wood shades bring organic texture to this beachside dining room.',
      likes: 278,
      views: 1845
    },
    {
      id: 6,
      title: 'Industrial Loft with Aluminum Shutters',
      room: 'living-room',
      style: 'industrial',
      products: ['Aluminum Shutters', 'Custom Color'],
      image: '/images/inspiration/industrial-loft-aluminum.jpg',
      description: 'Sleek aluminum shutters complement the raw materials in this urban loft space.',
      likes: 167,
      views: 1289
    },
    {
      id: 7,
      title: 'Classic Bathroom with Composite Shutters',
      room: 'bathroom',
      style: 'traditional',
      products: ['Composite Shutters', 'Moisture Resistant'],
      image: '/images/inspiration/classic-bathroom-composite.jpg',
      description: 'Moisture-resistant composite shutters provide privacy and style in this elegant bathroom.',
      likes: 145,
      views: 876
    },
    {
      id: 8,
      title: 'Minimalist Nursery with Cordless Shades',
      room: 'nursery',
      style: 'minimalist',
      products: ['Cordless Cellular', 'Child Safe'],
      image: '/images/inspiration/minimalist-nursery-cordless.jpg',
      description: 'Safe, cordless cellular shades create a peaceful environment for baby\'s room.',
      likes: 298,
      views: 1674
    }
  ];

  const roomCategories = [
    { id: 'all', name: 'All Rooms', count: inspirationGallery.length },
    { id: 'living-room', name: 'Living Room', count: inspirationGallery.filter(item => item.room === 'living-room').length },
    { id: 'bedroom', name: 'Bedroom', count: inspirationGallery.filter(item => item.room === 'bedroom').length },
    { id: 'kitchen', name: 'Kitchen', count: inspirationGallery.filter(item => item.room === 'kitchen').length },
    { id: 'bathroom', name: 'Bathroom', count: inspirationGallery.filter(item => item.room === 'bathroom').length },
    { id: 'dining-room', name: 'Dining Room', count: inspirationGallery.filter(item => item.room === 'dining-room').length },
    { id: 'office', name: 'Office', count: inspirationGallery.filter(item => item.room === 'office').length },
    { id: 'nursery', name: 'Nursery', count: inspirationGallery.filter(item => item.room === 'nursery').length }
  ];

  const styles = [
    'Modern', 'Traditional', 'Contemporary', 'Rustic', 'Coastal', 'Industrial', 'Minimalist', 'Transitional'
  ];

  const filteredGallery = selectedRoom === 'all' 
    ? inspirationGallery 
    : inspirationGallery.filter(item => item.room === selectedRoom);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Design Inspiration Gallery
            </h1>
            <p className="text-xl mb-8 text-purple-100 max-w-3xl mx-auto">
              Discover beautiful window treatment ideas for every room in your home. 
              Get inspired by real customer transformations and see how the right 
              window treatments can elevate your space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/consultation"
                className="bg-white text-purple-900 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Get Design Help
              </Link>
              <Link 
                href="/products"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-900 transition-colors"
              >
                Shop Products
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          {/* Room Filter */}
          <div className="flex flex-wrap gap-2">
            {roomCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedRoom(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                  selectedRoom === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            <span className="text-gray-600 text-sm">
              {filteredGallery.length} designs
            </span>
          </div>
        </div>

        {/* Style Tags */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse by Style</h3>
          <div className="flex flex-wrap gap-3">
            {styles.map((style) => (
              <span
                key={style}
                className="bg-white text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-purple-100 hover:text-purple-700 cursor-pointer transition-colors"
              >
                {style}
              </span>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
            : 'space-y-6'
        }`}>
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-shadow ${
                viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
              }`}
            >
              <div className={`${
                viewMode === 'list' ? 'md:w-1/2' : 'aspect-w-16 aspect-h-12'
              } bg-gray-200 relative overflow-hidden`}>
                <div className={`${
                  viewMode === 'list' ? 'h-64 md:h-full' : 'h-64'
                } bg-gradient-to-br from-purple-200 to-indigo-300 flex items-center justify-center`}>
                  <span className="text-purple-800 font-medium text-center px-4">
                    {item.title}
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="bg-white/90 p-2 rounded-full hover:bg-white transition-colors">
                    <Heart className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="bg-white/90 p-2 rounded-full hover:bg-white transition-colors">
                    <Share2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              <div className={`${viewMode === 'list' ? 'md:w-1/2' : ''} p-6`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {item.room.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {item.style}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{item.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.products.map((product, index) => (
                    <span
                      key={index}
                      className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                    >
                      {product}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {item.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {item.views}
                    </span>
                  </div>
                </div>
                
                <Link
                  href="/consultation"
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center block"
                >
                  Get This Look
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Rooms Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Room Transformations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="#" className="group">
              <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="h-48 bg-gradient-to-br from-blue-200 to-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-blue-800 font-medium">Living Room Ideas</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600">
                Living Room Window Treatments
              </h3>
              <p className="text-gray-600 text-sm mt-1">47 design ideas</p>
            </Link>
            
            <Link href="#" className="group">
              <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="h-48 bg-gradient-to-br from-green-200 to-teal-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-green-800 font-medium">Bedroom Ideas</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600">
                Bedroom Privacy & Style
              </h3>
              <p className="text-gray-600 text-sm mt-1">32 design ideas</p>
            </Link>
            
            <Link href="#" className="group">
              <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="h-48 bg-gradient-to-br from-orange-200 to-red-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-orange-800 font-medium">Kitchen Ideas</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600">
                Kitchen Window Solutions
              </h3>
              <p className="text-gray-600 text-sm mt-1">28 design ideas</p>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Create Your Dream Space?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Our design experts will help you achieve the perfect look for every room in your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/consultation"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              Schedule Design Consultation
            </Link>
            <Link
              href="/samples"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
            >
              Order Free Samples
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}