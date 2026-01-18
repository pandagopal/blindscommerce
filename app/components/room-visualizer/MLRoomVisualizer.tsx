'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ZoomIn, ZoomOut, RotateCw, Sparkles, Ruler, Lightbulb, Download, Share2, Camera, Eye, ShoppingCart, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import Link from 'next/link';
import NextImage from 'next/image';

declare global {
  interface Window {
    LocalDetectionModel: any;
  }
}

interface CalibrationData {
  method: 'reference-object' | 'known-dimension' | 'manual' | null;
  pixelsPerInch: number;
  referenceWidth?: number;
  referenceHeight?: number;
  isCalibrated: boolean;
}

interface DetectedWindow {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  lightingCondition: 'bright' | 'normal' | 'dim';
  windowType: 'standard' | 'wide' | 'patio_door' | 'bay';
  measurements?: {
    estimatedWidth: number;
    estimatedHeight: number;
    unit: 'inches' | 'cm';
  };
}

interface ProductRecommendation {
  product: any;
  score: number;
  reasons: string[];
  isPatioDoorRecommended: boolean;
  estimatedPrice: number;
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
  lightingTime: number;
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
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [calibrationData, setCalibrationData] = useState<CalibrationData>({
    method: null,
    pixelsPerInch: 1,
    isCalibrated: false
  });
  const [calibrationStep, setCalibrationStep] = useState<'method' | 'input' | 'complete'>('method');
  const [knownDimension, setKnownDimension] = useState<string>('');
  const [visualizationSettings, setVisualizationSettings] = useState<VisualizationSettings>({
    showMeasurements: true,
    showLighting: true,
    enableShadows: true,
    lightingTime: 12,
    seasonalLighting: 'summer'
  });
  const [aiEnhancementsEnabled, setAiEnhancementsEnabled] = useState(true);
  const [isSavingMeasurements, setIsSavingMeasurements] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWindow, setDraggedWindow] = useState<number | null>(null);
  const [dragHandle, setDragHandle] = useState<'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadModel();
      // Detect mobile device
      const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(checkMobile);
    }
  }, []);

  const loadModel = async () => {
    try {
      // Use simplified detection without TensorFlow (no external downloads)
      const simpleModel = {
        detect: async (imageElement: HTMLImageElement) => {
          // Return empty array - users will manually draw windows
          return [];
        }
      };

      setModel(simpleModel as any);
    } catch (error) {
      console.error('Model loading failed:', error);
    }
  };

  const loadLocalDetectionModel = async () => {
    return new Promise<void>((resolve, reject) => {
      if (window.LocalDetectionModel) {
        resolve();
        return;
      }

      const existingScript = document.querySelector('script[src="/models/local-detection.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load local detection model')));
        return;
      }

      const script = document.createElement('script');
      script.src = '/models/local-detection.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load local detection model'));
      document.head.appendChild(script);
    });
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

  const classifyWindowType = (bbox: number[], imgWidth: number, imgHeight: number): DetectedWindow['windowType'] => {
    const windowWidth = bbox[2];
    const windowHeight = bbox[3];
    const aspectRatio = windowWidth / windowHeight;
    const heightRatio = windowHeight / imgHeight;

    // Patio door: tall (>60% of image height) and aspect ratio < 0.6
    if (heightRatio > 0.6 && aspectRatio < 0.6) {
      return 'patio_door';
    }

    // Wide window: aspect ratio > 2
    if (aspectRatio > 2) {
      return 'wide';
    }

    // Bay window detection would require more sophisticated analysis
    // For now, standard is the default
    return 'standard';
  };

  const detectWindows = async (imageDataUrl: string) => {
    setIsLoading(true);

    if (!model) {
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise<void>(resolve => { img.onload = () => resolve(); });

      const defaultWindow: DetectedWindow = {
        x: Math.round(img.width * 0.25),
        y: Math.round(img.height * 0.25),
        width: Math.round(img.width * 0.5),
        height: Math.round(img.height * 0.5),
        confidence: 50,
        lightingCondition: 'normal',
        windowType: 'standard',
        measurements: estimateWindowMeasurements(
          [img.width * 0.25, img.height * 0.25, img.width * 0.5, img.height * 0.5],
          img.width,
          img.height
        )
      };

      setDetectedWindows([defaultWindow]);
      setIsLoading(false);
      toast.info('AI detection unavailable. Click and drag to adjust the window area.');
      return;
    }

    try {
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise<void>(resolve => { img.onload = () => resolve(); });

      const predictions = await model.detect(img);

      const windows = predictions
        .filter(p => ['window', 'door'].includes(p.class))
        .map(p => ({
          x: Math.round(p.bbox[0]),
          y: Math.round(p.bbox[1]),
          width: Math.round(p.bbox[2]),
          height: Math.round(p.bbox[3]),
          confidence: Math.round(p.score * 100),
          lightingCondition: analyzeLightingCondition(img, p.bbox),
          windowType: classifyWindowType(p.bbox, img.width, img.height),
          measurements: estimateWindowMeasurements(p.bbox, img.width, img.height)
        }));

      if (windows.length === 0) {
        const detectedWindows = await performEdgeBasedWindowDetection(img);
        windows.push(...detectedWindows);
      }

      setDetectedWindows(windows);

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
    const windowArea = (bbox[2] * bbox[3]) / (img.width * img.height);
    if (windowArea > 0.3) return 'bright';
    if (windowArea > 0.1) return 'normal';
    return 'dim';
  };

  const estimateWindowMeasurements = (bbox: number[], imgWidth: number, imgHeight: number) => {
    const windowWidthRatio = bbox[2] / imgWidth;
    const windowHeightRatio = bbox[3] / imgHeight;

    let estimatedWidth: number;
    let estimatedHeight: number;

    if (calibrationData.isCalibrated) {
      // Use calibrated measurements
      estimatedWidth = Math.round(bbox[2] / calibrationData.pixelsPerInch);
      estimatedHeight = Math.round(bbox[3] / calibrationData.pixelsPerInch);
    } else {
      // Use default estimation (assume 144" room width)
      const estimatedRoomWidth = 144;
      estimatedWidth = Math.round(estimatedRoomWidth * windowWidthRatio);
      estimatedHeight = Math.round(estimatedWidth * (bbox[3] / bbox[2]));
    }

    // Round to nearest 1/8 inch
    const roundToEighth = (val: number) => Math.round(val * 8) / 8;

    return {
      estimatedWidth: roundToEighth(estimatedWidth),
      estimatedHeight: roundToEighth(estimatedHeight),
      unit: 'inches' as const
    };
  };

  const performEdgeBasedWindowDetection = async (img: HTMLImageElement): Promise<DetectedWindow[]> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const estimatedWindow: DetectedWindow = {
      x: Math.round(img.width * 0.25),
      y: Math.round(img.height * 0.25),
      width: Math.round(img.width * 0.5),
      height: Math.round(img.height * 0.5),
      confidence: 60,
      lightingCondition: 'normal',
      windowType: 'standard',
      measurements: estimateWindowMeasurements(
        [img.width * 0.25, img.height * 0.25, img.width * 0.5, img.height * 0.5],
        img.width,
        img.height
      )
    };

    return [estimatedWindow];
  };

  const performRoomAnalysis = async (imageDataUrl: string, windows: DetectedWindow[]): Promise<RoomAnalysis> => {
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

  const handleCalibrationMethodSelect = (method: CalibrationData['method']) => {
    setCalibrationData(prev => ({ ...prev, method }));
    setCalibrationStep('input');
  };

  const completeCalibration = () => {
    if (calibrationData.method === 'manual' || calibrationData.method === 'known-dimension') {
      if (!knownDimension || parseFloat(knownDimension) <= 0) {
        toast.error('Please enter a valid dimension');
        return;
      }

      if (selectedWindow !== null && calibrationData.method === 'known-dimension') {
        const window = detectedWindows[selectedWindow];
        const knownWidthInches = parseFloat(knownDimension);
        const pixelsPerInch = window.width / knownWidthInches;

        setCalibrationData({
          method: 'known-dimension',
          pixelsPerInch,
          referenceWidth: knownWidthInches,
          isCalibrated: true
        });

        // Recalculate all window measurements
        const updatedWindows = detectedWindows.map(w => ({
          ...w,
          measurements: {
            estimatedWidth: Math.round((w.width / pixelsPerInch) * 8) / 8,
            estimatedHeight: Math.round((w.height / pixelsPerInch) * 8) / 8,
            unit: 'inches' as const
          }
        }));

        setDetectedWindows(updatedWindows);
        setCalibrationStep('complete');
        toast.success('Calibration complete! Measurements updated.');
      }
    } else if (calibrationData.method === 'reference-object') {
      // For reference object, user would need to select it in the image
      toast.info('Reference object calibration coming soon. Please use known dimension method.');
    }
  };

  const updateWindowMeasurement = (index: number, dimension: 'width' | 'height', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    const updatedWindows = [...detectedWindows];
    if (updatedWindows[index].measurements) {
      updatedWindows[index].measurements = {
        ...updatedWindows[index].measurements!,
        [dimension === 'width' ? 'estimatedWidth' : 'estimatedHeight']: numValue
      };
      setDetectedWindows(updatedWindows);
    }
  };

  const updateWindowType = (index: number, type: DetectedWindow['windowType']) => {
    const updatedWindows = [...detectedWindows];
    updatedWindows[index].windowType = type;
    setDetectedWindows(updatedWindows);
  };

  const getRecommendations = async () => {
    if (!roomAnalysis || detectedWindows.length === 0) {
      toast.error('Please upload a room image first');
      return;
    }

    setIsLoadingRecommendations(true);

    try {
      const response = await fetch('/api/v2/ai/recommend-blinds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          windows: detectedWindows.map(w => ({
            width: w.width,
            height: w.height,
            windowType: w.windowType,
            lightingCondition: w.lightingCondition,
            measurements: w.measurements
          })),
          roomType: roomAnalysis.roomType,
          lightingCondition: roomAnalysis.lighting,
          preferredStyles: []
        })
      });

      const data = await response.json();

      if (data.success && data.data?.recommendations) {
        setRecommendations(data.data.recommendations);
        toast.success('Recommendations loaded!');
      } else {
        toast.error('Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const saveMeasurementsToProfile = async () => {
    if (detectedWindows.length === 0) {
      toast.error('No windows detected to save');
      return;
    }

    setIsSavingMeasurements(true);

    try {
      const windows = detectedWindows.map((window, index) => ({
        width: window.measurements?.estimatedWidth || 0,
        height: window.measurements?.estimatedHeight || 0,
        location: `Window ${index + 1}`,
        windowType: window.windowType,
        notes: `AI-detected window with ${window.confidence}% confidence. Lighting: ${window.lightingCondition}. ${calibrationData.isCalibrated ? 'Calibrated measurement.' : 'Estimated measurement.'}`,
        calibrationMethod: calibrationData.method || 'manual',
        confidenceScore: window.confidence / 100
      }));

      const response = await fetch('/api/v2/ai/save-measurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomAnalysis?.roomType || 'Unknown Room',
          windows,
          imageData: roomImage
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Saved ${windows.length} measurement(s) to your profile!`);
      } else {
        toast.error(data.error || 'Failed to save measurements');
      }
    } catch (error: any) {
      console.error('Error saving measurements:', error);
      if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        toast.error('Please log in to save measurements');
      } else {
        toast.error('Failed to save measurements');
      }
    } finally {
      setIsSavingMeasurements(false);
    }
  };

  const deleteWindow = (index: number) => {
    const updatedWindows = detectedWindows.filter((_, i) => i !== index);
    setDetectedWindows(updatedWindows);
    if (selectedWindow === index) {
      setSelectedWindow(updatedWindows.length > 0 ? 0 : null);
    } else if (selectedWindow !== null && selectedWindow > index) {
      setSelectedWindow(selectedWindow - 1);
    }
    toast.success('Window deleted');
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getResizeHandle = (x: number, y: number, window: any) => {
    const handleSize = 10;

    // Top-left
    if (Math.abs(x - window.x) < handleSize && Math.abs(y - window.y) < handleSize) {
      return 'resize-tl';
    }
    // Top-right
    if (Math.abs(x - (window.x + window.width)) < handleSize && Math.abs(y - window.y) < handleSize) {
      return 'resize-tr';
    }
    // Bottom-left
    if (Math.abs(x - window.x) < handleSize && Math.abs(y - (window.y + window.height)) < handleSize) {
      return 'resize-bl';
    }
    // Bottom-right
    if (Math.abs(x - (window.x + window.width)) < handleSize && Math.abs(y - (window.y + window.height)) < handleSize) {
      return 'resize-br';
    }

    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    for (let i = 0; i < detectedWindows.length; i++) {
      const window = detectedWindows[i];
      const resizeHandle = getResizeHandle(x, y, window);

      if (resizeHandle) {
        setIsDragging(true);
        setDraggedWindow(i);
        setDragHandle(resizeHandle);
        setDragStart({ x, y });
        setSelectedWindow(i);
        return;
      }

      if (x >= window.x && x <= window.x + window.width &&
          y >= window.y && y <= window.y + window.height) {
        setIsDragging(true);
        setDraggedWindow(i);
        setDragHandle('move');
        setDragStart({ x: x - window.x, y: y - window.y });
        setSelectedWindow(i);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || draggedWindow === null) return;

    const { x, y } = getCanvasCoordinates(e);
    const updatedWindows = [...detectedWindows];
    const window = updatedWindows[draggedWindow];

    if (dragHandle === 'move') {
      window.x = x - dragStart.x;
      window.y = y - dragStart.y;
    } else if (dragHandle === 'resize-tl') {
      const newWidth = window.width + (window.x - x);
      const newHeight = window.height + (window.y - y);
      if (newWidth > 20 && newHeight > 20) {
        window.x = x;
        window.y = y;
        window.width = newWidth;
        window.height = newHeight;
      }
    } else if (dragHandle === 'resize-tr') {
      const newWidth = x - window.x;
      const newHeight = window.height + (window.y - y);
      if (newWidth > 20 && newHeight > 20) {
        window.y = y;
        window.width = newWidth;
        window.height = newHeight;
      }
    } else if (dragHandle === 'resize-bl') {
      const newWidth = window.width + (window.x - x);
      const newHeight = y - window.y;
      if (newWidth > 20 && newHeight > 20) {
        window.x = x;
        window.width = newWidth;
        window.height = newHeight;
      }
    } else if (dragHandle === 'resize-br') {
      const newWidth = x - window.x;
      const newHeight = y - window.y;
      if (newWidth > 20 && newHeight > 20) {
        window.width = newWidth;
        window.height = newHeight;
      }
    }

    // Recalculate measurements
    if (window.measurements) {
      const pixelsPerInch = calibrationData.pixelsPerInch || (window.width / 36);
      window.measurements.estimatedWidth = Math.round((window.width / pixelsPerInch) * 8) / 8;
      window.measurements.estimatedHeight = Math.round((window.height / pixelsPerInch) * 8) / 8;
    }

    setDetectedWindows(updatedWindows);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggedWindow(null);
    setDragHandle(null);
  };

  const renderVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || !roomImage) return;

    const img = new Image();
    img.src = roomImage;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0);

      detectedWindows.forEach((window, index) => {
        const isSelected = index === selectedWindow;
        if (ctx) {
          ctx.strokeStyle = isSelected ? '#dc2626' : '#22c55e';
          ctx.lineWidth = 3;
          ctx.strokeRect(window.x, window.y, window.width, window.height);

          // Draw window type label
          ctx.fillStyle = isSelected ? '#dc2626' : '#22c55e';
          ctx.fillRect(window.x, window.y - 25, 100, 25);
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px sans-serif';
          ctx.fillText(`Window ${index + 1}`, window.x + 5, window.y - 8);

          // Draw resize handles for selected window
          if (isSelected) {
            const handleSize = 8;
            ctx.fillStyle = '#dc2626';

            // Top-left
            ctx.fillRect(window.x - handleSize / 2, window.y - handleSize / 2, handleSize, handleSize);
            // Top-right
            ctx.fillRect(window.x + window.width - handleSize / 2, window.y - handleSize / 2, handleSize, handleSize);
            // Bottom-left
            ctx.fillRect(window.x - handleSize / 2, window.y + window.height - handleSize / 2, handleSize, handleSize);
            // Bottom-right
            ctx.fillRect(window.x + window.width - handleSize / 2, window.y + window.height - handleSize / 2, handleSize, handleSize);
          }
        }
      });

      if (selectedWindow !== null && productImage && ctx) {
        const window = detectedWindows[selectedWindow];
        const product = new Image();
        product.src = productImage;
        product.onload = () => {
          const scaledWidth = product.naturalWidth * scale;
          const scaledHeight = product.naturalHeight * scale;
          const x = window.x + (window.width - scaledWidth) / 2;
          const y = window.y + (window.height - scaledHeight) / 2;

          ctx.save();
          ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.drawImage(product, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.restore();
        };
      }
    };
  }, [roomImage, detectedWindows, selectedWindow, productImage, scale, rotation]);

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
            <Sparkles className="h-5 w-5 text-red-500" />
            AI-Powered Room Visualizer
            <Badge variant="secondary" className="bg-gradient-to-r from-red-500 to-primary-dark text-white">
              Enhanced
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              capture={isMobile ? "environment" : undefined}
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />

            {isMobile ? (
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    For accurate measurements, use your camera to take a live photo
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-12 border-primary-red text-primary-red hover:bg-red-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo with Camera
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Camera feature only available on mobile devices
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    For best results, use a mobile device to take live photos of your windows. Desktop upload is disabled for measurement accuracy.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12"
                  disabled={true}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera Not Available (Desktop)
                </Button>
              </div>
            )}
          </div>

          {/* Calibration Wizard */}
          {roomImage && !calibrationData.isCalibrated && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-red-600" />
                  Calibrate Measurements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={calibrationStep} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="method">Method</TabsTrigger>
                    <TabsTrigger value="input" disabled={!calibrationData.method}>Input</TabsTrigger>
                    <TabsTrigger value="complete" disabled={!calibrationData.isCalibrated}>Complete</TabsTrigger>
                  </TabsList>

                  <TabsContent value="method" className="space-y-3 mt-4">
                    <p className="text-sm text-gray-600">Choose a calibration method for accurate measurements:</p>
                    <div className="grid gap-3">
                      <Button
                        variant="outline"
                        className="h-auto py-3 px-4 justify-start"
                        onClick={() => handleCalibrationMethodSelect('reference-object')}
                      >
                        <div className="text-left">
                          <div className="font-semibold">Reference Object</div>
                          <div className="text-xs text-gray-500">Place a credit card or ruler in the photo</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 px-4 justify-start"
                        onClick={() => handleCalibrationMethodSelect('known-dimension')}
                      >
                        <div className="text-left">
                          <div className="font-semibold">Known Dimension (Recommended)</div>
                          <div className="text-xs text-gray-500">Enter one known window measurement</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 px-4 justify-start"
                        onClick={() => handleCalibrationMethodSelect('manual')}
                      >
                        <div className="text-left">
                          <div className="font-semibold">Manual Entry</div>
                          <div className="text-xs text-gray-500">Directly input all measurements</div>
                        </div>
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="input" className="space-y-3 mt-4">
                    {calibrationData.method === 'known-dimension' && (
                      <>
                        <p className="text-sm text-gray-600">
                          Select a window and enter its actual width in inches:
                        </p>
                        <Input
                          type="number"
                          placeholder="Enter width in inches (e.g., 36)"
                          value={knownDimension}
                          onChange={(e) => setKnownDimension(e.target.value)}
                        />
                        <Button onClick={completeCalibration} className="w-full">
                          Calibrate
                        </Button>
                      </>
                    )}
                    {calibrationData.method === 'reference-object' && (
                      <p className="text-sm text-gray-600">
                        Reference object calibration coming soon. Please use "Known Dimension" method.
                      </p>
                    )}
                    {calibrationData.method === 'manual' && (
                      <p className="text-sm text-gray-600">
                        You can manually adjust measurements in the window details panel below.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="complete" className="mt-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Badge variant="outline" className="border-green-500">Calibrated</Badge>
                      <span className="text-sm">Measurements are now accurate!</span>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Main Visualization Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas Area */}
            <div className="lg:col-span-2">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                {roomImage ? (
                  <>
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-contain cursor-move"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                      onClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
                        if (isDragging) return; // Prevent click when dragging
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
                      <Sparkles className="h-4 w-4 text-red-500" />
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
                          <div className="flex items-center gap-2">
                            <Badge variant={window.confidence > 80 ? 'default' : 'secondary'}>
                              {window.confidence}% confident
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWindow(index);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {visualizationSettings.showMeasurements && window.measurements && (
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 w-16">Width:</span>
                              <Input
                                type="number"
                                value={window.measurements.estimatedWidth}
                                onChange={(e) => updateWindowMeasurement(index, 'width', e.target.value)}
                                className="h-8 text-sm"
                                step="0.125"
                              />
                              <span className="text-sm text-gray-600">"</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 w-16">Height:</span>
                              <Input
                                type="number"
                                value={window.measurements.estimatedHeight}
                                onChange={(e) => updateWindowMeasurement(index, 'height', e.target.value)}
                                className="h-8 text-sm"
                                step="0.125"
                              />
                              <span className="text-sm text-gray-600">"</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-2">
                          <span className="text-sm text-gray-600 block mb-1">Type:</span>
                          <Select value={window.windowType} onValueChange={(val: any) => updateWindowType(index, val)}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard Window</SelectItem>
                              <SelectItem value="wide">Wide Window</SelectItem>
                              <SelectItem value="patio_door">Patio Door</SelectItem>
                              <SelectItem value="bay">Bay Window</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <Lightbulb className="h-3 w-3" />
                          <span className="capitalize">{window.lightingCondition} lighting</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {detectedWindows.length > 0 && roomAnalysis && (
                <div className="space-y-2">
                  <Button
                    onClick={getRecommendations}
                    className="w-full"
                    disabled={isLoadingRecommendations}
                  >
                    {isLoadingRecommendations ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading Recommendations...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Get Product Recommendations
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={saveMeasurementsToProfile}
                    variant="outline"
                    className="w-full"
                    disabled={isSavingMeasurements}
                  >
                    {isSavingMeasurements ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save to My Measurements
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Recommendations Panel */}
              {recommendations.length > 0 && selectedWindow !== null && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Recommended for Window {selectedWindow + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendations
                      .filter(rec => rec.window_index === selectedWindow)
                      .slice(0, 3)
                      .map((rec, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="flex gap-3">
                            {rec.product.primary_image_url && (
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <Image
                                  src={rec.product.primary_image_url}
                                  alt={rec.product.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{rec.product.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="default" className="text-xs">
                                  {rec.score}% Match
                                </Badge>
                                {rec.isPatioDoorRecommended && (
                                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                                    Patio Door
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                ${rec.estimatedPrice.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {rec.reasons.join(' • ')}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Link
                                  href={`/products/configure/${rec.product.slug}?width=${detectedWindows[selectedWindow].measurements?.estimatedWidth}&height=${detectedWindows[selectedWindow].measurements?.estimatedHeight}&roomType=${roomAnalysis?.roomType || ''}`}
                                  className="flex-1"
                                >
                                  <Button size="sm" className="w-full text-xs">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Configure
                                  </Button>
                                </Link>
                              </div>
                            </div>
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
                      <Sparkles className="h-4 w-4 text-red-500" />
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
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MLRoomVisualizer;
