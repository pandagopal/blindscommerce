'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Define fixed width and height ranges
const WIDTH_RANGES = [
  { label: '11-20', min: 11, max: 20 },
  { label: '21-30', min: 21, max: 30 },
  { label: '31-40', min: 31, max: 40 },
  { label: '41-50', min: 41, max: 50 },
  { label: '51-60', min: 51, max: 60 },
  { label: '61-70', min: 61, max: 70 },
  { label: '71-80', min: 71, max: 80 },
  { label: '81-90', min: 81, max: 90 },
  { label: '91-100', min: 91, max: 100 },
  { label: '101-110', min: 101, max: 110 },
  { label: '111-120', min: 111, max: 120 }
];

const HEIGHT_RANGES = [
  { label: '11-20', min: 11, max: 20 },
  { label: '21-30', min: 21, max: 30 },
  { label: '31-40', min: 31, max: 40 },
  { label: '41-50', min: 41, max: 50 },
  { label: '51-60', min: 51, max: 60 },
  { label: '61-70', min: 61, max: 70 },
  { label: '71-80', min: 71, max: 80 },
  { label: '81-90', min: 81, max: 90 },
  { label: '91-100', min: 91, max: 100 },
  { label: '101-110', min: 101, max: 110 },
  { label: '111-120', min: 111, max: 120 },
  { label: '121-130', min: 121, max: 130 },
  { label: '131-140', min: 131, max: 140 },
  { label: '141-150', min: 141, max: 150 },
  { label: '151-160', min: 151, max: 160 },
  { label: '161-170', min: 161, max: 170 },
  { label: '171-180', min: 171, max: 180 },
  { label: '181-190', min: 181, max: 190 },
  { label: '191-200', min: 191, max: 200 },
  { label: '201-210', min: 201, max: 210 },
  { label: '211-220', min: 211, max: 220 },
  { label: '221-230', min: 221, max: 230 },
  { label: '231-240', min: 231, max: 240 },
  { label: '241-250', min: 241, max: 250 },
  { label: '251-260', min: 251, max: 260 },
  { label: '261-270', min: 261, max: 270 },
  { label: '271-280', min: 271, max: 280 },
  { label: '281-290', min: 281, max: 290 },
  { label: '291-300', min: 291, max: 300 }
];

interface PricingMatrixProps {
  dimensions: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    widthIncrement: number;
    heightIncrement: number;
  };
  initialData?: {
    priceMatrix?: Record<string, string>;
    matrixEntries?: any[];
  };
  onChange: (data: any) => void;
  isReadOnly?: boolean;
}

