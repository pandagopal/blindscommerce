'use client';

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { ChevronRight, ChevronLeft, Check, ChevronDown, HelpCircle, ShoppingCart, Info, Bookmark, CheckCircle } from "lucide-react";

interface Product {
  product_id: number;
  name: string;
  slug: string;
  category_name: string;
  category_slug: string;
  base_price: number;
  short_description: string;
  full_description: string;
  images: {
    image_id: number;
    image_url: string;
    is_primary: boolean;
  }[];
  colors: {
    color_id: number;
    name: string;
    hex_code: string;
    price_modifier: number;
    is_default: boolean;
  }[];
  materials: {
    material_id: number;
    name: string;
    description: string;
    price_modifier: number;
    is_default: boolean;
  }[];
}

interface MountType {
  id: number;
  name: string;
  description: string;
  priceModifier: number;
  isDefault: boolean;
}

interface ConfigState {
  mountType: number;
  width: number;
  height: number;
  colorId: number | null;
  materialId: number | null;
  controlType: string;
  quantity: number;
  currentPrice: number;
  totalPrice: number;
  step: number;
}

export default function ProductConfiguratorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mount Types (example data - would come from API in real app)
  const mountTypes: MountType[] = [
    { id: 1, name: 'Inside Mount', description: 'Fits inside the window frame for a clean look', priceModifier: 0, isDefault: true },
    { id: 2, name: 'Outside Mount', description: 'Mounts outside the window frame', priceModifier: 0, isDefault: false },
    { id: 3, name: 'Ceiling Mount', description: 'Attaches to the ceiling above window', priceModifier: 10, isDefault: false },
  ];

  // Control Types (example data - would come from API in real app)
  const controlTypes = [
    { id: 1, name: 'Standard Cord', description: 'Traditional pull cord', priceModifier: 0, isDefault: true },
    { id: 2, name: 'Cordless', description: 'Safe for homes with children and pets', priceModifier: 25, isDefault: false },
    { id: 3, name: 'Motorized', description: 'Remote-controlled operation', priceModifier: 99, isDefault: false },
  ];

  // Configuration state
  const [config, setConfig] = useState<ConfigState>({
    mountType: 1, // Default to inside mount
    width: 24, // Default width in inches
    height: 36, // Default height in inches
    colorId: null,
    materialId: null,
    controlType: 'Standard Cord',
    quantity: 1,
    currentPrice: 0,
    totalPrice: 0,
    step: 1, // Start at step 1
  });

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`, {
          next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await res.json();
        setProduct(data.product);

        // Set default color and material if available
        if (data.product) {
          const defaultColor = data.product.colors?.find((c: { is_default: boolean }) => c.is_default) || data.product.colors?.[0] || null;
          const defaultMaterial = data.product.materials?.find((m: { is_default: boolean }) => m.is_default) || data.product.materials?.[0] || null;

          setConfig(prev => ({
            ...prev,
            colorId: defaultColor?.color_id || null,
            materialId: defaultMaterial?.material_id || null,
            currentPrice: data.product.base_price,
            totalPrice: data.product.base_price,
          }));
        }

      } catch (error) {
        console.error('Error fetching product:', error);
        setError('There was an error loading the product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Calculate the price whenever configuration changes
  useEffect(() => {
    if (!product) return;

    // Start with base price
    let price = product.base_price;

    // Add mount type price modifier
    const selectedMount = mountTypes.find(m => m.id === config.mountType);
    if (selectedMount) {
      price += selectedMount.priceModifier;
    }

    // Add color price modifier
    if (config.colorId) {
      const selectedColor = product.colors.find(c => c.color_id === config.colorId);
      if (selectedColor) {
        price += selectedColor.price_modifier;
      }
    }

    // Add material price modifier
    if (config.materialId) {
      const selectedMaterial = product.materials.find(m => m.material_id === config.materialId);
      if (selectedMaterial) {
        price += selectedMaterial.price_modifier;
      }
    }

    // Add control type price modifier
    const selectedControl = controlTypes.find(c => c.name === config.controlType);
    if (selectedControl) {
      price += selectedControl.priceModifier;
    }

    // Size-based pricing (simplified - would be more complex in real app)
    const sizeMultiplier = (config.width * config.height) / (24 * 36);
    price = price * Math.max(1, sizeMultiplier);

    // Round to 2 decimal places
    price = Math.round(price * 100) / 100;

    // Update configuration state
    setConfig(prev => ({
      ...prev,
      currentPrice: price,
      totalPrice: price * prev.quantity
    }));
  }, [product, config.mountType, config.width, config.height, config.colorId, config.materialId, config.controlType, config.quantity]);

  // Handle step navigation
  const nextStep = () => {
    if (config.step < 5) { // Assuming 5 steps total
      setConfig(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    if (config.step > 1) {
      setConfig(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  // Handle adding product to cart
  const addToCart = () => {
    if (!product) return;

    // Find selected color and material
    const selectedColor = product.colors.find(c => c.color_id === config.colorId);
    const selectedMaterial = product.materials.find(m => m.material_id === config.materialId);

    // Get primary image
    const primaryImage = product.images.find(img => img.is_primary)?.image_url || product.images[0]?.image_url;

    // Create cart item
    const cartItem = {
      id: Number(Date.now()), // Temporary ID
      productId: product.product_id,
      name: product.name,
      slug: product.slug,
      price: config.currentPrice,
      quantity: config.quantity,
      width: config.width,
      height: config.height,
      colorId: selectedColor?.color_id || undefined, // Change from null to undefined
      colorName: selectedColor?.name,
      materialId: selectedMaterial?.material_id || undefined, // Change from null to undefined
      materialName: selectedMaterial?.name,
      image: primaryImage,
      totalPrice: config.totalPrice,
    };

    // Add to cart
    addItem(cartItem);

    // Redirect to cart page
    router.push('/cart');
  };

  // Function to save the current configuration
  const saveConfiguration = async () => {
    if (!product || !configName.trim()) return;

    setSaving(true);
    try {
      // Find selected color and material
      const selectedColor = product.colors.find(c => c.color_id === config.colorId);
      const selectedMaterial = product.materials.find(m => m.material_id === config.materialId);

      // Get primary image
      const primaryImage = product.images.find(img => img.is_primary)?.image_url || product.images[0]?.image_url;

      // Get mount type name
      const selectedMount = mountTypes.find(m => m.id === config.mountType);

      // Create configuration object
      const configData = {
        width: config.width,
        height: config.height,
        colorId: config.colorId,
        colorName: selectedColor?.name,
        materialId: config.materialId,
        materialName: selectedMaterial?.name,
        mountType: config.mountType,
        mountTypeName: selectedMount?.name,
        controlType: config.controlType,
        currentPrice: config.currentPrice,
        image: primaryImage
      };

      // Save configuration to the API
      const response = await fetch('/api/account/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.product_id,
          name: configName,
          configuration: configData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveDialog(false);
        setSaveSuccess(false);
        setConfigName('');
      }, 2000);
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setSaving(false);
    }
  };

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

  // Function to render different steps of the configurator
  const renderConfigStep = () => {
    if (!product) return null;

    switch (config.step) {
      case 1: // Mount Type & Dimensions
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-3">1. Select Mount Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {mountTypes.map((mount) => (
                  <div
                    key={mount.id}
                    className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                      config.mountType === mount.id
                        ? 'border-primary-red bg-red-50'
                        : 'border-gray-200 hover:border-primary-red'
                    }`}
                    onClick={() => setConfig({ ...config, mountType: mount.id })}
                  >
                    <div className="flex justify-center items-center h-16 mb-2">
                      {config.mountType === mount.id && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-5 w-5 text-primary-red" />
                        </div>
                      )}
                      <span>{mount.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{mount.description}</p>
                    {mount.priceModifier > 0 && (
                      <p className="text-xs text-primary-red mt-1">+${mount.priceModifier.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">2. Enter Dimensions</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (inches)
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      min="12"
                      max="96"
                      step="0.125"
                      value={config.width}
                      onChange={(e) => setConfig({ ...config, width: parseFloat(e.target.value) || 12 })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <div className="ml-2 flex items-center">
                      <button
                        className="p-1 border border-gray-300 rounded-l-md"
                        onClick={() => setConfig({ ...config, width: Math.max(12, config.width - 0.125) })}
                      >
                        -
                      </button>
                      <button
                        className="p-1 border-t border-r border-b border-gray-300 rounded-r-md"
                        onClick={() => setConfig({ ...config, width: Math.min(96, config.width + 0.125) })}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Min: 12" - Max: 96"</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (inches)
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      min="12"
                      max="108"
                      step="0.125"
                      value={config.height}
                      onChange={(e) => setConfig({ ...config, height: parseFloat(e.target.value) || 12 })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <div className="ml-2 flex items-center">
                      <button
                        className="p-1 border border-gray-300 rounded-l-md"
                        onClick={() => setConfig({ ...config, height: Math.max(12, config.height - 0.125) })}
                      >
                        -
                      </button>
                      <button
                        className="p-1 border-t border-r border-b border-gray-300 rounded-r-md"
                        onClick={() => setConfig({ ...config, height: Math.min(108, config.height + 0.125) })}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Min: 12" - Max: 108"</p>
                </div>
              </div>
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <div className="flex">
                  <Info size={14} className="mr-1 flex-shrink-0" />
                  <span>For the most accurate fit, measure to the nearest 1/8 inch.</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Colors
        return (
          <div>
            <h2 className="text-lg font-medium mb-3">3. Select Color</h2>
            {product.colors && product.colors.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {product.colors.map((color) => (
                  <div
                    key={color.color_id}
                    className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                      config.colorId === color.color_id
                        ? 'border-primary-red bg-red-50'
                        : 'border-gray-200 hover:border-primary-red'
                    }`}
                    onClick={() => setConfig({ ...config, colorId: color.color_id })}
                  >
                    <div className="relative flex justify-center items-center mb-2">
                      {config.colorId === color.color_id && (
                        <div className="absolute top-0 right-0">
                          <Check className="h-5 w-5 text-primary-red" />
                        </div>
                      )}
                      <div
                        className="w-12 h-12 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex_code }}
                      ></div>
                    </div>
                    <p className="text-sm">{color.name}</p>
                    {color.price_modifier > 0 && (
                      <p className="text-xs text-primary-red mt-1">+${color.price_modifier.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No color options available for this product.</p>
            )}
          </div>
        );

      case 3: // Materials
        return (
          <div>
            <h2 className="text-lg font-medium mb-3">4. Select Material</h2>
            {product.materials && product.materials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.materials.map((material) => (
                  <div
                    key={material.material_id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      config.materialId === material.material_id
                        ? 'border-primary-red bg-red-50'
                        : 'border-gray-200 hover:border-primary-red'
                    }`}
                    onClick={() => setConfig({ ...config, materialId: material.material_id })}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{material.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                      </div>
                      {config.materialId === material.material_id && (
                        <Check className="h-5 w-5 text-primary-red" />
                      )}
                    </div>
                    {material.price_modifier > 0 && (
                      <p className="text-sm text-primary-red mt-2">+${material.price_modifier.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No material options available for this product.</p>
            )}
          </div>
        );

      case 4: // Control Type
        return (
          <div>
            <h2 className="text-lg font-medium mb-3">5. Select Control Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {controlTypes.map((control) => (
                <div
                  key={control.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    config.controlType === control.name
                      ? 'border-primary-red bg-red-50'
                      : 'border-gray-200 hover:border-primary-red'
                  }`}
                  onClick={() => setConfig({ ...config, controlType: control.name })}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{control.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{control.description}</p>
                    </div>
                    {config.controlType === control.name && (
                      <Check className="h-5 w-5 text-primary-red" />
                    )}
                  </div>
                  {control.priceModifier > 0 && (
                    <p className="text-sm text-primary-red mt-2">+${control.priceModifier.toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 5: // Review & Add to Cart - with save option
        return (
          <div>
            <h2 className="text-lg font-medium mb-3">Review Your Configuration</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-lg mb-3 border-b pb-2">{product.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mount Type:</span>
                  <span>{mountTypes.find(m => m.id === config.mountType)?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensions:</span>
                  <span>{config.width}" × {config.height}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color:</span>
                  <span>{product.colors.find(c => c.color_id === config.colorId)?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material:</span>
                  <span>{product.materials.find(m => m.material_id === config.materialId)?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Control Type:</span>
                  <span>{config.controlType}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Price:</span>
                    <span>${config.currentPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex w-32">
                <button
                  className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-100"
                  onClick={() => setConfig({ ...config, quantity: Math.max(1, config.quantity - 1) })}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={config.quantity}
                  onChange={(e) => setConfig({ ...config, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-12 text-center border-t border-b border-gray-300"
                />
                <button
                  className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-100"
                  onClick={() => setConfig({ ...config, quantity: config.quantity + 1 })}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={addToCart}
                className="flex-1 flex items-center justify-center bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart - ${config.totalPrice.toFixed(2)}
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg border border-blue-200 transition-colors"
              >
                <Bookmark className="mr-2 h-5 w-5" />
                Save
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/products/${slug}`}
          className="text-primary-red hover:underline flex items-center"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Product
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">
          Configure Your {product?.name}
        </h1>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div
            className="bg-primary-red h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(config.step / 5) * 100}%` }}
          ></div>
        </div>

        {/* Progress steps */}
        <div className="flex justify-between mb-8">
          {['Dimensions', 'Colors', 'Materials', 'Controls', 'Review'].map((step, index) => (
            <div
              key={index}
              className={`flex flex-col items-center cursor-pointer transition-colors ${
                config.step > index + 1 ? 'text-primary-red' : config.step === index + 1 ? 'text-primary-red' : 'text-gray-400'
              }`}
              onClick={() => setConfig({ ...config, step: index + 1 })}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                config.step > index + 1 ? 'bg-primary-red text-white' :
                config.step === index + 1 ? 'border-2 border-primary-red text-primary-red' :
                'border border-gray-300 text-gray-400'
              }`}>
                {config.step > index + 1 ? <Check size={16} /> : index + 1}
              </div>
              <span className="text-xs hidden sm:block">{step}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Product Preview */}
          <div className="lg:col-span-2 border border-gray-200 rounded-lg p-4 flex items-center justify-center h-[400px] bg-white">
            {product?.images && product.images.length > 0 ? (
              <img
                src={product.images[0].image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400">Product Preview</div>
            )}
          </div>

          {/* Right side - Configuration Options */}
          <div className="space-y-6">
            {renderConfigStep()}

            <div>
              <h2 className="text-lg font-medium mb-2">Current Price</h2>
              <div className="text-2xl font-bold text-primary-red">
                ${config.currentPrice.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">
                Price based on selected options
              </p>
            </div>

            <div className="flex justify-between mt-8">
              {config.step > 1 && (
                <button
                  onClick={prevStep}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </button>
              )}

              {config.step < 5 && (
                <button
                  onClick={nextStep}
                  className="flex items-center ml-auto px-4 py-2 bg-primary-red text-white rounded-md hover:bg-primary-red-dark"
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Information Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-lg mb-2">Need Help Measuring?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Our guides make it easy to get accurate measurements for the perfect fit.
          </p>
          <Link
            href="/measure-install"
            className="text-primary-red hover:underline text-sm font-medium flex items-center"
          >
            View Measuring Guide
            <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-lg mb-2">Professional Installation</h3>
          <p className="text-sm text-gray-600 mb-3">
            Let the pros handle it for you. We offer professional installation services.
          </p>
          <Link
            href="/measure-install"
            className="text-primary-red hover:underline text-sm font-medium flex items-center"
          >
            Learn About Installation
            <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-lg mb-2">100% Satisfaction Guarantee</h3>
          <p className="text-sm text-gray-600 mb-3">
            Not happy with your purchase? We'll make it right.
          </p>
          <Link
            href="/help"
            className="text-primary-red hover:underline text-sm font-medium flex items-center"
          >
            Read Our Guarantee
            <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>

      {/* Save Configuration Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Save Your Configuration</h3>
            {saveSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">Configuration Saved!</p>
                <p className="text-gray-500">You can view your saved configurations in your account.</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Save this configuration to access it later from your account.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Name
                  </label>
                  <input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g. Living Room Window"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveConfiguration}
                    disabled={saving || !configName.trim()}
                    className={`flex-1 py-2 rounded-md ${
                      configName.trim()
                        ? 'bg-primary-red text-white hover:bg-primary-red-dark'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    } flex items-center justify-center`}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
