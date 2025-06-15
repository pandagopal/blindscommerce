'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface FractionInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  error?: string;
  className?: string;
}

// Common fractions used in window measurements
const FRACTIONS = [
  { decimal: 0, display: '0' },
  { decimal: 0.125, display: '1/8' },
  { decimal: 0.25, display: '1/4' },
  { decimal: 0.375, display: '3/8' },
  { decimal: 0.5, display: '1/2' },
  { decimal: 0.625, display: '5/8' },
  { decimal: 0.75, display: '3/4' },
  { decimal: 0.875, display: '7/8' },
];

export default function FractionInput({
  value,
  onChange,
  min = 12,
  max = 120,
  label,
  error,
  className = '',
}: FractionInputProps) {
  const [wholeNumber, setWholeNumber] = useState(Math.floor(value));
  const [fraction, setFraction] = useState(value - Math.floor(value));

  useEffect(() => {
    setWholeNumber(Math.floor(value));
    setFraction(value - Math.floor(value));
  }, [value]);

  const handleWholeNumberChange = (newWhole: number) => {
    const newValue = newWhole + fraction;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const handleFractionChange = (newFraction: number) => {
    const newValue = wholeNumber + newFraction;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const increment = () => {
    const newValue = value + 0.125;
    if (newValue <= max) {
      onChange(newValue);
    }
  };

  const decrement = () => {
    const newValue = value - 0.125;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  // Convert decimal to fraction display
  const getFractionDisplay = (decimal: number) => {
    const fraction = FRACTIONS.find(f => Math.abs(f.decimal - decimal) < 0.001);
    return fraction ? fraction.display : decimal.toFixed(3);
  };

  // Format the full display value
  const getDisplayValue = () => {
    const whole = Math.floor(value);
    const fractionalPart = value - whole;
    
    if (fractionalPart < 0.001) {
      return `${whole}"`;
    }
    
    const fractionStr = getFractionDisplay(fractionalPart);
    return `${whole} ${fractionStr}"`;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Whole number input */}
        <div className="flex-1">
          <div className="flex items-center">
            <input
              type="number"
              min={Math.floor(min)}
              max={Math.floor(max)}
              value={wholeNumber}
              onChange={(e) => handleWholeNumberChange(parseInt(e.target.value) || 0)}
              className={`w-20 px-3 py-2 border rounded-l-md text-center font-medium ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-primary-red`}
            />
            <span className="px-2 py-2 bg-gray-50 border-t border-b border-gray-300 text-sm">
              inches
            </span>
          </div>
        </div>

        {/* Fraction selector */}
        <div className="flex-1">
          <select
            value={fraction}
            onChange={(e) => handleFractionChange(parseFloat(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-primary-red`}
          >
            {FRACTIONS.map((f) => (
              <option key={f.decimal} value={f.decimal}>
                {f.display}
              </option>
            ))}
          </select>
        </div>

        {/* Increment/Decrement buttons */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={increment}
            disabled={value >= max}
            className="p-1 border border-gray-300 rounded-t-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            className="p-1 border border-l border-r border-b border-gray-300 rounded-b-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Display formatted value */}
      <div className="mt-2 text-sm text-gray-600">
        Current: <span className="font-medium text-gray-900">{getDisplayValue()}</span>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Min/Max info */}
      <p className="mt-1 text-xs text-gray-500">
        Min: {min}" - Max: {max}"
      </p>
    </div>
  );
}