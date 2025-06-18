'use client';

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Upload, X, Trash2, Plus, Camera } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface FabricImage {
  id: string;
  url: string;
  file?: File;
  name: string;
}

interface FabricOption {
  id: string;
  name: string;
  image: FabricImage | null;
  price: number;
  fabricType: string;
  enabled: boolean;
}

interface FabricData {
  fabrics: FabricOption[];
}

interface FabricProps {
  data: FabricData;
  onChange: (data: FabricData) => void;
  isReadOnly?: boolean;
  productId?: string;
}

// Fabric type options
const FABRIC_TYPES = [
  { value: 'colored', label: 'Colored' },
  { value: 'sheer', label: 'Sheer' },
  { value: 'blackout', label: 'Blackout' },
  { value: 'designer', label: 'Designer' },
  { value: 'woven', label: 'Woven' },
  { value: 'natural', label: 'Natural' }
];

// Add ref interface for accessing current data
export interface FabricRef {
  getCurrentData: () => FabricData;
}

const Fabric = forwardRef<FabricRef, FabricProps>(({ data, onChange, isReadOnly = false, productId }, ref) => {
  const [localData, setLocalData] = useState<FabricData>(data);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Only update local state on initial load, not on every data prop change
  // This prevents parent re-renders from resetting our local changes
  useEffect(() => {
    if (!isInitialized) {
      setLocalData(data);
      setIsInitialized(true);
    }
  }, [data, isInitialized]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      localData.fabrics.forEach(fabric => {
        if (fabric.image?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(fabric.image.url);
        }
      });
    };
  }, []);

  // Expose current data through ref
  useImperativeHandle(ref, () => ({
    getCurrentData: () => localData
  }));

  const handleDataChange = (newData: FabricData) => {
    setLocalData(newData);
    // NEVER call onChange - all changes stay local until parent calls getCurrentData()
  };

  const addNewFabric = () => {
    if (isReadOnly) return;

    const newFabric: FabricOption = {
      id: `fabric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      image: null,
      price: 0,
      fabricType: 'colored',
      enabled: true
    };

    const updatedData = {
      ...localData,
      fabrics: [...localData.fabrics, newFabric]
    };
    handleDataChange(updatedData);
  };

  const removeFabric = (fabricId: string) => {
    if (isReadOnly) return;

    const updatedData = {
      ...localData,
      fabrics: localData.fabrics.filter(fabric => fabric.id !== fabricId)
    };

    handleDataChange(updatedData);
  };

  const updateFabric = (fabricId: string, field: keyof FabricOption, value: any) => {
    if (isReadOnly) return;

    const fabricExists = localData.fabrics.some(fabric => fabric.id === fabricId);

    if (!fabricExists) {
      console.error('Fabric not found with ID:', fabricId);
      console.error('Available fabrics:', localData.fabrics);
      return;
    }

    const updatedData = {
      ...localData,
      fabrics: localData.fabrics.map(fabric =>
        fabric.id === fabricId ? { ...fabric, [field]: value } : fabric
      )
    };

    // NEVER call onChange - all changes stay local until parent calls getCurrentData()
    handleDataChange(updatedData);
  };

  const handleImageUpload = useCallback(async (fabricId: string, files: FileList | null) => {
    if (!files || files.length === 0 || isReadOnly) {
      return;
    }

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image file must be less than 2MB');
      return;
    }

    try {
      // Validate the file object
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file object');
      }

      // Create blob URL for preview and file processing
      const blobUrl = URL.createObjectURL(file);
      const newImage: FabricImage = {
        id: `${productId || 'new'}_fabric_${fabricId}_${file.name}`,
        url: blobUrl, // Blob URL for preview and processing
        file: file,
        name: file.name
      };

      // Use setLocalData directly with current state instead of updateFabric
      setLocalData(currentData => {
        const fabricExists = currentData.fabrics.some(fabric => fabric.id === fabricId);
        
        if (!fabricExists) {
          console.error('Fabric not found in current data:', fabricId);
          console.error('Available fabrics in current data:', currentData.fabrics);
          return currentData; // Return unchanged
        }
        
        const updatedData = {
          ...currentData,
          fabrics: currentData.fabrics.map(fabric =>
            fabric.id === fabricId ? { ...fabric, image: newImage } : fabric
          )
        };
        
        return updatedData;
      });
      
      toast.success(`Image "${file.name}" selected - will upload when you click "Update Product"`);
    } catch (error) {
      console.error('Error selecting image:', error);
      toast.error('Failed to select image');
    }
  }, [isReadOnly, productId]);

  const removeImage = (fabricId: string) => {
    if (isReadOnly) return;

    const fabric = localData.fabrics.find(f => f.id === fabricId);
    if (fabric?.image?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(fabric.image.url);
    }

    updateFabric(fabricId, 'image', null); // All changes stay local
  };

  const triggerFileInput = (fabricId: string) => {
    const input = fileInputRefs.current[fabricId];
    if (input) {
      input.click();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Fabric Options</CardTitle>
          {!isReadOnly && (
            <Button 
              onClick={addNewFabric}
              size="sm"
              className="bg-primary-red hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Fabric
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {localData.fabrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No fabrics added yet</p>
            {!isReadOnly && (
              <p className="text-sm">Click "Add Fabric" to get started</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 pb-2 border-b font-medium text-sm text-gray-700">
              <div className="col-span-2">Image</div>
              <div className="col-span-3">Fabric Name</div>
              <div className="col-span-2">Price ($)</div>
              <div className="col-span-3">Fabric Type</div>
              <div className="col-span-2">Status</div>
            </div>

            {/* Fabric Rows */}
            {localData.fabrics.map((fabric) => (
              <div key={fabric.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg">
                {/* Image Thumbnail */}
                <div className="col-span-2">
                  <div className="relative">
                    {fabric.image && fabric.image.url ? (
                      // Show actual image if uploaded URL exists
                      <div className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={fabric.image.url}
                          alt={fabric.name || 'Fabric image'}
                          className="w-full h-full object-cover"
                          onError={(e) => console.error('Image failed to load:', fabric.image?.url, e)}
                        />
                        {!isReadOnly && (
                          <button
                            onClick={() => removeImage(fabric.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ) : fabric.image && fabric.image.file ? (
                      // Show file selected indicator if file exists but not uploaded yet
                      <div className="relative w-16 h-16 border border-green-300 rounded-lg overflow-hidden bg-green-50 flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="h-4 w-4 text-green-600 mx-auto mb-1" />
                          <div className="text-xs text-green-700 truncate w-14" title={fabric.image.name}>
                            {fabric.image.name.length > 8 ? fabric.image.name.substring(0, 8) + '...' : fabric.image.name}
                          </div>
                        </div>
                        {!isReadOnly && (
                          <button
                            onClick={() => removeImage(fabric.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => triggerFileInput(fabric.id)}
                        disabled={isReadOnly}
                        className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                      </button>
                    )}
                    
                    {/* Hidden file input */}
                    <input
                      ref={(el) => fileInputRefs.current[fabric.id] = el}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleImageUpload(fabric.id, e.target.files);
                        // Don't clear the input immediately to prevent blob URL issues
                        // e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Fabric Name */}
                <div className="col-span-3">
                  <Input
                    type="text"
                    value={fabric.name}
                    onChange={(e) => updateFabric(fabric.id, 'name', e.target.value)}
                    placeholder="Enter fabric name"
                    disabled={isReadOnly}
                    className="w-full"
                  />
                </div>

                {/* Price */}
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={fabric.price}
                    onChange={(e) => updateFabric(fabric.id, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    disabled={isReadOnly}
                    min="0"
                    step="0.01"
                    className="w-full"
                  />
                </div>

                {/* Fabric Type */}
                <div className="col-span-3">
                  <Select
                    value={fabric.fabricType}
                    onValueChange={(value) => updateFabric(fabric.id, 'fabricType', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FABRIC_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={fabric.enabled}
                      onCheckedChange={(checked) => updateFabric(fabric.id, 'enabled', checked)}
                      disabled={isReadOnly}
                    />
                    <span className={`text-sm ${fabric.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {fabric.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {!isReadOnly && (
                      <div className="flex gap-1">
                        {fabric.image && (
                          <Button
                            onClick={() => triggerFileInput(fabric.id)}
                            size="sm"
                            variant="ghost"
                            className="p-1 h-6 w-6"
                            title="Replace image"
                          >
                            <Camera className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          onClick={() => removeFabric(fabric.id)}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove fabric"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {localData.fabrics.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600">
            Total fabrics: {localData.fabrics.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

Fabric.displayName = 'Fabric';

export default Fabric;