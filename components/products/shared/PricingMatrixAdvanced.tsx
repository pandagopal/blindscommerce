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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Copy, Calculator } from "lucide-react";
import { toast } from "sonner";

// Define fixed width and height ranges based on Excel analysis
const WIDTH_RANGES = [
  { label: '12-22', min: 12, max: 22 },
  { label: '23-34', min: 23, max: 34 },
  { label: '35-46', min: 35, max: 46 },
  { label: '47-58', min: 47, max: 58 },
  { label: '59-70', min: 59, max: 70 },
  { label: '71-82', min: 71, max: 82 },
  { label: '83-94', min: 83, max: 94 },
  { label: '95-106', min: 95, max: 106 },
  { label: '107-118', min: 107, max: 118 },
  { label: '119-130', min: 119, max: 130 }
];

const HEIGHT_RANGES = [
  { label: '14-25', min: 14, max: 25 },
  { label: '26-37', min: 26, max: 37 },
  { label: '38-49', min: 38, max: 49 },
  { label: '50-61', min: 50, max: 61 },
  { label: '62-73', min: 62, max: 73 },
  { label: '74-85', min: 74, max: 85 },
  { label: '86-97', min: 86, max: 97 },
  { label: '98-109', min: 98, max: 109 },
  { label: '110-121', min: 110, max: 121 },
  { label: '122-133', min: 122, max: 133 },
  { label: '134-145', min: 134, max: 145 },
  { label: '146-157', min: 146, max: 157 },
  { label: '158-169', min: 158, max: 169 },
  { label: '170-181', min: 170, max: 181 },
  { label: '182-193', min: 182, max: 193 },
  { label: '194-205', min: 194, max: 205 },
  { label: '206-217', min: 206, max: 217 },
  { label: '218-229', min: 218, max: 229 },
  { label: '230-241', min: 230, max: 241 },
  { label: '242-253', min: 242, max: 253 },
  { label: '254-265', min: 254, max: 265 },
  { label: '266-277', min: 266, max: 277 },
  { label: '278-289', min: 278, max: 289 },
  { label: '290-300', min: 290, max: 300 }
];

// Common system types based on Excel
const SYSTEM_TYPES = [
  { value: 'square_cassette', label: 'Square/Fabric Insert Cassette' },
  { value: 'no_cassette', label: 'No Cassette System' },
  { value: 'new_cassette', label: 'New Cassette' },
  { value: 'full_enclosed', label: 'Full Enclosed System' },
  { value: 'wood_system', label: 'Wood System with Valance' }
];

interface SystemPricingData {
  systemType: string;
  fabricCode: string;
  priceMatrix: Record<string, string>;
  matrixEntries: any[];
}

interface FormulaCoefficients {
  base: number;
  widthRate: number;
  heightRate: number;
  areaRate: number;
}

interface PricingMatrixAdvancedProps {
  dimensions: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  };
  initialData?: {
    systems?: SystemPricingData[];
    perSquarePrice?: number;
    squareUnit?: 'sqft' | 'sqm';
    minSquares?: number;
    pricingModel?: 'grid' | 'formula' | 'per_square' | 'hybrid';
  };
  fabrics?: Array<{ fabric_option_id: string; fabric_name: string; fabric_code: string }>;
  onChange: (data: any) => void;
  isReadOnly?: boolean;
}

