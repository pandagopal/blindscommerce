'use client';

import { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from 'lucide-react';

interface PricingMatrixProps {
  dimensions: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    widthIncrement: number;
    heightIncrement: number;
  };
  onChange: (data: any) => void;
}

interface PricePoint {
  width: number;
  height: number;
  price: number;
}

export default function PricingMatrix({ dimensions, onChange }: PricingMatrixProps) {
  const [priceMatrix, setPriceMatrix] = useState<PricePoint[]>([]);
  const [widthPoints, setWidthPoints] = useState<number[]>([]);
  const [heightPoints, setHeightPoints] = useState<number[]>([]);
  const [basePrice, setBasePrice] = useState(0);

  useEffect(() => {
    // Generate width and height points based on dimensions
    const generatePoints = (min: number, max: number, increment: number) => {
      const points: number[] = [];
      for (let i = min; i <= max; i += increment) {
        points.push(Number(i.toFixed(3)));
      }
      return points;
    };

    const newWidthPoints = generatePoints(
      dimensions.minWidth,
      dimensions.maxWidth,
      dimensions.widthIncrement
    );
    const newHeightPoints = generatePoints(
      dimensions.minHeight,
      dimensions.maxHeight,
      dimensions.heightIncrement
    );

    setWidthPoints(newWidthPoints);
    setHeightPoints(newHeightPoints);
  }, [dimensions]);

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onChange({ [name]: numValue });
    }
  };

  const handlePriceChange = (width: number, height: number, price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return;

    setPriceMatrix(prev => {
      const existing = prev.findIndex(p => p.width === width && p.height === height);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].price = numPrice;
        return updated;
      }
      return [...prev, { width, height, price: numPrice }];
    });
  };

  const getPrice = (width: number, height: number) => {
    const point = priceMatrix.find(p => p.width === width && p.height === height);
    return point?.price || '';
  };

  const addWidthPoint = () => {
    if (widthPoints.length === 0) {
      setWidthPoints([dimensions.minWidth]);
    } else {
      const lastPoint = widthPoints[widthPoints.length - 1];
      const newPoint = lastPoint + dimensions.widthIncrement;
      if (newPoint <= dimensions.maxWidth) {
        setWidthPoints([...widthPoints, newPoint]);
      }
    }
  };

  const removeWidthPoint = () => {
    if (widthPoints.length > 1) {
      setWidthPoints(widthPoints.slice(0, -1));
    }
  };

  const addHeightPoint = () => {
    if (heightPoints.length === 0) {
      setHeightPoints([dimensions.minHeight]);
    } else {
      const lastPoint = heightPoints[heightPoints.length - 1];
      const newPoint = lastPoint + dimensions.heightIncrement;
      if (newPoint <= dimensions.maxHeight) {
        setHeightPoints([...heightPoints, newPoint]);
      }
    }
  };

  const removeHeightPoint = () => {
    if (heightPoints.length > 1) {
      setHeightPoints(heightPoints.slice(0, -1));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Width Range</h3>
          <div className="flex space-x-4">
            <FormField>
              <FormItem>
                <FormLabel>Min Width (inches)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name="minWidth"
                    value={dimensions.minWidth}
                    onChange={handleDimensionChange}
                    step={dimensions.widthIncrement}
                  />
                </FormControl>
              </FormItem>
            </FormField>
            <FormField>
              <FormItem>
                <FormLabel>Max Width (inches)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name="maxWidth"
                    value={dimensions.maxWidth}
                    onChange={handleDimensionChange}
                    step={dimensions.widthIncrement}
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Height Range</h3>
          <div className="flex space-x-4">
            <FormField>
              <FormItem>
                <FormLabel>Min Height (inches)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name="minHeight"
                    value={dimensions.minHeight}
                    onChange={handleDimensionChange}
                    step={dimensions.heightIncrement}
                  />
                </FormControl>
              </FormItem>
            </FormField>
            <FormField>
              <FormItem>
                <FormLabel>Max Height (inches)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name="maxHeight"
                    value={dimensions.maxHeight}
                    onChange={handleDimensionChange}
                    step={dimensions.heightIncrement}
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Price Matrix</h3>
          <div className="flex space-x-4">
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeWidthPoint}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWidthPoint}
                className="ml-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeHeightPoint}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHeightPoint}
                className="ml-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Width →<br />Height ↓</TableHead>
                {widthPoints.map(width => (
                  <TableHead key={width} className="w-24">
                    {width}"
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {heightPoints.map(height => (
                <TableRow key={height}>
                  <TableCell className="font-medium">{height}"</TableCell>
                  {widthPoints.map(width => (
                    <TableCell key={`${width}-${height}`}>
                      <Input
                        type="number"
                        value={getPrice(width, height)}
                        onChange={(e) => handlePriceChange(width, height, e.target.value)}
                        className="w-20"
                        step="0.01"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <FormField>
        <FormItem>
          <FormLabel>Base Price ($)</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              step="0.01"
            />
          </FormControl>
          <FormDescription>
            Starting price before size adjustments
          </FormDescription>
        </FormItem>
      </FormField>
    </div>
  );
} 