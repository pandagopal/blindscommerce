import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Camera, Ruler, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ARPreview } from './ARPreview';
import { MeasurementTool } from './MeasurementTool';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileProductViewProps {
  product: {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    features: string[];
    specifications: Record<string, string>;
  };
}

export default function MobileProductView({ product }: MobileProductViewProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [showMeasurement, setShowMeasurement] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="pb-20">
      {/* Product Images */}
      <div className="relative">
        <div className="aspect-square">
          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Image Thumbnails */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {product.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`w-2 h-2 rounded-full ${
                selectedImage === index ? 'bg-primary-red' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-xl font-medium">${product.price.toFixed(2)}</p>
        <p className="text-gray-600">{product.description}</p>

        {/* Actions */}
        <div className="flex space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAR(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                AR Preview
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>AR Preview</SheetTitle>
              </SheetHeader>
              <ARPreview
                productId={product.id}
                productImage={product.images[0]}
                productDimensions={{ width: 36, height: 48 }}
              />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowMeasurement(true)}
              >
                <Ruler className="w-4 h-4 mr-2" />
                Measure
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Measurement Tool</SheetTitle>
              </SheetHeader>
              <MeasurementTool />
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            className="flex-shrink-0"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Details Accordion */}
        <div className="border rounded-lg">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-4 flex items-center justify-between"
          >
            <span className="font-medium">Product Details</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="p-4 border-t space-y-4">
              {/* Features */}
              <div>
                <h3 className="font-medium mb-2">Features</h3>
                <ul className="list-disc list-inside space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="font-medium mb-2">Specifications</h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button className="w-full bg-primary-red hover:bg-primary-red-dark">
          Add to Cart
        </Button>
      </div>
    </div>
  );
} 