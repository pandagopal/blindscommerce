'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PlusIcon, SearchIcon, FilterIcon, EyeIcon,
  EditIcon, TrashIcon, ToggleLeftIcon, ToggleRightIcon,
  SlidersIcon, TagIcon, AlertTriangleIcon, ArrowUpDownIcon,
  ChevronDownIcon, PackageIcon, ArrowLeft, Copy
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import BasicInfo from '@/components/products/shared/BasicInfo';
import PricingMatrix from '@/components/products/shared/PricingMatrix';
import Options from '@/components/products/shared/Options';
import Fabric, { FabricRef } from '@/components/products/shared/Fabric';
import Images from '@/components/products/shared/Images';
import Features from '@/components/products/shared/Features';
import RoomRecommendations from '@/components/products/shared/RoomRecommendations';
import Rendering3D from '@/components/products/shared/Rendering3D';
import ProductCloneButton from '@/components/products/ProductCloneButton';

// Types
interface Product {
  product_id: number;
  name: string;
  slug: string;
  type_id: number;
  series_name?: string;
  material_type?: string;
  short_description?: string;
  full_description?: string;
  features?: string[];
  benefits?: string[];
  is_active: boolean;
  is_listing_enabled: boolean;
  base_price: number;
  created_at: string;
  updated_at: string;
}

interface UnifiedProductPageProps {
  userRole: 'admin' | 'vendor';
}

const SHADE_CATEGORIES = [
  'Cellular Shades',
  'Roller Shades',
  'Roman Shades',
  'Woven Wood Shades',
  'Zebra Shades',
  'Solar Shades',
  'Vertical Blinds',
  'Horizontal Blinds',
  'Panel Track Blinds',
  'Shutters',
  'Valances',
  'Motorized Blinds',
  'Shades'
];


// Convert pricing matrix entries to the format expected by PricingMatrix component
const convertPricingMatrixToObject = (matrixEntries: any[]): Record<string, string> => {
  const priceMatrix: Record<string, string> = {};
  
  if (!Array.isArray(matrixEntries)) return priceMatrix;
  
  matrixEntries.forEach(entry => {
    if (entry.width_min && entry.width_max && entry.height_min && entry.height_max) {
      // Create the key format that matches PricingMatrix component expectations
      const widthRange = `${Math.floor(entry.width_min)}-${Math.floor(entry.width_max)}`;
      const heightRange = `${Math.floor(entry.height_min)}-${Math.floor(entry.height_max)}`;
      const key = `${widthRange}_${heightRange}`;
      
      // Store the base price as string with 2 decimal places
      priceMatrix[key] = parseFloat(entry.base_price || 0).toFixed(2);
    }
  });
  
  return priceMatrix;
};

