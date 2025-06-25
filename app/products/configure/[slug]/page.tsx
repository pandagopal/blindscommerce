'use client';

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Product } from "./components/ConfigurationContext";
import NewProductConfigurator from "./components/NewProductConfigurator";
import SatisfactionGuarantee from "@/components/ui/SatisfactionGuarantee";
import PriceMatchGuarantee from "@/components/ui/PriceMatchGuarantee";
import NoDrillHighlight from "@/components/ui/NoDrillHighlight";
import { toast } from "sonner";

export default function ProductConfiguratorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { addItem, updateQuantity, removeItem, items } = useCart();
  const { user } = useAuth();
  const editCartItemId = searchParams.get('edit');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Fetching product with slug
        const res = await fetch(`/api/products/${slug}?configure=true`);

        if (!res.ok) {
          const errorData = await res.text();
          console.error('Product fetch failed:', res.status, errorData);
          throw new Error(`Failed to fetch product: ${res.status}`);
        }

        const data = await res.json();
        setProduct(data.product);
      } catch (error) {
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

  const handleAddToCart = (config: any) => {
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
      quantity: 1,
      width: parseFloat(config.width || 0),
      height: parseFloat(config.height || 0),
      unit_price: parseFloat(config.width || 0) * parseFloat(config.height || 0) * 0.10 + (product.base_price || 33.99),
      // UI fields
      name: product.name,
      slug: product.slug,
      image: product.images?.[0]?.image_url || '',
      totalPrice: parseFloat(config.width || 0) * parseFloat(config.height || 0) * 0.10 + (product.base_price || 33.99),
      // Pass ALL configuration options
      ...config, // This includes all fields from the configurator
      controlType: config.controlOption, // Map controlOption to controlType for consistency
      fabricName: fabricName, // Add the fabric name for display
    };
    
    if (editCartItemId) {
      // If editing, remove old item and add new one
      const oldItem = items.find(item => item.cart_item_id === parseInt(editCartItemId));
      if (oldItem) {
        removeItem(oldItem.cart_item_id);
      }
      addItem(cartItem);
      toast.success('Item updated in cart!');
    } else {
      addItem(cartItem);
      toast.success('Item added to cart!');
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
      />
      
      {/* Guarantees and Features */}
      <div className="container mx-auto px-4 py-8 space-y-4">
        <SatisfactionGuarantee variant="banner" />
        <PriceMatchGuarantee variant="banner" productId={product?.id?.toString()} />
        <NoDrillHighlight variant="banner" />
      </div>
    </div>
  );
}
