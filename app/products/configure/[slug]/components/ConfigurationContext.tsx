'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  width: number;
  height: number;
  colorId?: number;
  colorName?: string;
  materialId?: number;
  materialName?: string;
  mountType?: number;
  mountTypeName?: string;
  controlType: string;
  headrailId?: number;
  headrailName?: string;
  bottomRailId?: number;
  bottomRailName?: string;
  image?: string;
  totalPrice: number;
}

// Define types for mount options
export interface MountType {
  id: number;
  name: string;
  description: string;
  priceModifier: number;
  isDefault: boolean;
}

// Define types for control options 
export interface ControlType {
  id: number;
  name: string;
  description: string;
  priceModifier: number;
  isDefault: boolean;
}

// Define types for headrail options
export interface HeadrailOption {
  id: number;
  name: string;
  description: string;
  priceModifier: number;
  isDefault: boolean;
}

// Define types for bottom rail options
export interface BottomRailOption {
  id: number;
  name: string;
  description: string;
  priceModifier: number;
  isDefault: boolean;
}

// Define types for room recommendation
export interface RoomRecommendation {
  id: number;
  name: string;
  description: string;
  score: number;
}

// Define type for the product
export interface Product {
  product_id: number;
  name: string;
  slug: string;
  base_price: number;
  colors: Array<{
    color_id: number;
    name: string;
    hex_code: string;
    price_modifier: number;
  }>;
  materials: Array<{
    material_id: number;
    name: string;
    description: string;
    price_modifier: number;
  }>;
  images: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
}

// Configuration state
export interface ConfigState {
  mountType: number;
  width: number;
  height: number;
  colorId?: number;
  materialId?: number;
  controlType: string;
  headrailId?: number;
  bottomRailId?: number;
  quantity: number;
  currentPrice: number;
  totalPrice: number;
  step: number;
  roomType?: string;
  showRoomView: boolean;
}

// Add validation interface
interface StepValidation {
  [key: number]: boolean;
}

// Update ConfigContextType to include validation
interface ConfigContextType {
  product: Product | null;
  loading: boolean;
  error: string | null;
  config: ConfigState;
  setConfig: React.Dispatch<React.SetStateAction<ConfigState>>;
  mountTypes: MountType[];
  controlTypes: ControlType[];
  headrailOptions: HeadrailOption[];
  bottomRailOptions: BottomRailOption[];
  roomRecommendations: RoomRecommendation[];
  showSaveDialog: boolean;
  setShowSaveDialog: React.Dispatch<React.SetStateAction<boolean>>;
  configName: string;
  setConfigName: React.Dispatch<React.SetStateAction<string>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  saveSuccess: boolean;
  setSaveSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  addToCart: () => void;
  saveConfiguration: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  toggleRoomView: () => void;
  stepValidation: StepValidation;
  canProceedToNextStep: boolean;
}