export default function UnifiedProductPage({ userRole }: UnifiedProductPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine page mode based on URL
  const isNewMode = pathname.includes('/new') || pathname.includes('/add');
  const isEditMode = pathname.includes('/edit');
  const isViewMode = pathname.includes('/view');
  const isListMode = !isNewMode && !isEditMode && !isViewMode;
  
  // Get product ID from URL
  const productId = React.useMemo(() => {
    const pathParts = pathname.split('/');
    
    // For view mode: /vendor/products/view/242 -> extract 242
    if (isViewMode) {
      const viewIndex = pathParts.findIndex(part => part === 'view');
      if (viewIndex > 0 && viewIndex < pathParts.length - 1) {
        const id = pathParts[viewIndex + 1];
        return id;
      }
    }
    // For edit mode: /vendor/products/240/edit -> extract 240
    if (isEditMode) {
      const editIndex = pathParts.findIndex(part => part === 'edit');
      if (editIndex > 0) {
        const id = pathParts[editIndex - 1];
        return id;
      }
    }
    // For other cases, try search params or last segment
    const fallbackId = searchParams.get('id') || pathname.split('/').pop();
    return fallbackId;
  }, [pathname, searchParams, isEditMode, isViewMode]);

  // List mode states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Ref for getting current fabric data
  const fabricRef = useRef<FabricRef>(null);

  // Form mode states
  const [saving, setSaving] = useState(false);
  const [productData, setProductData] = useState({
    basicInfo: {
      name: '',
      slug: '',
      shortDescription: '',
      fullDescription: '',
      sku: '',
      basePrice: 0,
      vendorId: userRole === 'vendor' ? 'auto-assigned' : '',
      isActive: true,
      isFeatured: false,
      categories: [],
      primaryCategory: ''
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
    pricing: {
      matrixEntries: []
    },
    images: [],
    features: [],
    fabric: {
      fabrics: []
    },
    roomRecommendations: [],
    rendering3D: {
      model3D: null,
      renderingConfig: {
        engine: 'three.js',
        environment: 'studio',
        lighting: {
          ambient: 0.4,
          directional: 0.6,
          shadowSoftness: 0.5
        },
        camera: {
          defaultPosition: [0, 0, 5],
          fov: 45
        },
        quality: {
          resolution: 'high',
          antialiasing: true,
          shadows: true
        }
      },
      previewSettings: {
        autoRotate: false,
        showGrid: false,
        showAxes: false
      },
      textureSettings: {
        defaultScale: 1.0,
        defaultFinish: 'matte',
        defaultOpacity: 1.0
      }
    }
  });

  const productsPerPage = 25;
  const basePath = userRole === 'admin' ? '/admin/products' : '/vendor/products';

  // Separate useEffect for list mode
  useEffect(() => {
    if (isListMode) {
      fetchProducts();
    }
  }, [currentPage, typeFilter, statusFilter, sortBy, sortOrder, searchQuery, isListMode]);

  // Separate useEffect for edit/view mode - only depends on productId and mode
  useEffect(() => {
    if (isEditMode || isViewMode) {
      loadProductData();
    }
  }, [isEditMode, isViewMode, productId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        limit: productsPerPage.toString(),
        offset: ((currentPage - 1) * productsPerPage).toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const apiPath = userRole === 'admin' ? '/api/v2/commerce/products' : '/api/v2/vendors/products';
      const fullUrl = `${apiPath}?${params.toString()}`;
      
      const res = await fetch(fullUrl);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || `Failed to fetch products: ${res.status}`);
        return;
      }
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }
      
      // Handle both response formats - commerce API returns { data: { data: [...], pagination: {...} } }
      // while admin API returns { data: { products: [...], pagination: {...} } }
      const responseData = data.data || data;
      const products = responseData.data || responseData.products || [];
      const total = responseData.pagination?.total || 0;
      
      setProducts(products);
      setTotalProducts(total);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const loadProductData = async () => {
    if (!productId || productId === 'new' || productId === 'add') return;
    
    // Additional validation to prevent invalid product IDs
    if (productId === 'products' || productId === 'view' || productId === 'edit') {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }
    
    // Ensure productId is numeric for vendor products
    const numericId = parseInt(productId);
    if (isNaN(numericId)) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const apiPath = userRole === 'admin' ? '/api/v2/commerce/products' : '/api/v2/vendors/products';
      const fullUrl = `${apiPath}/${numericId}`;
      
      // Load basic product data
      const res = await fetch(fullUrl);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to load product data');
        return;
      }
      
      if (!data.success) throw new Error(data.message || 'API request failed');
      
      if (data.data?.product) {
        const product = data.data.product;
        
        // Options and fabric data now come from the main product API response
        let optionsData = product.options;
        // Map API response to expected structure
        const mappedData = {
          basicInfo: {
            name: product.name || '',
            slug: product.slug || '',
            shortDescription: product.short_description || '',
            fullDescription: product.full_description || '',
            sku: product.sku || '',
            basePrice: product.base_price || 0,
            vendorId: product.vendor_id || '',
            isActive: Boolean(product.is_active),
            isFeatured: Boolean(product.is_featured),
            categories: Array.isArray(product.categories) ? product.categories : [],
            primaryCategory: product.primary_category || ''
          },
          options: optionsData || {
            dimensions: optionsData?.dimensions || {
              minWidth: 12,
              maxWidth: 96,
              minHeight: 12,
              maxHeight: 120,
              widthIncrement: 0.125,
              heightIncrement: 0.125
            },
            mountTypes: optionsData?.mountTypes || [],
            controlTypes: optionsData?.controlTypes || {
              liftSystems: [],
              wandSystem: [],
              stringSystem: [],
              remoteControl: []
            },
            valanceOptions: optionsData?.valanceOptions || [],
            bottomRailOptions: optionsData?.bottomRailOptions || []
          },
          pricing: { 
            matrixEntries: Array.isArray(product.pricing_matrix) ? product.pricing_matrix : [],
            priceMatrix: Array.isArray(product.pricing_matrix) ? 
              convertPricingMatrixToObject(product.pricing_matrix) : {}
          },
          images: Array.isArray(product.images) ? product.images : [],
          features: Array.isArray(product.features) ? product.features : [],
          fabric: product.fabric || { fabrics: [] },
          roomRecommendations: Array.isArray(product.roomRecommendations) ? product.roomRecommendations : [],
          rendering3D: product.rendering3D || {
            model3D: null,
            renderingConfig: {
              engine: 'three.js',
              environment: 'studio',
              lighting: {
                ambient: 0.4,
                directional: 0.6,
                shadowSoftness: 0.5
              },
              camera: {
                defaultPosition: [0, 0, 5],
                fov: 45
              },
              quality: {
                resolution: 'high',
                antialiasing: true,
                shadows: true
              }
            },
            previewSettings: {
              autoRotate: false,
              showGrid: false,
              showAxes: false
            },
            textureSettings: {
              defaultScale: 1.0,
              defaultFinish: 'matte',
              defaultOpacity: 1.0
            }
          }
        };
        
        setProductData(mappedData);
      } else {
        setError('Failed to load product data');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const updateProductData = (section: string, data: any) => {
    setProductData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  // Isolated method to process fabric images - handles upload for blob URLs
  const processFabricImages = async (fabricData: any, currentProductId?: string) => {
    const processedData = { ...fabricData };
    
    if (processedData.fabrics && Array.isArray(processedData.fabrics)) {
      for (let i = 0; i < processedData.fabrics.length; i++) {
        const fabric = processedData.fabrics[i];
        
        if (fabric.image && fabric.image.url?.startsWith('blob:') && fabric.image.file) {
          try {
            const uploadedImage = await uploadSingleFabricImage(
              fabric.image, 
              fabric.fabricType || 'general', 
              currentProductId || 'new'
            );
            
            processedData.fabrics[i].image = uploadedImage;
            
          } catch (error) {
            console.error(`Failed to upload image for fabric: ${fabric.name}`, error);
            throw new Error(`Failed to upload image for fabric: ${fabric.name}`);
          }
        }
      }
    }
    
    return processedData;
  };

  // Upload a single fabric image
  const uploadSingleFabricImage = async (image: any, fabricType: string, currentProductId: string) => {
    const formData = new FormData();
    formData.append('file', image.file);  // Changed from 'files' to 'file'
    formData.append('type', 'fabric');  // Changed to match what the handler expects
    formData.append('category', `fabric_${fabricType}`);
    formData.append('productId', currentProductId);
    
    const uploadResponse = await fetch('/api/v2/vendors/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload response error:', errorText);
      throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    
    // Handle V2 API response format
    const uploadData = uploadResult.data || uploadResult;
    
    if (uploadData.success && uploadData.uploaded && uploadData.uploaded.length > 0) {
      const uploadedUrl = uploadData.uploaded[0].secureUrl;
      
      return {
        ...image,
        url: uploadedUrl,
      };
    } else if (uploadResult.success && uploadResult.data) {
      // Alternative: if the data is wrapped differently
      console.error('Upload response has unexpected structure:', uploadResult);
      throw new Error('Upload response has unexpected structure');
    } else {
      console.error('Upload failed - unexpected result format:', uploadResult);
      throw new Error(`Upload failed: ${uploadResult.error || uploadData.error || 'Unknown error'}`);
    }
  };

  // Process product images - handles upload for blob URLs
  const processProductImages = async (images: any[], currentProductId?: string) => {
    if (!images || !Array.isArray(images)) return images;
    
    const processedImages = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (image.url?.startsWith('blob:') && image.file) {
        try {
          const formData = new FormData();
          formData.append('file', image.file);  // Changed from 'files' to 'file'
          formData.append('type', 'product');  // Changed to match what the handler expects
          formData.append('category', 'product');
          formData.append('productId', currentProductId || 'new');
          
          const uploadResponse = await fetch('/api/v2/vendors/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload response error:', errorText);
            throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          
          // Handle V2 API response format
          const uploadData = uploadResult.data || uploadResult;
          
          if (uploadData.success && uploadData.uploaded && uploadData.uploaded.length > 0) {
            const uploadedUrl = uploadData.uploaded[0].secureUrl;
            
            processedImages.push({
              ...image,
              url: uploadedUrl,
              file: undefined // Remove file reference after upload
            });
          } else {
            throw new Error(`Upload failed: ${uploadResult.error || uploadData.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`Failed to upload image: ${image.alt}`, error);
          throw new Error(`Failed to upload image: ${image.alt}`);
        }
      } else {
        // Image already uploaded or no file to upload
        processedImages.push(image);
      }
    }
    
    return processedImages;
  };

  const saveProduct = async () => {
    try {
      setSaving(true);
      
      const baseEndpoint = userRole === 'admin' ? '/api/v2/admin/products' : '/api/v2/vendors/products';
      const apiEndpoint = isEditMode ? `${baseEndpoint}/${productId}` : baseEndpoint;
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Get current fabric data from ref
      const currentFabricData = fabricRef.current?.getCurrentData() || productData.fabric;
      
      // Process fabric images - upload any new images that are still using blob URLs
      const processedFabricData = await processFabricImages(currentFabricData, productId);
      
      // Process product images - upload any new images that are still using blob URLs
      const processedImages = await processProductImages(productData.images, productId);
      
      // Transform productData to the format expected by the API
      const apiData = {
        // Basic info fields
        name: productData.basicInfo.name,
        slug: productData.basicInfo.slug,
        sku: productData.basicInfo.sku,
        short_description: productData.basicInfo.shortDescription,
        full_description: productData.basicInfo.fullDescription,
        base_price: productData.basicInfo.basePrice,
        vendor_id: productData.basicInfo.vendorId,
        is_active: productData.basicInfo.isActive,
        is_featured: productData.basicInfo.isFeatured,
        categories: productData.basicInfo.categories,
        primary_category: productData.basicInfo.primaryCategory,
        
        // Other tabs data
        images: processedImages,
        options: productData.options,
        pricing_matrix: productData.pricing.matrixEntries,
        fabric: processedFabricData,
        features: productData.features,
        roomRecommendations: productData.roomRecommendations,
        rendering3D: productData.rendering3D
      };
      
      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to save product');
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'API request failed');
      
      // Options and fabric data are now saved through the main API
      
      toast.success(isEditMode ? 'Product updated successfully!' : 'Product created successfully!');
      
      // Don't redirect for edit mode - stay on current tab to allow continued editing
      if (!isEditMode) {
        // Only redirect to list for new product creation
        router.push(basePath);
      }
      
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const apiPath = userRole === 'admin' ? '/api/v2/commerce/products' : '/api/v2/vendors/products';
      const res = await fetch(`${apiPath}/${product.product_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !product.is_active }),
      });

      const data = await res.json();
      if (!data.success && res.ok) throw new Error(data.message || 'API request failed');
      
      if (res.ok && data.success) {
        toast.success(data.message || `Product ${!product.is_active ? 'activated' : 'deactivated'} successfully`);
        fetchProducts();
      } else {
        toast.error(data.error || 'Failed to update product status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update product status');
    }
  };

  const deleteProduct = async (product: Product) => {
    try {
      const apiPath = userRole === 'admin' ? '/api/v2/commerce/products' : '/api/v2/vendors/products';
      const res = await fetch(`${apiPath}/${product.product_id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.success && res.ok) throw new Error(data.message || 'API request failed');
      
      if (res.ok && data.success) {
        setShowDeleteModal(false);
        setProductToDelete(null);
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    router.push(basePath);
  };

  // Filter products for list mode
  let filteredProducts = products;
  
  if (searchQuery && isListMode) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.slug && p.slug.toLowerCase().includes(query))
    );
  }

  // RENDER LIST MODE
  if (isListMode) {
    return (
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userRole === 'admin' ? 'All Products' : 'My Products'}
              </h1>
              <p className="text-gray-600 mt-1">
                {userRole === 'admin' 
                  ? 'Manage all products in the system' 
                  : 'Manage your product catalog and listings'
                }
              </p>
            </div>
            <Link
              href={`${basePath}/new`}
              className="inline-flex items-center px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Product
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
            >
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
              <option value="base_price">Price</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
          </div>
        )}

        {/* Products Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.slug}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatCurrency(product.base_price)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={product.is_active ? 'text-green-600' : 'text-red-600'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={product.is_listing_enabled ? 'text-primary-red' : 'text-gray-400'}>
                          {product.is_listing_enabled ? 'Listed' : 'Unlisted'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(product.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`${basePath}/view/${product.product_id}`}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Product"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          <Link
                            href={`${basePath}/${product.product_id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Product"
                          >
                            <EditIcon className="h-5 w-5" />
                          </Link>
                          {userRole === 'vendor' && (
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/v2/vendors/products/clone', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      productId: product.product_id,
                                      customizations: {
                                        name: `${product.name} - Copy`,
                                        price: product.base_price,
                                        vendorDescription: `Cloned from ${product.name}`
                                      }
                                    }),
                                  });
                                  const data = await response.json();
                                  if (!data.success && response.ok) throw new Error(data.message || 'API request failed');
                                  if (response.ok && data.success) {
                                    toast.success('Product cloned successfully! The cloned product is inactive and ready for editing.');
                                    fetchProducts();
                                  } else {
                                    toast.error(data.error || 'Failed to clone product');
                                  }
                                } catch (error) {
                                  toast.error('Failed to clone product');
                                }
                              }}
                              className="text-purple-600 hover:text-purple-900"
                              title="Clone Product"
                            >
                              <Copy className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => toggleProductStatus(product)}
                            className={`${
                              product.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                            title={product.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {product.is_active ? (
                              <ToggleRightIcon className="h-5 w-5" />
                            ) : (
                              <ToggleLeftIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(product);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Product"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalProducts > productsPerPage && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * productsPerPage) + 1} to{' '}
                    {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} results
                  </div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, Math.ceil(totalProducts / productsPerPage)) }).map((_, i) => {
                      let pageNumber;
                      const totalPages = Math.ceil(totalProducts / productsPerPage);

                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else {
                        const start = Math.max(1, currentPage - 2);
                        const end = Math.min(totalPages, start + 4);
                        pageNumber = start + i;
                        
                        if (end - start < 4) {
                          pageNumber = Math.max(1, end - 4) + i;
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'bg-primary-red text-white border-primary-red'
                              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(totalProducts / productsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                        currentPage === Math.ceil(totalProducts / productsPerPage)
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Product</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{productToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteProduct(productToDelete)}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER FORM MODE (new/edit/view)
  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Products</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isViewMode ? 'View Product' : isEditMode ? 'Edit Product' : 'Create New Product'}
                </h1>
                <p className="text-gray-600">
                  {isViewMode 
                    ? 'View product details and specifications'
                    : isEditMode 
                    ? 'Update product information and settings'
                    : 'Add a new product to your catalog'
                  }
                </p>
              </div>
            </div>
            
            {!isViewMode && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveProduct}
                  disabled={saving}
                  className="px-6 py-2 bg-primary-red text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            )}
          </div>

          {/* Product Form Tabs */}
          <Tabs defaultValue="basic-info" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="fabric">Fabric</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="rendering3d">3D & Rendering</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="basic-info">
                <BasicInfo
                  data={productData.basicInfo}
                  categories={SHADE_CATEGORIES}
                  onChange={(data) => updateProductData('basicInfo', data)}
                  showVendorSelection={userRole === 'admin'}
                  isAdmin={userRole === 'admin'}
                  isReadOnly={isViewMode}
                />
              </TabsContent>

              <TabsContent value="options">
                <Options
                  data={productData.options}
                  onChange={(data) => updateProductData('options', data)}
                  isReadOnly={isViewMode}
                />
              </TabsContent>

              <TabsContent value="fabric">
                <Fabric
                  ref={fabricRef}
                  data={productData.fabric}
                  onChange={(data) => updateProductData('fabric', data)} // Update parent state to persist changes
                  isReadOnly={isViewMode}
                  productId={productId}
                />
              </TabsContent>

              <TabsContent value="pricing">
                <PricingMatrix
                  dimensions={productData.options.dimensions}
                  initialData={productData.pricing}
                  onChange={(data) => updateProductData('pricing', data)}
                  isReadOnly={isViewMode}
                />
              </TabsContent>

              <TabsContent value="images">
                <Images
                  images={productData.images}
                  onChange={(data) => updateProductData('images', data)}
                  isReadOnly={isViewMode}
                  productId={productId}
                />
              </TabsContent>

              <TabsContent value="features">
                <Features
                  features={productData.features}
                  onChange={(data) => updateProductData('features', data)}
                  isReadOnly={isViewMode}
                />
              </TabsContent>

              <TabsContent value="rooms">
                <RoomRecommendations
                  recommendations={productData.roomRecommendations}
                  onChange={(data) => updateProductData('roomRecommendations', data)}
                  isReadOnly={isViewMode}
                />
              </TabsContent>

              <TabsContent value="rendering3d">
                <Rendering3D
                  data={productData.rendering3D}
                  onChange={(data) => updateProductData('rendering3D', data)}
                  isReadOnly={isViewMode}
                  productId={productId}
                  fabrics={productData.fabric.fabrics.map(f => ({
                    id: f.id,
                    name: f.name,
                    texture_url: f.image?.url
                  }))}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}