'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Sun, 
  Moon, 
  Cloud, 
  Thermometer,
  Lightbulb,
  Settings,
  RotateCcw,
  Download,
  Share2,
  Eye,
  Ruler,
  Palette,
  Timer
} from 'lucide-react';

interface LightingCondition {
  name: string;
  timeOfDay: string;
  temperature: number; // Kelvin
  intensity: number;
  shadows: boolean;
  season: 'spring' | 'summer' | 'fall' | 'winter';
}

interface BlindConfiguration {
  type: string;
  color: string;
  material: string;
  opacity: number;
  position: number; // 0-100, how open/closed
}

interface RoomEnvironment {
  roomType: string;
  wallColor: string;
  floorType: string;
  windowSize: { width: number; height: number };
  windowOrientation: 'north' | 'south' | 'east' | 'west';
}

const AdvancedARVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [roomAnalyzed, setRoomAnalyzed] = useState(false);
  const [currentLighting, setCurrentLighting] = useState<LightingCondition>({
    name: 'Natural Daylight',
    timeOfDay: '12:00',
    temperature: 5500,
    intensity: 80,
    shadows: true,
    season: 'summer'
  });
  
  const [blindConfig, setBlindConfig] = useState<BlindConfiguration>({
    type: 'roller',
    color: '#f5f5f5',
    material: 'fabric',
    opacity: 70,
    position: 50
  });
  
  const [roomEnvironment, setRoomEnvironment] = useState<RoomEnvironment>({
    roomType: 'living-room',
    wallColor: '#ffffff',
    floorType: 'hardwood',
    windowSize: { width: 120, height: 150 },
    windowOrientation: 'south'
  });
  
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [renderingMode, setRenderingMode] = useState<'real-time' | 'photorealistic'>('real-time');

  // Predefined lighting conditions
  const lightingPresets: LightingCondition[] = [
    {
      name: 'Dawn',
      timeOfDay: '06:00',
      temperature: 2000,
      intensity: 30,
      shadows: true,
      season: 'summer'
    },
    {
      name: 'Morning',
      timeOfDay: '09:00',
      temperature: 4000,
      intensity: 60,
      shadows: true,
      season: 'summer'
    },
    {
      name: 'Midday',
      timeOfDay: '12:00',
      temperature: 5500,
      intensity: 90,
      shadows: true,
      season: 'summer'
    },
    {
      name: 'Afternoon',
      timeOfDay: '15:00',
      temperature: 4500,
      intensity: 75,
      shadows: true,
      season: 'summer'
    },
    {
      name: 'Golden Hour',
      timeOfDay: '18:00',
      temperature: 3000,
      intensity: 40,
      shadows: true,
      season: 'summer'
    },
    {
      name: 'Twilight',
      timeOfDay: '20:00',
      temperature: 2200,
      intensity: 15,
      shadows: false,
      season: 'summer'
    }
  ];

  // Initialize camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Analyze room from camera feed
  const analyzeRoom = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Capture current frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64 for analysis
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      // Call AI analysis API
      const response = await fetch('/api/room-visualizer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData,
          analysisType: 'comprehensive',
          includeDepth: true,
          includeLighting: true
        })
      });
      
      const analysis = await response.json();
      setAnalysisData(analysis);
      
      // Update room environment based on analysis
      if (analysis.roomData) {
        setRoomEnvironment(prev => ({
          ...prev,
          roomType: analysis.roomData.type || prev.roomType,
          wallColor: analysis.roomData.wallColor || prev.wallColor,
          floorType: analysis.roomData.floorType || prev.floorType,
          windowOrientation: analysis.roomData.windowOrientation || prev.windowOrientation
        }));
      }
      
      // Update lighting based on current conditions detected
      if (analysis.lightingData) {
        setCurrentLighting(prev => ({
          ...prev,
          temperature: analysis.lightingData.colorTemperature || prev.temperature,
          intensity: analysis.lightingData.intensity || prev.intensity
        }));
      }
      
      setRoomAnalyzed(true);
    } catch (error) {
      console.error('Error analyzing room:', error);
    }
  };

  // Render AR overlay with lighting simulation
  const renderAROverlay = () => {
    if (!canvasRef.current || !videoRef.current || !roomAnalyzed) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    if (!ctx) return;
    
    // Clear and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply lighting effects based on current conditions
    applyLightingEffects(ctx, canvas.width, canvas.height);
    
    // Render blinds with realistic shadows and materials
    renderBlindsWithLighting(ctx, canvas.width, canvas.height);
    
    // Add measurement overlays if analysis data is available
    if (analysisData?.measurements) {
      renderMeasurements(ctx, analysisData.measurements);
    }
  };

  // Apply realistic lighting effects to the scene
  const applyLightingEffects = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create lighting gradient based on time of day and temperature
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    
    // Calculate color temperature effect
    const tempEffect = calculateColorTemperatureEffect(currentLighting.temperature);
    const intensityAlpha = currentLighting.intensity / 100 * 0.1;
    
    gradient.addColorStop(0, `rgba(${tempEffect.r}, ${tempEffect.g}, ${tempEffect.b}, ${intensityAlpha})`);
    gradient.addColorStop(1, `rgba(${tempEffect.r}, ${tempEffect.g}, ${tempEffect.b}, ${intensityAlpha * 0.5})`);
    
    // Apply lighting overlay
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };

  // Render blinds with realistic material properties and shadows
  const renderBlindsWithLighting = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!analysisData?.windows) return;
    
    analysisData.windows.forEach((window: any) => {
      const { x, y, width: winWidth, height: winHeight } = window.bounds;
      
      // Calculate blind position based on configuration
      const blindHeight = (winHeight * blindConfig.position) / 100;
      
      // Draw blind material with lighting effects
      const materialOpacity = blindConfig.opacity / 100;
      const lightingEffect = calculateMaterialLighting(blindConfig.material, currentLighting);
      
      // Main blind surface
      ctx.fillStyle = `rgba(${lightingEffect.r}, ${lightingEffect.g}, ${lightingEffect.b}, ${materialOpacity})`;
      ctx.fillRect(x, y, winWidth, blindHeight);
      
      // Add texture based on material type
      renderMaterialTexture(ctx, x, y, winWidth, blindHeight, blindConfig.material);
      
      // Add shadows if enabled and conditions are right
      if (currentLighting.shadows && currentLighting.intensity > 20) {
        renderShadows(ctx, x, y, winWidth, blindHeight, currentLighting);
      }
      
      // Add light filtering effect below blinds
      if (blindConfig.position < 100) {
        renderLightFiltering(ctx, x, y + blindHeight, winWidth, winHeight - blindHeight);
      }
    });
  };

  // Calculate color temperature effects
  const calculateColorTemperatureEffect = (temperature: number) => {
    // Simplified color temperature to RGB conversion
    let r, g, b;
    
    if (temperature <= 3000) {
      // Warm light (dawn, dusk, incandescent)
      r = 255;
      g = Math.min(255, (temperature - 1000) / 2000 * 255);
      b = Math.max(0, (temperature - 2000) / 1000 * 255);
    } else if (temperature <= 5000) {
      // Neutral light
      r = 255 - ((temperature - 3000) / 2000 * 55);
      g = 255;
      b = 200 + ((temperature - 3000) / 2000 * 55);
    } else {
      // Cool light (daylight, overcast)
      r = 200 - ((temperature - 5000) / 2000 * 50);
      g = 220 - ((temperature - 5000) / 2000 * 20);
      b = 255;
    }
    
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  };

  // Calculate how lighting affects different materials
  const calculateMaterialLighting = (material: string, lighting: LightingCondition) => {
    const baseColor = hexToRgb(blindConfig.color);
    const tempEffect = calculateColorTemperatureEffect(lighting.temperature);
    const intensity = lighting.intensity / 100;
    
    // Material-specific light interaction
    let reflectivity = 0.3; // Default
    let diffusion = 0.5;
    
    switch (material) {
      case 'fabric':
        reflectivity = 0.2;
        diffusion = 0.8;
        break;
      case 'wood':
        reflectivity = 0.4;
        diffusion = 0.3;
        break;
      case 'aluminum':
        reflectivity = 0.8;
        diffusion = 0.1;
        break;
      case 'vinyl':
        reflectivity = 0.6;
        diffusion = 0.2;
        break;
    }
    
    // Blend base color with lighting
    const r = Math.round(baseColor.r * (1 - intensity * reflectivity) + tempEffect.r * intensity * reflectivity);
    const g = Math.round(baseColor.g * (1 - intensity * reflectivity) + tempEffect.g * intensity * reflectivity);
    const b = Math.round(baseColor.b * (1 - intensity * reflectivity) + tempEffect.b * intensity * reflectivity);
    
    return { r, g, b };
  };

  // Render material-specific textures
  const renderMaterialTexture = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, material: string) => {
    ctx.save();
    
    switch (material) {
      case 'fabric':
        // Subtle fabric weave pattern
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < width; i += 2) {
          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i, y + height);
          ctx.stroke();
        }
        break;
      case 'wood':
        // Wood grain effect
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < height; i += 8) {
          ctx.beginPath();
          ctx.moveTo(x, y + i);
          ctx.lineTo(x + width, y + i);
          ctx.stroke();
        }
        break;
      case 'aluminum':
        // Metallic reflection
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        break;
    }
    
    ctx.restore();
  };

  // Render realistic shadows
  const renderShadows = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, lighting: LightingCondition) => {
    const shadowIntensity = lighting.intensity / 100 * 0.3;
    const shadowOffset = getShadowOffset(lighting.timeOfDay, roomEnvironment.windowOrientation);
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowIntensity})`;
    
    // Shadow cast by blinds
    ctx.fillRect(
      x + shadowOffset.x, 
      y + height + shadowOffset.y, 
      width, 
      shadowOffset.length
    );
    
    ctx.restore();
  };

  // Calculate shadow offset based on sun position
  const getShadowOffset = (timeOfDay: string, orientation: string) => {
    const hour = parseInt(timeOfDay.split(':')[0]);
    let angle = 0;
    
    // Calculate sun angle based on time and window orientation
    switch (orientation) {
      case 'east':
        angle = hour < 12 ? (hour - 6) * 15 : 90;
        break;
      case 'south':
        angle = Math.abs(12 - hour) * 15;
        break;
      case 'west':
        angle = hour > 12 ? (18 - hour) * 15 : 90;
        break;
      case 'north':
        angle = 75; // Minimal direct sun
        break;
    }
    
    const radians = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radians) * 10,
      y: 5,
      length: Math.sin(radians) * 20
    };
  };

  // Render light filtering effects
  const renderLightFiltering = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    const filterIntensity = (100 - blindConfig.opacity) / 100 * currentLighting.intensity / 100;
    const tempEffect = calculateColorTemperatureEffect(currentLighting.temperature);
    
    ctx.save();
    ctx.fillStyle = `rgba(${tempEffect.r}, ${tempEffect.g}, ${tempEffect.b}, ${filterIntensity * 0.2})`;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  };

  // Render measurement overlays
  const renderMeasurements = (ctx: CanvasRenderingContext2D, measurements: any) => {
    ctx.save();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.font = '16px Arial';
    ctx.fillStyle = '#00ff00';
    
    measurements.forEach((measurement: any) => {
      const { x, y, width, height, label } = measurement;
      
      // Draw measurement box
      ctx.strokeRect(x, y, width, height);
      
      // Draw measurement label
      ctx.fillText(label, x, y - 5);
      
      // Draw dimension lines
      ctx.beginPath();
      // Width dimension
      ctx.moveTo(x, y + height + 10);
      ctx.lineTo(x + width, y + height + 10);
      ctx.stroke();
      
      // Height dimension
      ctx.moveTo(x + width + 10, y);
      ctx.lineTo(x + width + 10, y + height);
      ctx.stroke();
    });
    
    ctx.restore();
  };

  // Utility function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  // Animation loop for real-time rendering
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      if (isCapturing && roomAnalyzed && renderingMode === 'real-time') {
        renderAROverlay();
      }
      animationId = requestAnimationFrame(animate);
    };
    
    if (isCapturing) {
      animate();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isCapturing, roomAnalyzed, currentLighting, blindConfig, renderingMode]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-500" />
            Advanced AR Room Visualizer
            <Badge variant="outline" className="ml-2">Phase 2</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={startCamera} disabled={isCapturing}>
              <Camera className="h-4 w-4 mr-2" />
              {isCapturing ? 'Camera Active' : 'Start Camera'}
            </Button>
            <Button onClick={analyzeRoom} disabled={!isCapturing || roomAnalyzed}>
              <Eye className="h-4 w-4 mr-2" />
              {roomAnalyzed ? 'Room Analyzed' : 'Analyze Room'}
            </Button>
            <Button variant="outline" onClick={() => setRenderingMode(renderingMode === 'real-time' ? 'photorealistic' : 'real-time')}>
              <Settings className="h-4 w-4 mr-2" />
              {renderingMode === 'real-time' ? 'Real-time' : 'Photorealistic'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera/Canvas View */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: isCapturing && !roomAnalyzed ? 'block' : 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ display: roomAnalyzed ? 'block' : 'none' }}
                />
                {!isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Start camera to begin AR visualization</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Lighting Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sun className="h-5 w-5" />
                Lighting Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={currentLighting.name} onValueChange={(value) => {
                const preset = lightingPresets.find(p => p.name === value);
                if (preset) setCurrentLighting(preset);
              }}>
                <TabsList className="grid grid-cols-3 gap-1">
                  <TabsTrigger value="Dawn">Dawn</TabsTrigger>
                  <TabsTrigger value="Midday">Day</TabsTrigger>
                  <TabsTrigger value="Twilight">Night</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Color Temperature: {currentLighting.temperature}K
                  </label>
                  <Slider
                    value={[currentLighting.temperature]}
                    onValueChange={([value]) => setCurrentLighting(prev => ({ ...prev, temperature: value }))}
                    min={2000}
                    max={7000}
                    step={100}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Intensity: {currentLighting.intensity}%
                  </label>
                  <Slider
                    value={[currentLighting.intensity]}
                    onValueChange={([value]) => setCurrentLighting(prev => ({ ...prev, intensity: value }))}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blind Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5" />
                Blind Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Material</label>
                <select 
                  value={blindConfig.material}
                  onChange={(e) => setBlindConfig(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="fabric">Fabric</option>
                  <option value="wood">Wood</option>
                  <option value="aluminum">Aluminum</option>
                  <option value="vinyl">Vinyl</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Color</label>
                <input
                  type="color"
                  value={blindConfig.color}
                  onChange={(e) => setBlindConfig(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full mt-1 h-10 border rounded-md"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Opacity: {blindConfig.opacity}%</label>
                <Slider
                  value={[blindConfig.opacity]}
                  onValueChange={([value]) => setBlindConfig(prev => ({ ...prev, opacity: value }))}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Position: {blindConfig.position}%</label>
                <Slider
                  value={[blindConfig.position]}
                  onValueChange={([value]) => setBlindConfig(prev => ({ ...prev, position: value }))}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="h-5 w-5" />
                  Room Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Room Type:</strong> {analysisData.roomData?.type || 'Unknown'}</div>
                  <div><strong>Window Count:</strong> {analysisData.windows?.length || 0}</div>
                  <div><strong>Lighting:</strong> {analysisData.lightingData?.condition || 'Natural'}</div>
                  <div><strong>Measurements:</strong> Available</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Button disabled={!roomAnalyzed}>
              <Download className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            <Button variant="outline" disabled={!roomAnalyzed}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Preview
            </Button>
            <Button variant="outline" onClick={() => {
              setRoomAnalyzed(false);
              setAnalysisData(null);
            }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedARVisualizer;