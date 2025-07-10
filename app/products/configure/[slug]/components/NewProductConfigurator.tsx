'use client';

import React, { useState } from 'react';
import { ZoomIn, ArrowLeft, Check, Info, Sparkles, Shield, Truck, Calendar, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

// Room types from vendor configuration
const ROOM_TYPES = [
  'Living Room',
  'Bedroom', 
  'Kitchen',
  'Bathroom',
  'Dining Room',
  'Home Office',
  'Media Room',
  'Nursery',
  'Sunroom',
  'Basement',
  'Garage',
  'Patio/Outdoor',
];

interface ProductConfiguratorProps {
  product: any;
  slug: string;
  onAddToCart: (config: any) => void;
  initialConfig?: any;
  isEditMode?: boolean;
  userRole?: string;
}

export default function NewProductConfigurator({ product, slug, onAddToCart, initialConfig = {}, isEditMode = false, userRole }: ProductConfiguratorProps) {
  const { itemCount } = useCart();
  const [showZoom, setShowZoom] = useState(false);
  
  
  const [config, setConfig] = useState({
    roomType: initialConfig.roomType || '',
    mountType: initialConfig.mountType || '',
    width: initialConfig.width || '',
    height: initialConfig.height || '',
    widthFraction: initialConfig.widthFraction || '0',
    heightFraction: initialConfig.heightFraction || '0',
    fabricType: initialConfig.fabricType || '',
    fabricOption: initialConfig.fabricOption || '',
    colorOption: initialConfig.colorOption || '',
    liftSystem: initialConfig.liftSystem || '',
    controlOption: initialConfig.controlOption || initialConfig.controlType || '', // Handle both field names
    valanceOption: initialConfig.valanceOption || '',
    bottomRailOption: initialConfig.bottomRailOption || '',
  });

  const [errors, setErrors] = useState({
    roomType: '',
    mountType: '',
    width: '',
    height: '',
    fabricType: '',
    colorOption: '',
    controlOption: '',
    liftSystem: '',
    valanceOption: '',
    bottomRailOption: '',
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeFabricType, setActiveFabricType] = useState<string>('');

  // Group fabrics by type and initialize active fabric type
  const fabricTypes = React.useMemo(() => {
    if (!product?.fabricOptions) return [];
    
    const groupedFabrics = product.fabricOptions.reduce((acc, fabric) => {
      const type = fabric.fabric_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(fabric);
      return acc;
    }, {} as Record<string, any[]>);
    
    return Object.keys(groupedFabrics).map(type => ({
      type,
      fabrics: groupedFabrics[type]
    }));
  }, [product?.fabricOptions]);

  // Initialize active fabric type when fabric types are available
  React.useEffect(() => {
    if (fabricTypes.length > 0 && !activeFabricType) {
      // If editing mode and initial fabric is selected, find the correct tab
      if (initialConfig.fabricType) {
        const selectedFabric = product?.fabricOptions?.find(
          f => f.fabric_option_id?.toString() === initialConfig.fabricType ||
               f.id?.toString() === initialConfig.fabricType
        );
        
        if (selectedFabric) {
          setActiveFabricType(selectedFabric.fabric_type);
        } else {
          // Fallback to first tab if fabric not found
          setActiveFabricType(fabricTypes[0].type);
        }
      } else {
        // Default behavior: show first tab
        setActiveFabricType(fabricTypes[0].type);
      }
    }
  }, [fabricTypes, activeFabricType, initialConfig.fabricType, product?.fabricOptions]);

  const handleRoomTypeChange = (roomType: string) => {
    setConfig(prev => ({ ...prev, roomType }));
    setErrors(prev => ({ ...prev, roomType: '' }));
  };

  const handleMountTypeChange = (mountType: string) => {
    setConfig(prev => ({ ...prev, mountType }));
    setErrors(prev => ({ ...prev, mountType: '' }));
  };

  const validateDimension = (value: string, type: 'width' | 'height') => {
    const numValue = parseFloat(value);
    
    if (!value || isNaN(numValue) || numValue <= 0) {
      return `Please enter valid ${type}`;
    }

    // Get dimensions from product data - NO hardcoded fallbacks
    const dimensions = product?.dimensions || {};
    
    // Product dimensions after refresh
    
    const minWidth = dimensions?.minWidth;
    const maxWidth = dimensions?.maxWidth;
    const minHeight = dimensions?.minHeight;
    const maxHeight = dimensions?.maxHeight;

    // Extracted dimension values

    // If no dimension data from database, don't validate
    if (!minWidth || !maxWidth || !minHeight || !maxHeight) {
      // Missing dimension data, skipping validation
      return ''; // No validation if database doesn't have dimension limits
    }
    
    // Validation will proceed with database values

    // Add eighths fraction to get total dimension
    let totalValue = numValue;
    if (type === 'width') {
      const widthFraction = parseFloat(config.widthFraction) || 0;
      totalValue = numValue + widthFraction;
      
      // Width validation with fraction
      
      if (totalValue < minWidth) {
        return `Width must be at least ${minWidth} inches`;
      }
      if (totalValue > maxWidth) {
        return `Width must be at most ${maxWidth} inches (including eighths)`;
      }
    } else if (type === 'height') {
      const heightFraction = parseFloat(config.heightFraction) || 0;
      totalValue = numValue + heightFraction;
      
      // Height validation with fraction
      
      if (totalValue < minHeight) {
        return `Height must be at least ${minHeight} inches`;
      }
      if (totalValue > maxHeight) {
        return `Height must be at most ${maxHeight} inches (including eighths)`;
      }
    }

    return '';
  };

  const handleDimensionChange = (field: 'width' | 'height', value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // If user enters max value, reset fraction to 0 to prevent exceeding limit
    const dimensions = product?.dimensions || {};
    const maxWidth = dimensions?.maxWidth || product?.custom_width_max;
    const maxHeight = dimensions?.maxHeight || product?.custom_height_max;
    
    const numValue = parseFloat(value);
    if (field === 'width' && maxWidth && numValue >= maxWidth) {
      setConfig(prev => ({ ...prev, widthFraction: '0' }));
    }
    if (field === 'height' && maxHeight && numValue >= maxHeight) {
      setConfig(prev => ({ ...prev, heightFraction: '0' }));
    }
    
    // Validate as user types
    const error = validateDimension(value, field);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Helper functions to check if eighths should be disabled
  const isWidthEighthsDisabled = () => {
    const dimensions = product?.dimensions || {};
    const maxWidth = dimensions?.maxWidth || product?.custom_width_max;
    const currentWidth = parseFloat(config.width);
    return maxWidth && currentWidth >= maxWidth;
  };

  const isHeightEighthsDisabled = () => {
    const dimensions = product?.dimensions || {};
    const maxHeight = dimensions?.maxHeight || product?.custom_height_max;
    const currentHeight = parseFloat(config.height);
    return maxHeight && currentHeight >= maxHeight;
  };

  // Mandatory fields validation - easily extensible for future requirements
  const validateMandatoryFields = () => {
    const mandatoryErrors = {
      roomType: !config.roomType ? 'Please select a room type' : '',
      mountType: !config.mountType ? 'Please select mount type' : '',
      width: !config.width ? 'Please enter width' : validateDimension(config.width, 'width'),
      height: !config.height ? 'Please enter height' : validateDimension(config.height, 'height'),
      fabricType: !config.fabricType ? 'Please select a fabric type' : '',
      controlOption: !config.controlOption ? 'Please select a control option' : '',
      valanceOption: !config.valanceOption ? 'Please select a valance option' : '',
      bottomRailOption: !config.bottomRailOption ? 'Please select a bottom rail option' : '',
    };

    return mandatoryErrors;
  };

  // Complete form validation - all fields are now mandatory
  const validateForm = () => {
    const allErrors = validateMandatoryFields();
    setErrors(allErrors);
    
    return !Object.values(allErrors).some(error => error !== '');
  };

  // Check if mandatory fields are completed (for UI indicators)
  const areMandatoryFieldsComplete = () => {
    const mandatoryErrors = validateMandatoryFields();
    return !Object.values(mandatoryErrors).some(error => error !== '');
  };

  const handleAddToCart = () => {
    if (validateForm()) {
      const calculatedPrice = calculatePrice();
      onAddToCart(config, calculatedPrice);
    }
  };

  const calculateFinalWidth = () => {
    const width = parseFloat(config.width) || 0;
    const fraction = parseFloat(config.widthFraction) || 0;
    const totalWidth = width + fraction;
    
    // Apply deductions based on mount type
    if (config.mountType === 'inside') {
      return (totalWidth - 0.25).toFixed(3).replace(/\.?0+$/, ''); // Remove trailing zeros
    }
    return totalWidth.toString();
  };

  const calculateFinalHeight = () => {
    const height = parseFloat(config.height) || 0;
    const fraction = parseFloat(config.heightFraction) || 0;
    const totalHeight = height + fraction;
    
    // Apply deductions based on mount type
    if (config.mountType === 'inside') {
      return (totalHeight - 0.125).toFixed(3).replace(/\.?0+$/, ''); // Remove trailing zeros
    }
    return totalHeight.toString();
  };

  const calculatePrice = () => {
    // Get dimensions including fractions
    const width = parseFloat(config.width) || 0;
    const height = parseFloat(config.height) || 0;
    const widthFraction = parseFloat(config.widthFraction) || 0;
    const heightFraction = parseFloat(config.heightFraction) || 0;
    
    const totalWidth = width + widthFraction;
    const totalHeight = height + heightFraction;
    const area = totalWidth * totalHeight;
    const areaInSqFt = area / 144; // Convert sq inches to sq ft
    
    // 1. Start with base price from Basic Info tab
    let totalPrice = parseFloat(product?.base_price) || 0;
    
    // 2. Add pricing from Pricing Matrix based on width/height ranges
    if (product?.pricingMatrix && totalWidth > 0 && totalHeight > 0) {
      const matrixPrice = product.pricingMatrix.find(matrix => 
        totalWidth >= matrix.width_min && 
        totalWidth <= matrix.width_max && 
        totalHeight >= matrix.height_min && 
        totalHeight <= matrix.height_max
      );
      
      if (matrixPrice) {
        totalPrice += parseFloat(matrixPrice.base_price) || 0;
        if (matrixPrice.price_per_sqft > 0) {
          totalPrice += areaInSqFt * parseFloat(matrixPrice.price_per_sqft);
        }
      }
    }
    
    // 3. Add fabric pricing (per sq ft)
    if (config.fabricType) {
      const selectedFabric = product?.fabricOptions?.find(f => f.fabric_option_id.toString() === config.fabricType);
      if (selectedFabric) {
        const fabricPricing = product?.fabricPricing?.find(p => p.fabric_option_id === selectedFabric.fabric_option_id);
        if (fabricPricing && fabricPricing.price_per_sqft) {
          totalPrice += areaInSqFt * parseFloat(fabricPricing.price_per_sqft);
        }
      }
    }
    
    // 4. Add control options pricing (from Options tab database)
    if (config.controlOption && product?.controlTypes) {
      // Find the selected control option and its price
      const allControlTypes = [
        ...(product.controlTypes.liftSystems || []),
        ...(product.controlTypes.wandSystem || []),
        ...(product.controlTypes.stringSystem || []),
        ...(product.controlTypes.remoteControl || [])
      ];
      
      const selectedControl = allControlTypes.find(control => 
        control.name.toLowerCase().replace(/\s+/g, '-') === config.controlOption
      );
      
      if (selectedControl && selectedControl.enabled) {
        totalPrice += parseFloat(selectedControl.price_adjustment) || 0;
      }
    }
    // 5. Add valance options pricing
    if (config.valanceOption && product?.controlTypes?.valanceOptions) {
      const selectedValance = product.controlTypes.valanceOptions.find(valance => 
        valance.name.toLowerCase().replace(/\s+/g, '-') === config.valanceOption
      );
      
      if (selectedValance && selectedValance.enabled) {
        totalPrice += parseFloat(selectedValance.price_adjustment) || 0;
      }
    }
    
    // 6. Add bottom rail options pricing
    if (config.bottomRailOption && product?.controlTypes?.bottomRailOptions) {
      const selectedBottomRail = product.controlTypes.bottomRailOptions.find(rail => 
        rail.name.toLowerCase().replace(/\s+/g, '-') === config.bottomRailOption
      );
      
      if (selectedBottomRail && selectedBottomRail.enabled) {
        totalPrice += parseFloat(selectedBottomRail.price_adjustment) || 0;
      }
    }
    
    // Ensure we always return a number
    return isNaN(totalPrice) ? 0 : totalPrice;
  };

  const isStepCompleted = (step: string) => {
    switch (step) {
      // Mandatory steps
      case 'room': return !!config.roomType;
      case 'mount': return !!config.mountType;
      case 'dimensions': return !!config.width && !!config.height;
      
      // Optional steps (for future use)
      case 'fabric': return !!config.fabricType;
      case 'controls': return !!config.controlOption;
      case 'rails': return !!config.valanceOption && !!config.bottomRailOption;
      default: return false;
    }
  };

  // Check if mandatory steps are completed (for progress tracking)
  const isMandatoryStepCompleted = (step: string) => {
    const mandatorySteps = ['room', 'mount', 'dimensions', 'fabric', 'controls', 'rails'];
    return mandatorySteps.includes(step) ? isStepCompleted(step) : true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-4">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href={`/products/${slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium group"
          >
            <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Product Details
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start">
          {/* Left Side - Configuration (scrolls naturally) */}
          <div className="space-y-3 lg:h-auto">

            {/* Choose Your Room */}
            <div className={`bg-white rounded-xl shadow-lg p-4 border transition-all ${
              activeSection === 'room' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('room')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Choose Your Room 
                <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
              </h2>
              
              <select
                value={config.roomType}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 ${
                  errors.roomType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select room type</option>
                {ROOM_TYPES.map((roomType) => (
                  <option key={roomType} value={roomType}>
                    {roomType}
                  </option>
                ))}
              </select>
              {errors.roomType && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.roomType}
                </p>
              )}
            </div>

            {/* Choose Inside or Outside Mount */}
            <div className={`bg-white rounded-xl shadow-lg p-4 border transition-all ${
              activeSection === 'mount' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('mount')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Choose Mount Type 
                <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
              </h2>
              
              <div className="space-y-2">
                {/* Inside Mount */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    config.mountType === 'inside'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMountTypeChange('inside')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <div className="w-10 h-10 bg-white rounded shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-gray-900">Inside Mount</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Provide exact window opening dimensions. There will be visible light gaps of approximately 1/4 on inch on non-operting side,and 1/2 inch on operting side of your roller shade to allow clearance for operating.
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      config.mountType === 'inside' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {config.mountType === 'inside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </div>

                {/* Outside Mount */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    config.mountType === 'outside'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMountTypeChange('outside')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-10 bg-white rounded shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-gray-900">Outside Mount</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Provide the exact size of your shade, not the window. Because the fabric is narrower than the roller, you should add a minimum of 1½ inch to width.
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      config.mountType === 'outside' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {config.mountType === 'outside' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </div>
              </div>
              
              {errors.mountType && (
                <p className="text-red-500 text-sm mt-3 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.mountType}
                </p>
              )}
            </div>

            {/* Enter Size */}
            <div className={`bg-white rounded-xl shadow-lg p-4 border transition-all ${
              activeSection === 'dimensions' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('dimensions')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Enter Size <span className="text-sm text-gray-500 font-normal">(inches)</span>
                <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
              </h2>
              
              <div className="flex items-start space-x-4">
                <div className="flex-1 space-y-3">
                  <div className="flex space-x-4">
                    {/* Window illustration - moved inside and centered */}
                    <div className="hidden sm:flex items-center justify-center">
                      <div className="w-20 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-2">
                        <div className="w-full h-full bg-white rounded shadow-inner grid grid-cols-2 grid-rows-2">
                          <div className="border-r border-b border-gray-200"></div>
                          <div className="border-b border-gray-200"></div>
                          <div className="border-r border-gray-200"></div>
                          <div></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      {/* Width Section */}
                      <div>
                        <div className="flex items-end space-x-2 mb-2">
                          <div className="w-20">
                            <label className="block text-sm font-medium text-gray-700">Width</label>
                          </div>
                          <div className="w-16">
                            <label className="block text-sm font-medium text-gray-700">Eighths</label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={config.width}
                            onChange={(e) => handleDimensionChange('width', e.target.value)}
                            placeholder="0"
                            min={product?.dimensions?.minWidth || product?.options?.dimensions?.minWidth}
                            max={product?.dimensions?.maxWidth || product?.options?.dimensions?.maxWidth}
                            step="0.125"
                            className={`w-20 p-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              errors.width ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          <select
                            value={config.widthFraction}
                            onChange={(e) => {
                              setConfig(prev => ({ ...prev, widthFraction: e.target.value }));
                              // Re-validate width when fraction changes
                              if (config.width) {
                                const error = validateDimension(config.width, 'width');
                                setErrors(prev => ({ ...prev, width: error }));
                              }
                            }}
                            disabled={isWidthEighthsDisabled()}
                            className={`w-16 p-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              isWidthEighthsDisabled() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="0">0</option>
                            <option value="0.125">1/8</option>
                            <option value="0.25">1/4</option>
                            <option value="0.375">3/8</option>
                            <option value="0.5">1/2</option>
                            <option value="0.625">5/8</option>
                            <option value="0.75">3/4</option>
                            <option value="0.875">7/8</option>
                          </select>
                          <span className="text-sm text-gray-600">inches</span>
                        </div>
                      </div>

                      {/* Height Section */}
                      <div>
                        <div className="flex items-end space-x-2 mb-2">
                          <div className="w-20">
                            <label className="block text-sm font-medium text-gray-700">Height</label>
                          </div>
                          <div className="w-16">
                            <label className="block text-sm font-medium text-gray-700">Eighths</label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={config.height}
                            onChange={(e) => handleDimensionChange('height', e.target.value)}
                            placeholder="0"
                            min={product?.dimensions?.minHeight || product?.options?.dimensions?.minHeight}
                            max={product?.dimensions?.maxHeight || product?.options?.dimensions?.maxHeight}
                            step="0.125"
                            className={`w-20 p-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              errors.height ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          <select
                            value={config.heightFraction}
                            onChange={(e) => {
                              setConfig(prev => ({ ...prev, heightFraction: e.target.value }));
                              // Re-validate height when fraction changes
                              if (config.height) {
                                const error = validateDimension(config.height, 'height');
                                setErrors(prev => ({ ...prev, height: error }));
                              }
                            }}
                            disabled={isHeightEighthsDisabled()}
                            className={`w-16 p-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              isHeightEighthsDisabled() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="0">0</option>
                            <option value="0.125">1/8</option>
                            <option value="0.25">1/4</option>
                            <option value="0.375">3/8</option>
                            <option value="0.5">1/2</option>
                            <option value="0.625">5/8</option>
                            <option value="0.75">3/4</option>
                            <option value="0.875">7/8</option>
                          </select>
                          <span className="text-sm text-gray-600">inches</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Messages, Notices and Tips - moved outside the flex container */}
                {(errors.width || errors.height) && (
                  <div className="mt-2 space-y-1">
                    {errors.width && <p className="text-red-500 text-sm">{errors.width}</p>}
                    {errors.height && <p className="text-red-500 text-sm">{errors.height}</p>}
                  </div>
                )}

                {/* Eighths Disabled Notice */}
                {(isWidthEighthsDisabled() || isHeightEighthsDisabled()) && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-700 text-sm">
                      <Info size={14} className="inline mr-1" />
                      Eighths fractions are disabled when you enter the maximum dimension to prevent exceeding size limits.
                    </p>
                  </div>
                )}

                {/* Measurement Tips */}
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700">
                    <p className="font-medium">Measurement Instructions:</p>
                    <ul className="space-y-1 ml-2 mt-1">
                      <li>• Enter precise dimensions for best fit(-1/4 inches)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Fabric Selection - Tab Based UI */}
            <div className={`bg-white rounded-xl shadow-lg p-4 border transition-all ${
              activeSection === 'fabric' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('fabric')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Choose Fabric
                <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
              </h2>
              
              {fabricTypes.length > 0 ? (
                <div>
                  {/* Fabric Type Tabs */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                    {fabricTypes.map((fabricTypeGroup) => (
                      <button
                        key={fabricTypeGroup.type}
                        onClick={() => setActiveFabricType(fabricTypeGroup.type)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all capitalize ${
                          activeFabricType === fabricTypeGroup.type
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {fabricTypeGroup.type} ({fabricTypeGroup.fabrics.length})
                      </button>
                    ))}
                  </div>

                  {/* Fabric Options for Active Type - Simplified to Image and Name only */}
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {fabricTypes
                      .find(ft => ft.type === activeFabricType)
                      ?.fabrics.map((fabric) => {
                        // Generate background class based on fabric type
                        const getBgClass = (fabricType) => {
                          switch(fabricType?.toLowerCase()) {
                            case 'sheer': return 'from-gray-100 to-gray-200';
                            case 'blackout': return 'from-gray-800 to-gray-900';
                            case 'colored': return 'from-blue-100 to-blue-200';
                            case 'woven': return 'from-amber-100 to-amber-200';
                            case 'natural': return 'from-green-100 to-green-200';
                            case 'designer': return 'from-purple-100 to-purple-200';
                            default: return 'from-gray-100 to-gray-200';
                          }
                        };
                        
                        return (
                          <div
                            key={fabric.fabric_option_id}
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              config.fabricType === fabric.fabric_option_id.toString()
                                ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg'
                                : ''
                            }`}
                            onClick={() => {
                              setConfig(prev => ({ ...prev, fabricType: fabric.fabric_option_id.toString() }));
                              setErrors(prev => ({ ...prev, fabricType: '' }));
                            }}
                          >
                            <div className="space-y-2">
                              <div className={`aspect-square rounded-lg overflow-hidden border-2 ${
                                config.fabricType === fabric.fabric_option_id.toString() ? 'border-blue-500' : 'border-gray-200'
                              }`}>
                                {fabric.fabric_image_url ? (
                                  <img 
                                    src={fabric.fabric_image_url} 
                                    alt={fabric.fabric_name}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                                  />
                                ) : (
                                  <div className={`w-full h-full bg-gradient-to-br ${getBgClass(fabric.fabric_type)} flex items-center justify-center`}>
                                    <div className="w-3/4 h-3/4 bg-white/80 rounded shadow-sm"></div>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-center font-medium text-gray-700 truncate px-1">
                                {fabric.fabric_name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No fabric options are currently available for this product.</p>
                  <p className="text-sm text-gray-400">Please contact support or check the vendor's product page.</p>
                </div>
              )}
              
              {errors.fabricType && (
                <p className="text-red-500 text-sm mt-3 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.fabricType}
                </p>
              )}
            </div>


            {/* Control Options */}
            <div className={`bg-white rounded-xl shadow-lg p-4 border transition-all ${
              activeSection === 'controls' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('controls')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Choose Control Option
                <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">Select one control option for your blind</p>
              
              {product?.controlTypes ? (
                <div className="space-y-3">
                  {/* Lift Systems */}
                  {product.controlTypes.liftSystems && product.controlTypes.liftSystems.some(s => s.enabled) && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Lift Systems</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.controlTypes.liftSystems
                          .filter(system => system.enabled)
                          .map(system => {
                            const controlId = system.name.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <label key={controlId} className={`flex items-start p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                config.controlOption === controlId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <input
                                  type="radio"
                                  name="controlOption"
                                  value={controlId}
                                  checked={config.controlOption === controlId}
                                  onChange={(e) => {
                                    setConfig(prev => ({ ...prev, controlOption: e.target.value }));
                                    setErrors(prev => ({ ...prev, controlOption: '' }));
                                  }}
                                  className="mt-1 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-2">
                                  <h4 className="text-sm font-medium text-gray-900">{system.name}</h4>
                                  <p className="text-xs text-gray-600">{system.name === 'Cordless' ? 'Child-safe' : 'Chain control'}</p>
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    {system.price_adjustment === 0 ? 'Standard' : `+$${system.price_adjustment}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Wand System */}
                  {product.controlTypes.wandSystem && product.controlTypes.wandSystem.some(s => s.enabled) && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Wand System</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.controlTypes.wandSystem
                          .filter(system => system.enabled)
                          .map(system => {
                            const controlId = system.name.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <label key={controlId} className={`flex items-start p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                config.controlOption === controlId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <input
                                  type="radio"
                                  name="controlOption"
                                  value={controlId}
                                  checked={config.controlOption === controlId}
                                  onChange={(e) => {
                                    setConfig(prev => ({ ...prev, controlOption: e.target.value }));
                                    setErrors(prev => ({ ...prev, controlOption: '' }));
                                  }}
                                  className="mt-1 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-2">
                                  <h4 className="text-sm font-medium text-gray-900">{system.name}</h4>
                                  <p className="text-xs text-gray-600">{system.name === 'Standard Wand' ? 'Twist control' : 'Extended reach'}</p>
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    {system.price_adjustment === 0 ? 'Standard' : `+$${system.price_adjustment}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* String System */}
                  {product.controlTypes.stringSystem && product.controlTypes.stringSystem.some(s => s.enabled) && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">String System</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.controlTypes.stringSystem
                          .filter(system => system.enabled)
                          .map(system => {
                            const controlId = system.name.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <label key={controlId} className={`flex items-start p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                config.controlOption === controlId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <input
                                  type="radio"
                                  name="controlOption"
                                  value={controlId}
                                  checked={config.controlOption === controlId}
                                  onChange={(e) => {
                                    setConfig(prev => ({ ...prev, controlOption: e.target.value }));
                                    setErrors(prev => ({ ...prev, controlOption: '' }));
                                  }}
                                  className="mt-1 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-2">
                                  <h4 className="text-sm font-medium text-gray-900">{system.name}</h4>
                                  <p className="text-xs text-gray-600">{system.name === 'String Lift' ? 'Pull string' : 'Chain operation'}</p>
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    {system.price_adjustment === 0 ? 'Standard' : `+$${system.price_adjustment}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Remote Control */}
                  {product.controlTypes.remoteControl && product.controlTypes.remoteControl.some(s => s.enabled) && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Remote Control</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.controlTypes.remoteControl
                          .filter(system => system.enabled)
                          .map(system => {
                            const controlId = system.name.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <label key={controlId} className={`flex items-start p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                config.controlOption === controlId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <input
                                  type="radio"
                                  name="controlOption"
                                  value={controlId}
                                  checked={config.controlOption === controlId}
                                  onChange={(e) => {
                                    setConfig(prev => ({ ...prev, controlOption: e.target.value }));
                                    setErrors(prev => ({ ...prev, controlOption: '' }));
                                  }}
                                  className="mt-1 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-2">
                                  <h4 className="text-sm font-medium text-gray-900">{system.name}</h4>
                                  <p className="text-xs text-gray-600">{system.name === 'Basic Remote' ? 'Handheld remote' : 'Smart home'}</p>
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    {system.price_adjustment === 0 ? 'Standard' : `+$${system.price_adjustment}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No control options are currently available for this product.</p>
                  <p className="text-sm text-gray-400">Please contact support or check the vendor's product page.</p>
                </div>
              )}
              
              {errors.controlOption && (
                <p className="text-red-500 text-sm mt-3 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.controlOption}
                </p>
              )}
            </div>

            {/* Rail Options - Only show if there are any enabled options */}
            {((product?.controlTypes?.valanceOptions && product.controlTypes.valanceOptions.filter(o => o.enabled).length > 0) || 
              (product?.controlTypes?.bottomRailOptions && product.controlTypes.bottomRailOptions.filter(o => o.enabled).length > 0)) && (
              <div className={`bg-white rounded-xl shadow-lg p-4 border transition-all ${
                activeSection === 'rails' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
              }`}
                onFocus={() => setActiveSection('rails')}
                onBlur={() => setActiveSection(null)}
              >
                <h2 className="text-lg font-semibold mb-3 text-gray-900">
                  Rail Options
                  <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
                </h2>
                
                <div className="space-y-2">
                {/* Valance Options */}
                {product?.controlTypes?.valanceOptions && product.controlTypes.valanceOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valance (Head Rail)</label>
                    <select
                      value={config.valanceOption}
                      onChange={(e) => {
                        setConfig(prev => ({ ...prev, valanceOption: e.target.value }));
                        setErrors(prev => ({ ...prev, valanceOption: '' }));
                      }}
                      className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.valanceOption ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select valance option</option>
                      {product.controlTypes.valanceOptions
                        .filter(option => option.enabled)
                        .map((option) => (
                          <option key={option.name} value={option.name.toLowerCase().replace(/\s+/g, '-')}>
                            {option.name} {option.price_adjustment > 0 ? `(+$${option.price_adjustment})` : ''}
                          </option>
                        ))}
                    </select>
                    {errors.valanceOption && (
                      <p className="text-red-500 text-sm mt-1">{errors.valanceOption}</p>
                    )}
                  </div>
                )}

                {/* Bottom Rail Options */}
                {product?.controlTypes?.bottomRailOptions && product.controlTypes.bottomRailOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Rail</label>
                    <select
                      value={config.bottomRailOption}
                      onChange={(e) => {
                        setConfig(prev => ({ ...prev, bottomRailOption: e.target.value }));
                        setErrors(prev => ({ ...prev, bottomRailOption: '' }));
                      }}
                      className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.bottomRailOption ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select bottom rail option</option>
                      {product.controlTypes.bottomRailOptions
                        .filter(option => option.enabled)
                        .map((option) => (
                          <option key={option.name} value={option.name.toLowerCase().replace(/\s+/g, '-')}>
                            {option.name} {option.price_adjustment > 0 ? `(+$${option.price_adjustment})` : ''}
                          </option>
                        ))}
                    </select>
                    {errors.bottomRailOption && (
                      <p className="text-red-500 text-sm mt-1">{errors.bottomRailOption}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Action Buttons - Mobile Responsive */}
            <div className="space-y-2 md:space-y-0 md:flex md:gap-2">
              {/* Add to Cart Button - Only show for customers or guests */}
              {(!userRole || userRole === 'customer') ? (
                <button
                  onClick={handleAddToCart}
                  disabled={!areMandatoryFieldsComplete()}
                  className={`w-full md:flex-1 font-semibold py-3 px-4 md:px-5 rounded-lg transition-all transform shadow-lg flex items-center justify-center text-sm md:text-base ${
                    areMandatoryFieldsComplete()
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:scale-[1.02] hover:shadow-xl cursor-pointer'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={18} className="mr-1 md:mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {areMandatoryFieldsComplete() 
                      ? isEditMode 
                        ? `Update Cart - $${calculatePrice().toFixed(2)}`
                        : `Add to Cart - $${calculatePrice().toFixed(2)}` 
                      : 'Complete Required Fields'
                    }
                  </span>
                </button>
              ) : (
                <div className="w-full md:flex-1 bg-gray-100 border border-gray-300 rounded-lg py-3 px-4 md:px-5 text-center">
                  <p className="text-gray-600 font-medium">
                    Only customers can add items to cart
                  </p>
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm underline">
                    Log in as customer
                  </Link>
                </div>
              )}

              {/* View Cart Button - Only show for customers or guests */}
              {(!userRole || userRole === 'customer') && (
                <Link href="/cart" className="block w-full md:w-auto">
                  <button className="w-full md:w-auto font-semibold py-3 px-4 md:px-5 rounded-lg transition-all border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center text-sm md:text-base whitespace-nowrap">
                    <ShoppingCart size={16} className="mr-1 md:mr-2 flex-shrink-0" />
                    <span>View Cart</span>
                    {itemCount > 0 && <span className="ml-1 md:ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">({itemCount})</span>}
                  </button>
                </Link>
              )}
            </div>

            {/* Mandatory Fields Notice */}
            {!areMandatoryFieldsComplete() && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  <Info size={14} className="inline mr-1" />
                  Please complete all required fields: Room Type, Mount Type, Width, and Height.
                </p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center">
                <Shield className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">100% Secure</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <Truck className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Free Shipping</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Quick Delivery</p>
              </div>
            </div>
          </div>

          {/* Right Side - Product Preview (fixed position, scrollable content) */}
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-4 space-y-3 
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-100">
              <div className="flex items-center mb-2">
                <Sparkles className="text-blue-600 mr-2" size={20} />
                <h1 className="text-lg font-bold text-gray-900">Configure Your Perfect Blind</h1>
              </div>
              <p className="text-sm text-gray-600">Customize every detail to match your style and needs</p>
              
              {/* Progress Steps */}
              <div className="mt-3 flex items-center justify-between">
                {[
                  { id: 'room', label: 'Room' },
                  { id: 'mount', label: 'Mount' },
                  { id: 'dimensions', label: 'Size' },
                  { id: 'fabric', label: 'Fabric' },
                  { id: 'controls', label: 'Controls' },
                  { id: 'rails', label: 'Rails' },
                ].map((step, index, array) => (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isStepCompleted(step.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isStepCompleted(step.id) ? <Check size={16} /> : index + 1}
                      </div>
                      <span className="text-xs mt-1 text-gray-600">{step.label}</span>
                    </div>
                    {index < array.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-all ${
                        isStepCompleted(step.id) ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{product?.name || 'Premium Roller Shades'}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Brand: <span className="font-medium text-gray-900">Blinds.com</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Shown in: <span className="font-medium text-gray-900">
                        {config.fabricType && product?.fabricOptions ? 
                          (() => {
                            const selectedFabric = product.fabricOptions.find(
                              f => f.fabric_option_id.toString() === config.fabricType
                            );
                            return selectedFabric ? selectedFabric.fabric_name : 'Select a Color to Preview';
                          })()
                          : 'Select a Color to Preview'}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">${calculatePrice().toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Price includes options</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <Sparkles size={12} className="mr-1" />
                    New
                  </span>
                  <span className="text-sm text-gray-600">Enhanced Product Preview</span>
                </div>
              </div>

              {/* Product Preview */}
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl overflow-hidden shadow-inner" style={{ height: '400px' }}>
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => setShowZoom(true)}
                    className="bg-white/90 backdrop-blur text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-md hover:shadow-lg transition-all hover:bg-white"
                  >
                    <ZoomIn size={16} className="mr-2" />
                    Zoom In
                  </button>
                </div>
                
                {/* Product Image - Show fabric image if fabric is selected, otherwise show main product image */}
                {(() => {
                  // Check if a fabric is selected and has an image
                  if (config.fabricType && product?.fabricOptions) {
                    const selectedFabric = product.fabricOptions.find(
                      f => f.fabric_option_id.toString() === config.fabricType
                    );
                    if (selectedFabric?.fabric_image_url) {
                      return (
                        <div className="w-full h-full bg-cover bg-center" 
                             style={{
                               backgroundImage: `url(${selectedFabric.fabric_image_url})`
                             }}>
                        </div>
                      );
                    }
                  }
                  
                  // Default to product image
                  if (product?.images && product.images.length > 0) {
                    return (
                      <div className="w-full h-full bg-cover bg-center" 
                           style={{
                             backgroundImage: `url(${product.images[0].image_url})`
                           }}>
                      </div>
                    );
                  }
                  
                  // Fallback placeholder
                  return (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-6xl mb-3">🏠</div>
                        <p className="text-lg font-medium">Product preview</p>
                        <p className="text-sm">Image will appear here</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Shipping Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center text-blue-700">
                  <Calendar size={20} className="mr-2" />
                  <div>
                    <p className="font-medium text-sm">Estimated Ship Date</p>
                    <p className="text-xs text-blue-600">06/26/2025 based on your selections</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Your Configuration</h3>
              <div className="space-y-2">
                {config.roomType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium text-gray-900">{config.roomType}</span>
                  </div>
                )}
                {config.mountType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mount:</span>
                    <span className="font-medium text-gray-900 capitalize">{config.mountType} Mount</span>
                  </div>
                )}
                {(config.width || config.height) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium text-gray-900">
                      {config.width ? `${config.width}"` : '--'} × {config.height ? `${config.height}"` : '--'}
                    </span>
                  </div>
                )}
                {config.fabricType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fabric:</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const selectedFabric = product?.fabricOptions?.find(f => f.fabric_option_id.toString() === config.fabricType);
                        return selectedFabric ? selectedFabric.fabric_name : config.fabricType;
                      })()}
                    </span>
                  </div>
                )}
                {config.controlOption && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Control:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {config.controlOption.replace(/-/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {showZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowZoom(false)}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 max-w-5xl max-h-[90vh] w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Product Preview</h3>
              <button
                onClick={() => setShowZoom(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Image Container */}
            <div className="p-4 bg-gray-50">
              <div className="relative bg-white rounded-lg shadow-inner overflow-hidden" style={{ height: '70vh' }}>
                {(() => {
                  // Get the current image URL
                  let imageUrl = null;
                  
                  // Check if a fabric is selected and has an image
                  if (config.fabricType && product?.fabricOptions) {
                    const selectedFabric = product.fabricOptions.find(
                      f => f.fabric_option_id.toString() === config.fabricType
                    );
                    if (selectedFabric?.fabric_image_url) {
                      imageUrl = selectedFabric.fabric_image_url;
                    }
                  }
                  
                  // Default to product image if no fabric selected
                  if (!imageUrl && product?.images && product.images.length > 0) {
                    imageUrl = product.images[0].image_url;
                  }
                  
                  if (imageUrl) {
                    return (
                      <img 
                        src={imageUrl}
                        alt={product?.name || 'Product preview'}
                        className="w-full h-full object-contain"
                      />
                    );
                  }
                  
                  // Fallback placeholder
                  return (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-8xl mb-4">🏠</div>
                        <p className="text-xl font-medium">No image available</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Footer with product info */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{product?.name || 'Premium Roller Shades'}</h4>
                  {config.fabricType && product?.fabricOptions && (
                    <p className="text-sm text-gray-600">
                      Fabric: {product.fabricOptions.find(f => f.fabric_option_id.toString() === config.fabricType)?.fabric_name || 'Selected'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${calculatePrice().toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Current configuration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}