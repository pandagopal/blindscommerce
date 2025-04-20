'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ConfigState,
  Product,
  MountType,
  ControlType,
  HeadrailOption,
  BottomRailOption
} from './ConfigurationContext';

interface PriceBreakdownProps {
  product: Product;
  config: ConfigState;
  mountTypes: MountType[];
  controlTypes: ControlType[];
  headrailOptions: HeadrailOption[];
  bottomRailOptions: BottomRailOption[];
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  product,
  config,
  mountTypes,
  controlTypes,
  headrailOptions,
  bottomRailOptions
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get selected options
  const selectedMount = mountTypes.find(m => m.id === config.mountType);
  const selectedColor = product.colors.find(c => c.color_id === config.colorId);
  const selectedMaterial = product.materials.find(m => m.material_id === config.materialId);
  const selectedControl = controlTypes.find(c => c.name === config.controlType);
  const selectedHeadrail = headrailOptions.find(h => h.id === config.headrailId);
  const selectedBottomRail = bottomRailOptions.find(b => b.id === config.bottomRailId);

  // Calculate the size multiplier
  const sizeMultiplier = (config.width * config.height) / (24 * 36);
  const adjustedBasePrice = Math.round(product.base_price * Math.max(1, sizeMultiplier) * 100) / 100;

  // Toggle the expanded view
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <button
        onClick={toggleExpanded}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <span className="font-medium text-gray-900">Price Breakdown</span>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Price:</span>
            <span>${product.base_price.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Size Adjustment:</span>
            <span>
              {sizeMultiplier > 1
                ? `${sizeMultiplier.toFixed(2)}x (${adjustedBasePrice.toFixed(2)})`
                : 'No adjustment'
              }
            </span>
          </div>

          {selectedMount && selectedMount.priceModifier > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">{selectedMount.name}:</span>
              <span>+${selectedMount.priceModifier.toFixed(2)}</span>
            </div>
          )}

          {selectedColor && selectedColor.price_modifier > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">{selectedColor.name} Color:</span>
              <span>+${selectedColor.price_modifier.toFixed(2)}</span>
            </div>
          )}

          {selectedMaterial && selectedMaterial.price_modifier > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">{selectedMaterial.name} Material:</span>
              <span>+${selectedMaterial.price_modifier.toFixed(2)}</span>
            </div>
          )}

          {selectedControl && selectedControl.priceModifier > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">{selectedControl.name} Control:</span>
              <span>+${selectedControl.priceModifier.toFixed(2)}</span>
            </div>
          )}

          {selectedHeadrail && selectedHeadrail.priceModifier > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">{selectedHeadrail.name} Headrail:</span>
              <span>+${selectedHeadrail.priceModifier.toFixed(2)}</span>
            </div>
          )}

          {selectedBottomRail && selectedBottomRail.priceModifier > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">{selectedBottomRail.name} Bottom Rail:</span>
              <span>+${selectedBottomRail.priceModifier.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t pt-2 mt-2 font-medium">
            <div className="flex justify-between">
              <span>Unit Price:</span>
              <span>${config.currentPrice.toFixed(2)}</span>
            </div>
          </div>

          {config.quantity > 1 && (
            <>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span>x{config.quantity}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Price:</span>
                <span>${config.totalPrice.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {!isExpanded && (
        <div className="flex justify-between font-medium text-lg">
          <span>Price:</span>
          <span className="text-primary-red">${config.totalPrice.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

export default PriceBreakdown;
