'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { ChevronRight, ChevronLeft, Check, Bookmark, ShoppingCart, Info, CheckCircle } from "lucide-react";
import { ConfigProvider, useConfig, Product } from "./components/ConfigurationContext";
import StepContent from "./components/StepContent";

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

  // Use the ConfigProvider to manage configuration state
  return (
    <ConfigProvider productData={product} addToCartFn={addItem}>
      <ConfiguratorContent slug={slug} />
    </ConfigProvider>
  );
}

// Separate component that uses the context
function ConfiguratorContent({ slug }: { slug: string }) {
  const {
    product,
    config,
    setConfig,
    nextStep,
    prevStep,
    showSaveDialog,
    setShowSaveDialog,
    configName,
    setConfigName,
    saving,
    saveSuccess,
    saveConfiguration,
    addToCart,
    toggleRoomView,
    canProceedToNextStep,
    stepValidation,
  } = useConfig();

  // Helper function to get step status
  const getStepStatus = (stepNumber: number) => {
    if (config.step > stepNumber) {
      return stepValidation[stepNumber] ? 'completed' : 'error';
    }
    if (config.step === stepNumber) {
      return 'current';
    }
    return 'upcoming';
  };

  // Get text for next button based on validation
  const getNextButtonText = () => {
    if (!canProceedToNextStep) {
      switch (config.step) {
        case 1:
          return 'Please enter valid dimensions';
        case 2:
          return 'Please select a color';
        case 3:
          return 'Please select a material';
        case 4:
          return 'Please select control type';
        case 5:
          return 'Please select rail options';
        case 6:
          return 'Please select room type';
        default:
          return 'Complete required fields';
      }
    }
    return 'Next';
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
            style={{ width: `${(config.step / 7) * 100}%` }}
          ></div>
        </div>

        {/* Progress steps */}
        <div className="flex justify-between mb-8">
          {['Dimensions', 'Colors', 'Materials', 'Controls', 'Rail Options', 'Room View', 'Review'].map((step, index) => {
            const status = getStepStatus(index + 1);
            return (
              <div
                key={index}
                className={`flex flex-col items-center cursor-pointer transition-colors ${
                  status === 'completed' ? 'text-primary-red' :
                  status === 'current' ? 'text-primary-red' :
                  status === 'error' ? 'text-red-500' :
                  'text-gray-400'
                }`}
                onClick={() => {
                  // Only allow clicking on completed steps or the next available step
                  if (status === 'completed' || (index + 1) === config.step) {
                    setConfig({ ...config, step: index + 1 });
                  }
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  status === 'completed' ? 'bg-primary-red text-white' :
                  status === 'current' ? 'border-2 border-primary-red text-primary-red' :
                  status === 'error' ? 'border-2 border-red-500 text-red-500' :
                  'border border-gray-300 text-gray-400'
                }`}>
                  {status === 'completed' ? <Check size={16} /> : index + 1}
                </div>
                <span className="text-xs hidden sm:block">{step}</span>
                {status === 'error' && (
                  <span className="absolute mt-12 text-xs text-red-500">Required</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Product Preview */}
          <div className={`lg:col-span-2 border border-gray-200 rounded-lg p-4 flex flex-col ${
            config.showRoomView ? 'items-start justify-start' : 'items-center justify-center'
          } h-[400px] bg-white`}>
            {config.showRoomView ? (
              <div className="w-full h-full flex flex-col">
                <button
                  onClick={toggleRoomView}
                  className="mb-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Back to Product View
                </button>
                <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  Room Visualization Mode
                  <br />
                  (Actual room visualization would appear here)
                </div>
              </div>
            ) : (
              product?.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].image_url}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-400">Product Preview</div>
              )
            )}
          </div>

          {/* Right side - Configuration Options */}
          <div className="space-y-6">
            <StepContent />

            <div>
              <h2 className="text-lg font-medium mb-2">Current Price</h2>
              <div className="text-2xl font-bold text-primary-red">
                ${config.currentPrice.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">
                Price based on selected options
              </p>
            </div>

            {!config.showRoomView && config.step === 6 && (
              <button
                onClick={toggleRoomView}
                className="w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md flex items-center justify-center transition-colors"
              >
                <Info className="mr-2 h-4 w-4" />
                View in Room
              </button>
            )}

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

              {config.step < 7 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceedToNextStep}
                  className={`flex items-center ml-auto px-4 py-2 rounded-md transition-colors ${
                    canProceedToNextStep
                      ? 'bg-primary-red text-white hover:bg-primary-red-dark'
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
                  title={!canProceedToNextStep ? getNextButtonText() : undefined}
                >
                  {getNextButtonText()}
                  <ChevronRight size={16} className="ml-1" />
                </button>
              ) : (
                <div className="flex space-x-3 ml-auto">
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-md border border-blue-200 transition-colors"
                  >
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={addToCart}
                    className="flex items-center justify-center bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-md transition-colors"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
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
