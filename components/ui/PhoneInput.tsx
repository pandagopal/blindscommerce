'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPhoneNumber, validatePhoneNumber, COUNTRY_CONFIGS, CountryCode, getPhoneValidationError } from '@/lib/utils/phoneFormatter';

interface PhoneInputProps {
  value: string;
  onChange: (value: string, country?: CountryCode) => void;
  onCountryChange?: (country: CountryCode) => void;
  country?: CountryCode;
  showCountrySelector?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function PhoneInput({
  value,
  onChange,
  onCountryChange,
  country = 'US',
  showCountrySelector = false,
  placeholder,
  className = '',
  required = false,
  disabled = false,
  error
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(country);
  const config = COUNTRY_CONFIGS[selectedCountry];

  const handlePhoneChange = (inputValue: string) => {
    const formatted = formatPhoneNumber(inputValue, selectedCountry);
    onChange(formatted, selectedCountry);
  };

  const handleCountryChange = (newCountry: CountryCode) => {
    setSelectedCountry(newCountry);
    onCountryChange?.(newCountry);
    // Reformat existing number for new country
    if (value) {
      const formatted = formatPhoneNumber(value, newCountry);
      onChange(formatted, newCountry);
    }
  };

  const isValid = !value || validatePhoneNumber(value, selectedCountry);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        {showCountrySelector && (
          <Select value={selectedCountry} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-40">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{config.flag}</span>
                  <span className="text-sm">{config.dialCode}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(COUNTRY_CONFIGS).map((countryConfig) => (
                <SelectItem key={countryConfig.code} value={countryConfig.code}>
                  <div className="flex items-center gap-2">
                    <span>{countryConfig.flag}</span>
                    <span>{countryConfig.name}</span>
                    <span className="text-gray-500 text-sm">{countryConfig.dialCode}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Input
          type="tel"
          value={value}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder || config.placeholder}
          maxLength={config.maxLength}
          required={required}
          disabled={disabled}
          className={`flex-1 ${!isValid ? 'border-red-500' : ''}`}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {!isValid && value && !error && (
        <p className="text-sm text-red-600">
          {getPhoneValidationError(selectedCountry)}
        </p>
      )}
      
      {showCountrySelector && (
        <p className="text-xs text-gray-500">
          Format: {config.format} • Example: {config.placeholder}
        </p>
      )}
    </div>
  );
}