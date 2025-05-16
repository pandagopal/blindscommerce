import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from 'next/image';

interface RoomVisualizerProps {
  productImage?: string;
  productName?: string;
}

export default function RoomVisualizer({ productImage, productName }: RoomVisualizerProps) {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRoomImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyProductToRoom = () => {
    if (!roomImage || !productImage || !canvasRef.current) return;

    setIsLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Load room image
    const roomImg = new Image();
    roomImg.src = roomImage;
    roomImg.onload = () => {
      // Set canvas dimensions to match room image
      canvas.width = roomImg.width;
      canvas.height = roomImg.height;
      
      // Draw room image
      ctx.drawImage(roomImg, 0, 0);

      // Load and draw product image
      const prodImg = new Image();
      prodImg.src = productImage;
      prodImg.onload = () => {
        // Calculate product placement (simplified - you'll want to add proper window detection)
        const scale = 0.5; // Adjust scale as needed
        const x = (canvas.width - prodImg.width * scale) / 2;
        const y = (canvas.height - prodImg.height * scale) / 2;
        
        ctx.drawImage(prodImg, x, y, prodImg.width * scale, prodImg.height * scale);
        setIsLoading(false);
      };
    };
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Room Visualizer</h2>
      
      <div className="space-y-4">
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
          >
            Upload Room Photo
          </Button>
        </div>

        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {roomImage ? (
            <>
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Upload a photo of your room
            </div>
          )}
        </div>

        {roomImage && productImage && (
          <Button
            onClick={applyProductToRoom}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Applying...' : 'Apply Product to Room'}
          </Button>
        )}
      </div>
    </div>
  );
} 