'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import BasicInfo from '@/app/admin/products/components/BasicInfo';
import PricingMatrix from '@/app/admin/products/components/PricingMatrix';
import Options from '@/app/admin/products/components/Options';
import Fabric from '@/app/admin/products/components/Fabric';
import Images from '@/app/admin/products/components/Images';
import Features from '@/app/admin/products/components/Features';
import RoomRecommendations from '@/app/admin/products/components/RoomRecommendations';

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

interface ProductCreationFormProps {
  userRole: 'admin' | 'vendor';
  onBack?: () => void;
  className?: string;
  isEditMode?: boolean;
  isViewMode?: boolean;
  initialData?: any;
  productId?: string | null;
}

export default function ProductCreationForm({ 
  userRole, 
  onBack,
  className = '',
  isEditMode = false,
  isViewMode = false,
  initialData = null,
  productId = null 
}: ProductCreationFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isSaving, setIsSaving] = useState(false);
  const [productData, setProductData] = useState({
    basicInfo: {
      name: '',
      categories: [],
      primaryCategory: '',
      shortDescription: '',
      fullDescription: '',
      sku: '',
      vendorId: userRole === 'admin' ? 'marketplace' : undefined, // Only for admin
      basePrice: 0,
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
      dimensions: {
        minWidth: 12,
        maxWidth: 96,
        minHeight: 12,
        maxHeight: 120,
        widthIncrement: 0.125,
        heightIncrement: 0.125
      },
      mountTypes: [],
      controlTypes: {
        liftSystems: [],
        wandSystem: [],
        stringSystem: [],
        remoteControl: []
      },
      valanceOptions: [],
      bottomRailOptions: []
    },
    fabric: {
      coloredFabric: [],
      sheerFabric: [],
      blackoutFabric: []
    },
    images: [],
    features: [],
    roomRecommendations: []
  });

  // Populate form with initial data when editing or viewing
  useEffect(() => {
    console.log('ProductCreationForm useEffect - isEditMode:', isEditMode, 'isViewMode:', isViewMode, 'initialData:', initialData);
    if ((isEditMode || isViewMode) && initialData) {
      console.log('Populating form with data:', initialData);
      
      // Convert pricing_matrix from database format to component format
      const priceMatrix = {};
      if (initialData.pricing_matrix && Array.isArray(initialData.pricing_matrix)) {
        initialData.pricing_matrix.forEach(entry => {
          const widthRange = `${entry.width_min}-${entry.width_max}`;
          const heightRange = `${entry.height_min}-${entry.height_max}`;
          const key = `${widthRange}-${heightRange}`;
          priceMatrix[key] = entry.base_price.toString();
        });
      }

      setProductData({
        basicInfo: {
          name: initialData.name || '',
          categories: [],
          primaryCategory: initialData.category_id?.toString() || '',
          shortDescription: initialData.short_description || '',
          fullDescription: initialData.full_description || '',
          sku: '',
          vendorId: userRole === 'admin' ? 'marketplace' : undefined,
          basePrice: initialData.base_price || 0,
          isActive: initialData.vendor_active !== false,
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
        options: initialData.options || {
          dimensions: {
            minWidth: 12,
            maxWidth: 96,
            minHeight: 12,
            maxHeight: 120,
            widthIncrement: 0.125,
            heightIncrement: 0.125
          },
          mountTypes: [],
          controlTypes: {
            liftSystems: [],
            wandSystem: [],
            stringSystem: [],
            remoteControl: []
          },
          valanceOptions: [],
          bottomRailOptions: []
        },
        pricing: { 
          priceMatrix, 
          matrixEntries: initialData.pricing_matrix || [] 
        },
        fabric: {
          coloredFabric: [],
          sheerFabric: [],
          blackoutFabric: []
        },
        images: initialData.images || [],
        features: [],
        roomRecommendations: []
      });
      
      console.log('Form data updated with initial data:', {
        basicInfo: {
          name: initialData.name || '',
          primaryCategory: initialData.category_id?.toString() || '',
          basePrice: initialData.base_price || 0
        }
      });
    }
  }, [isEditMode, isViewMode, initialData, userRole]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate required fields
      const { basicInfo } = productData;
      if (!basicInfo.name || !basicInfo.primaryCategory || !basicInfo.shortDescription) {
        toast.error("Please fill in all required fields in Basic Info");
        setActiveTab('basic-info');
        return;
      }
      
      // SKU is required for new products but optional for edits
      if (!isEditMode && !basicInfo.sku) {
        toast.error("Please enter a SKU for the new product");
        setActiveTab('basic-info');
        return;
      }

      if (basicInfo.basePrice <= 0) {
        toast.error("Please enter a valid base price");
        setActiveTab('basic-info');
        return;
      }

      // Prepare data for API
      const apiData = {
        ...productData.basicInfo,
        name: productData.basicInfo.name,
        description: productData.basicInfo.fullDescription,
        base_price: productData.basicInfo.basePrice,
        category_id: parseInt(productData.basicInfo.primaryCategory),
        images: productData.images,
        options: productData.options,
        pricing_matrix: productData.pricing?.matrixEntries || [],
        fabric: productData.fabric
      };

      // Use appropriate API endpoint based on mode
      const apiEndpoint = isEditMode 
        ? `/api/vendor/products/${productId}`
        : '/api/products/create';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditMode ? apiData : productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save product');
      }

      const result = await response.json();
      
      // If product was created successfully and we have options, save them
      if (result.success && result.product_id && userRole === 'vendor') {
        try {
          const optionsResponse = await fetch(`/api/vendor/products/${result.product_id}/options`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              options: productData.options,
              fabric: productData.fabric 
            }),
          });

          if (!optionsResponse.ok) {
            console.warn('Failed to save product options, but product was created');
          }
        } catch (optionsError) {
          console.warn('Error saving product options:', optionsError);
        }
      }
      
      toast.success(
        isEditMode 
          ? "Product updated successfully"
          : userRole === 'admin' 
            ? (result.vendor_assigned ? 'Product created and assigned to vendor successfully' : 'Product created successfully')
            : "Product created successfully"
      );
      
      // Navigate based on user role
      const redirectPath = userRole === 'admin' ? '/admin/products' : '/vendor/products';
      router.push(redirectPath);
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      const backPath = userRole === 'admin' ? '/admin/products' : '/vendor/products';
      router.push(backPath);
    }
  };

  const pageTitle = isViewMode 
    ? 'View Product Details'
    : isEditMode 
      ? 'Edit Product' 
      : userRole === 'admin' ? 'Add New Product' : 'Add New Product';
  const pageDescription = isViewMode
    ? 'View product information and configuration details'
    : isEditMode
      ? 'Update your product information and settings'
      : userRole === 'admin' 
        ? 'Create a new product for the marketplace or assign to a vendor'
        : 'Create a new product for your vendor catalog';

  return (
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-primary-red text-primary-red hover:bg-red-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className={`text-2xl font-bold ${
              userRole === 'vendor' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent' 
                : ''
            }`}>
              {pageTitle}
            </h1>
            <p className="text-gray-600">{pageDescription}</p>
          </div>
        </div>
        {!isViewMode && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary-red hover:bg-red-700 text-white"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
          </Button>
        )}
      </div>

      {isViewMode && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium">
            📖 View Mode: This form is in read-only mode. All fields are disabled for viewing only.
          </p>
        </div>
      )}

      <Card className={userRole === 'vendor' ? "border-purple-100 shadow-lg" : ""}>
        <Tabs defaultValue="basic-info" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`w-full grid grid-cols-7 ${
            userRole === 'vendor' ? 'bg-gray-50' : ''
          }`}>
            <TabsTrigger 
              value="basic-info" 
              className="data-[state=active]:bg-primary-red data-[state=active]:text-white"
            >
              Basic Info
            </TabsTrigger>
            <TabsTrigger 
              value="options"
              className="data-[state=active]:bg-primary-red data-[state=active]:text-white"
            >
              Options
            </TabsTrigger>
            <TabsTrigger 
              value="fabric"
              className="data-[state=active]:bg-primary-red data-[state=active]:text-white"
            >
              Fabric
            </TabsTrigger>
            <TabsTrigger 
              value="pricing"
              className="data-[state=active]:bg-primary-red data-[state=active]:text-white"
            >
              Pricing Matrix
            </TabsTrigger>
            <TabsTrigger 
              value="images"
              className="data-[state=active]:bg-primary-red data-[state=active]:text-white"
            >
              Images
            </TabsTrigger>
            <TabsTrigger 
              value="features"
              className="data-[state=active]:bg-primary-red data-[state=active]:text-white"
            >
              Features
            </TabsTrigger>
            <TabsTrigger 
              value="recommendations"
              className="data-[state=active]:bg-primary-red data-[state=active]:text-white"
            >
              Room Recommendations
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="basic-info">
              <BasicInfo
                data={productData.basicInfo}
                categories={SHADE_CATEGORIES}
                onChange={(data) => updateProductData('basicInfo', data)}
                showVendorSelection={userRole === 'admin'} // Only show vendor dropdown for admin
                isReadOnly={isViewMode}
              />
            </TabsContent>

            <TabsContent value="options">
              <Options
                data={productData.options}
                onChange={(data) => updateProductData('options', data)}
              />
            </TabsContent>

            <TabsContent value="fabric">
              <Fabric
                data={productData.fabric}
                onChange={(data) => updateProductData('fabric', data)}
              />
            </TabsContent>

            <TabsContent value="pricing">
              <PricingMatrix
                dimensions={productData.dimensions}
                initialData={productData.pricing}
                onChange={(data) => updateProductData('pricing', data)}
                isReadOnly={isViewMode}
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

      {/* Progress indicator - Enhanced for vendor */}
      {userRole === 'vendor' && (
        <div className="mt-6 bg-white rounded-lg border border-purple-100 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Product Creation Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className={`flex items-center gap-2 ${productData.basicInfo.name ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${productData.basicInfo.name ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              Basic Information
            </div>
            <div className={`flex items-center gap-2 ${productData.options.mountTypes.some(opt => opt.enabled) || Object.values(productData.options.controlTypes).some(group => group.some(opt => opt.enabled)) ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${productData.options.mountTypes.some(opt => opt.enabled) || Object.values(productData.options.controlTypes).some(group => group.some(opt => opt.enabled)) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
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
      )}
    </div>
  );
}