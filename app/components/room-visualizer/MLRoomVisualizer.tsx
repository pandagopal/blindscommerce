'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  // Empty - using built-in DOM types
}

interface DetectedWindow {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MLRoomVisualizerProps {
  productImage?: string;
  productName?: string;
  onVisualizationSave?: (visualizationData: { roomImage: string; resultImage: string }) => void;
}

const MLRoomVisualizer = ({ 
  productImage,
  onVisualizationSave 
}: MLRoomVisualizerProps): JSX.Element => {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [detectedWindows, setDetectedWindows] = useState<DetectedWindow[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load the model on component mount
  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    } catch (error) {
      console.error('Error loading model:', error);
      toast.error('Failed to load object detection model');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target && e.target.result && typeof e.target.result === 'string') {
        setRoomImage(e.target.result);
        detectWindows(e.target.result);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const detectWindows = async (imageDataUrl: string) => {
    if (!model) return;

    setIsLoading(true);
    try {
      // Load image
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise<void>(resolve => { img.onload = () => resolve(); });

      // Get predictions
      const predictions = await model.detect(img);

      // Filter for windows and doors
      const windows = predictions
        .filter(p => ['window', 'door'].includes(p.class))
        .map(p => ({
          x: Math.round(p.bbox[0]),
          y: Math.round(p.bbox[1]),
          width: Math.round(p.bbox[2]),
          height: Math.round(p.bbox[3])
        }));

      // If no windows detected, try to estimate based on image dimensions
      if (windows.length === 0) {
        const estimatedWindow = {
          x: Math.round(img.width * 0.25),
          y: Math.round(img.height * 0.25),
          width: Math.round(img.width * 0.5),
          height: Math.round(img.height * 0.5)
        };
        windows.push(estimatedWindow);
      }

      setDetectedWindows(windows);
    } catch (error) {
      console.error('Error detecting windows:', error);
      toast.error('Failed to detect windows');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || !roomImage) return;

    // Draw room image
    const img = new Image();
    img.src = roomImage;
    img.onload = () => {
      // Set canvas dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Clear canvas and draw room image
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0);

      // Draw detected windows
      detectedWindows.forEach((window, index) => {
        const isSelected = index === selectedWindow;
        if (ctx) {
          ctx.strokeStyle = isSelected ? '#ff0000' : '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(window.x, window.y, window.width, window.height);
        }
      });

      // Draw product if a window is selected
      if (selectedWindow !== null && productImage && ctx) {
        const window = detectedWindows[selectedWindow];
        const product = new Image();
        product.src = productImage;
        product.onload = () => {
          // Calculate product placement
          const scaledWidth = product.naturalWidth * scale;
          const scaledHeight = product.naturalHeight * scale;
          const x = window.x + (window.width - scaledWidth) / 2;
          const y = window.y + (window.height - scaledHeight) / 2;

          // Save context for rotation
          ctx.save();
          ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.drawImage(product, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.restore();
        };
      }
    };
  }, [roomImage, detectedWindows, selectedWindow, productImage, scale, rotation]);

  // Update visualization when relevant state changes
  useEffect(() => {
    if (roomImage) {
      renderVisualization();
    }
  }, [roomImage, renderVisualization]);

  const saveVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !roomImage) return;

    const resultImage = canvas.toDataURL('image/jpeg');
    onVisualizationSave?.({
      roomImage,
      resultImage
    });
    toast.success('Visualization saved!');
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Smart Room Visualizer</h2>
      
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
                onClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
                  const canvas = canvasRef.current;
                  if (!canvas) return;

                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;
                  
                  const x = (e.clientX - rect.left) * scaleX;
                  const y = (e.clientY - rect.top) * scaleY;
                  
                  const clickedWindowIndex = detectedWindows.findIndex(window => 
                    x >= window.x && x <= window.x + window.width &&
                    y >= window.y && y <= window.y + window.height
                  );
                  
                  setSelectedWindow(clickedWindowIndex === -1 ? null : clickedWindowIndex);
                }}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Upload a photo of your room
            </div>
          )}
        </div>

        {selectedWindow !== null && (
          <div className="flex space-x-4">
            <Button
              onClick={() => setRotation(r => (r - 90) % 360)}
              variant="outline"
              size="icon"
              type="button"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
              variant="outline"
              size="icon"
              type="button"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
              variant="outline"
              size="icon"
              type="button"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        )}

        {roomImage && productImage && selectedWindow !== null && (
          <Button
            onClick={saveVisualization}
            className="w-full"
            disabled={isLoading}
            type="button"
          >
            Save Visualization
          </Button>
        )}
      </div>
    </div>
  );
};

export default MLRoomVisualizer;
