#!/usr/bin/env node
/**
 * Test pricing calculations against Excel examples
 * Based on the analysis showing additive pricing model:
 * Price = A + B×width + C×height + D×(width×height)
 */

// Example from Excel analysis - Corded Roller, Insert Cassette System, Fabric S1001
const testCases = [
  // Width 12-22, Height 14-25 = $18.18
  { width: 17, height: 19.75, expectedPrice: 18.18, tolerance: 0.02 },
  
  // Width 23-34, Height 14-25 = $22.89
  { width: 28.5, height: 19.75, expectedPrice: 22.89, tolerance: 0.02 },
  
  // Width 35-46, Height 14-25 = $28.10
  { width: 40.5, height: 19.75, expectedPrice: 28.10, tolerance: 0.30 },
  
  // Width 12-22, Height 38-49 = $20.33
  { width: 17, height: 43.75, expectedPrice: 20.33, tolerance: 0.20 },
  
  // Width 23-34, Height 26-37 = $24.55
  { width: 28.5, height: 31.5, expectedPrice: 24.55, tolerance: 0.50 },
  
  // Width 35-46, Height 26-37 = $30.34
  { width: 40.5, height: 31.5, expectedPrice: 30.34, tolerance: 1.50 }
];

// Coefficients from Excel analysis
const formula = {
  A: 10.84,  // Base price
  B: 0.325,  // Width rate per inch
  C: 0.019,  // Height rate per inch
  D: 0.00429 // Area rate per square inch
};

function calculatePrice(width, height, coefficients) {
  const { A, B, C, D } = coefficients;
  return A + (B * width) + (C * height) + (D * width * height);
}

