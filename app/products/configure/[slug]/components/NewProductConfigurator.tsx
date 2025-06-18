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
    liftSystem: '',
    wandSystem: '',
    stringSystem: '',
    remoteControl: '',
    valanceOption: '',
    bottomRailOption: '',
  });

  const [errors, setErrors] = useState({
    roomType: '',
    mountType: '',
    width: '',
    height: '',
    liftSystem: '',
    valanceOption: '',
    bottomRailOption: '',
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleRoomTypeChange = (roomType: string) => {
    setConfig(prev => ({ ...prev, roomType }));
    setErrors(prev => ({ ...prev, roomType: '' }));
  };

  const handleMountTypeChange = (mountType: string) => {
    setConfig(prev => ({ ...prev, mountType }));
    setErrors(prev => ({ ...prev, mountType: '' }));
  };

  const handleDimensionChange = (field: 'width' | 'height', value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {
      roomType: !config.roomType ? 'Please select a room type' : '',
      mountType: !config.mountType ? 'Please select mount type' : '',
      width: !config.width || parseFloat(config.width) <= 0 ? 'Please enter valid width' : '',
      height: !config.height || parseFloat(config.height) <= 0 ? 'Please enter valid height' : '',
      liftSystem: !config.liftSystem ? 'Please select a lift system' : '',
      valanceOption: !config.valanceOption ? 'Please select a valance option' : '',
      bottomRailOption: !config.bottomRailOption ? 'Please select a bottom rail option' : '',
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleAddToCart = () => {
    if (validateForm()) {
      onAddToCart(config);
    }
  };

  const calculatePrice = () => {
    // Basic price calculation based on dimensions
    const basePrice = product?.base_price || 33.99;
    const width = parseFloat(config.width) || 0;
    const height = parseFloat(config.height) || 0;
    const area = width * height;
    
    // Area-based pricing
    let totalPrice = basePrice + (area * 0.10);
    
    // Add option pricing
    if (config.liftSystem === 'continuous-loop') totalPrice += 25;
    if (config.wandSystem === 'standard-wand') totalPrice += 15;
    if (config.wandSystem === 'extended-wand') totalPrice += 30;
    if (config.stringSystem === 'string-lift') totalPrice += 10;
    if (config.stringSystem === 'chain-system') totalPrice += 20;
    if (config.remoteControl === 'basic-remote') totalPrice += 150;
    if (config.remoteControl === 'smart-home') totalPrice += 250;
    if (config.valanceOption === 'circular-fabric') totalPrice += 45;
    if (config.valanceOption === 'square-without') totalPrice += 35;
    if (config.valanceOption === 'fabric-wrapped') totalPrice += 55;
    if (config.bottomRailOption === 'fabric-wrapped') totalPrice += 25;
    
    return totalPrice;
  };

  const isStepCompleted = (step: string) => {
    switch (step) {
      case 'room': return !!config.roomType;
      case 'mount': return !!config.mountType;
      case 'dimensions': return !!config.width && !!config.height;
      case 'controls': return !!config.liftSystem;
      case 'rails': return !!config.valanceOption && !!config.bottomRailOption;
      default: return false;
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Configuration */}
          <div className="space-y-6">
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

            {/* Choose Your Room */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 border transition-all ${
              activeSection === 'room' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('room')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Choose Your Room</h2>
              
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
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Choose Mount Type</h2>
              
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

                <div className="flex-1 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        value={config.width}
                        onChange={(e) => handleDimensionChange('width', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.125"
                        className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.width ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      <select
                        value={config.widthFraction}
                        onChange={(e) => setConfig(prev => ({ ...prev, widthFraction: e.target.value }))}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    </div>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Measure the top of the window frame</li>
                        <li>• Order the exact size - we'll handle deductions</li>
                      </ul>
                    </div>
                    {errors.width && <p className="text-red-500 text-sm mt-2">{errors.width}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        value={config.height}
                        onChange={(e) => handleDimensionChange('height', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.125"
                        className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.height ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      <select
                        value={config.heightFraction}
                        onChange={(e) => setConfig(prev => ({ ...prev, heightFraction: e.target.value }))}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    </div>
                    {errors.height && <p className="text-red-500 text-sm mt-2">{errors.height}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Control Options */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 border transition-all ${
              activeSection === 'controls' ? 'border-blue-500 shadow-blue-100' : 'border-gray-100'
            }`}
              onFocus={() => setActiveSection('controls')}
              onBlur={() => setActiveSection(null)}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Control Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lift Systems */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lift System</label>
                  <select
                    value={config.liftSystem}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, liftSystem: e.target.value }));
                      setErrors(prev => ({ ...prev, liftSystem: '' }));
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.liftSystem ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select lift system</option>
                    <option value="cordless">Cordless (+$0)</option>
                    <option value="continuous-loop">Continuous Loop (+$25)</option>
                  </select>
                  {errors.liftSystem && (
                    <p className="text-red-500 text-sm mt-1">{errors.liftSystem}</p>
                  )}
                </div>

                {/* Wand System */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wand System <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <select
                    value={config.wandSystem}
                    onChange={(e) => setConfig(prev => ({ ...prev, wandSystem: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">No wand system</option>
                    <option value="standard-wand">Standard Wand (+$15)</option>
                    <option value="extended-wand">Extended Wand (+$30)</option>
                  </select>
                </div>

                {/* String System */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    String System <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <select
                    value={config.stringSystem}
                    onChange={(e) => setConfig(prev => ({ ...prev, stringSystem: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">No string system</option>
                    <option value="string-lift">String Lift (+$10)</option>
                    <option value="chain-system">Chain System (+$20)</option>
                  </select>
                </div>

                {/* Remote Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remote Control <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <select
                    value={config.remoteControl}
                    onChange={(e) => setConfig(prev => ({ ...prev, remoteControl: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">No remote control</option>
                    <option value="basic-remote">Basic Remote (+$150)</option>
                    <option value="smart-home">Smart Home Compatible (+$250)</option>
                  </select>
                </div>
              </div>
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <Sparkles size={20} className="mr-2" />
              Add to Cart - ${calculatePrice().toFixed(2)}
            </button>

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

          {/* Right Side - Product Preview */}
          <div className="lg:sticky lg:top-8 space-y-6">
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
                {config.liftSystem && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lift System:</span>
                    <span className="font-medium text-gray-900 capitalize">{config.liftSystem.replace('-', ' ')}</span>
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