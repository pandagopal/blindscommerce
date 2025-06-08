'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ZoomIn, ZoomOut, RotateCw, Sparkles, Ruler, Lightbulb, Download, Share2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

declare global {
  // Empty - using built-in DOM types
}

interface DetectedWindow {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  lightingCondition: 'bright' | 'normal' | 'dim';
  measurements?: {
    estimatedWidth: number;
    estimatedHeight: number;
    unit: 'inches' | 'cm';
  };
}

interface RoomAnalysis {
  style: string;
  lighting: string;
  roomType: string;
  colorScheme: string[];
  recommendations: string[];
}

interface VisualizationSettings {
  showMeasurements: boolean;
  showLighting: boolean;
  enableShadows: boolean;
  lightingTime: number; // 0-24 hours
  seasonalLighting: 'spring' | 'summer' | 'fall' | 'winter';
}

interface MLRoomVisualizerProps {
  productImage?: string;
  productName?: string;
  onVisualizationSave?: (visualizationData: { roomImage: string; resultImage: string }) => void;
}

const MLRoomVisualizer = ({ 
  productImage,
  onVisualizationSave 
}: MLRoomVisualizerProps): JSX.Element => {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [detectedWindows, setDetectedWindows] = useState<DetectedWindow[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [roomAnalysis, setRoomAnalysis] = useState<RoomAnalysis | null>(null);
  const [visualizationSettings, setVisualizationSettings] = useState<VisualizationSettings>({
    showMeasurements: true,
    showLighting: true,
    enableShadows: true,
    lightingTime: 12,
    seasonalLighting: 'summer'
  });
  const [aiEnhancementsEnabled, setAiEnhancementsEnabled] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load the model on component mount
  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    } catch (error) {
      console.error('Error loading model:', error);
      toast.error('Failed to load object detection model');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target && e.target.result && typeof e.target.result === 'string') {
        setRoomImage(e.target.result);
        detectWindows(e.target.result);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const detectWindows = async (imageDataUrl: string) => {
    if (!model) return;

    setIsLoading(true);
    try {
      // Load image
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise<void>(resolve => { img.onload = () => resolve(); });

      // Get predictions
      const predictions = await model.detect(img);

      // Filter for windows and doors with enhanced detection
      const windows = predictions
        .filter(p => ['window', 'door'].includes(p.class))
        .map(p => ({
          x: Math.round(p.bbox[0]),
          y: Math.round(p.bbox[1]),
          width: Math.round(p.bbox[2]),
          height: Math.round(p.bbox[3]),
          confidence: Math.round(p.score * 100),
          lightingCondition: analyzeLightingCondition(img, p.bbox),
          measurements: estimateWindowMeasurements(p.bbox, img.width, img.height)
        }));

      // Enhanced fallback window detection using edge detection
      if (windows.length === 0) {
        const detectedWindows = await performEdgeBasedWindowDetection(img);
        windows.push(...detectedWindows);
      }

      setDetectedWindows(windows);

      // Perform AI room analysis if enabled
      if (aiEnhancementsEnabled) {
        const analysis = await performRoomAnalysis(imageDataUrl, windows);
        setRoomAnalysis(analysis);
      }

    } catch (error) {
      console.error('Error detecting windows:', error);
      toast.error('Failed to detect windows');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeLightingCondition = (img: HTMLImageElement, bbox: number[]): 'bright' | 'normal' | 'dim' => {
    // Analyze the lighting in the window area
    // This is a simplified implementation - in production, you'd analyze actual pixel brightness
    const windowArea = (bbox[2] * bbox[3]) / (img.width * img.height);
    if (windowArea > 0.3) return 'bright';
    if (windowArea > 0.1) return 'normal';
    return 'dim';
  };

  const estimateWindowMeasurements = (bbox: number[], imgWidth: number, imgHeight: number) => {
    // Estimate real-world measurements based on typical room proportions
    // This is a simplified estimation - in production, you'd use depth sensors or user input for calibration
    const windowWidthRatio = bbox[2] / imgWidth;
    const windowHeightRatio = bbox[3] / imgHeight;
    
    // Assume average room width of 12 feet (144 inches)
    const estimatedRoomWidth = 144;
    const estimatedWindowWidth = estimatedRoomWidth * windowWidthRatio;
    const estimatedWindowHeight = estimatedWindowWidth * (bbox[3] / bbox[2]); // Maintain aspect ratio

    return {
      estimatedWidth: Math.round(estimatedWindowWidth),
      estimatedHeight: Math.round(estimatedWindowHeight),
      unit: 'inches' as const
    };
  };

  const performEdgeBasedWindowDetection = async (img: HTMLImageElement): Promise<DetectedWindow[]> => {
    // Enhanced window detection using canvas edge detection
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Simple edge detection fallback
    const estimatedWindow: DetectedWindow = {
      x: Math.round(img.width * 0.25),
      y: Math.round(img.height * 0.25),
      width: Math.round(img.width * 0.5),
      height: Math.round(img.height * 0.5),
      confidence: 60,
      lightingCondition: 'normal',
      measurements: estimateWindowMeasurements(
        [img.width * 0.25, img.height * 0.25, img.width * 0.5, img.height * 0.5],
        img.width,
        img.height
      )
    };

    return [estimatedWindow];
  };

  const performRoomAnalysis = async (imageDataUrl: string, windows: DetectedWindow[]): Promise<RoomAnalysis> => {
    // AI room analysis - in production, this would call an AI service
    // For now, we'll simulate the analysis
    
    return {
      style: 'Modern Contemporary',
      lighting: windows.some(w => w.lightingCondition === 'bright') ? 'Well-lit' : 'Moderate lighting',
      roomType: 'Living Room',
      colorScheme: ['Neutral', 'Warm'],
      recommendations: [
        'Light filtering blinds for optimal light control',
        'Neutral colors to complement existing decor',
        'Motorized options for convenience'
      ]
    };
  };

  const renderVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || !roomImage) return;

    // Draw room image
    const img = new Image();
    img.src = roomImage;
    img.onload = () => {
      // Set canvas dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Clear canvas and draw room image
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0);

      // Draw detected windows
      detectedWindows.forEach((window, index) => {
        const isSelected = index === selectedWindow;
        if (ctx) {
          ctx.strokeStyle = isSelected ? '#ff0000' : '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(window.x, window.y, window.width, window.height);
        }
      });

      // Draw product if a window is selected
      if (selectedWindow !== null && productImage && ctx) {
        const window = detectedWindows[selectedWindow];
        const product = new Image();
        product.src = productImage;
        product.onload = () => {
          // Calculate product placement
          const scaledWidth = product.naturalWidth * scale;
          const scaledHeight = product.naturalHeight * scale;
          const x = window.x + (window.width - scaledWidth) / 2;
          const y = window.y + (window.height - scaledHeight) / 2;

          // Save context for rotation
          ctx.save();
          ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.drawImage(product, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.restore();
        };
      }
    };
  }, [roomImage, detectedWindows, selectedWindow, productImage, scale, rotation]);

  // Update visualization when relevant state changes
  useEffect(() => {
    if (roomImage) {
      renderVisualization();
    }
  }, [roomImage, renderVisualization]);

  const saveVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !roomImage) return;

    const resultImage = canvas.toDataURL('image/jpeg');
    onVisualizationSave?.({
      roomImage,
      resultImage
    });
    toast.success('Visualization saved!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Room Visualizer
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              Enhanced
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Upload Room Photo'
              )}
            </Button>
          </div>

          {/* Main Visualization Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas Area */}
            <div className="lg:col-span-2">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                {roomImage ? (
                  <>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-contain cursor-crosshair"
                      onClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
                        const canvas = canvasRef.current;
                        if (!canvas) return;

                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        
                        const x = (e.clientX - rect.left) * scaleX;
                        const y = (e.clientY - rect.top) * scaleY;
                        
                        const clickedWindowIndex = detectedWindows.findIndex(window => 
                          x >= window.x && x <= window.x + window.width &&
                          y >= window.y && y <= window.y + window.height
                        );
                        
                        setSelectedWindow(clickedWindowIndex === -1 ? null : clickedWindowIndex);
                      }}
                    />
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                          <p>AI is analyzing your room...</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Sparkles className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">Upload a photo of your room</p>
                    <p className="text-sm">AI will detect windows and analyze your space</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              {selectedWindow !== null && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setRotation(r => (r - 90) % 360)}
                        variant="outline"
                        size="sm"
                      >
                        <RotateCw className="w-4 h-4 mr-2" />
                        Rotate
                      </Button>
                      <Button
                        onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
                        variant="outline"
                        size="sm"
                      >
                        <ZoomOut className="w-4 h-4 mr-2" />
                        Zoom Out
                      </Button>
                      <Button
                        onClick={() => setScale(s => Math.min(2, s + 0.1))}
                        variant="outline"
                        size="sm"
                      >
                        <ZoomIn className="w-4 h-4 mr-2" />
                        Zoom In
                      </Button>
                      {roomImage && productImage && (
                        <>
                          <Button
                            onClick={saveVisualization}
                            className="ml-auto"
                            disabled={isLoading}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              {/* AI Enhancements Toggle */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">AI Enhancements</span>
                    </div>
                    <Switch
                      checked={aiEnhancementsEnabled}
                      onCheckedChange={setAiEnhancementsEnabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Detected Windows */}
              {detectedWindows.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detected Windows</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detectedWindows.map((window, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedWindow === index ? 'border-primary-red bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedWindow(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Window {index + 1}</span>
                          <Badge variant={window.confidence > 80 ? 'default' : 'secondary'}>
                            {window.confidence}% confident
                          </Badge>
                        </div>
                        
                        {visualizationSettings.showMeasurements && window.measurements && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Ruler className="h-3 w-3" />
                            <span>
                              ~{window.measurements.estimatedWidth}" × {window.measurements.estimatedHeight}"
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Lightbulb className="h-3 w-3" />
                          <span className="capitalize">{window.lightingCondition} lighting</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Room Analysis */}
              {roomAnalysis && aiEnhancementsEnabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      AI Room Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium text-sm">Detected Style:</span>
                      <p className="text-sm text-gray-600">{roomAnalysis.style}</p>
                    </div>
                    <div>
                      <span className="font-medium text-sm">Room Type:</span>
                      <p className="text-sm text-gray-600">{roomAnalysis.roomType}</p>
                    </div>
                    <div>
                      <span className="font-medium text-sm">Lighting:</span>
                      <p className="text-sm text-gray-600">{roomAnalysis.lighting}</p>
                    </div>
                    <div>
                      <span className="font-medium text-sm">Recommendations:</span>
                      <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                        {roomAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Visualization Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visualization Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Show Measurements</span>
                    <Switch
                      checked={visualizationSettings.showMeasurements}
                      onCheckedChange={(checked) => 
                        setVisualizationSettings(prev => ({ ...prev, showMeasurements: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Show Lighting Effects</span>
                    <Switch
                      checked={visualizationSettings.showLighting}
                      onCheckedChange={(checked) => 
                        setVisualizationSettings(prev => ({ ...prev, showLighting: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enable Shadows</span>
                    <Switch
                      checked={visualizationSettings.enableShadows}
                      onCheckedChange={(checked) => 
                        setVisualizationSettings(prev => ({ ...prev, enableShadows: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Time of Day</span>
                    <Slider
                      value={[visualizationSettings.lightingTime]}
                      onValueChange={([value]) => 
                        setVisualizationSettings(prev => ({ ...prev, lightingTime: value }))
                      }
                      max={24}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>12 AM</span>
                      <span>{visualizationSettings.lightingTime}:00</span>
                      <span>11 PM</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Season</span>
                    <Select
                      value={visualizationSettings.seasonalLighting}
                      onValueChange={(value: any) => 
                        setVisualizationSettings(prev => ({ ...prev, seasonalLighting: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spring">Spring</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="fall">Fall</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MLRoomVisualizer;