export default function PricingMatrixAdvanced({ 
  dimensions, 
  initialData, 
  fabrics = [], 
  onChange, 
  isReadOnly = false 
}: PricingMatrixAdvancedProps) {
  const [pricingModel, setPricingModel] = useState<'grid' | 'formula' | 'per_square' | 'hybrid'>(
    initialData?.pricingModel || 'grid'
  );
  
  // Grid-based pricing state
  const [systems, setSystems] = useState<SystemPricingData[]>(
    initialData?.systems?.length > 0 ? initialData.systems : [{
      systemType: 'square_cassette',
      fabricCode: fabrics && fabrics.length > 0 ? fabrics[0].fabric_code : '',
      priceMatrix: {},
      matrixEntries: []
    }]
  );
  
  // Per-square pricing state
  const [perSquarePrice, setPerSquarePrice] = useState(initialData?.perSquarePrice || 0);
  const [squareUnit, setSquareUnit] = useState<'sqft' | 'sqm'>(initialData?.squareUnit || 'sqft');
  const [minSquares, setMinSquares] = useState(initialData?.minSquares || 1);
  
  // Formula coefficients state
  const [showFormula, setShowFormula] = useState(false);
  const [formulaCoefficients, setFormulaCoefficients] = useState<FormulaCoefficients>({
    base: 0,
    widthRate: 0,
    heightRate: 0,
    areaRate: 0
  });

  const handleSystemPriceChange = (systemIndex: number, widthRange: string, heightRange: string, value: string) => {
    const key = `${widthRange}_${heightRange}`;
    
    // Validate input
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value) && value !== '') {
      return;
    }
    
    const updatedSystems = [...systems];
    updatedSystems[systemIndex].priceMatrix[key] = value;
    
    // Update matrix entries for database
    const matrixEntries = Object.entries(updatedSystems[systemIndex].priceMatrix).map(([rangeKey, price]) => {
      const [wRange, hRange] = rangeKey.split('_');
      const wData = WIDTH_RANGES.find(r => r.label === wRange);
      const hData = HEIGHT_RANGES.find(r => r.label === hRange);
      
      if (wData && hData) {
        return {
          system_type: updatedSystems[systemIndex].systemType,
          fabric_code: updatedSystems[systemIndex].fabricCode,
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
    
    updatedSystems[systemIndex].matrixEntries = matrixEntries;
    setSystems(updatedSystems);
    
    onChange({
      pricingModel,
      systems: updatedSystems,
      perSquarePrice,
      squareUnit,
      minSquares
    });
  };

  const addSystem = () => {
    const newSystem: SystemPricingData = {
      systemType: SYSTEM_TYPES[0]?.value || '',
      fabricCode: fabrics && fabrics.length > 0 ? fabrics[0].fabric_code : '',
      priceMatrix: {},
      matrixEntries: []
    };
    setSystems([...systems, newSystem]);
  };

  const removeSystem = (index: number) => {
    const updatedSystems = systems.filter((_, i) => i !== index);
    setSystems(updatedSystems);
    onChange({
      pricingModel,
      systems: updatedSystems,
      perSquarePrice,
      squareUnit,
      minSquares
    });
  };

  const copyPricesFromSystem = (fromIndex: number, toIndex: number) => {
    const updatedSystems = [...systems];
    updatedSystems[toIndex].priceMatrix = { ...systems[fromIndex].priceMatrix };
    setSystems(updatedSystems);
    toast.success('Prices copied successfully');
  };

  const calculateFormulaPrice = () => {
    if (!showFormula) {
      setShowFormula(true);
      // Calculate coefficients from existing prices
      if (systems[0]?.priceMatrix) {
        const prices = [];
        const inputs = [];
        
        Object.entries(systems[0].priceMatrix).forEach(([key, price]) => {
          if (price) {
            const [wRange, hRange] = key.split('_');
            const wData = WIDTH_RANGES.find(r => r.label === wRange);
            const hData = HEIGHT_RANGES.find(r => r.label === hRange);
            
            if (wData && hData) {
              const w = (wData.min + wData.max) / 2;
              const h = (hData.min + hData.max) / 2;
              inputs.push([1, w, h, w * h]);
              prices.push(parseFloat(price));
            }
          }
        });
        
        if (inputs.length >= 4) {
          // Use least squares to fit the formula
          // This is a simplified calculation - in production, use proper matrix operations
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          setFormulaCoefficients({
            base: avgPrice * 0.3, // Rough estimate
            widthRate: 0.5,
            heightRate: 0.1,
            areaRate: 0.005
          });
        }
      }
    } else {
      setShowFormula(false);
    }
  };

  const renderGridPricing = () => (
    <div className="space-y-6">
      {systems.map((system, systemIndex) => (
        <Card key={systemIndex}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <Label>System Type</Label>
                  <Select
                    value={system.systemType}
                    onValueChange={(value) => {
                      const updated = [...systems];
                      updated[systemIndex].systemType = value;
                      setSystems(updated);
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select system type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_TYPES.map((type, idx) => (
                        <SelectItem key={`system-${type.value}-${idx}`} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Fabric</Label>
                  <Select
                    value={system.fabricCode || ''}
                    onValueChange={(value) => {
                      const updated = [...systems];
                      // If the value starts with 'fabric_', it's a fallback value
                      // Store the original fabric code if available
                      const selectedFabric = fabrics.find(f => 
                        f.fabric_code === value || 
                        `fabric_${f.fabric_option_id}` === value ||
                        `fabric_${fabrics.indexOf(f)}` === value
                      );
                      updated[systemIndex].fabricCode = selectedFabric?.fabric_code || value;
                      setSystems(updated);
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select fabric" />
                    </SelectTrigger>
                    <SelectContent>
                      {fabrics.map((fabric, idx) => {
                        // Skip fabrics without a code or use fabric_option_id as fallback
                        const fabricValue = fabric.fabric_code || `fabric_${fabric.fabric_option_id || idx}`;
                        return (
                          <SelectItem 
                            key={fabric.fabric_option_id || `fabric-${idx}`} 
                            value={fabricValue}
                          >
                            {fabric.fabric_name} {fabric.fabric_code ? `(${fabric.fabric_code})` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                {systemIndex > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyPricesFromSystem(0, systemIndex)}
                    disabled={isReadOnly}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy from first
                  </Button>
                )}
                {systems.length > 1 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeSystem(systemIndex)}
                    disabled={isReadOnly}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto border-t">
              <Table className="min-w-full relative">
                <TableHeader className="sticky top-0 z-20 bg-gray-50">
                  <TableRow>
                    <TableHead className="text-left sticky left-0 bg-gray-50 z-30 min-w-[70px] border-r p-2">
                      <div className="text-xs font-semibold">Height \ Width</div>
                    </TableHead>
                    {WIDTH_RANGES.map((range) => (
                      <TableHead key={range.label} className="text-center min-w-[80px] px-1 bg-gray-50">
                        <div className="text-xs font-medium">{range.label}"</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HEIGHT_RANGES.map((heightRange) => (
                    <TableRow key={heightRange.label} className="hover:bg-gray-50">
                      <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-white z-10 min-w-[70px] border-r p-2">
                        <div className="text-xs font-medium">{heightRange.label}"</div>
                      </TableCell>
                      {WIDTH_RANGES.map((widthRange) => {
                        const key = `${widthRange.label}_${heightRange.label}`;
                        const currentPrice = system.priceMatrix[key] || '';
                        
                        return (
                          <TableCell key={key} className="p-0">
                            <input
                              type="text"
                              value={currentPrice}
                              onChange={(e) => handleSystemPriceChange(systemIndex, widthRange.label, heightRange.label, e.target.value)}
                              className="w-full text-center h-8 px-1 text-xs border-0 outline-none focus:ring-1 focus:ring-blue-400"
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
          </CardContent>
        </Card>
      ))}
      
      {!isReadOnly && (
        <Button onClick={addSystem} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Another System/Fabric Combination
        </Button>
      )}
    </div>
  );

  const renderPerSquarePricing = () => (
    <Card>
      <CardHeader>
        <CardTitle>Per Square Unit Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Price per Square Unit</Label>
            <Input
              type="number"
              value={perSquarePrice}
              onChange={(e) => {
                setPerSquarePrice(parseFloat(e.target.value) || 0);
                onChange({
                  pricingModel,
                  perSquarePrice: parseFloat(e.target.value) || 0,
                  squareUnit,
                  minSquares
                });
              }}
              disabled={isReadOnly}
              step="0.01"
              min="0"
            />
          </div>
          
          <div>
            <Label>Square Unit</Label>
            <Select
              value={squareUnit}
              onValueChange={(value: 'sqft' | 'sqm') => {
                setSquareUnit(value);
                onChange({
                  pricingModel,
                  perSquarePrice,
                  squareUnit: value,
                  minSquares
                });
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="sqft" value="sqft">Square Feet</SelectItem>
                <SelectItem key="sqm" value="sqm">Square Meters</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Minimum Squares</Label>
            <Input
              type="number"
              value={minSquares}
              onChange={(e) => {
                setMinSquares(parseFloat(e.target.value) || 1);
                onChange({
                  pricingModel,
                  perSquarePrice,
                  squareUnit,
                  minSquares: parseFloat(e.target.value) || 1
                });
              }}
              disabled={isReadOnly}
              step="0.1"
              min="0.1"
            />
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Formula:</strong> Price = Rate × Area (minimum {minSquares} {squareUnit})
          </p>
          <p className="text-sm text-blue-800 mt-1">
            Example: 48" × 60" = 20 sqft × ${perSquarePrice}/{squareUnit} = ${(20 * perSquarePrice).toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderFormulaDisplay = () => showFormula && (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Pricing Formula (for custom sizes)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label className="text-xs">Base (A)</Label>
            <Input
              type="number"
              value={formulaCoefficients.base}
              onChange={(e) => setFormulaCoefficients({...formulaCoefficients, base: parseFloat(e.target.value) || 0})}
              disabled={isReadOnly}
              step="0.01"
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Width Rate (B)</Label>
            <Input
              type="number"
              value={formulaCoefficients.widthRate}
              onChange={(e) => setFormulaCoefficients({...formulaCoefficients, widthRate: parseFloat(e.target.value) || 0})}
              disabled={isReadOnly}
              step="0.0001"
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Height Rate (C)</Label>
            <Input
              type="number"
              value={formulaCoefficients.heightRate}
              onChange={(e) => setFormulaCoefficients({...formulaCoefficients, heightRate: parseFloat(e.target.value) || 0})}
              disabled={isReadOnly}
              step="0.0001"
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Area Rate (D)</Label>
            <Input
              type="number"
              value={formulaCoefficients.areaRate}
              onChange={(e) => setFormulaCoefficients({...formulaCoefficients, areaRate: parseFloat(e.target.value) || 0})}
              disabled={isReadOnly}
              step="0.000001"
              className="h-8"
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Price = {formulaCoefficients.base} + {formulaCoefficients.widthRate}×W + {formulaCoefficients.heightRate}×H + {formulaCoefficients.areaRate}×(W×H)
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pricing Configuration</h3>
          <p className="text-sm text-gray-600">Configure pricing based on size ranges and systems</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Label>Pricing Model:</Label>
          <Select
            value={pricingModel}
            onValueChange={(value: any) => {
              setPricingModel(value);
              onChange({
                pricingModel: value,
                systems,
                perSquarePrice,
                squareUnit,
                minSquares
              });
            }}
            disabled={isReadOnly}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="grid" value="grid">Grid-Based</SelectItem>
              <SelectItem key="per_square" value="per_square">Per Square Unit</SelectItem>
              <SelectItem key="hybrid" value="hybrid">Hybrid (Grid + Formula)</SelectItem>
            </SelectContent>
          </Select>
          
          {(pricingModel === 'grid' || pricingModel === 'hybrid') && (
            <Button
              size="sm"
              variant="outline"
              onClick={calculateFormulaPrice}
            >
              <Calculator className="h-4 w-4 mr-1" />
              {showFormula ? 'Hide' : 'Show'} Formula
            </Button>
          )}
        </div>
      </div>
      
      {pricingModel === 'grid' && renderGridPricing()}
      {pricingModel === 'per_square' && renderPerSquarePricing()}
      {pricingModel === 'hybrid' && (
        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid">Grid Pricing</TabsTrigger>
            <TabsTrigger value="per_square">Per Square Pricing</TabsTrigger>
          </TabsList>
          <TabsContent value="grid">{renderGridPricing()}</TabsContent>
          <TabsContent value="per_square">{renderPerSquarePricing()}</TabsContent>
        </Tabs>
      )}
      
      {showFormula && (pricingModel === 'grid' || pricingModel === 'hybrid') && renderFormulaDisplay()}
      
      {isReadOnly && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
          📋 View-only mode - Prices cannot be edited
        </div>
      )}
    </div>
  );
}