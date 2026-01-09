'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ConfigState, Product } from './ConfigurationContext';

interface RoomVisualizerProps {
  roomType: string;
  product: Product;
  config: ConfigState;
}

const RoomVisualizer = ({ roomType, product, config }: RoomVisualizerProps) => {
  const [showProduct, setShowProduct] = useState(true);

  // Image mapping for different room types
  const roomImages: Record<string, string> = {
    'Living Room': '/images/rooms/living-room.jpg',
    'Bedroom': '/images/rooms/bedroom.jpg',
    'Kitchen': '/images/rooms/kitchen.jpg',
    'Bathroom': '/images/rooms/bathroom.jpg',
    'Office': '/images/rooms/office.jpg',
    // Default fallback
    'default': '/images/rooms/living-room.jpg'
  };

  // Toggle room view with or without product
  const toggleProduct = () => {
    setShowProduct(prev => !prev);
  };

  // Get the selected color name
  const selectedColor = product.colors.find(c => c.color_id === config.colorId)?.name || 'Default';

  // The room image to use (fallback to default if the roomType is not found)
  const roomImage = roomImages[roomType] || roomImages.default;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-800">Room Visualization: {roomType}</h3>
        <button
          onClick={toggleProduct}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          {showProduct ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Hide Product
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Show Product
            </>
          )}
        </button>
      </div>

      <div className="relative h-64 md:h-96">
        {/* Room background image */}
        <img
          src={roomImage}
          alt={`${roomType} visualization`}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Product visualization overlay */}
        {showProduct && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white bg-opacity-80 p-3 rounded-md text-center">
              <p className="text-sm font-semibold">
                {product.name} in {selectedColor}
              </p>
              <p className="text-xs text-gray-600">
                {config.width}" × {config.height}"
              </p>
            </div>
          </div>
        )}

        {/* Informational overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs">
          <p>
            Note: This is a simplified visualization. In a production environment,
            this would show a realistic rendering of your selected product in the room.
          </p>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Recommended for: <span className="font-medium">{roomType}</span> - based on your product configuration
        </p>
      </div>
    </div>
  );
};

export default RoomVisualizer;
