'use client';

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Product } from "./components/ConfigurationContext";
import NewProductConfigurator from "./components/NewProductConfigurator";
import NoDrillHighlight from "@/components/ui/NoDrillHighlight";
import { toast } from "sonner";
import { StickyAddToCart, EstimatedDelivery } from "@/components/ecommerce";

export default function ProductConfiguratorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { addItem, updateItem, items } = useCart();
  const { user } = useAuth();
  const editCartItemId = searchParams.get('edit');

  const [product, setProduct] = useState<Product | null>(null);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for sticky add to cart
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isConfigured, setIsConfigured] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<any>(null);

  // Scroll to top when page loads
  useEffect(() => {
    // Use smooth scrolling for better UX
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Also try to focus on the main content for accessibility
    document.body.focus();
  }, [slug]); // Re-run if slug changes

  // Fetch room types from database (all rooms, not just active ones)
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        // Use ?all=true to get all rooms including inactive (is_active is for home page only)
        const res = await fetch('/api/v2/content/rooms?all=true');
        if (res.ok) {
          const data = await res.json();
          const rooms = data.data?.rooms || data.rooms || data.data || [];
          // Sort alphabetically by name
          const sortedRooms = rooms
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
            .map((room: any) => room.name);
          setRoomTypes(sortedRooms);
        }
      } catch (error) {
        console.error('Error fetching room types:', error);
        // Fallback will be handled by the component
      }
    };
    fetchRoomTypes();
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Search for the product by slug
        const res = await fetch(`/api/v2/commerce/products?search=${encodeURIComponent(slug)}&limit=10`);

        if (!res.ok) {
          const errorData = await res.text();
          console.error('Product fetch failed:', res.status, errorData);
          throw new Error(`Failed to fetch product: ${res.status}`);
        }

        const data = await res.json();
        
        // Find the product with exact matching slug
        // Handle both paginated and non-paginated responses
        const products = data.data?.data || data.data?.products || data.products || data.data || [];
        const product = Array.isArray(products) ? products.find((p: any) => p.slug === slug) : null;
        
        if (!product) {
          console.error('Product not found in results:', { slug, products: products.map((p: any) => p.slug) });
          throw new Error('Product not found');
        }
        
        // Get detailed product information if product_id exists
        if (product.product_id) {
          try {
            // Get product details with configuration options from commerce API
            const detailRes = await fetch(`/api/v2/commerce/products/${product.product_id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              const productToSet = detailData.data || detailData;
              
              // Apply fallback values for dimension limits if they're NULL
              if (!productToSet.custom_width_min) productToSet.custom_width_min = 12;
              if (!productToSet.custom_width_max) productToSet.custom_width_max = 95;
              if (!productToSet.custom_height_min) productToSet.custom_height_min = 10;
              if (!productToSet.custom_height_max) productToSet.custom_height_max = 300;
              
              setProduct(productToSet);
            } else {
              // Apply fallback values for search result too
              if (!product.custom_width_min) product.custom_width_min = 12;
              if (!product.custom_width_max) product.custom_width_max = 95;
              if (!product.custom_height_min) product.custom_height_min = 10;
              if (!product.custom_height_max) product.custom_height_max = 300;
              setProduct(product);
            }
          } catch (detailError) {
            console.warn('Could not fetch detailed product info, using search result:', detailError);
            // Apply fallback values for search result too
            if (!product.custom_width_min) product.custom_width_min = 12;
            if (!product.custom_width_max) product.custom_width_max = 95;
            if (!product.custom_height_min) product.custom_height_min = 10;
            if (!product.custom_height_max) product.custom_height_max = 300;
            setProduct(product);
          }
        } else {
          // Apply fallback values for search result too
          if (!product.custom_width_min) product.custom_width_min = 12;
          if (!product.custom_width_max) product.custom_width_max = 95;
          if (!product.custom_height_min) product.custom_height_min = 10;
          if (!product.custom_height_max) product.custom_height_max = 300;
          setProduct(product);
        }
      } catch (error: any) {
        console.error('Error fetching product:', error);
        setError(`There was an error loading the product: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded w-full max-w-md"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Product</h2>
        <p className="text-gray-600 mb-6">{error || 'Product not found'}</p>
        <Link
          href="/products"
          className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Return to Products
        </Link>
      </div>
    );
  }

  const handleAddToCart = (config: any, calculatedPrice: number) => {
    // Find fabric name from product data if fabricType is an ID
    let fabricName = config.fabricOption || '';
    if (config.fabricType && product.fabricOptions) {
      const selectedFabric = product.fabricOptions.find((f: any) =>
        f.fabric_option_id?.toString() === config.fabricType ||
        f.id?.toString() === config.fabricType
      );
      if (selectedFabric) {
        fabricName = selectedFabric.fabric_name || selectedFabric.name || fabricName;
      }
    }

    // Convert configuration to cart item format
    const cartItem = {
      cart_item_id: Date.now(), // Temporary ID until saved to database
      cart_id: 0, // Will be set by cart context
      product_id: product.product_id,
      productId: product.product_id, // API expects productId (camelCase)
      vendor_id: product.vendor_id, // Add vendor_id for the API
      vendorId: product.vendor_id, // API expects vendorId (camelCase)
      quantity: 1,
      width: parseFloat(config.width || 0),
      height: parseFloat(config.height || 0),
      unit_price: calculatedPrice,
      // UI fields
      name: product.name,
      slug: product.slug,
      image: product.images?.[0]?.image_url || '',
      totalPrice: calculatedPrice,
      // Pass ALL configuration options
      ...config, // This includes all fields from the configurator
      controlType: config.controlOption, // Map controlOption to controlType for consistency
      fabricName: fabricName, // Add the fabric name for display
      configuration: {
        vendorId: product.vendor_id, // Always include vendor_id in configuration
        roomType: config.roomType,
        mountType: config.mountType,
        width: config.width,
        height: config.height,
        widthFraction: config.widthFraction,
        heightFraction: config.heightFraction,
        fabricType: config.fabricType,
        fabricOption: config.fabricOption,
        colorOption: config.colorOption,
        liftSystem: config.liftSystem,
        controlOption: config.controlOption,
        valanceOption: config.valanceOption,
        bottomRailOption: config.bottomRailOption
      } // API expects configuration object
    };

    if (editCartItemId) {
      // If editing, update the existing item
      updateItem(parseInt(editCartItemId), cartItem);
      toast.success('Item updated in cart!');
    } else {
      addItem(cartItem);
      toast.success('Item added to cart!');
    }
  };

  // Callback for price and configuration updates from configurator
  const handleConfigurationChange = (config: any, price: number, isComplete: boolean) => {
    setCurrentPrice(price);
    setIsConfigured(isComplete);
    setPendingConfig(config);
  };

  // Handle sticky add to cart click
  const handleStickyAddToCart = () => {
    if (pendingConfig && isConfigured) {
      handleAddToCart(pendingConfig, currentPrice);
    }
  };

  // Get initial configuration from URL params
  const getInitialConfig = () => {
    const config: any = {};
    searchParams.forEach((value, key) => {
      if (key !== 'edit') {
        config[key] = value;
      }
    });
    
    // Convert decimal width/height back to whole number + eighths
    if (config.width) {
      const widthNum = parseFloat(config.width);
      const wholeWidth = Math.floor(widthNum);
      const fractionWidth = widthNum - wholeWidth;
      
      // Convert decimal fraction to nearest eighth
      const eighths = Math.round(fractionWidth * 8);
      config.width = wholeWidth.toString();
      config.widthFraction = (eighths / 8).toString();
    }
    
    if (config.height) {
      const heightNum = parseFloat(config.height);
      const wholeHeight = Math.floor(heightNum);
      const fractionHeight = heightNum - wholeHeight;
      
      // Convert decimal fraction to nearest eighth
      const eighths = Math.round(fractionHeight * 8);
      config.height = wholeHeight.toString();
      config.heightFraction = (eighths / 8).toString();
    }
    
    return config;
  };

  return (
    <div>
      <NewProductConfigurator
        product={product}
        slug={slug}
        onAddToCart={handleAddToCart}
        initialConfig={getInitialConfig()}
        isEditMode={!!editCartItemId}
        userRole={user?.role}
        roomTypes={roomTypes}
        onConfigurationChange={handleConfigurationChange}
      />

      {/* Estimated Delivery Section */}
      <div className="container mx-auto px-4 py-6">
        <EstimatedDelivery
          processingDays={5}
          shippingDays={{ min: 3, max: 7 }}
          isCustomProduct={true}
        />
      </div>

      {/* Guarantees and Features */}
      <div className="container mx-auto px-4 py-8 space-y-4">
        <NoDrillHighlight variant="banner" />
      </div>

      {/* Sticky Add to Cart - Only show for customers */}
      {user?.role === 'customer' && (
        <StickyAddToCart
          productName={product.name}
          price={currentPrice}
          imageUrl={product.images?.[0]?.image_url}
          onAddToCart={handleStickyAddToCart}
          isConfigured={isConfigured}
          showAfterScroll={500}
          disabled={!isConfigured}
        />
      )}
    </div>
  );
}
