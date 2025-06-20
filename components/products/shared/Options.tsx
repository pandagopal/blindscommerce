'use client';

import { useState, useRef, useEffect } from 'react';
import { PlusIcon, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface BasicOption {
  name: string;
  price_adjustment: number;
  enabled: boolean;
  description?: string;
}

interface DimensionSettings {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  widthIncrement: number;
  heightIncrement: number;
}

interface ProductOptions {
  // Dimensions
  dimensions: DimensionSettings;
  
  // Mount Types
  mountTypes: BasicOption[];
  
  // Control Types
  controlTypes: {
    liftSystems: BasicOption[];
    wandSystem: BasicOption[];
    stringSystem: BasicOption[];
    remoteControl: BasicOption[];
  };
  
  // Valance (Head Rail)
  valanceOptions: BasicOption[];
  
  // Bottom Rail
  bottomRailOptions: BasicOption[];
}

interface OptionsProps {
  data: ProductOptions;
  onChange: (data: ProductOptions) => void;
  isReadOnly?: boolean;
}

export default function Options({ data, onChange, isReadOnly = false }: OptionsProps) {
  // Initialize default options if they don't exist
  const [currentData, setCurrentData] = useState<ProductOptions>(() => {
    return {
      dimensions: data.dimensions || {
        minWidth: 12,
        maxWidth: 96,
        minHeight: 12,
        maxHeight: 120,
        widthIncrement: 0.125,  // Fixed to 1/8" industry standard
        heightIncrement: 0.125, // Fixed to 1/8" industry standard
      },
      mountTypes: data.mountTypes && data.mountTypes.length > 0 ? data.mountTypes : [
        { name: 'Inside Mount', price_adjustment: 0, enabled: false },
        { name: 'Outside Mount', price_adjustment: 0, enabled: false },
      ],
      controlTypes: {
        liftSystems: data.controlTypes?.liftSystems && data.controlTypes.liftSystems.length > 0 ? data.controlTypes.liftSystems : [
          { name: 'Cordless', price_adjustment: 0, enabled: false },
          { name: 'Continuous Loop', price_adjustment: 25, enabled: false },
        ],
        wandSystem: data.controlTypes?.wandSystem && data.controlTypes.wandSystem.length > 0 ? data.controlTypes.wandSystem : [
          { name: 'Standard Wand', price_adjustment: 15, enabled: false },
          { name: 'Extended Wand', price_adjustment: 30, enabled: false },
        ],
        stringSystem: data.controlTypes?.stringSystem && data.controlTypes.stringSystem.length > 0 ? data.controlTypes.stringSystem : [
          { name: 'String Lift', price_adjustment: 10, enabled: false },
          { name: 'Chain System', price_adjustment: 20, enabled: false },
        ],
        remoteControl: data.controlTypes?.remoteControl && data.controlTypes.remoteControl.length > 0 ? data.controlTypes.remoteControl : [
          { name: 'Basic Remote', price_adjustment: 150, enabled: false },
          { name: 'Smart Home Compatible', price_adjustment: 250, enabled: false },
        ],
      },
      valanceOptions: data.valanceOptions && data.valanceOptions.length > 0 ? data.valanceOptions : [
        { name: 'Circular (With Fabric Insert)', price_adjustment: 45, enabled: false },
        { name: 'Square (Without Fabric)', price_adjustment: 35, enabled: false },
        { name: 'Fabric Wrapped', price_adjustment: 55, enabled: false },
      ],
      bottomRailOptions: data.bottomRailOptions && data.bottomRailOptions.length > 0 ? data.bottomRailOptions : [
        { name: 'Fabric Wrapped', price_adjustment: 25, enabled: false },
        { name: 'Just a Rail', price_adjustment: 0, enabled: false },
      ],
    };
  });

  // Update currentData when data prop changes (e.g., when loading product data)
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setCurrentData({
        dimensions: data.dimensions || {
          minWidth: 12,
          maxWidth: 96,
          minHeight: 12,
          maxHeight: 120,
          widthIncrement: 0.125,
          heightIncrement: 0.125,
        },
        mountTypes: data.mountTypes && data.mountTypes.length > 0 ? data.mountTypes : [
          { name: 'Inside Mount', price_adjustment: 0, enabled: false },
          { name: 'Outside Mount', price_adjustment: 0, enabled: false },
        ],
        controlTypes: {
          liftSystems: data.controlTypes?.liftSystems && data.controlTypes.liftSystems.length > 0 ? data.controlTypes.liftSystems : [
            { name: 'Cordless', price_adjustment: 0, enabled: false },
            { name: 'Continuous Loop', price_adjustment: 25, enabled: false },
          ],
          wandSystem: data.controlTypes?.wandSystem && data.controlTypes.wandSystem.length > 0 ? data.controlTypes.wandSystem : [
            { name: 'Standard Wand', price_adjustment: 15, enabled: false },
            { name: 'Extended Wand', price_adjustment: 30, enabled: false },
          ],
          stringSystem: data.controlTypes?.stringSystem && data.controlTypes.stringSystem.length > 0 ? data.controlTypes.stringSystem : [
            { name: 'String Lift', price_adjustment: 10, enabled: false },
            { name: 'Chain System', price_adjustment: 20, enabled: false },
          ],
          remoteControl: data.controlTypes?.remoteControl && data.controlTypes.remoteControl.length > 0 ? data.controlTypes.remoteControl : [
            { name: 'Basic Remote', price_adjustment: 150, enabled: false },
            { name: 'Smart Home Compatible', price_adjustment: 250, enabled: false },
          ],
        },
        valanceOptions: data.valanceOptions && data.valanceOptions.length > 0 ? data.valanceOptions : [
          { name: 'Circular (With Fabric Insert)', price_adjustment: 45, enabled: false },
          { name: 'Square (Without Fabric)', price_adjustment: 35, enabled: false },
          { name: 'Fabric Wrapped', price_adjustment: 55, enabled: false },
        ],
        bottomRailOptions: data.bottomRailOptions && data.bottomRailOptions.length > 0 ? data.bottomRailOptions : [
          { name: 'Fabric Wrapped', price_adjustment: 25, enabled: false },
          { name: 'Just a Rail', price_adjustment: 0, enabled: false },
        ],
      });
    }
  }, [data]);

  const handleDimensionChange = (field: keyof DimensionSettings, value: number) => {
    // Ensure positive values only
    const positiveValue = Math.max(0, value);
    const newData = {
      ...currentData,
      dimensions: {
        ...currentData.dimensions,
        [field]: positiveValue,
      },
    };
    setCurrentData(newData);
    onChange(newData);
  };

  const handleOptionToggle = (
    category: keyof ProductOptions,
    subcategory: string | null,
    index: number
  ) => {
    const newData = { ...currentData };
    
    if (subcategory) {
      // Handle nested control types
      const controlCategory = newData.controlTypes as any;
      controlCategory[subcategory][index].enabled = !controlCategory[subcategory][index].enabled;
    } else {
      // Handle direct categories
      const categoryData = newData[category] as BasicOption[];
      categoryData[index].enabled = !categoryData[index].enabled;
    }
    
    setCurrentData(newData);
    onChange(newData);
  };

  const handlePriceChange = (
    category: keyof ProductOptions,
    subcategory: string | null,
    index: number,
    newPrice: number
  ) => {
    const newData = { ...currentData };
    
    if (subcategory) {
      // Handle nested control types
      const controlCategory = newData.controlTypes as any;
      controlCategory[subcategory][index].price_adjustment = newPrice;
    } else {
      // Handle direct categories
      const categoryData = newData[category] as BasicOption[];
      categoryData[index].price_adjustment = newPrice;
    }
    
    setCurrentData(newData);
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      {/* Dimensions Section */}
      <Card>
        <CardHeader>
          <CardTitle>📐 Dimensions Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">📏 Measurement Precision</h4>
              <p className="text-sm text-blue-700">
                All measurements use industry-standard <strong>1/8" (0.125") increments</strong> for precise fitting.
                Customers will select measurements in eighths: 24", 24 1/8", 24 1/4", 24 3/8", 24 1/2", etc.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="minWidth">Min Width (inches)</Label>
                <Input
                  id="minWidth"
                  type="number"
                  step="0.125"
                  min="0.125"
                  placeholder="e.g., 12"
                  value={currentData.dimensions.minWidth === 0 ? '' : currentData.dimensions.minWidth}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      handleDimensionChange('minWidth', value);
                    }
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.value = '';
                    }
                  }}
                  disabled={isReadOnly}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum width for this product</p>
              </div>
              <div>
                <Label htmlFor="maxWidth">Max Width (inches)</Label>
                <Input
                  id="maxWidth"
                  type="number"
                  step="0.125"
                  min="0.125"
                  placeholder="e.g., 96"
                  value={currentData.dimensions.maxWidth === 0 ? '' : currentData.dimensions.maxWidth}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      handleDimensionChange('maxWidth', value);
                    }
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.value = '';
                    }
                  }}
                  disabled={isReadOnly}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum width for this product</p>
              </div>
              <div>
                <Label htmlFor="minHeight">Min Height (inches)</Label>
                <Input
                  id="minHeight"
                  type="number"
                  step="0.125"
                  min="0.125"
                  placeholder="e.g., 12"
                  value={currentData.dimensions.minHeight === 0 ? '' : currentData.dimensions.minHeight}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      handleDimensionChange('minHeight', value);
                    }
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.value = '';
                    }
                  }}
                  disabled={isReadOnly}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum height for this product</p>
              </div>
              <div>
                <Label htmlFor="maxHeight">Max Height (inches)</Label>
                <Input
                  id="maxHeight"
                  type="number"
                  step="0.125"
                  min="0.125"
                  placeholder="e.g., 120"
                  value={currentData.dimensions.maxHeight === 0 ? '' : currentData.dimensions.maxHeight}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      handleDimensionChange('maxHeight', value);
                    }
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.value = '';
                    }
                  }}
                  disabled={isReadOnly}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum height for this product</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mount Types Section */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Mount Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentData.mountTypes.map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Switch
                    id={`mount-${index}`}
                    checked={option.enabled}
                    onCheckedChange={() => handleOptionToggle('mountTypes', null, index)}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor={`mount-${index}`} className="font-medium">
                    {option.name}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${option.enabled ? 'text-muted-foreground' : 'text-gray-300'}`}>$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={option.price_adjustment}
                    onChange={(e) => handlePriceChange('mountTypes', null, index, parseFloat(e.target.value) || 0)}
                    className={`w-20 h-8 text-sm ${!option.enabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={!option.enabled || isReadOnly}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Control Types Section */}
      <Card>
        <CardHeader>
          <CardTitle>🎛️ Control Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Lift Systems */}
            <div>
              <h4 className="font-semibold mb-3">Lift Systems</h4>
              <div className="space-y-2 ml-4">
                {currentData.controlTypes.liftSystems.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`lift-${index}`}
                        checked={option.enabled}
                        onCheckedChange={() => handleOptionToggle('controlTypes', 'liftSystems', index)}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`lift-${index}`}>{option.name}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${option.enabled ? 'text-muted-foreground' : 'text-gray-300'}`}>$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={option.price_adjustment}
                        onChange={(e) => handlePriceChange('controlTypes', 'liftSystems', index, parseFloat(e.target.value) || 0)}
                        className={`w-20 h-8 text-sm ${!option.enabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={!option.enabled || isReadOnly}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Wand System */}
            <div>
              <h4 className="font-semibold mb-3">Wand System</h4>
              <div className="space-y-2 ml-4">
                {currentData.controlTypes.wandSystem.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`wand-${index}`}
                        checked={option.enabled}
                        onCheckedChange={() => handleOptionToggle('controlTypes', 'wandSystem', index)}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`wand-${index}`}>{option.name}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${option.enabled ? 'text-muted-foreground' : 'text-gray-300'}`}>$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={option.price_adjustment}
                        onChange={(e) => handlePriceChange('controlTypes', 'wandSystem', index, parseFloat(e.target.value) || 0)}
                        className={`w-20 h-8 text-sm ${!option.enabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={!option.enabled || isReadOnly}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* String System */}
            <div>
              <h4 className="font-semibold mb-3">String System</h4>
              <div className="space-y-2 ml-4">
                {currentData.controlTypes.stringSystem.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`string-${index}`}
                        checked={option.enabled}
                        onCheckedChange={() => handleOptionToggle('controlTypes', 'stringSystem', index)}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`string-${index}`}>{option.name}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${option.enabled ? 'text-muted-foreground' : 'text-gray-300'}`}>$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={option.price_adjustment}
                        onChange={(e) => handlePriceChange('controlTypes', 'stringSystem', index, parseFloat(e.target.value) || 0)}
                        className={`w-20 h-8 text-sm ${!option.enabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={!option.enabled || isReadOnly}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Remote Control */}
            <div>
              <h4 className="font-semibold mb-3">Remote Control</h4>
              <div className="space-y-2 ml-4">
                {currentData.controlTypes.remoteControl.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`remote-${index}`}
                        checked={option.enabled}
                        onCheckedChange={() => handleOptionToggle('controlTypes', 'remoteControl', index)}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`remote-${index}`}>{option.name}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${option.enabled ? 'text-muted-foreground' : 'text-gray-300'}`}>$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={option.price_adjustment}
                        onChange={(e) => handlePriceChange('controlTypes', 'remoteControl', index, parseFloat(e.target.value) || 0)}
                        className={`w-20 h-8 text-sm ${!option.enabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={!option.enabled || isReadOnly}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valance (Head Rail) Section */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ Valance (Head Rail)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentData.valanceOptions.map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Switch
                    id={`valance-${index}`}
                    checked={option.enabled}
                    onCheckedChange={() => handleOptionToggle('valanceOptions', null, index)}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor={`valance-${index}`} className="font-medium">
                    {option.name}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${option.enabled ? 'text-muted-foreground' : 'text-gray-300'}`}>$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={option.price_adjustment}
                    onChange={(e) => handlePriceChange('valanceOptions', null, index, parseFloat(e.target.value) || 0)}
                    className={`w-20 h-8 text-sm ${!option.enabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={!option.enabled || isReadOnly}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Rail Section */}
      <Card>
        <CardHeader>
          <CardTitle>⬇️ Bottom Rail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentData.bottomRailOptions.map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Switch
                    id={`bottom-${index}`}
                    checked={option.enabled}
                    onCheckedChange={() => handleOptionToggle('bottomRailOptions', null, index)}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor={`bottom-${index}`} className="font-medium">
                    {option.name}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${option.enabled ? 'text-muted-foreground' : 'text-gray-300'}`}>$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={option.price_adjustment}
                    onChange={(e) => handlePriceChange('bottomRailOptions', null, index, parseFloat(e.target.value) || 0)}
                    className={`w-20 h-8 text-sm ${!option.enabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={!option.enabled || isReadOnly}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}