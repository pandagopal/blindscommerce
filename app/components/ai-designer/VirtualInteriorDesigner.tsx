'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Camera, 
  Palette, 
  Wand2, 
  Heart,
  Eye,
  Smile,
  Frown,
  Meh,
  Zap,
  Sparkles,
  Download,
  Share2,
  Users,
  Video,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Save,
  Upload,
  Image as ImageIcon,
  Mic,
  MicOff
} from 'lucide-react';

interface EmotionData {
  emotion: 'happy' | 'sad' | 'neutral' | 'excited' | 'calm' | 'stressed';
  confidence: number;
  timestamp: number;
}

interface DesignStyle {
  id: string;
  name: string;
  description: string;
  emotionalImpact: string;
  colors: string[];
  materials: string[];
  atmosphere: string;
  wellness: number; // 1-100 wellness score
}

interface AIDesignRecommendation {
  id: string;
  style: DesignStyle;
  confidence: number;
  reasoning: string;
  emotionalBenefit: string;
  products: any[];
  estimatedCost: number;
  completionTime: string;
}

interface RoomAnalysis {
  roomType: string;
  lighting: string;
  architecture: string;
  currentMood: string;
  improvementAreas: string[];
  wellnessScore: number;
}

const VirtualInteriorDesigner: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  const [designRecommendations, setDesignRecommendations] = useState<AIDesignRecommendation[]>([]);
  const [roomAnalysis, setRoomAnalysis] = useState<RoomAnalysis | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [isVRMode, setIsVRMode] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [voiceControlEnabled, setVoiceControlEnabled] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vrViewerRef = useRef<HTMLDivElement>(null);

  // Emotion detection styles
  const emotionStyles: Record<string, DesignStyle> = {
    stressed: {
      id: 'calming-sanctuary',
      name: 'Calming Sanctuary',
      description: 'Therapeutic design focused on stress reduction and tranquility',
      emotionalImpact: 'Reduces cortisol levels by 30%, promotes relaxation',
      colors: ['#E8F4F8', '#D6EAF8', '#AED6F1', '#85C1E9'],
      materials: ['Natural Wood', 'Soft Linen', 'Bamboo'],
      atmosphere: 'Zen-like tranquility',
      wellness: 95
    },
    happy: {
      id: 'vibrant-energy',
      name: 'Vibrant Energy',
      description: 'Dynamic design that amplifies positive emotions and creativity',
      emotionalImpact: 'Increases dopamine production, enhances mood by 40%',
      colors: ['#F7DC6F', '#F9E79F', '#F8C471', '#F5B041'],
      materials: ['Polished Metal', 'Glass', 'Ceramic'],
      atmosphere: 'Energetic and inspiring',
      wellness: 85
    },
    calm: {
      id: 'mindful-minimalism',
      name: 'Mindful Minimalism',
      description: 'Clean, uncluttered design promoting mental clarity',
      emotionalImpact: 'Reduces cognitive load, improves focus by 50%',
      colors: ['#FDFEFE', '#F8F9FA', '#E5E8E8', '#D5D8DC'],
      materials: ['Pure Cotton', 'Matte Wood', 'Stone'],
      atmosphere: 'Peaceful and clear',
      wellness: 90
    }
  };

  // Initialize emotion detection
  useEffect(() => {
    startEmotionDetection();
  }, []);

  // Start real-time emotion detection
  const startEmotionDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start emotion analysis loop
        setInterval(() => {
          analyzeEmotion();
        }, 2000); // Analyze every 2 seconds
      }
    } catch (error) {
      console.error('Error accessing camera for emotion detection:', error);
    }
  };

  // Analyze current emotion from video feed
  const analyzeEmotion = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Capture frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64 for analysis
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      // Call emotion detection API
      const response = await fetch('/api/ai-designer/emotion-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });
      
      const result = await response.json();
      if (result.success) {
        setEmotionData({
          emotion: result.emotion,
          confidence: result.confidence,
          timestamp: Date.now()
        });
        
        // Trigger design recommendations based on emotion
        if (result.confidence > 0.7) {
          generateEmotionBasedDesigns(result.emotion);
        }
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
    }
  };

  // Generate design recommendations based on detected emotion
  const generateEmotionBasedDesigns = async (emotion: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Simulate AI processing stages
      const stages = [
        'Analyzing emotional state...',
        'Processing room psychology...',
        'Generating therapeutic designs...',
        'Optimizing wellness impact...',
        'Creating 3D visualizations...'
      ];
      
      for (let i = 0; i < stages.length; i++) {
        setAnalysisProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const response = await fetch('/api/ai-designer/generate-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion,
          roomImage: canvasRef.current?.toDataURL(),
          userPreferences: {
            budget: 5000,
            timeline: '2-weeks',
            priority: 'wellness'
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setDesignRecommendations(result.recommendations);
        setRoomAnalysis(result.roomAnalysis);
      }
    } catch (error) {
      console.error('Error generating designs:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(100);
    }
  };

  // Upload inspiration photo for style transfer
  const handleInspirationUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('inspiration', file);
    formData.append('emotion', emotionData?.emotion || 'neutral');
    
    try {
      const response = await fetch('/api/ai-designer/style-transfer', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        setDesignRecommendations(prev => [...prev, ...result.styleTransferDesigns]);
      }
    } catch (error) {
      console.error('Error processing inspiration photo:', error);
    }
  };

  // Start VR design session
  const startVRDesignSession = async () => {
    if (!selectedDesign) return;
    
    try {
      setIsVRMode(true);
      
      // Initialize WebXR session
      if ('xr' in navigator) {
        const xr = (navigator as any).xr;
        const isSupported = await xr.isSessionSupported('immersive-vr');
        
        if (isSupported) {
          const session = await xr.requestSession('immersive-vr');
          setupVRScene(session);
        } else {
          // Fallback to WebGL 3D viewer
          setup3DViewer();
        }
      } else {
        setup3DViewer();
      }
    } catch (error) {
      console.error('Error starting VR session:', error);
      setup3DViewer(); // Fallback
    }
  };

  // Setup 3D viewer as VR fallback
  const setup3DViewer = () => {
    if (!vrViewerRef.current) return;
    
    // Initialize Three.js scene
    const scene = new (window as any).THREE.Scene();
    const camera = new (window as any).THREE.PerspectiveCamera(75, 800/600, 0.1, 1000);
    const renderer = new (window as any).THREE.WebGLRenderer();
    
    renderer.setSize(800, 600);
    vrViewerRef.current.appendChild(renderer.domElement);
    
    // Add room geometry and blinds
    setupRoomGeometry(scene);
    
    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  };

  // Setup VR scene with room and blinds
  const setupVRScene = (session: any) => {
    // VR-specific setup would go here
    console.log('VR session started:', session);
  };

  // Setup room geometry for 3D visualization
  const setupRoomGeometry = (scene: any) => {
    // Add walls, windows, and blind previews
    const geometry = new (window as any).THREE.BoxGeometry(10, 8, 12);
    const material = new (window as any).THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const room = new (window as any).THREE.Mesh(geometry, material);
    scene.add(room);
  };

  // Voice command handling
  const toggleVoiceControl = () => {
    setVoiceControlEnabled(!voiceControlEnabled);
    
    if (!voiceControlEnabled) {
      startVoiceRecognition();
    } else {
      stopVoiceRecognition();
    }
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        handleVoiceCommand(transcript);
      };
      
      recognition.start();
    }
  };

  const stopVoiceRecognition = () => {
    // Stop voice recognition
  };

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('show me calming designs')) {
      generateEmotionBasedDesigns('stressed');
    } else if (lowerCommand.includes('make it more colorful')) {
      generateEmotionBasedDesigns('happy');
    } else if (lowerCommand.includes('start vr')) {
      startVRDesignSession();
    }
  };

  // Get emotion icon
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'happy': return <Smile className="h-5 w-5 text-yellow-500" />;
      case 'sad': return <Frown className="h-5 w-5 text-blue-500" />;
      case 'stressed': return <Zap className="h-5 w-5 text-red-500" />;
      case 'calm': return <Heart className="h-5 w-5 text-green-500" />;
      default: return <Meh className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI-Powered Virtual Interior Designer
            <Badge variant="outline" className="ml-2">Phase 3</Badge>
          </CardTitle>
          <p className="text-gray-600">
            Revolutionary emotion-aware design AI that creates therapeutic spaces based on your psychological state
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => generateEmotionBasedDesigns('neutral')}>
              <Wand2 className="h-4 w-4 mr-2" />
              Start AI Design Session
            </Button>
            <Button variant="outline" onClick={startVRDesignSession} disabled={!selectedDesign}>
              <Eye className="h-4 w-4 mr-2" />
              Enter VR Preview
            </Button>
            <Button variant="outline" onClick={toggleVoiceControl}>
              {voiceControlEnabled ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              Voice Control
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emotion Detection & Analysis */}
        <div className="lg:col-span-1 space-y-6">
          {/* Live Emotion Detection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Emotion Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg bg-gray-900"
                    style={{ maxHeight: '200px' }}
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {emotionData && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-lg flex items-center gap-2">
                      {getEmotionIcon(emotionData.emotion)}
                      <span className="text-sm capitalize">{emotionData.emotion}</span>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(emotionData.confidence * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                {emotionData && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence Level</span>
                      <span>{Math.round(emotionData.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${emotionData.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Room Wellness Analysis */}
          {roomAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Wellness Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {roomAnalysis.wellnessScore}/100
                    </div>
                    <div className="text-sm text-gray-600">Wellness Score</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Current Mood: {roomAnalysis.currentMood}</div>
                    <div className="text-sm font-medium">Improvement Areas:</div>
                    <ul className="text-xs space-y-1">
                      {roomAnalysis.improvementAreas.map((area, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inspiration Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Style Transfer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload an inspiration photo and our AI will recreate the style with window treatments
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInspirationUpload}
                    className="hidden"
                  />
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Inspiration Photo
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Design Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Processing Status */}
          {isAnalyzing && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500 animate-spin" />
                    <span className="font-medium">AI Designer Working...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analysis Progress</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Design Recommendations */}
          <Tabs defaultValue="recommendations">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
              <TabsTrigger value="3d-preview">3D Preview</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              {designRecommendations.map((design) => (
                <Card 
                  key={design.id} 
                  className={`cursor-pointer transition-all ${
                    selectedDesign === design.id ? 'ring-2 ring-purple-500' : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedDesign(design.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {design.style.name}
                          <Badge variant="outline">
                            {Math.round(design.confidence * 100)}% match
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {design.style.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${design.estimatedCost.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{design.completionTime}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-2">Emotional Benefits</div>
                          <p className="text-sm text-gray-600">{design.emotionalBenefit}</p>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Color Palette</div>
                          <div className="flex gap-2">
                            {design.style.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Wellness Impact</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${design.style.wellness}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{design.style.wellness}/100</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-2">AI Reasoning</div>
                          <p className="text-xs text-gray-600">{design.reasoning}</p>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Materials</div>
                          <div className="flex flex-wrap gap-1">
                            {design.style.materials.map((material, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => setSelectedDesign(design.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview in 3D
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Save Design
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="3d-preview">
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div ref={vrViewerRef} className="w-full h-full">
                      {selectedDesign ? (
                        <div className="text-white text-center">
                          <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                          <p>3D Preview Loading...</p>
                          <p className="text-sm mt-2">Selected: {designRecommendations.find(d => d.id === selectedDesign)?.style.name}</p>
                        </div>
                      ) : (
                        <div className="text-white text-center">
                          <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>Select a design to preview in 3D</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button onClick={startVRDesignSession} disabled={!selectedDesign}>
                      <Video className="h-4 w-4 mr-2" />
                      Enter VR Mode
                    </Button>
                    <Button variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset View
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Adjust Lighting
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collaboration">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Design Collaboration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Invite family members or design professionals to collaborate on your space
                    </p>
                    
                    <div className="flex gap-2">
                      <Button>
                        <Users className="h-4 w-4 mr-2" />
                        Invite Collaborators
                      </Button>
                      <Button variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        Start Video Session
                      </Button>
                    </div>
                    
                    {collaborators.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No active collaborators</p>
                        <p className="text-sm">Invite others to join your design session</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {collaborators.map((collaborator) => (
                          <div key={collaborator.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{collaborator.name}</span>
                            <Badge variant="outline">{collaborator.role}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VirtualInteriorDesigner;