'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface FabricImage {
  id: string;
  url: string;
  file?: File;
  name: string;
}

interface FabricPriceMatrix {
  widthRange: string;
  minWidth: number;
  maxWidth: number;
  pricePerSqft: number;
}

interface FabricOption {
  id: string;
  name: string;
  images: FabricImage[];
  enabled: boolean;
  priceMatrix: FabricPriceMatrix[];
  description?: string;
}

interface FabricData {
  coloredFabric: FabricOption[];
  sheerFabric: FabricOption[];
  blackoutFabric: FabricOption[];
}

interface FabricProps {
  data: FabricData;
  onChange: (data: FabricData) => void;
}

// Generate width ranges (10", 20", 30", ..., 118")
const generateWidthRanges = (): FabricPriceMatrix[] => {
  const ranges: FabricPriceMatrix[] = [];
  for (let i = 10; i <= 118; i += 10) {
    const minWidth = i - 9;
    const maxWidth = i;
    ranges.push({
      widthRange: `${minWidth}" - ${maxWidth}"`,
      minWidth,
      maxWidth,
      pricePerSqft: 0.00
    });
  }
  return ranges;
};

export default function Fabric({ data, onChange }: FabricProps) {
  const [currentData, setCurrentData] = useState<FabricData>(() => {
    return {
      coloredFabric: data.coloredFabric && data.coloredFabric.length > 0 ? data.coloredFabric : [],
      sheerFabric: data.sheerFabric && data.sheerFabric.length > 0 ? data.sheerFabric : [],
      blackoutFabric: data.blackoutFabric && data.blackoutFabric.length > 0 ? data.blackoutFabric : []
    };
  });

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleAddFabricOption = (category: keyof FabricData) => {
    const newOption: FabricOption = {
      id: `${category}_${Date.now()}`,
      name: '',
      images: [],
      enabled: false,
      priceMatrix: generateWidthRanges(),
      description: ''
    };

    const newData = {
      ...currentData,
      [category]: [...currentData[category], newOption]
    };

    setCurrentData(newData);
    onChange(newData);
  };

  const handleRemoveFabricOption = (category: keyof FabricData, index: number) => {
    const newData = {
      ...currentData,
      [category]: currentData[category].filter((_, i) => i !== index)
    };

    setCurrentData(newData);
    onChange(newData);
  };

  const handleFabricNameChange = (category: keyof FabricData, index: number, name: string) => {
    const newData = { ...currentData };
    newData[category][index].name = name;

    setCurrentData(newData);
    onChange(newData);
  };

  const handleFabricToggle = (category: keyof FabricData, index: number) => {
    const newData = { ...currentData };
    newData[category][index].enabled = !newData[category][index].enabled;

    setCurrentData(newData);
    onChange(newData);
  };

  const handlePriceMatrixChange = (
    category: keyof FabricData, 
    fabricIndex: number, 
    priceIndex: number, 
    newPrice: number
  ) => {
    const newData = { ...currentData };
    newData[category][fabricIndex].priceMatrix[priceIndex].pricePerSqft = newPrice;

    setCurrentData(newData);
    onChange(newData);
  };

  const handleImageUpload = async (
    category: keyof FabricData, 
    fabricIndex: number, 
    files: FileList | null
  ) => {
    if (!files) return;

    const newImages: FabricImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      
      newImages.push({
        id: `${Date.now()}_${i}`,
        url,
        file,
        name: file.name
      });
    }

    if (newImages.length > 0) {
      const newData = { ...currentData };
      newData[category][fabricIndex].images = [...newData[category][fabricIndex].images, ...newImages];

      setCurrentData(newData);
      onChange(newData);
      
      toast.success(`${newImages.length} image(s) added successfully`);
    }
  };

  const handleRemoveImage = (category: keyof FabricData, fabricIndex: number, imageIndex: number) => {
    const newData = { ...currentData };
    const image = newData[category][fabricIndex].images[imageIndex];
    
    // Clean up object URL
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
    
    newData[category][fabricIndex].images = newData[category][fabricIndex].images.filter((_, i) => i !== imageIndex);

    setCurrentData(newData);
    onChange(newData);
  };

  const FabricCategory = ({ 
    category, 
    title, 
    description 
  }: { 
    category: keyof FabricData; 
    title: string; 
    description: string;
  }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Button
          type="button"
          onClick={() => handleAddFabricOption(category)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add {title} Option
        </Button>
      </div>

      <div className="space-y-6">
        {currentData[category].map((fabric, fabricIndex) => (
          <Card key={fabric.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={fabric.enabled}
                      onCheckedChange={() => handleFabricToggle(category, fabricIndex)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`${category}-name-${fabricIndex}`}>Fabric Name</Label>
                      <Input
                        id={`${category}-name-${fabricIndex}`}
                        value={fabric.name}
                        onChange={(e) => handleFabricNameChange(category, fabricIndex, e.target.value)}
                        placeholder="Enter fabric name (e.g., Premium Cotton, Blackout Vinyl)"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFabricOption(category, fabricIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Image Upload Section */}
              <div>
                <Label>Fabric Images</Label>
                <div className="mt-2">
                  <input
                    ref={(el) => fileInputRefs.current[`${category}_${fabricIndex}`] = el}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(category, fabricIndex, e.target.files)}
                    className="hidden"
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {fabric.images.map((image, imageIndex) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveImage(category, fabricIndex, imageIndex)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                      </div>
                    ))}
                    
                    {/* Add Image Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[`${category}_${fabricIndex}`]?.click()}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Add Images</span>
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Upload multiple images (JPG, PNG). Max 5MB per image.
                  </p>
                </div>
              </div>

              {/* Price Matrix Section */}
              <div>
                <Label>Price Matrix (Per Square Foot)</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Set pricing based on width ranges. Height options will be added later.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fabric.priceMatrix.map((priceRange, priceIndex) => (
                      <div key={priceIndex} className="flex items-center gap-2 bg-white p-2 rounded border">
                        <span className="text-sm font-medium min-w-[80px]">
                          {priceRange.widthRange}
                        </span>
                        <span className="text-sm text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceRange.pricePerSqft}
                          onChange={(e) => handlePriceMatrixChange(
                            category, 
                            fabricIndex, 
                            priceIndex, 
                            parseFloat(e.target.value) || 0
                          )}
                          className="w-20 h-8 text-sm"
                          placeholder="0.00"
                        />
                        <span className="text-sm text-gray-500">/sqft</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Pricing Guide:</strong> Width ranges from 1-10", 11-20", up to 109-118". 
                      Set competitive prices per square foot for each width range.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {currentData[category].length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No {title.toLowerCase()} options added yet</p>
            <Button onClick={() => handleAddFabricOption(category)}>
              Add First {title} Option
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">🧵 Fabric Options</h2>
        <p className="text-gray-600">
          Manage fabric types with images and square-foot pricing. Each fabric can have multiple images and width-based pricing.
        </p>
      </div>

      <Tabs defaultValue="colored" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colored">Colored Fabric</TabsTrigger>
          <TabsTrigger value="sheer">Sheer Fabric</TabsTrigger>
          <TabsTrigger value="blackout">Blackout Fabric</TabsTrigger>
        </TabsList>

        <TabsContent value="colored" className="mt-6">
          <FabricCategory
            category="coloredFabric"
            title="Colored Fabric"
            description="Decorative fabrics with colors and patterns"
          />
        </TabsContent>

        <TabsContent value="sheer" className="mt-6">
          <FabricCategory
            category="sheerFabric"
            title="Sheer Fabric"
            description="Light-filtering translucent fabrics"
          />
        </TabsContent>

        <TabsContent value="blackout" className="mt-6">
          <FabricCategory
            category="blackoutFabric"
            title="Blackout Fabric"
            description="Light-blocking opaque fabrics for maximum privacy"
          />
        </TabsContent>
      </Tabs>

      {/* Summary Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">📊 Fabric Options Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-blue-900">Colored Fabric</div>
              <div className="text-blue-700">
                {currentData.coloredFabric.filter(f => f.enabled).length} enabled / {currentData.coloredFabric.length} total
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-green-900">Sheer Fabric</div>
              <div className="text-green-700">
                {currentData.sheerFabric.filter(f => f.enabled).length} enabled / {currentData.sheerFabric.length} total
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-gray-900">Blackout Fabric</div>
              <div className="text-gray-700">
                {currentData.blackoutFabric.filter(f => f.enabled).length} enabled / {currentData.blackoutFabric.length} total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}