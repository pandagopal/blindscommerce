'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, Info } from 'lucide-react';

interface EstimatedDeliveryProps {
  processingDays?: number; // Days to manufacture/process
  shippingDays?: { min: number; max: number }; // Shipping time range
  zipCode?: string;
  isCustomProduct?: boolean;
  className?: string;
  compact?: boolean;
}

const EstimatedDelivery: React.FC<EstimatedDeliveryProps> = ({
  processingDays = 3,
  shippingDays = { min: 5, max: 7 },
  zipCode,
  isCustomProduct = true,
  className = '',
  compact = false
}) => {
  const [userZip, setUserZip] = useState(zipCode || '');
  const [isEditing, setIsEditing] = useState(false);
  const [estimatedDate, setEstimatedDate] = useState<{ min: Date; max: Date } | null>(null);

  // Calculate estimated delivery date
  useEffect(() => {
    const today = new Date();
    const currentHour = today.getHours();

    // If order placed after 2 PM, add 1 day
    const orderOffset = currentHour >= 14 ? 1 : 0;

    // Skip weekends in calculation
    const addBusinessDays = (startDate: Date, days: number): Date => {
      const result = new Date(startDate);
      let daysAdded = 0;

      while (daysAdded < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysAdded++;
        }
      }

      return result;
    };

    const totalMinDays = orderOffset + processingDays + shippingDays.min;
    const totalMaxDays = orderOffset + processingDays + shippingDays.max;

    setEstimatedDate({
      min: addBusinessDays(today, totalMinDays),
      max: addBusinessDays(today, totalMaxDays)
    });
  }, [processingDays, shippingDays]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setUserZip(value);
  };

  const handleZipSubmit = () => {
    if (userZip.length === 5) {
      setIsEditing(false);
      // Could trigger API call to get more accurate shipping estimate
    }
  };

  if (!estimatedDate) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Truck className="h-4 w-4 text-green-600" />
        <span className="text-gray-700">
          Get it by <span className="font-semibold text-green-600">{formatDate(estimatedDate.max)}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 ${className}`}>
      {/* Main Delivery Estimate */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-green-100 rounded-full">
          <Truck className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">Estimated Delivery</span>
            <div className="group relative">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
                {isCustomProduct ? 'Custom products are made to order' : 'Standard shipping estimate'}
              </div>
            </div>
          </div>
          <div className="text-lg font-semibold text-green-700">
            {formatDate(estimatedDate.min)} - {formatDate(estimatedDate.max)}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mb-1" />
            <span className="text-gray-500">Order</span>
            <span className="font-medium">Today</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2 relative">
            <div className="absolute inset-0 bg-green-500" style={{ width: '30%' }} />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mb-1" />
            <span className="text-gray-500">Processing</span>
            <span className="font-medium">{processingDays} days</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mb-1" />
            <span className="text-gray-500">Ships</span>
            <span className="font-medium">{shippingDays.min}-{shippingDays.max} days</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mb-1" />
            <span className="text-gray-500">Delivery</span>
            <span className="font-medium text-green-600">{formatDate(estimatedDate.max).split(',')[0]}</span>
          </div>
        </div>
      </div>

      {/* ZIP Code Input */}
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-gray-400" />
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userZip}
              onChange={handleZipChange}
              placeholder="Enter ZIP"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
              autoFocus
            />
            <button
              onClick={handleZipSubmit}
              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              Update
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">
              Delivering to {userZip || 'your area'}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-green-600 hover:text-green-700 font-medium text-xs"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Order Cutoff Notice */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>Order within <span className="font-medium text-orange-600">2 hrs 30 min</span> for same-day processing</span>
      </div>
    </div>
  );
};

export default EstimatedDelivery;
