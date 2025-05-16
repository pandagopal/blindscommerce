import React from 'react';

export default function WikiPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Blinds Installation Wiki</h1>
      <div className="prose max-w-none">
        <p className="text-gray-600 text-lg mb-4">
          Welcome to our comprehensive guide on blinds installation, maintenance, and customization.
        </p>
        
        {/* Wiki Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="p-6 border rounded-lg shadow-sm hover:border-primary-red transition-colors">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Installation Guides</h2>
            <ul className="space-y-2">
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Basic Installation Steps</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Mounting Types</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Tools Required</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Troubleshooting</a>
              </li>
            </ul>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm hover:border-primary-red transition-colors">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Maintenance Tips</h2>
            <ul className="space-y-2">
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Cleaning Guidelines</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Regular Maintenance</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Common Issues</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Repair Guides</a>
              </li>
            </ul>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm hover:border-primary-red transition-colors">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Product Knowledge</h2>
            <ul className="space-y-2">
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Types of Blinds</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Material Guide</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Measuring Guide</a>
              </li>
              <li className="text-gray-600 hover:text-primary-red transition-colors">
                <a href="#" className="flex items-center">Style Tips</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 