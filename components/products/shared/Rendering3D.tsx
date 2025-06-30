'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Box, Settings, Eye, Download, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Model3D {
  id: string;
  url: string;
  type: 'gltf' | 'obj' | 'fbx' | 'usdz';
  name: string;
  file?: File;
}

interface RenderingConfig {
  engine: 'canvas2d' | 'webgl' | 'three.js' | 'babylon.js';
  environment: string;
  lighting: {
    ambient: number;
    directional: number;
    shadowSoftness: number;
  };
  camera: {
    defaultPosition: [number, number, number];
    fov: number;
  };
  quality: {
    resolution: 'low' | 'medium' | 'high' | 'ultra';
    antialiasing: boolean;
    shadows: boolean;
  };
}

interface Rendering3DData {
  model3D: Model3D | null;
  renderingConfig: RenderingConfig;
  previewSettings: {
    autoRotate: boolean;
    showGrid: boolean;
    showAxes: boolean;
  };
  textureSettings: {
    defaultScale: number;
    defaultFinish: 'matte' | 'satin' | 'glossy' | 'metallic';
    defaultOpacity: number;
  };
}

interface Rendering3DProps {
  data: Rendering3DData;
  onChange: (data: Rendering3DData) => void;
  isReadOnly?: boolean;
  productId?: string;
  fabrics?: Array<{ id: string; name: string; texture_url?: string }>;
}

const ENVIRONMENT_PRESETS = [
  { value: 'studio', label: 'Studio' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'forest', label: 'Forest' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'night', label: 'Night' },
  { value: 'neutral', label: 'Neutral' }
];