// Create the context
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Provider component
export function ConfigProvider({
  children,
  productData,
  addToCartFn
}: {
  children: ReactNode;
  productData: Product | null;
  addToCartFn: (item: CartItem) => void;
}) {
  const [product] = useState<Product | null>(productData);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [stepValidation, setStepValidation] = useState<StepValidation>({});
  const [canProceedToNextStep, setCanProceedToNextStep] = useState(false);

  // Sample options with proper typing
  const mountTypes = React.useMemo<MountType[]>(() => [
    { id: 1, name: 'Inside Mount', description: 'Fits inside the window frame for a clean look', priceModifier: 0, isDefault: true },
    { id: 2, name: 'Outside Mount', description: 'Mounts outside the window frame', priceModifier: 0, isDefault: false },
    { id: 3, name: 'Ceiling Mount', description: 'Attaches to the ceiling above window', priceModifier: 10, isDefault: false },
    { id: 4, name: 'No-Drill Tension', description: 'No drilling required - uses tension to stay in place', priceModifier: 15, isDefault: false },
    { id: 5, name: 'No-Drill Magnetic', description: 'Magnetic brackets for metal window frames', priceModifier: 20, isDefault: false },
    { id: 6, name: 'No-Drill Adhesive', description: 'Strong adhesive strips - no holes or damage', priceModifier: 12, isDefault: false },
  ], []);

  const controlTypes = React.useMemo<ControlType[]>(() => [
    { id: 1, name: 'Standard Cord', description: 'Traditional pull cord', priceModifier: 0, isDefault: true },
    { id: 2, name: 'Cordless', description: 'Safe for homes with children and pets', priceModifier: 25, isDefault: false },
    { id: 3, name: 'Motorized', description: 'Remote-controlled operation', priceModifier: 99, isDefault: false },
  ], []);

  const headrailOptions = React.useMemo<HeadrailOption[]>(() => [
    { id: 1, name: 'Standard', description: 'Basic headrail', priceModifier: 0, isDefault: true },
    { id: 2, name: 'Decorative', description: 'Enhanced visual appeal', priceModifier: 15, isDefault: false },
    { id: 3, name: 'Fabric-Wrapped', description: 'Matching fabric covering', priceModifier: 25, isDefault: false },
  ], []);

  const bottomRailOptions = React.useMemo<BottomRailOption[]>(() => [
    { id: 1, name: 'Standard', description: 'Basic bottom rail', priceModifier: 0, isDefault: true },
    { id: 2, name: 'Weighted', description: 'Extra weight for stability', priceModifier: 10, isDefault: false },
    { id: 3, name: 'Fabric-Wrapped', description: 'Matching fabric covering', priceModifier: 20, isDefault: false },
  ], []);

  const roomRecommendations = React.useMemo<RoomRecommendation[]>(() => [
    { id: 1, name: 'Living Room', description: 'Perfect for large windows and social spaces', score: 5 },
    { id: 2, name: 'Bedroom', description: 'Ideal for light control and privacy', score: 4 },
    { id: 3, name: 'Kitchen', description: 'Easy to clean and maintain', score: 4 },
    { id: 4, name: 'Bathroom', description: 'Water resistant and privacy focused', score: 3 },
    { id: 5, name: 'Office', description: 'Reduces glare on screens', score: 4 },
  ], []);

  // Configuration state with proper typing
  const [config, setConfig] = useState<ConfigState>({
    mountType: mountTypes[0].id,
    width: 24,
    height: 36,
    colorId: undefined,
    materialId: undefined,
    controlType: controlTypes[0].name,
    headrailId: headrailOptions[0].id,
    bottomRailId: bottomRailOptions[0].id,
    quantity: 1,
    currentPrice: 0,
    totalPrice: 0,
    step: 1,
    roomType: undefined,
    showRoomView: false,
  });

  // Validation logic with proper typing
  const validateStep = React.useCallback((step: number, currentConfig: ConfigState): boolean => {
    if (!product) return false;

    switch (step) {
      case 1:
        const validWidth = currentConfig.width >= 12 && currentConfig.width <= 96 && 
                         (currentConfig.width * 8) % 1 === 0;
        const validHeight = currentConfig.height >= 12 && currentConfig.height <= 108 && 
                          (currentConfig.height * 8) % 1 === 0;
        return currentConfig.mountType > 0 && validWidth && validHeight;

      case 2:
        return typeof currentConfig.colorId === 'number' && 
               product.colors.some(c => c.color_id === currentConfig.colorId);

      case 3:
        return typeof currentConfig.materialId === 'number' && 
               product.materials.some(m => m.material_id === currentConfig.materialId);

      case 4:
        return typeof currentConfig.controlType === 'string' && 
               controlTypes.some(c => c.name === currentConfig.controlType);

      case 5:
        return typeof currentConfig.headrailId === 'number' && 
               typeof currentConfig.bottomRailId === 'number' &&
               headrailOptions.some(h => h.id === currentConfig.headrailId) &&
               bottomRailOptions.some(b => b.id === currentConfig.bottomRailId);

      case 6:
        return typeof currentConfig.roomType === 'string' && 
               currentConfig.roomType.length > 0;

      case 7:
        return true;

      default:
        return false;
    }
  }, [product, controlTypes, headrailOptions, bottomRailOptions]);

  // Calculate comprehensive price
  const calculatePrice = useCallback(async () => {
    if (!product) return { currentPrice: 0, totalPrice: 0 };

    try {
      let basePrice = 0;
      
      // 1. Get price from new formula-based pricing API
      try {
        const params = new URLSearchParams({
          width: config.width.toString(),
          height: config.height.toString(),
          ...(config.colorId && { colorId: config.colorId.toString() }),
          ...(config.materialId && { materialId: config.materialId.toString() }),
          ...(config.mountType && { mountType: mountTypes.find(mt => mt.id === config.mountType)?.name || '' }),
          ...(config.controlType && { controlType: config.controlType }),
          ...(config.headrailId && { headrailId: config.headrailId.toString() }),
          ...(config.bottomRailId && { bottomRailId: config.bottomRailId.toString() })
        });

        const response = await fetch(`/api/v2/commerce/products/${product.product_id}/pricing?${params}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Use the formula-based pricing if available
            if (result.data.method === 'formula' && result.data.breakdown) {
              return { 
                currentPrice: result.data.price, 
                totalPrice: result.data.price * config.quantity 
              };
            } else {
              // Fallback to matrix pricing
              basePrice = result.data.price || product.base_price || 0;
            }
          }
        } else {
          basePrice = product.base_price || 0;
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
        basePrice = product.base_price || 0;
      }

      // 2. Calculate fabric price (price per square foot × area)
      let fabricPrice = 0;
      if (config.materialId && product.materials) {
        const selectedMaterial = product.materials.find((m: any) => m.material_id === config.materialId);
        if (selectedMaterial) {
          const area = (config.width * config.height) / 144; // Convert to square feet
          fabricPrice = (selectedMaterial.price_per_sqft || 0) * area;
        }
      }

      // 3. Calculate vendor options price
      let optionsPrice = 0;
      
      // Mount type price from product options
      if (product.options?.mountTypes && config.mountType) {
        const mountTypeName = mountTypes.find(mt => mt.id === config.mountType)?.name;
        const mountTypeOption = product.options.mountTypes.find((mt: any) => 
          mt.enabled && mt.name === mountTypeName
        );
        if (mountTypeOption && mountTypeOption.price_adjustment) {
          optionsPrice += mountTypeOption.price_adjustment || 0;
        }
      }

      // Control type price from product options
      if (product.options?.controlTypes && config.controlType) {
        // Find in all control type categories
        const allControlTypes = [
          ...(product.options.controlTypes.liftSystems || []),
          ...(product.options.controlTypes.wandSystem || []),
          ...(product.options.controlTypes.stringSystem || []),
          ...(product.options.controlTypes.remoteControl || [])
        ];
        const controlTypeOption = allControlTypes.find((ct: any) => 
          ct.enabled && ct.name === config.controlType
        );
        if (controlTypeOption && controlTypeOption.price_adjustment) {
          optionsPrice += controlTypeOption.price_adjustment || 0;
        }
      }

      // Valance (headrail) price
      if (product.options?.valanceOptions && config.headrailId) {
        const valanceOption = product.options.valanceOptions.find((vo: any) => 
          vo.enabled && vo.name === headrailOptions.find(ho => ho.id === config.headrailId)?.name
        );
        if (valanceOption && valanceOption.price_adjustment) {
          optionsPrice += valanceOption.price_adjustment || 0;
        }
      }

      // Bottom rail price
      if (product.options?.bottomRailOptions && config.bottomRailId) {
        const bottomRailOption = product.options.bottomRailOptions.find((bro: any) => 
          bro.enabled && bro.name === bottomRailOptions.find(br => br.id === config.bottomRailId)?.name
        );
        if (bottomRailOption && bottomRailOption.price_adjustment) {
          optionsPrice += bottomRailOption.price_adjustment || 0;
        }
      }

      // Add color and material modifiers from product data
      const colorModifier = product.colors?.find(c => c.color_id === config.colorId)?.price_modifier ?? 0;
      const materialModifier = product.materials?.find(m => m.material_id === config.materialId)?.price_modifier ?? 0;

      // Total calculation: Base Price + Fabric Price + Options Price + Color/Material modifiers
      const itemPrice = basePrice + fabricPrice + optionsPrice + colorModifier + materialModifier;
      const totalPrice = itemPrice * config.quantity;

      return { currentPrice: itemPrice, totalPrice };
    } catch (error) {
      console.error('Error calculating price:', error);
      return { currentPrice: product.base_price || 0, totalPrice: (product.base_price || 0) * config.quantity };
    }
  }, [config, product, mountTypes, controlTypes, headrailOptions, bottomRailOptions]);

  // Update step validation and prices
  useEffect(() => {
    if (!product) return;

    const isValid = validateStep(config.step, config);
    setCanProceedToNextStep(isValid);
    setStepValidation(prev => ({ ...prev, [config.step]: isValid }));

    // Calculate comprehensive price
    calculatePrice().then(({ currentPrice, totalPrice }) => {
      setConfig(prev => ({
        ...prev,
        currentPrice,
        totalPrice
      }));
    });
  }, [
    config.width,
    config.height,
    config.colorId,
    config.materialId,
    config.mountType,
    config.controlType,
    config.headrailId,
    config.bottomRailId,
    config.quantity,
    config.step,
    product,
    mountTypes,
    controlTypes,
    headrailOptions,
    bottomRailOptions,
    validateStep,
    calculatePrice
  ]);

  // Step navigation with validation
  const nextStep = useCallback(() => {
    if (config.step < 7 && canProceedToNextStep) {
      setConfig(prev => ({ ...prev, step: prev.step + 1 }));
    }
  }, [config.step, canProceedToNextStep]);

  const prevStep = useCallback(() => {
    if (config.step > 1) {
      setConfig(prev => ({ ...prev, step: prev.step - 1 }));
    }
  }, [config.step]);

  // Add to cart function
  const addToCart = useCallback(() => {
    if (!product) return;

    const item: CartItem = {
      cart_item_id: Date.now(), // Temporary ID for new items
      cart_id: 0, // Will be assigned by backend
      product_id: product.product_id,
      quantity: config.quantity,
      width: config.width,
      height: config.height,
      color_id: config.colorId,
      material_id: config.materialId,
      unit_price: config.currentPrice,
      // UI fields
      name: product.name,
      slug: product.slug,
      colorName: product.colors.find(c => c.color_id === config.colorId)?.name,
      materialName: product.materials.find(m => m.material_id === config.materialId)?.name,
      mountType: config.mountType,
      mountTypeName: mountTypes.find(m => m.id === config.mountType)?.name,
      controlType: config.controlType,
      headrailId: config.headrailId,
      headrailName: headrailOptions.find(h => h.id === config.headrailId)?.name,
      bottomRailId: config.bottomRailId,
      bottomRailName: bottomRailOptions.find(b => b.id === config.bottomRailId)?.name,
      image: product.images.find(img => img.is_primary)?.image_url,
      totalPrice: config.currentPrice * config.quantity,
    };

    addToCartFn(item);
  }, [config, product, mountTypes, headrailOptions, bottomRailOptions, addToCartFn]);

  // Save configuration function
  const saveConfiguration = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(true);
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }, []);

  const value = {
    product,
    loading,
    error,
    config,
    setConfig,
    mountTypes,
    controlTypes,
    headrailOptions,
    bottomRailOptions,
    roomRecommendations,
    showSaveDialog,
    setShowSaveDialog,
    configName,
    setConfigName,
    saving,
    setSaving,
    saveSuccess,
    setSaveSuccess,
    addToCart,
    saveConfiguration,
    nextStep,
    prevStep,
    toggleRoomView: useCallback(() => 
      setConfig(prev => ({ ...prev, showRoomView: !prev.showRoomView })), 
    []),
    stepValidation,
    canProceedToNextStep
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

// Custom hook to use the ConfigContext
export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
