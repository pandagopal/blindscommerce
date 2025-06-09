'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import BasicInfo from '../components/BasicInfo';
import PricingMatrix from '../components/PricingMatrix';
import Options from '../components/Options';
import Images from '../components/Images';
import Features from '../components/Features';
import RoomRecommendations from '../components/RoomRecommendations';

const SHADE_CATEGORIES = [
  'Cellular Shades',
  'Roller Shades',
  'Roman Shades',
  'Woven Wood Shades',
  'Zebra Shades',
  'Solar Shades',
  'Sheer Shades',
  'Outdoor Blinds',
  'Vertical Blinds',
  'Horizontal Blinds',
  'Plantation Shutters',
  'Panel Track Blinds'
];

export default function VendorAddProductPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/vendor/products/new');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'vendor' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/vendor/products/new');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate required fields
      const { basicInfo } = productData;
      if (!basicInfo.name || !basicInfo.category || !basicInfo.shortDescription || !basicInfo.sku) {
        toast.error("Please fill in all required fields in Basic Info");
        setActiveTab('basic-info');
        return;
      }

      // API endpoint will be different for vendors
      const response = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save product');
      }

      toast.success("Product saved successfully");
      router.push('/vendor/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save product. Please try again.");
    } finally {
      setIsSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/vendor/products')}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Add New Product
              </h1>
              <p className="text-gray-600">Create a new product for your vendor catalog</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSaving ? 'Saving...' : 'Save Product'}
          </Button>
        </div>

        <Card className="border-purple-100 shadow-lg">
          <Tabs defaultValue="basic-info" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-6 bg-gray-50">
              <TabsTrigger value="basic-info" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="options" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Options
              </TabsTrigger>
              <TabsTrigger value="pricing" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Pricing Matrix
              </TabsTrigger>
              <TabsTrigger value="images" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Images
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Features
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Room Recommendations
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
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
            </div>
          </Tabs>
        </Card>

        {/* Progress indicator */}
        <div className="mt-6 bg-white rounded-lg border border-purple-100 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Product Creation Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className={`flex items-center gap-2 ${productData.basicInfo.name ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${productData.basicInfo.name ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              Basic Information
            </div>
            <div className={`flex items-center gap-2 ${productData.options.mountTypes.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${productData.options.mountTypes.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              Product Options
            </div>
            <div className={`flex items-center gap-2 ${productData.images.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${productData.images.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              Product Images
            </div>
            <div className={`flex items-center gap-2 ${productData.features.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${productData.features.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              Features
            </div>
            <div className={`flex items-center gap-2 ${productData.roomRecommendations.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${productData.roomRecommendations.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              Room Recommendations
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              Ready to Publish
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}