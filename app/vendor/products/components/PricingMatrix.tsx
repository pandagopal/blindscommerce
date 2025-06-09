import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Dimensions {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  widthIncrement: number;
  heightIncrement: number;
}

interface PricingMatrixProps {
  dimensions: Dimensions;
  onChange: (dimensions: Dimensions) => void;
}

export default function PricingMatrix({ dimensions, onChange }: PricingMatrixProps) {
  const [pricingData, setPricingData] = useState<any[]>([]);

  const updateDimension = (key: keyof Dimensions, value: number) => {
    onChange({
      ...dimensions,
      [key]: value
    });
  };

  const generatePricingMatrix = () => {
    const matrix = [];
    for (let width = dimensions.minWidth; width <= dimensions.maxWidth; width += 12) {
      for (let height = dimensions.minHeight; height <= dimensions.maxHeight; height += 12) {
        const basePrice = 50 + (width * 0.5) + (height * 0.4);
        matrix.push({
          width,
          height,
          price: basePrice.toFixed(2)
        });
      }
    }
    setPricingData(matrix.slice(0, 20)); // Limit to 20 entries for display
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Product Dimensions & Pricing</h3>
        <p className="text-sm text-gray-600 mb-6">
          Set the size constraints and pricing structure for your product
        </p>
      </div>

      <Tabs defaultValue="dimensions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="dimensions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Size Constraints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minWidth">Minimum Width (inches)</Label>
                  <Input
                    id="minWidth"
                    type="number"
                    value={dimensions.minWidth}
                    onChange={(e) => updateDimension('minWidth', Number(e.target.value))}
                    min="6"
                    max="144"
                  />
                </div>
                <div>
                  <Label htmlFor="maxWidth">Maximum Width (inches)</Label>
                  <Input
                    id="maxWidth"
                    type="number"
                    value={dimensions.maxWidth}
                    onChange={(e) => updateDimension('maxWidth', Number(e.target.value))}
                    min="6"
                    max="144"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minHeight">Minimum Height (inches)</Label>
                  <Input
                    id="minHeight"
                    type="number"
                    value={dimensions.minHeight}
                    onChange={(e) => updateDimension('minHeight', Number(e.target.value))}
                    min="6"
                    max="144"
                  />
                </div>
                <div>
                  <Label htmlFor="maxHeight">Maximum Height (inches)</Label>
                  <Input
                    id="maxHeight"
                    type="number"
                    value={dimensions.maxHeight}
                    onChange={(e) => updateDimension('maxHeight', Number(e.target.value))}
                    min="6"
                    max="144"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="widthIncrement">Width Increment</Label>
                  <Input
                    id="widthIncrement"
                    type="number"
                    step="0.125"
                    value={dimensions.widthIncrement}
                    onChange={(e) => updateDimension('widthIncrement', Number(e.target.value))}
                    min="0.125"
                    max="1"
                  />
                  <p className="text-xs text-gray-600 mt-1">Minimum size increment for width</p>
                </div>
                <div>
                  <Label htmlFor="heightIncrement">Height Increment</Label>
                  <Input
                    id="heightIncrement"
                    type="number"
                    step="0.125"
                    value={dimensions.heightIncrement}
                    onChange={(e) => updateDimension('heightIncrement', Number(e.target.value))}
                    min="0.125"
                    max="1"
                  />
                  <p className="text-xs text-gray-600 mt-1">Minimum size increment for height</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Size Range Summary</h4>
                <div className="text-sm text-blue-800">
                  <p>Width: {dimensions.minWidth}" - {dimensions.maxWidth}" (increment: {dimensions.widthIncrement}")</p>
                  <p>Height: {dimensions.minHeight}" - {dimensions.maxHeight}" (increment: {dimensions.heightIncrement}")</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Pricing Matrix Preview
                <Button onClick={generatePricingMatrix} size="sm">
                  Generate Preview
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pricingData.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <Badge variant="outline">
                      Showing {pricingData.length} sample price points
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {pricingData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{item.width}" × {item.height}"</span>
                        <span className="font-medium">${item.price}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    * Prices are calculated using a base formula. You can customize pricing rules in the advanced settings.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Click "Generate Preview" to see sample pricing based on your dimensions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}