const Rendering3D = ({ data, onChange, isReadOnly = false, productId, fabrics = [] }: Rendering3DProps) => {
  const [localData, setLocalData] = useState<Rendering3DData>(data || {
    model3D: null,
    renderingConfig: {
      engine: 'three.js',
      environment: 'studio',
      lighting: {
        ambient: 0.4,
        directional: 0.6,
        shadowSoftness: 0.5
      },
      camera: {
        defaultPosition: [0, 0, 5],
        fov: 45
      },
      quality: {
        resolution: 'high',
        antialiasing: true,
        shadows: true
      }
    },
    previewSettings: {
      autoRotate: false,
      showGrid: false,
      showAxes: false
    },
    textureSettings: {
      defaultScale: 1.0,
      defaultFinish: 'matte',
      defaultOpacity: 1.0
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update local data when prop changes
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const handleDataChange = (newData: Rendering3DData) => {
    setLocalData(newData);
    onChange(newData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['gltf', 'glb', 'obj', 'fbx', 'usdz'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExt || !validTypes.includes(fileExt)) {
      toast.error('Invalid file type. Please upload a GLTF, OBJ, FBX, or USDZ file.');
      return;
    }

    // Create blob URL for preview
    const url = URL.createObjectURL(file);
    
    const newModel: Model3D = {
      id: `model_${Date.now()}`,
      url: url,
      type: fileExt === 'glb' ? 'gltf' : fileExt as any,
      name: file.name,
      file: file
    };

    handleDataChange({
      ...localData,
      model3D: newModel
    });

    toast.success('3D model uploaded successfully');
  };

  const removeModel = () => {
    if (localData.model3D?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(localData.model3D.url);
    }
    
    handleDataChange({
      ...localData,
      model3D: null
    });
    
    setPreviewUrl(null);
  };

  const generatePreview = async () => {
    if (!productId) {
      toast.error('Product ID is required for preview generation');
      return;
    }

    setIsPreviewLoading(true);
    
    try {
      // Simulate preview generation
      // In real implementation, this would call the render API
      const params = new URLSearchParams({
        productId: productId,
        engine: localData.renderingConfig.engine,
        environment: localData.renderingConfig.environment,
        quality: localData.renderingConfig.quality.resolution
      });

      // For now, use a placeholder
      setPreviewUrl(`/api/v2/render/preview?${params.toString()}`);
      toast.success('Preview generated successfully');
    } catch (error) {
      toast.error('Failed to generate preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const updateRenderingConfig = (path: string, value: any) => {
    const newConfig = { ...localData.renderingConfig };
    const keys = path.split('.');
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    handleDataChange({
      ...localData,
      renderingConfig: newConfig
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          3D Model & Rendering
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="model" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="model">3D Model</TabsTrigger>
            <TabsTrigger value="rendering">Rendering</TabsTrigger>
            <TabsTrigger value="textures">Textures</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>3D Model File</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Upload a 3D model in GLTF, OBJ, FBX, or USDZ format
                </p>
                
                {localData.model3D ? (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                    <Box className="h-8 w-8 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">{localData.model3D.name}</p>
                      <p className="text-sm text-gray-600">Type: {localData.model3D.type.toUpperCase()}</p>
                    </div>
                    {!isReadOnly && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeModel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Box className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No 3D model uploaded</p>
                    {!isReadOnly && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".gltf,.glb,.obj,.fbx,.usdz"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isReadOnly}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Model
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rendering" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rendering Engine</Label>
                <Select
                  value={localData.renderingConfig.engine}
                  onValueChange={(value) => updateRenderingConfig('engine', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canvas2d">Canvas 2D</SelectItem>
                    <SelectItem value="webgl">WebGL</SelectItem>
                    <SelectItem value="three.js">Three.js</SelectItem>
                    <SelectItem value="babylon.js">Babylon.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Environment</Label>
                <Select
                  value={localData.renderingConfig.environment}
                  onValueChange={(value) => updateRenderingConfig('environment', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENT_PRESETS.map(env => (
                      <SelectItem key={env.value} value={env.value}>
                        {env.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Lighting</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Ambient Intensity</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localData.renderingConfig.lighting.ambient}
                    onChange={(e) => updateRenderingConfig('lighting.ambient', parseFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Directional Intensity</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localData.renderingConfig.lighting.directional}
                    onChange={(e) => updateRenderingConfig('lighting.directional', parseFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Shadow Softness</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localData.renderingConfig.lighting.shadowSoftness}
                    onChange={(e) => updateRenderingConfig('lighting.shadowSoftness', parseFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Quality Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Resolution</Label>
                  <Select
                    value={localData.renderingConfig.quality.resolution}
                    onValueChange={(value) => updateRenderingConfig('quality.resolution', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (720p)</SelectItem>
                      <SelectItem value="medium">Medium (1080p)</SelectItem>
                      <SelectItem value="high">High (2K)</SelectItem>
                      <SelectItem value="ultra">Ultra (4K)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Antialiasing</Label>
                    <Switch
                      checked={localData.renderingConfig.quality.antialiasing}
                      onCheckedChange={(checked) => updateRenderingConfig('quality.antialiasing', checked)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Shadows</Label>
                    <Switch
                      checked={localData.renderingConfig.quality.shadows}
                      onCheckedChange={(checked) => updateRenderingConfig('quality.shadows', checked)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="textures" className="space-y-4">
            <div>
              <h4 className="font-medium mb-4">Texture Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Default Scale</Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={localData.textureSettings.defaultScale}
                    onChange={(e) => handleDataChange({
                      ...localData,
                      textureSettings: {
                        ...localData.textureSettings,
                        defaultScale: parseFloat(e.target.value)
                      }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
                
                <div>
                  <Label>Default Finish</Label>
                  <Select
                    value={localData.textureSettings.defaultFinish}
                    onValueChange={(value: any) => handleDataChange({
                      ...localData,
                      textureSettings: {
                        ...localData.textureSettings,
                        defaultFinish: value
                      }
                    })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matte">Matte</SelectItem>
                      <SelectItem value="satin">Satin</SelectItem>
                      <SelectItem value="glossy">Glossy</SelectItem>
                      <SelectItem value="metallic">Metallic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Default Opacity</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={localData.textureSettings.defaultOpacity}
                    onChange={(e) => handleDataChange({
                      ...localData,
                      textureSettings: {
                        ...localData.textureSettings,
                        defaultOpacity: parseFloat(e.target.value)
                      }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              {fabrics.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Fabric Texture Mapping</h4>
                  <div className="text-sm text-gray-600 mb-4">
                    Configure how each fabric texture is applied to the 3D model
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {fabrics.map(fabric => (
                      <div key={fabric.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {fabric.texture_url ? (
                            <img 
                              src={fabric.texture_url} 
                              alt={fabric.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200" />
                          )}
                          <span className="font-medium">{fabric.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {fabric.texture_url ? (
                            <span className="text-sm text-green-600">✓ Texture uploaded</span>
                          ) : (
                            <span className="text-sm text-gray-500">No texture</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div>
              <h4 className="font-medium mb-4">Preview Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Auto Rotate</Label>
                  <Switch
                    checked={localData.previewSettings.autoRotate}
                    onCheckedChange={(checked) => handleDataChange({
                      ...localData,
                      previewSettings: {
                        ...localData.previewSettings,
                        autoRotate: checked
                      }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Show Grid</Label>
                  <Switch
                    checked={localData.previewSettings.showGrid}
                    onCheckedChange={(checked) => handleDataChange({
                      ...localData,
                      previewSettings: {
                        ...localData.previewSettings,
                        showGrid: checked
                      }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Show Axes</Label>
                  <Switch
                    checked={localData.previewSettings.showAxes}
                    onCheckedChange={(checked) => handleDataChange({
                      ...localData,
                      previewSettings: {
                        ...localData.previewSettings,
                        showAxes: checked
                      }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={generatePreview}
                  disabled={!localData.model3D || isPreviewLoading}
                  className="w-full"
                >
                  {isPreviewLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Generate Preview
                    </>
                  )}
                </Button>
              </div>

              {previewUrl && (
                <div className="mt-6">
                  <div className="border rounded-lg overflow-hidden bg-gray-100">
                    <div className="aspect-video flex items-center justify-center">
                      <p className="text-gray-500">Preview will be displayed here</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Rendering3D;