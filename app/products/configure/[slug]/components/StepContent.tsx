'use client';

import React from 'react';
import { Check, Info } from 'lucide-react';
import { useConfig } from './ConfigurationContext';
import RoomVisualizer from './RoomVisualizer';
import PriceBreakdown from './PriceBreakdown';

const StepContent = () => {
  const {
    product,
    config,
    setConfig,
    mountTypes,
    controlTypes,
    headrailOptions,
    bottomRailOptions,
    roomRecommendations,
  } = useConfig();

  const [dimensionErrors, setDimensionErrors] = React.useState({
    width: '',
    height: '',
  });

  const validateDimension = (value: number, type: 'width' | 'height') => {
    const minVal = 12;
    const maxVal = type === 'width' ? 96 : 108;
    const isValidStep = (value * 8) % 1 === 0; // Check if it's a multiple of 1/8"

    if (value < minVal) {
      return `${type === 'width' ? 'Width' : 'Height'} must be at least ${minVal} inches`;
    }
    if (value > maxVal) {
      return `${type === 'width' ? 'Width' : 'Height'} must be at most ${maxVal} inches`;
    }
    if (!isValidStep) {
      return 'Measurements must be in 1/8 inch increments';
    }
    return '';
  };

  const handleDimensionChange = (type: 'width' | 'height', value: number) => {
    const error = validateDimension(value, type);
    setDimensionErrors(prev => ({ ...prev, [type]: error }));
    
    if (!error) {
      setConfig({ ...config, [type]: value });
    }
  };

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
                  <div className="relative flex justify-center items-center h-16 mb-2">
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
                    onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 12)}
                    className={`w-full p-2 border rounded-md ${
                      dimensionErrors.width ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="ml-2 flex items-center">
                    <button
                      className="p-1 border border-gray-300 rounded-l-md"
                      onClick={() => handleDimensionChange('width', Math.max(12, config.width - 0.125))}
                    >
                      -
                    </button>
                    <button
                      className="p-1 border-t border-r border-b border-gray-300 rounded-r-md"
                      onClick={() => handleDimensionChange('width', Math.min(96, config.width + 0.125))}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-gray-500">Min: 12" - Max: 96"</p>
                  {dimensionErrors.width && (
                    <p className="text-xs text-red-500 mt-1">{dimensionErrors.width}</p>
                  )}
                </div>
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
                    onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 12)}
                    className={`w-full p-2 border rounded-md ${
                      dimensionErrors.height ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="ml-2 flex items-center">
                    <button
                      className="p-1 border border-gray-300 rounded-l-md"
                      onClick={() => handleDimensionChange('height', Math.max(12, config.height - 0.125))}
                    >
                      -
                    </button>
                    <button
                      className="p-1 border-t border-r border-b border-gray-300 rounded-r-md"
                      onClick={() => handleDimensionChange('height', Math.min(108, config.height + 0.125))}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-gray-500">Min: 12" - Max: 108"</p>
                  {dimensionErrors.height && (
                    <p className="text-xs text-red-500 mt-1">{dimensionErrors.height}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <div className="flex">
                <Info size={14} className="mr-1 flex-shrink-0" />
                <span>For the most accurate fit, measure to the nearest 1/8 inch.</span>
              </div>
            </div>
            <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm text-gray-600">
                Standard sizes for <span className="font-medium">{config.mountType === 1 ? 'Inside' : 'Outside'}</span> mount:
                <br />
                {config.mountType === 1 ? (
                  <span className="text-xs">
                    • Deduct 1/4" from exact window opening for proper operation
                    <br />
                    • Minimum depth required: 2" for standard mount, 3.5" for flush mount
                  </span>
                ) : (
                  <span className="text-xs">
                    • Add 3" to width for light gap coverage (1.5" per side)
                    <br />
                    • Add 2-3" to height if mounting above window frame
                  </span>
                )}
              </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

    case 5: // Additional Options (Headrail & Bottom Rail)
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-3">6. Select Headrail Style</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {headrailOptions.map((option) => (
                <div
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    config.headrailId === option.id
                      ? 'border-primary-red bg-red-50'
                      : 'border-gray-200 hover:border-primary-red'
                  }`}
                  onClick={() => setConfig({ ...config, headrailId: option.id })}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{option.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    </div>
                    {config.headrailId === option.id && (
                      <Check className="h-5 w-5 text-primary-red" />
                    )}
                  </div>
                  {option.priceModifier > 0 && (
                    <p className="text-sm text-primary-red mt-2">+${option.priceModifier.toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-3">7. Select Bottom Rail Style</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {bottomRailOptions.map((option) => (
                <div
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    config.bottomRailId === option.id
                      ? 'border-primary-red bg-red-50'
                      : 'border-gray-200 hover:border-primary-red'
                  }`}
                  onClick={() => setConfig({ ...config, bottomRailId: option.id })}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{option.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    </div>
                    {config.bottomRailId === option.id && (
                      <Check className="h-5 w-5 text-primary-red" />
                    )}
                  </div>
                  {option.priceModifier > 0 && (
                    <p className="text-sm text-primary-red mt-2">+${option.priceModifier.toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 6: // Room Recommendations
      return (
        <div>
          <h2 className="text-lg font-medium mb-3">8. Recommended Rooms</h2>
          <p className="text-gray-600 mb-4">
            Based on your selections, these are the best rooms for your configured window treatment:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roomRecommendations
              .sort((a, b) => b.score - a.score)
              .map((room) => (
                <div
                  key={room.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    config.roomType === room.name
                      ? 'border-primary-red bg-red-50'
                      : 'border-gray-200 hover:border-primary-red'
                  }`}
                  onClick={() => setConfig({ ...config, roomType: room.name })}
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{room.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{room.description}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full mx-0.5 ${
                            i < room.score ? 'bg-primary-red' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {config.roomType && (
            <div className="mt-4">
              <RoomVisualizer roomType={config.roomType} product={product} config={config} />
            </div>
          )}
        </div>
      );

    case 7: // Review & Add to Cart
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
              <div className="flex justify-between">
                <span className="text-gray-600">Headrail:</span>
                <span>{headrailOptions.find(h => h.id === config.headrailId)?.name || 'Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bottom Rail:</span>
                <span>{bottomRailOptions.find(b => b.id === config.bottomRailId)?.name || 'Standard'}</span>
              </div>
              {config.roomType && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Recommended Room:</span>
                  <span>{config.roomType}</span>
                </div>
              )}
            </div>

            <PriceBreakdown
              product={product}
              config={config}
              mountTypes={mountTypes}
              controlTypes={controlTypes}
              headrailOptions={headrailOptions}
              bottomRailOptions={bottomRailOptions}
            />
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
        </div>
      );

    default:
      return null;
  }
};

export default StepContent;
