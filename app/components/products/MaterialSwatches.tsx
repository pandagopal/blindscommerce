import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface Swatch {
  id: string;
  name: string;
  color: string;
  material: string;
  image: string;
}

interface MaterialSwatchesProps {
  swatches: Swatch[];
  maxSelections?: number;
}

export default function MaterialSwatches({ swatches, maxSelections = 5 }: MaterialSwatchesProps) {
  const [selectedSwatches, setSelectedSwatches] = useState<string[]>([]);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleSwatchSelection = (swatchId: string) => {
    setSelectedSwatches(prev => {
      if (prev.includes(swatchId)) {
        return prev.filter(id => id !== swatchId);
      }
      if (prev.length >= maxSelections) {
        return prev;
      }
      return [...prev, swatchId];
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // TODO: Implement API call to submit swatch order
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm">
      <div>
        <h2 className="text-2xl font-bold mb-2">Order Free Swatches</h2>
        <p className="text-gray-600">
          Select up to {maxSelections} swatches to receive free samples
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {swatches.map((swatch) => (
          <div
            key={swatch.id}
            className={`relative border rounded-lg p-3 cursor-pointer transition-all
              ${selectedSwatches.includes(swatch.id) ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => handleSwatchSelection(swatch.id)}
          >
            <div className="aspect-square rounded-md overflow-hidden mb-2">
              <img
                src={swatch.image}
                alt={swatch.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">{swatch.name}</h3>
              <p className="text-xs text-gray-500">{swatch.material}</p>
            </div>
            <Checkbox
              checked={selectedSwatches.includes(swatch.id)}
              className="absolute top-2 right-2"
            />
          </div>
        ))}
      </div>

      {selectedSwatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shipping Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                value={shippingInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={shippingInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input
              value={shippingInfo.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your street address"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <Input
                value={shippingInfo.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <Input
                value={shippingInfo.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">ZIP Code</label>
              <Input
                value={shippingInfo.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="ZIP Code"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!shippingInfo.name || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode}
          >
            Order Free Swatches
          </Button>
        </div>
      )}
    </div>
  );
} 