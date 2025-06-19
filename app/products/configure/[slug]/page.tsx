'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { Product } from "./components/ConfigurationContext";
import NewProductConfigurator from "./components/NewProductConfigurator";
import SatisfactionGuarantee from "@/components/ui/SatisfactionGuarantee";
import PriceMatchGuarantee from "@/components/ui/PriceMatchGuarantee";
import NoDrillHighlight from "@/components/ui/NoDrillHighlight";

export default function ProductConfiguratorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCart();

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
        const res = await fetch(`/api/products/${slug}?configure=true`, {
          next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await res.json();
        setProduct(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('There was an error loading the product. Please try again later.');
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
    // Convert configuration to cart item format
    const cartItem = {
      id: product.id,
      name: product.name,
      price: parseFloat(config.width || 0) * parseFloat(config.height || 0) * 0.10 + (product.base_price || 33.99),
      quantity: 1,
      image: product.images?.[0]?.image_url || '',
      options: {
        roomType: config.roomType,
        mountType: config.mountType,
        width: `${config.width}${config.widthFraction !== '0' ? ` ${config.widthFraction}` : ''}"`,
        height: `${config.height}${config.heightFraction !== '0' ? ` ${config.heightFraction}` : ''}"`,
        fabricType: config.fabricType,
        controlOption: config.controlOption,
        valanceOption: config.valanceOption,
        bottomRailOption: config.bottomRailOption,
      }
    };
    
    addItem(cartItem);
  };

  return (
    <div>
      <NewProductConfigurator 
        product={product} 
        slug={slug} 
        onAddToCart={handleAddToCart}
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
