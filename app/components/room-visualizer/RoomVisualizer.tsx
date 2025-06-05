import React from 'react';
import MLRoomVisualizer from './MLRoomVisualizer';
import { toast } from 'sonner';

interface RoomVisualizerProps {
  productImage?: string;
  productName?: string;
}

export default function RoomVisualizer({ productImage, productName }: RoomVisualizerProps) {
  const handleVisualizationSave = async (visualizationData: { roomImage: string; resultImage: string }) => {
    try {
      const response = await fetch('/api/room-visualizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomImage: visualizationData.roomImage,
          resultImage: visualizationData.resultImage,
          productId: productImage, // Using productImage as ID for now
          userId: 'current-user' // TODO: Get actual user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save visualization');
      }

      toast.success('Visualization saved successfully!');
    } catch (error) {
      console.error('Error saving visualization:', error);
      toast.error('Failed to save visualization');
    }
  };

  return (
    <MLRoomVisualizer
      productImage={productImage}
      productName={productName}
      onVisualizationSave={handleVisualizationSave}
    />
  );
} 