export default function PricingMatrix({ initialData, onChange, isReadOnly = false }: PricingMatrixProps) {
  const [priceMatrix, setPriceMatrix] = useState<Record<string, string>>(initialData?.priceMatrix || {});
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllRanges, setShowAllRanges] = useState(false);
  const rowsPerPage = 20; // Increased to show more ranges per page

  // Update state when initialData changes
  useEffect(() => {
    if (initialData?.priceMatrix) {
      setPriceMatrix(initialData.priceMatrix);
    }
  }, [initialData]);

  const handlePriceChange = (widthRange: string, heightRange: string, value: string) => {
    const key = `${widthRange}_${heightRange}`;
    
    // Validate input - only allow numbers and up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value) && value !== '') {
      return; // Don't update if invalid format
    }
    
    // Create updated price matrix
    const updatedPriceMatrix = {
      ...priceMatrix,
      [key]: value
    };
    
    setPriceMatrix(updatedPriceMatrix);

    // Parse the width and height ranges to get min/max values
    const widthRangeData = WIDTH_RANGES.find(r => r.label === widthRange);
    const heightRangeData = HEIGHT_RANGES.find(r => r.label === heightRange);

    // Create array of pricing matrix entries matching database structure
    const matrixEntries = Object.entries(updatedPriceMatrix).map(([rangeKey, price]) => {
      const [wRange, hRange] = rangeKey.split('_');
      const wData = WIDTH_RANGES.find(r => r.label === wRange);
      const hData = HEIGHT_RANGES.find(r => r.label === hRange);
      
      if (wData && hData) {
        return {
          width_min: wData.min,
          width_max: wData.max,
          height_min: hData.min,
          height_max: hData.max,
          base_price: parseFloat(price) || 0,
          price_per_sqft: 0,
          is_active: 1
        };
      }
      return null;
    }).filter(Boolean);

    onChange({
      priceMatrix: updatedPriceMatrix,
      matrixEntries
    });
  };

  const getPrice = (widthRange: string, heightRange: string): string => {
    const key = `${widthRange}_${heightRange}`;
    return priceMatrix[key] || '0.00';
  };

  // Calculate pagination or show all ranges
  const totalPages = Math.ceil(HEIGHT_RANGES.length / rowsPerPage);
  const startIndex = showAllRanges ? 0 : (currentPage - 1) * rowsPerPage;
  const endIndex = showAllRanges ? HEIGHT_RANGES.length : startIndex + rowsPerPage;
  const visibleHeightRanges = HEIGHT_RANGES.slice(startIndex, endIndex);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pricing Matrix</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">All sizes in inches</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllRanges(!showAllRanges)}
                className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              >
                {showAllRanges ? 'Paginated View' : 'Show All'}
              </button>
            </div>
          </div>
          {isReadOnly && (
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
              📋 View-only mode - Prices cannot be edited
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto border-t">
          <Table className="min-w-full relative">
            <TableHeader className="sticky top-0 z-20 bg-gray-50">
              <TableRow>
                <TableHead className="text-left sticky left-0 bg-gray-50 z-30 min-w-[70px] border-r p-2">
                  <div className="text-xs font-semibold">Size</div>
                </TableHead>
                {WIDTH_RANGES.map((range) => (
                  <TableHead key={range.label} className="text-center min-w-[60px] px-1 bg-gray-50">
                    <div className="text-[10px] text-gray-500">W</div>
                    <div className="text-xs font-medium">{range.label}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleHeightRanges.map((heightRange) => (
                <TableRow key={heightRange.label} className="hover:bg-gray-50">
                  <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-white z-10 min-w-[70px] border-r p-2">
                    <div className="text-[10px] text-gray-500">H</div>
                    <div className="text-xs font-medium">{heightRange.label}</div>
                  </TableCell>
                  {WIDTH_RANGES.map((widthRange) => {
                    const currentPrice = getPrice(widthRange.label, heightRange.label);
                    const priceValue = parseFloat(currentPrice) || 0;
                    const isPositiveValue = priceValue > 0;
                    
                    return (
                      <TableCell key={`${widthRange.label}-${heightRange.label}`} className="p-0">
                        <input
                          type="text"
                          value={currentPrice}
                          onChange={(e) => handlePriceChange(widthRange.label, heightRange.label, e.target.value)}
                          onFocus={(e) => {
                            if (e.target.value === '0' || e.target.value === '0.00') {
                              e.target.select();
                            }
                          }}
                          className={`w-full text-center h-8 px-1 text-xs border-0 outline-none focus:ring-1 focus:ring-blue-400 ${
                            isPositiveValue 
                              ? 'text-blue-600 font-medium bg-blue-50' 
                              : 'bg-white hover:bg-gray-50'
                          } ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-text'}`}
                          disabled={isReadOnly}
                          placeholder="0.00"
                          pattern="[0-9]*\.?[0-9]{0,2}"
                          inputMode="decimal"
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {!showAllRanges && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
            <div className="text-xs text-muted-foreground">
              Heights: {visibleHeightRanges[0]?.label}"-{visibleHeightRanges[visibleHeightRanges.length - 1]?.label}"
            </div>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  currentPage === 1 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                ‹
              </button>
              
              <span className="px-2 text-xs text-gray-600">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  currentPage === totalPages 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                ›
              </button>
            </div>
          </div>
        )}
        
        {showAllRanges && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing all height ranges: 11-20" to 291-300" ({HEIGHT_RANGES.length} ranges total)
          </div>
        )}
      </CardContent>
    </Card>
  );
}