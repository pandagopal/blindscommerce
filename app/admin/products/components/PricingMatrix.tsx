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
import { Input } from "@/components/ui/input";
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
  const rowsPerPage = 10;

  // Update state when initialData changes
  useEffect(() => {
    if (initialData?.priceMatrix) {
      setPriceMatrix(initialData.priceMatrix);
    }
  }, [initialData]);

  const handlePriceChange = (widthRange: string, heightRange: string, value: string) => {
    const key = `${widthRange}-${heightRange}`;
    
    setPriceMatrix(prev => ({
      ...prev,
      [key]: value
    }));

    // Parse the width and height ranges to get min/max values
    const [widthLabel, heightLabel] = key.split('-');
    const widthRangeData = WIDTH_RANGES.find(r => r.label === widthRange);
    const heightRangeData = HEIGHT_RANGES.find(r => r.label === heightRange);

    // Create array of pricing matrix entries matching database structure
    const matrixEntries = Object.entries({
      ...priceMatrix,
      [key]: value
    }).map(([rangeKey, price]) => {
      const [wRange, hRange] = rangeKey.split('-');
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
      priceMatrix,
      matrixEntries
    });
  };

  const getPrice = (widthRange: string, heightRange: string): string => {
    const key = `${widthRange}-${heightRange}`;
    return priceMatrix[key] || '0.00';
  };

  // Calculate pagination
  const totalPages = Math.ceil(HEIGHT_RANGES.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleHeightRanges = HEIGHT_RANGES.slice(startIndex, startIndex + rowsPerPage);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">All Sizes in INCHES</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Sizes</TableHead>
                {WIDTH_RANGES.map((range) => (
                  <TableHead key={range.label} className="text-center">
                    Width<br />{range.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleHeightRanges.map((heightRange) => (
                <TableRow key={heightRange.label}>
                  <TableCell className="font-medium whitespace-nowrap">
                    Height<br />{heightRange.label}
                  </TableCell>
                  {WIDTH_RANGES.map((widthRange) => (
                    <TableCell key={`${widthRange.label}-${heightRange.label}`} className="p-0">
                      <Input
                        type="number"
                        value={getPrice(widthRange.label, heightRange.label)}
                        onChange={(e) => handlePriceChange(widthRange.label, heightRange.label, e.target.value)}
                        className="text-center border-0 h-12"
                        step="0.01"
                        min="0"
                        disabled={isReadOnly}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-primary text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-primary text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 