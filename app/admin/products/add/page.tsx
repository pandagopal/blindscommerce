'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import BasicInfo from './components/BasicInfo';
import PricingMatrix from './components/PricingMatrix';
import Options from './components/Options';
import Images from './components/Images';
import Features from './components/Features';
import RoomRecommendations from './components/RoomRecommendations';

const SHADE_CATEGORIES = [
  'Cellular Shades',
  'Roller Shades',
  'Roman Shades',
  'Woven Wood Shades',
  'Zebra Shades',
  'Solar Shades',
  'Sheer Shades',
  'Outdoor Blinds'
];

export default function AddProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic-info');
  const [productData, setProductData] = useState({
    basicInfo: {
      name: '',
      category: '',
      shortDescription: '',
      fullDescription: '',
      sku: '',
      isActive: true,
      isFeatured: false
    },
    dimensions: {
      minWidth: 12,
      maxWidth: 96,
      minHeight: 12,
      maxHeight: 120,
      widthIncrement: 0.125,
      heightIncrement: 0.125
    },
    options: {
      mountTypes: [],
      controlTypes: [],
      fabricTypes: [],
      headrailOptions: [],
      bottomRailOptions: [],
      specialtyOptions: []
    },
    images: [],
    features: [],
    roomRecommendations: []
  });

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      router.push('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      // Show error notification
    }
  };

  const updateProductData = (section: string, data: any) => {
    setProductData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add New Product</h1>
        <button
          onClick={handleSave}
          className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg"
        >
          Save Product
        </button>
      </div>

      <Card className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 gap-4 p-4">
            <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Matrix</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="recommendations">Room Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="basic-info">
            <BasicInfo
              data={productData.basicInfo}
              categories={SHADE_CATEGORIES}
              onChange={(data) => updateProductData('basicInfo', data)}
            />
          </TabsContent>

          <TabsContent value="options">
            <Options
              data={productData.options}
              onChange={(data) => updateProductData('options', data)}
            />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingMatrix
              dimensions={productData.dimensions}
              onChange={(data) => updateProductData('dimensions', data)}
            />
          </TabsContent>

          <TabsContent value="images">
            <Images
              images={productData.images}
              onChange={(data) => updateProductData('images', data)}
            />
          </TabsContent>

          <TabsContent value="features">
            <Features
              features={productData.features}
              onChange={(data) => updateProductData('features', data)}
            />
          </TabsContent>

          <TabsContent value="recommendations">
            <RoomRecommendations
              recommendations={productData.roomRecommendations}
              onChange={(data) => updateProductData('roomRecommendations', data)}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 