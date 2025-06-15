'use client';

import React, { useState } from 'react';
import { Calculator, Info, Ruler, AlertCircle, Check } from 'lucide-react';
import FractionInput from '@/components/ui/FractionInput';

interface MeasurementResult {
  insideMount: {
    width: number;
    height: number;
  };
  outsideMount: {
    width: number;
    height: number;
  };
  recommendations: string[];
}

export default function MeasurementCalculator() {
  const [windowType, setWindowType] = useState<'standard' | 'bay' | 'arch' | 'skylight'>('standard');
  const [mountType, setMountType] = useState<'inside' | 'outside'>('inside');
  const [measurements, setMeasurements] = useState({
    openingWidth: 36,
    openingHeight: 48,
    leftDepth: 3,
    rightDepth: 3,
    topDepth: 3,
    bottomDepth: 3,
  });
  const [showResults, setShowResults] = useState(false);

  const calculateRecommendedSizes = (): MeasurementResult => {
    const recommendations: string[] = [];
    
    // Inside mount calculations
    const insideWidth = measurements.openingWidth - 0.25; // 1/4" deduction for clearance
    const insideHeight = measurements.openingHeight - 0.25;
    
    // Outside mount calculations
    const outsideWidth = measurements.openingWidth + 3; // 1.5" on each side for overlap
    const outsideHeight = measurements.openingHeight + 3; // Extra height for top mounting
    
    // Check depth requirements
    const minDepth = Math.min(
      measurements.leftDepth,
      measurements.rightDepth,
      measurements.topDepth,
      measurements.bottomDepth
    );
    
    if (minDepth < 2) {
      recommendations.push('⚠️ Inside mount requires minimum 2" depth. Consider outside mount.');
    } else if (minDepth < 3.5) {
      recommendations.push('✓ Standard inside mount possible (2" minimum depth met)');
      recommendations.push('ℹ️ Flush mount requires 3.5" depth - not available for this window');
    } else {
      recommendations.push('✓ Both standard and flush inside mount options available');
    }
    
    // Check for square window
    const depthVariance = Math.max(
      measurements.leftDepth,
      measurements.rightDepth,
      measurements.topDepth,
      measurements.bottomDepth
    ) - minDepth;
    
    if (depthVariance > 0.25) {
      recommendations.push('⚠️ Window opening may not be square. Measure carefully at multiple points.');
    }
    
    // Size recommendations
    if (measurements.openingWidth > 72) {
      recommendations.push('ℹ️ For windows wider than 72", consider using multiple blinds for easier operation');
    }
    
    return {
      insideMount: {
        width: Math.round(insideWidth * 8) / 8, // Round to nearest 1/8"
        height: Math.round(insideHeight * 8) / 8,
      },
      outsideMount: {
        width: Math.round(outsideWidth * 8) / 8,
        height: Math.round(outsideHeight * 8) / 8,
      },
      recommendations,
    };
  };

  const handleCalculate = () => {
    setShowResults(true);
  };

  const results = showResults ? calculateRecommendedSizes() : null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Calculator className="h-8 w-8 text-primary-red mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Window Measurement Calculator</h2>
      </div>

      {/* Window Type Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">1. Select Window Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'standard', label: 'Standard Window' },
            { value: 'bay', label: 'Bay Window' },
            { value: 'arch', label: 'Arch Window' },
            { value: 'skylight', label: 'Skylight' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setWindowType(type.value as any)}
              className={`p-3 border rounded-lg text-center transition-colors ${
                windowType === type.value
                  ? 'border-primary-red bg-red-50 text-primary-red'
                  : 'border-gray-300 hover:border-primary-red'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mount Type Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">2. Preferred Mount Type</h3>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => setMountType('inside')}
            className={`p-3 border rounded-lg text-center transition-colors ${
              mountType === 'inside'
                ? 'border-primary-red bg-red-50 text-primary-red'
                : 'border-gray-300 hover:border-primary-red'
            }`}
          >
            Inside Mount
          </button>
          <button
            onClick={() => setMountType('outside')}
            className={`p-3 border rounded-lg text-center transition-colors ${
              mountType === 'outside'
                ? 'border-primary-red bg-red-50 text-primary-red'
                : 'border-gray-300 hover:border-primary-red'
            }`}
          >
            Outside Mount
          </button>
        </div>
      </div>

      {/* Measurement Inputs */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">3. Enter Window Measurements</h3>
        
        {/* Opening measurements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FractionInput
            label="Window Opening Width"
            value={measurements.openingWidth}
            onChange={(value) => setMeasurements({ ...measurements, openingWidth: value })}
            min={12}
            max={144}
          />
          <FractionInput
            label="Window Opening Height"
            value={measurements.openingHeight}
            onChange={(value) => setMeasurements({ ...measurements, openingHeight: value })}
            min={12}
            max={120}
          />
        </div>

        {/* Depth measurements for inside mount */}
        {mountType === 'inside' && (
          <div>
            <h4 className="text-md font-medium mb-3 flex items-center">
              <Ruler className="h-5 w-5 mr-2" />
              Window Frame Depth (for inside mount)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <FractionInput
                label="Left Depth"
                value={measurements.leftDepth}
                onChange={(value) => setMeasurements({ ...measurements, leftDepth: value })}
                min={0}
                max={12}
              />
              <FractionInput
                label="Right Depth"
                value={measurements.rightDepth}
                onChange={(value) => setMeasurements({ ...measurements, rightDepth: value })}
                min={0}
                max={12}
              />
              <FractionInput
                label="Top Depth"
                value={measurements.topDepth}
                onChange={(value) => setMeasurements({ ...measurements, topDepth: value })}
                min={0}
                max={12}
              />
              <FractionInput
                label="Bottom Depth"
                value={measurements.bottomDepth}
                onChange={(value) => setMeasurements({ ...measurements, bottomDepth: value })}
                min={0}
                max={12}
              />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
              <Info className="h-4 w-4 inline mr-1" />
              Measure depth at all four corners to ensure your window is square
            </div>
          </div>
        )}
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        className="w-full md:w-auto px-6 py-3 bg-primary-red text-white font-medium rounded-lg hover:bg-primary-red-dark transition-colors"
      >
        Calculate Recommended Sizes
      </button>

      {/* Results */}
      {results && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Recommended Blind Sizes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Inside Mount</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Width:</span>
                  <span className="font-medium">{results.insideMount.width}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Height:</span>
                  <span className="font-medium">{results.insideMount.height}"</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Includes 1/4" deduction for proper clearance
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Outside Mount</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Width:</span>
                  <span className="font-medium">{results.outsideMount.width}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Height:</span>
                  <span className="font-medium">{results.outsideMount.height}"</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Includes 3" total overlap for light control
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {results.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Measurement Tips */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
          Pro Measurement Tips
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Always use a steel tape measure for accuracy</li>
          <li>• Measure width at top, middle, and bottom - use the smallest measurement</li>
          <li>• Measure height at left, center, and right - use the smallest measurement</li>
          <li>• For inside mount, check that window frame is deep enough (min 2")</li>
          <li>• Round measurements to the nearest 1/8 inch</li>
        </ul>
      </div>
    </div>
  );
}