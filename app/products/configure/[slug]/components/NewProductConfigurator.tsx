'use client';

import React, { useState } from 'react';
import { ZoomIn, ArrowLeft, Check, Info, Sparkles, Shield, Truck, Calendar } from 'lucide-react';
import Link from 'next/link';

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
}

export default function NewProductConfigurator({ product, slug, onAddToCart }: ProductConfiguratorProps) {
  const [config, setConfig] = useState({
    roomType: '',
    mountType: '',
    width: '',
    height: '',
    widthFraction: '0',
    heightFraction: '0',
    fabricType: '',
    fabricOption: '',
    colorOption: '',
    liftSystem: '',
    controlOption: '', // Single control option selection
    valanceOption: '',
    bottomRailOption: '',
  });

  const [errors, setErrors] = useState({
    roomType: '',
    mountType: '',
    width: '',
    height: '',
    fabricType: '',
    colorOption: '',
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
      setActiveFabricType(fabricTypes[0].type);
    }
  }, [fabricTypes, activeFabricType]);

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
    
    console.log('Product dimensions after refresh:', dimensions);
    
    const minWidth = dimensions?.minWidth;
    const maxWidth = dimensions?.maxWidth;
    const minHeight = dimensions?.minHeight;
    const maxHeight = dimensions?.maxHeight;

    console.log('Extracted dimension values:', { minWidth, maxWidth, minHeight, maxHeight });

    // If no dimension data from database, don't validate
    if (!minWidth || !maxWidth || !minHeight || !maxHeight) {
      console.log('Missing dimension data, skipping validation');
      return ''; // No validation if database doesn't have dimension limits
    }
    
    console.log('Validation will proceed with database values');

    // Add eighths fraction to get total dimension
    let totalValue = numValue;
    if (type === 'width') {
      const widthFraction = parseFloat(config.widthFraction) || 0;
      totalValue = numValue + widthFraction;
      
      console.log(`Width validation: ${numValue} + ${widthFraction} = ${totalValue}, limits: ${minWidth} - ${maxWidth}`);
      
      if (totalValue < minWidth) {
        return `Width must be at least ${minWidth} inches`;
      }
      if (totalValue > maxWidth) {
        return `Width must be at most ${maxWidth} inches (including eighths)`;
      }
    } else if (type === 'height') {
      const heightFraction = parseFloat(config.heightFraction) || 0;
      totalValue = numValue + heightFraction;
      
      console.log(`Height validation: ${numValue} + ${heightFraction} = ${totalValue}, limits: ${minHeight} - ${maxHeight}`);
      
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
    };

    return mandatoryErrors;
  };

  // Complete form validation including mandatory and optional fields
  const validateForm = () => {
    const mandatoryErrors = validateMandatoryFields();
    
    // Optional fields validation (can be empty but if filled must be valid)
    const optionalErrors = {
      fabricType: !config.fabricType ? 'Please select a fabric type' : '',
      liftSystem: !config.liftSystem ? 'Please select a lift system' : '',
      valanceOption: !config.valanceOption ? 'Please select a valance option' : '',
      bottomRailOption: !config.bottomRailOption ? 'Please select a bottom rail option' : '',
    };

    const allErrors = { ...mandatoryErrors, ...optionalErrors };
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
      onAddToCart(config);
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
    let totalPrice = product?.base_price || 0;
    
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
        totalPrice += selectedControl.price_adjustment;
      }
    }
    if (config.valanceOption === 'circular-fabric') totalPrice += 45;
    if (config.valanceOption === 'square-without') totalPrice += 35;
    if (config.valanceOption === 'fabric-wrapped') totalPrice += 55;
    if (config.bottomRailOption === 'fabric-wrapped') totalPrice += 25;
    
    return totalPrice;
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
    const mandatorySteps = ['room', 'mount', 'dimensions'];
    return mandatorySteps.includes(step) ? isStepCompleted(step) : true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
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
          <div className="space-y-6 lg:h-auto">

            {/* Choose Your Room */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 border transition-all ${
              activeSection === 'room' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('room')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Choose Your Room 
                <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
              </h2>
              
              <select
                value={config.roomType}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 ${
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
            <div className={`bg-white rounded-2xl shadow-lg p-6 border transition-all ${
              activeSection === 'mount' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('mount')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Choose Mount Type 
                <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
              </h2>
              
              <div className="space-y-4">
                {/* Inside Mount */}
                <div
                  className={`border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${
                    config.mountType === 'inside'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMountTypeChange('inside')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <div className="w-10 h-10 bg-white rounded shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-gray-900">Inside Mount</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Provide exact window opening dimensions. There will be visible light gaps of approximately 1/2 inch on both sides of your roller shade to allow clearance for operating.
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
                  className={`border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${
                    config.mountType === 'outside'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMountTypeChange('outside')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-10 bg-white rounded shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-gray-900">Outside Mount</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
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
            <div className={`bg-white rounded-2xl shadow-lg p-6 border transition-all ${
              activeSection === 'dimensions' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('dimensions')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Enter Size <span className="text-sm text-gray-500 font-normal">(inches)</span>
                <span className="text-red-500 text-sm font-normal ml-2">* Required</span>
              </h2>
              
              <div className="flex items-start space-x-6">
                {/* Window illustration */}
                <div className="hidden sm:block">
                  <div className="w-24 h-28 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-3">
                    <div className="w-full h-full bg-white rounded shadow-inner grid grid-cols-2 grid-rows-2">
                      <div className="border-r border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                      <div className="border-r border-gray-200"></div>
                      <div></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  {/* Labels Row */}
                  <div className="flex items-end space-x-8 mb-2">
                    <div className="flex items-end space-x-2">
                      <div className="w-20">
                        <label className="block text-sm font-medium text-gray-700">Width</label>
                      </div>
                      <div className="w-16">
                        <label className="block text-sm font-medium text-gray-700">Eighths</label>
                      </div>
                      <div className="w-12">
                        <span className="text-xs text-gray-500"></span>
                      </div>
                    </div>
                    <div className="flex items-end space-x-2">
                      <div className="w-20">
                        <label className="block text-sm font-medium text-gray-700">Height</label>
                      </div>
                      <div className="w-16">
                        <label className="block text-sm font-medium text-gray-700">Eighths</label>
                      </div>
                      <div className="w-12">
                        <span className="text-xs text-gray-500"></span>
                      </div>
                    </div>
                  </div>

                  {/* Inputs Row */}
                  <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={config.width}
                        onChange={(e) => handleDimensionChange('width', e.target.value)}
                        placeholder="0"
                        min={product?.dimensions?.minWidth || product?.options?.dimensions?.minWidth}
                        max={product?.dimensions?.maxWidth || product?.options?.dimensions?.maxWidth}
                        step="0.125"
                        className={`w-20 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
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
                        className={`w-16 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={config.height}
                        onChange={(e) => handleDimensionChange('height', e.target.value)}
                        placeholder="0"
                        min={product?.dimensions?.minHeight || product?.options?.dimensions?.minHeight}
                        max={product?.dimensions?.maxHeight || product?.options?.dimensions?.maxHeight}
                        step="0.125"
                        className={`w-20 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
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
                        className={`w-16 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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

                  {/* Error Messages */}
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
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-700">
                      <p className="font-medium">Measurement Instructions:</p>
                      <ul className="space-y-1 ml-2 mt-1">
                        <li>• Measure the exact window opening</li>
                        <li>• Enter precise dimensions for best fit</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fabric Selection - Tab Based UI */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 border transition-all ${
              activeSection === 'fabric' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('fabric')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Choose Fabric</h2>
              
              {fabricTypes.length > 0 ? (
                <div>
                  {/* Fabric Type Tabs */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
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

                  {/* Fabric Options for Active Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fabricTypes
                      .find(ft => ft.type === activeFabricType)
                      ?.fabrics.map((fabric) => {
                        // Find pricing for this fabric
                        const fabricPricing = product?.fabricPricing?.find(p => p.fabric_option_id === fabric.fabric_option_id);
                        const pricePerSqft = fabricPricing?.price_per_sqft || 0;
                        
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
                        
                        // Get fabric type description
                        const getFabricTypeDescription = (fabricType) => {
                          switch(fabricType?.toLowerCase()) {
                            case 'sheer': return 'Allows natural light while maintaining privacy';
                            case 'blackout': return 'Blocks 99% of light - perfect for bedrooms and media rooms';
                            case 'colored': return 'Standard colored fabrics with good light filtering';
                            case 'woven': return 'Textured fabrics add depth and sophistication';
                            case 'natural': return 'Eco-friendly natural fibers with organic appeal';
                            case 'designer': return 'Premium patterns and textures for luxury finish';
                            default: return '';
                          }
                        };
                        
                        return (
                          <div
                            key={fabric.fabric_option_id}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                              config.fabricType === fabric.fabric_option_id.toString()
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setConfig(prev => ({ ...prev, fabricType: fabric.fabric_option_id.toString() }));
                              setErrors(prev => ({ ...prev, fabricType: '' }));
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-12 h-12 bg-gradient-to-br ${getBgClass(fabric.fabric_type)} rounded-lg flex items-center justify-center ${
                                fabric.fabric_type?.toLowerCase() === 'blackout' ? 'text-white' : 'text-gray-700'
                              }`}>
                                <div className="w-8 h-8 bg-white/80 rounded shadow-sm"></div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1 text-gray-900">{fabric.fabric_name}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                  {fabric.description || getFabricTypeDescription(fabric.fabric_type)}
                                </p>
                                {pricePerSqft > 0 && (
                                  <p className="text-sm text-blue-600 font-medium">
                                    +${parseFloat(pricePerSqft).toFixed(2)}/sq ft
                                  </p>
                                )}
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                config.fabricType === fabric.fabric_option_id.toString() ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                              }`}>
                                {config.fabricType === fabric.fabric_option_id.toString() && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
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

              {config.fabricType && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center text-blue-700">
                    <Info size={20} className="mr-2" />
                    <div>
                      <p className="font-medium text-sm">
                        {(() => {
                          const selectedFabric = product?.fabricOptions?.find(f => f.fabric_option_id.toString() === config.fabricType);
                          if (selectedFabric) {
                            return selectedFabric.description || `${selectedFabric.fabric_name} - ${selectedFabric.fabric_type} fabric option selected.`;
                          }
                          return 'Fabric option selected.';
                        })()}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Free fabric swatches available upon request</p>
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Control Options */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 border transition-all ${
              activeSection === 'controls' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('controls')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Choose Control Option</h2>
              <p className="text-sm text-gray-600 mb-4">Select one control option for your blind</p>
              
              {product?.controlTypes ? (
                <div className="space-y-3">
                  {/* Flatten all control types into a single list */}
                  {(() => {
                    const allControls = [];
                    
                    // Add lift systems
                    if (product.controlTypes.liftSystems) {
                      product.controlTypes.liftSystems.forEach(system => {
                        if (system.enabled) {
                          allControls.push({
                            id: system.name.toLowerCase().replace(/\s+/g, '-'),
                            name: system.name,
                            category: 'Lift System',
                            description: getControlDescription('liftSystem', system.name),
                            price: system.price_adjustment
                          });
                        }
                      });
                    }
                    
                    // Add wand systems
                    if (product.controlTypes.wandSystem) {
                      product.controlTypes.wandSystem.forEach(system => {
                        if (system.enabled) {
                          allControls.push({
                            id: system.name.toLowerCase().replace(/\s+/g, '-'),
                            name: system.name,
                            category: 'Wand System',
                            description: getControlDescription('wandSystem', system.name),
                            price: system.price_adjustment
                          });
                        }
                      });
                    }
                    
                    // Add string systems
                    if (product.controlTypes.stringSystem) {
                      product.controlTypes.stringSystem.forEach(system => {
                        if (system.enabled) {
                          allControls.push({
                            id: system.name.toLowerCase().replace(/\s+/g, '-'),
                            name: system.name,
                            category: 'String System',
                            description: getControlDescription('stringSystem', system.name),
                            price: system.price_adjustment
                          });
                        }
                      });
                    }
                    
                    // Add remote controls
                    if (product.controlTypes.remoteControl) {
                      product.controlTypes.remoteControl.forEach(system => {
                        if (system.enabled) {
                          allControls.push({
                            id: system.name.toLowerCase().replace(/\s+/g, '-'),
                            name: system.name,
                            category: 'Remote Control',
                            description: getControlDescription('remoteControl', system.name),
                            price: system.price_adjustment
                          });
                        }
                      });
                    }
                    
                    // Helper functions for descriptions and prices
                    function getControlDescription(type, name) {
                      const descriptions = {
                        'liftSystem': {
                          'Cordless': 'Child-safe cordless operation',
                          'Continuous Loop': 'Smooth chain control system'
                        },
                        'wandSystem': {
                          'Standard Wand': 'Easy twist wand control',
                          'Extended Wand': 'Longer wand for high windows'
                        },
                        'stringSystem': {
                          'String Lift': 'Traditional pull string operation',
                          'Chain System': 'Durable chain operation'
                        },
                        'remoteControl': {
                          'Basic Remote': 'Motorized with handheld remote',
                          'Smart Home Compatible': 'Works with Alexa, Google Home & more'
                        }
                      };
                      return descriptions[type]?.[name] || `${name} control option`;
                    }
                    
                    
                    return allControls.map(control => (
                      <label key={control.id} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        config.controlOption === control.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="controlOption"
                          value={control.id}
                          checked={config.controlOption === control.id}
                          onChange={(e) => {
                            setConfig(prev => ({ ...prev, controlOption: e.target.value }));
                            setErrors(prev => ({ ...prev, liftSystem: '' }));
                          }}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900">{control.name}</h4>
                          <p className="text-sm text-gray-500">{control.category}</p>
                          <p className="text-sm text-gray-600 mt-1">{control.description}</p>
                          <p className="text-sm text-blue-600 font-medium mt-1">
                            {control.price === 0 ? 'Standard (No additional cost)' : `+$${control.price.toFixed(2)}`}
                          </p>
                        </div>
                      </label>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No control options are currently available for this product.</p>
                  <p className="text-sm text-gray-400">Please contact support or check the vendor's product page.</p>
                </div>
              )}
              
              {errors.liftSystem && (
                <p className="text-red-500 text-sm mt-3 flex items-center">
                  <Info size={14} className="mr-1" />
                  {errors.liftSystem}
                </p>
              )}
            </div>

            {/* Rail Options */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 border transition-all ${
              activeSection === 'rails' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('rails')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Rail Options</h2>
              
              <div className="space-y-4">
                {/* Valance Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valance (Head Rail)</label>
                  <select
                    value={config.valanceOption}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, valanceOption: e.target.value }));
                      setErrors(prev => ({ ...prev, valanceOption: '' }));
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.valanceOption ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select valance option</option>
                    <option value="circular-fabric">Circular (With Fabric Insert) (+$45)</option>
                    <option value="square-without">Square (Without Fabric) (+$35)</option>
                    <option value="fabric-wrapped">Fabric Wrapped (+$55)</option>
                  </select>
                  {errors.valanceOption && (
                    <p className="text-red-500 text-sm mt-1">{errors.valanceOption}</p>
                  )}
                </div>

                {/* Bottom Rail Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Rail</label>
                  <select
                    value={config.bottomRailOption}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, bottomRailOption: e.target.value }));
                      setErrors(prev => ({ ...prev, bottomRailOption: '' }));
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.bottomRailOption ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select bottom rail option</option>
                    <option value="fabric-wrapped">Fabric Wrapped (+$25)</option>
                    <option value="just-rail">Just a Rail (+$0)</option>
                  </select>
                  {errors.bottomRailOption && (
                    <p className="text-red-500 text-sm mt-1">{errors.bottomRailOption}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!areMandatoryFieldsComplete()}
              className={`w-full font-semibold py-4 px-6 rounded-xl transition-all transform shadow-lg flex items-center justify-center ${
                areMandatoryFieldsComplete()
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:scale-[1.02] hover:shadow-xl cursor-pointer'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
            >
              <Sparkles size={20} className="mr-2" />
              {areMandatoryFieldsComplete() 
                ? `Add to Cart - $${calculatePrice().toFixed(2)}` 
                : 'Complete Required Fields to Continue'
              }
            </button>

            {/* Mandatory Fields Notice */}
            {!areMandatoryFieldsComplete() && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  <Info size={14} className="inline mr-1" />
                  Please complete all required fields: Room Type, Mount Type, Width, and Height.
                </p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">100% Secure</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Free Shipping</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Quick Delivery</p>
              </div>
            </div>
          </div>

          {/* Right Side - Product Preview (fixed position, scrollable content) */}
          <div className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-4 space-y-6 
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <Sparkles className="text-blue-600 mr-2" size={24} />
                <h1 className="text-2xl font-bold text-gray-900">Configure Your Perfect Blind</h1>
              </div>
              <p className="text-gray-600">Customize every detail to match your style and needs</p>
              
              {/* Progress Steps */}
              <div className="mt-6 flex items-center justify-between">
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
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

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{product?.name || 'Premium Roller Shades'}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Brand: <span className="font-medium text-gray-900">Blinds.com</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Shown in: <span className="font-medium text-gray-900">Select a Color to Preview</span>
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
                  <button className="bg-white/90 backdrop-blur text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-md hover:shadow-lg transition-all hover:bg-white">
                    <ZoomIn size={16} className="mr-2" />
                    Zoom In
                  </button>
                </div>
                
                {/* Product Image */}
                {product?.images && product.images.length > 0 ? (
                  <div className="w-full h-full bg-cover bg-center" 
                       style={{
                         backgroundImage: `url(${product.images[0].image_url})`
                       }}>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-3">🏠</div>
                      <p className="text-lg font-medium">Product preview</p>
                      <p className="text-sm">Image will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
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
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Your Configuration</h3>
              <div className="space-y-3">
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
    </div>
  );
}