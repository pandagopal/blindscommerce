'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ConfigState, Product } from './ConfigurationContext';

interface Room {
  room_type_id?: number;
  name: string;
  description?: string;
  image_url?: string;
}

interface RoomVisualizerProps {
  roomType: string;
  product: Product;
  config: ConfigState;
  room?: Room; // Optional: full room object from database
}

const RoomVisualizer = ({ roomType, product, config, room }: RoomVisualizerProps) => {
  const [showProduct, setShowProduct] = useState(true);

  // Fallback image mapping for when database doesn't have images
  const fallbackRoomImages: Record<string, string> = {
    'Living Room': '/uploads/rooms/living-room.jpg',
    'Bedroom': '/uploads/rooms/bedroom.jpg',
    'Kitchen': '/uploads/rooms/kitchen.jpg',
    'Bathroom': '/uploads/rooms/bathroom.jpg',
    'Office': '/uploads/rooms/office.jpg',
    // Default fallback
    'default': '/uploads/rooms/living-room.jpg'
  };

  // Toggle room view with or without product
  const toggleProduct = () => {
    setShowProduct(prev => !prev);
  };

  // Get the selected color name
  const selectedColor = product.colors.find(c => c.color_id === config.colorId)?.name || 'Default';

  // Get room image: prioritize database image, then fallback to hardcoded paths
  const getRoomImage = (): string => {
    // If we have a room object with image_url from database, use it
    if (room?.image_url) {
      // Handle both absolute and relative paths
      if (room.image_url.startsWith('http')) return room.image_url;
      if (room.image_url.startsWith('/')) return room.image_url;
      return `/uploads/${room.image_url}`;
    }
    // Otherwise use fallback mapping
    return fallbackRoomImages[roomType] || fallbackRoomImages.default;
  };

  const roomImage = getRoomImage();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-800">Room Visualization: {roomType}</h3>
        <button
          onClick={toggleProduct}
          className="flex items-center text-sm text-red-600 hover:text-red-800"
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