function testPricingFormula() {
  console.log('Testing Pricing Formula Against Excel Examples');
  console.log('Formula: Price = A + B×W + C×H + D×(W×H)');
  console.log(`Coefficients: A=${formula.A}, B=${formula.B}, C=${formula.C}, D=${formula.D}`);
  console.log('=' .repeat(80));
  console.log();
  
  let totalError = 0;
  let passCount = 0;
  
  testCases.forEach((test, index) => {
    const calculatedPrice = calculatePrice(test.width, test.height, formula);
    const error = Math.abs(calculatedPrice - test.expectedPrice);
    const errorPercent = (error / test.expectedPrice) * 100;
    const passed = error <= test.tolerance;
    
    if (passed) passCount++;
    totalError += errorPercent;
    
    console.log(`Test ${index + 1}: Width=${test.width}", Height=${test.height}"`);
    console.log(`  Expected: $${test.expectedPrice.toFixed(2)}`);
    console.log(`  Calculated: $${calculatedPrice.toFixed(2)}`);
    console.log(`  Error: $${error.toFixed(2)} (${errorPercent.toFixed(1)}%)`);
    console.log(`  Status: ${passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log();
  });
  
  const avgError = totalError / testCases.length;
  console.log('=' .repeat(80));
  console.log(`Summary: ${passCount}/${testCases.length} tests passed`);
  console.log(`Average error: ${avgError.toFixed(2)}%`);
  console.log();
  
  // Test price progression
  console.log('Price Progression Examples:');
  console.log('-'.repeat(50));
  
  const sizes = [
    { width: 20, height: 20 },
    { width: 40, height: 40 },
    { width: 60, height: 60 },
    { width: 80, height: 80 },
    { width: 100, height: 100 }
  ];
  
  sizes.forEach(size => {
    const price = calculatePrice(size.width, size.height, formula);
    const area = size.width * size.height;
    const pricePerSqFt = (price / (area / 144)).toFixed(2);
    console.log(`${size.width}" × ${size.height}" = $${price.toFixed(2)} ($${pricePerSqFt}/sqft)`);
  });
}

// Test grid-based lookup
function testGridPricing() {
  console.log('\n');
  console.log('=' .repeat(80));
  console.log('Grid-Based Pricing Test');
  console.log('=' .repeat(80));
  console.log();
  
  // Define price ranges
  const widthRanges = [
    { min: 12, max: 22, label: '12-22' },
    { min: 23, max: 34, label: '23-34' },
    { min: 35, max: 46, label: '35-46' },
    { min: 47, max: 58, label: '47-58' },
    { min: 59, max: 70, label: '59-70' }
  ];
  
  const heightRanges = [
    { min: 14, max: 25, label: '14-25' },
    { min: 26, max: 37, label: '26-37' },
    { min: 38, max: 49, label: '38-49' },
    { min: 50, max: 61, label: '50-61' },
    { min: 62, max: 73, label: '62-73' }
  ];
  
  // Sample grid prices (from Excel)
  const priceGrid = {
    '12-22_14-25': 18.18,
    '23-34_14-25': 22.89,
    '35-46_14-25': 28.10,
    '12-22_26-37': 19.47,
    '23-34_26-37': 24.55,
    '35-46_26-37': 30.34,
    '12-22_38-49': 20.33,
    '23-34_38-49': 26.21,
    '35-46_38-49': 32.58
  };
  
  console.log('Sample Grid Lookups:');
  
  const testSizes = [
    { width: 15, height: 20 },
    { width: 30, height: 30 },
    { width: 40, height: 45 },
    { width: 25, height: 35 },
    { width: 18, height: 40 }
  ];
  
  testSizes.forEach(size => {
    // Find matching ranges
    const widthRange = widthRanges.find(r => size.width >= r.min && size.width <= r.max);
    const heightRange = heightRanges.find(r => size.height >= r.min && size.height <= r.max);
    
    if (widthRange && heightRange) {
      const key = `${widthRange.label}_${heightRange.label}`;
      const gridPrice = priceGrid[key];
      
      if (gridPrice) {
        console.log(`${size.width}" × ${size.height}" → ${widthRange.label} × ${heightRange.label} = $${gridPrice}`);
      } else {
        console.log(`${size.width}" × ${size.height}" → ${widthRange.label} × ${heightRange.label} = [No price in sample]`);
      }
    } else {
      console.log(`${size.width}" × ${size.height}" → Out of range`);
    }
  });
}

// Test per-square pricing
function testPerSquarePricing() {
  console.log('\n');
  console.log('=' .repeat(80));
  console.log('Per-Square Pricing Test (Vertical Blinds Example)');
  console.log('=' .repeat(80));
  console.log();
  
  const ratePerSqM = 13.99; // $13.99/sqm from Excel
  const minSquares = 1.0;
  const motorAddOn = 79.00;
  
  const testSizes = [
    { width: 24, height: 36 },   // Small
    { width: 48, height: 60 },   // Medium
    { width: 72, height: 84 },   // Large
    { width: 12, height: 12 }    // Below minimum
  ];
  
  testSizes.forEach(size => {
    // Convert to square meters (assuming input is in inches)
    const areaInches = size.width * size.height;
    const areaInSqFt = areaInches / 144;
    const areaInSqM = areaInSqFt * 0.092903; // 1 sqft = 0.092903 sqm
    
    const effectiveArea = Math.max(areaInSqM, minSquares);
    const basePrice = effectiveArea * ratePerSqM;
    const withMotor = basePrice + motorAddOn;
    
    console.log(`${size.width}" × ${size.height}"`);
    console.log(`  Area: ${areaInSqM.toFixed(2)} sqm (min: ${minSquares} sqm)`);
    console.log(`  Base price: $${basePrice.toFixed(2)}`);
    console.log(`  With motor: $${withMotor.toFixed(2)}`);
    console.log();
  });
}

// Run all tests
console.log('BlindsCommerce Pricing Calculation Tests');
console.log('Based on Excel File Analysis');
console.log('=' .repeat(80));
console.log();

testPricingFormula();
testGridPricing();
testPerSquarePricing();

console.log('\n');
console.log('=' .repeat(80));
console.log('Test completed');
console.log('=' .repeat(80));