import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useRoleAuth } from "@/lib/hooks/useRoleAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InstallationProduct {
  id: string;
  name: string;
  quantity: number;
  dimensions: string;
}

interface InstallationAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  specialInstructions?: string;
}

export default function InstallationScheduling() {
  // Role-based access control
  const { isAuthorized, isLoading } = useRoleAuth('INSTALLER');

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [products, setProducts] = useState<InstallationProduct[]>([]);
  const [address, setAddress] = useState<InstallationAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    specialInstructions: ''
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authorized, this will redirect to unauthorized page
  if (!isAuthorized) {
    return null;
  }

  const timeSlots = [
    'Morning (8:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 4:00 PM)',
    'Evening (4:00 PM - 8:00 PM)'
  ];

  const handleAddressChange = (field: keyof InstallationAddress, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTimeSlot) return;

    // TODO: Implement API call to schedule installation
    console.log('Scheduling installation:', {
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      products,
      address
    });
  };

  const isFormValid = () => {
    return (
      selectedDate &&
      selectedTimeSlot &&
      products.length > 0 &&
      address.street &&
      address.city &&
      address.state &&
      address.zipCode
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Schedule Installation</h2>
        <p className="text-gray-600">
          Book a professional installation service for your window treatments
        </p>
      </div>

      {/* Date Selection */}
      <div>
        <h3 className="font-medium mb-3">Select Installation Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
          disabled={(date) => 
            date < new Date() || // Past dates
            date.getDay() === 0 || // Sundays
            date.getDay() === 6    // Saturdays
          }
        />
      </div>

      {/* Time Slot Selection */}
      <div>
        <h3 className="font-medium mb-3">Select Time Slot</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTimeSlot(slot)}
              className={`p-4 text-sm rounded-lg border transition-colors
                ${selectedTimeSlot === slot
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-gray-300'
                }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Installation Address */}
      <div className="space-y-4">
        <h3 className="font-medium">Installation Address</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Street Address</label>
          <Input
            value={address.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            placeholder="Enter street address"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <Input
              value={address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="City"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <Input
              value={address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="State"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <Input
              value={address.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              placeholder="ZIP Code"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Special Instructions</label>
          <Textarea
            value={address.specialInstructions}
            onChange={(e) => handleAddressChange('specialInstructions', e.target.value)}
            placeholder="Any special instructions for the installation team?"
            rows={4}
          />
        </div>
      </div>

      {/* Products List */}
      <div>
        <h3 className="font-medium mb-3">Products to Install</h3>
        {products.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No products selected. Please add products from your order.
          </p>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 border rounded-lg flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">
                    Quantity: {product.quantity} • Dimensions: {product.dimensions}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProducts(prev => prev.filter(p => p.id !== product.id))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={!isFormValid()}
      >
        Schedule Installation
      </Button>

      <p className="text-sm text-gray-500 text-center">
        Our installation team will contact you to confirm the appointment and provide additional details.
      </p>
    </div>
  );
} 