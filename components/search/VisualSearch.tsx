'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Sparkles, Loader2, Search, Filter, Star, ShoppingCart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Image from 'next/image';
import Link from 'next/link';
import { validateFileUpload, apiRateLimiter } from '@/lib/security/validation';
import { validateBase64Image } from '@/lib/security/imageValidation';

interface VisualSearchResult {
  product_id: number;
  name: string;
  slug: string;
  base_price: number;
  rating: number;
  image_url?: string;
  confidence: number;
  match_reason: string;
}

interface SearchFilters {
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  category?: string;
}

interface VisualSearchProps {
  trigger?: React.ReactNode;
  onResultSelect?: (product: VisualSearchResult) => void;
}

export default function VisualSearch({ trigger, onResultSelect }: VisualSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<VisualSearchResult[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Rate limiting check
      const clientId = `visual-search-${Date.now()}`;
      if (apiRateLimiter.isRateLimited(clientId)) {
        setError('Too many upload attempts. Please wait before trying again.');
        return;
      }

      // Comprehensive file validation
      const fileValidation = validateFileUpload(file);
      if (!fileValidation.isValid) {
        setError(fileValidation.error || 'Invalid file');
        return;
      }

      // Stricter size limit for visual search
      if (file.size > 5 * 1024 * 1024) { // Reduced to 5MB
        setError('Image size must be less than 5MB for visual search');
        return;
      }

      // Validate image type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are supported');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          
          // Validate base64 data
          const base64Validation = validateBase64Image(result);
          if (!base64Validation.isValid) {
            setError(`Invalid image data: ${base64Validation.errors.join(', ')}`);
            return;
          }

          setSelectedImage(result);
          await performVisualSearch(result);
        } catch (error) {
          setError('Failed to process image');
          console.error('Image processing error:', error);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', error);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      // Rate limiting for camera access
      const clientId = `camera-access-${Date.now()}`;
      if (apiRateLimiter.isRateLimited(clientId)) {
        setError('Too many camera access attempts. Please wait before trying again.');
        return;
      }

      // Request camera with security constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 }, // Limit resolution for security
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 } // Limit frame rate
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        
        // Set up security event listeners
        videoRef.current.addEventListener('loadedmetadata', () => {
          const video = videoRef.current!;
          // Validate video dimensions for security
          if (video.videoWidth > 2000 || video.videoHeight > 2000) {
            console.warn('Video resolution too high, stopping stream');
            stopCamera();
            setError('Camera resolution too high for security');
          }
        });
      }
    } catch (error) {
      // Safe error logging
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error accessing camera:', error);
      }
      setError('Could not access camera. Please upload an image instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setError('Canvas context not available');
        return;
      }

      // Validate video dimensions before capture
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      let captureWidth = Math.min(video.videoWidth, maxWidth);
      let captureHeight = Math.min(video.videoHeight, maxHeight);
      
      // Ensure minimum dimensions
      if (captureWidth < 200 || captureHeight < 200) {
        setError('Camera resolution too low for visual search');
        return;
      }

      canvas.width = captureWidth;
      canvas.height = captureHeight;
      
      // Scale if needed to fit within limits
      const scaleX = captureWidth / video.videoWidth;
      const scaleY = captureHeight / video.videoHeight;
      
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(video, 0, 0);

      // Generate image with quality control
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Validate the captured image
      const base64Validation = validateBase64Image(imageDataUrl);
      if (!base64Validation.isValid) {
        setError('Captured image validation failed');
        return;
      }
      
      setSelectedImage(imageDataUrl);
      stopCamera();
      await performVisualSearch(imageDataUrl);
    } catch (error) {
      setError('Failed to capture photo');
      console.error('Photo capture error:', error);
    }
  }, [stopCamera]);

  const performVisualSearch = async (imageDataUrl: string) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/search/visual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageDataUrl,
          searchType: 'general',
          filters
        })
      });

      if (!response.ok) {
        throw new Error('Visual search failed');
      }

      const data = await response.json();
      setSearchResults(data.results);
      setAnalysis(data.analysis);

      // Track search event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'visual_search', {
          event_category: 'search',
          event_label: data.analysis?.style || 'unknown'
        });
      }

    } catch (error) {
      console.error('Error performing visual search:', error);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSelectedImage(null);
    setSearchResults([]);
    setAnalysis(null);
    setError(null);
    stopCamera();
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (selectedImage) {
      performVisualSearch(selectedImage);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2">
      <Camera className="h-4 w-4" />
      Visual Search
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Visual Search
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              Beta
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload/Capture Section */}
          {!selectedImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Image */}
              <Card className="border-dashed border-2 border-gray-300 hover:border-primary-red transition-colors">
                <CardContent className="p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-semibold mb-2">Upload Room Photo</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a photo of your room to find matching blinds
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    Choose Image
                  </Button>
                </CardContent>
              </Card>

              {/* Take Photo */}
              <Card className="border-dashed border-2 border-gray-300 hover:border-primary-red transition-colors">
                <CardContent className="p-8 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-semibold mb-2">Take Photo</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Use your camera to capture your room
                  </p>
                  <Button 
                    onClick={startCamera}
                    variant="outline"
                    className="w-full"
                  >
                    Start Camera
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Camera View */}
          {isCameraActive && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex justify-center gap-4 mt-4">
                <Button onClick={capturePhoto} size="lg">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
                <Button onClick={stopCamera} variant="outline" size="lg">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Selected Image and Analysis */}
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Analyzing Your Room</h3>
                <Button onClick={clearSearch} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image Preview */}
                <div className="lg:col-span-1">
                  <div className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image
                      src={selectedImage}
                      alt="Uploaded room"
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {analysis && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Detected Style:</span>
                        <Badge variant="outline">{analysis.style}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Room Type:</span>
                        <Badge variant="outline">{analysis.room}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Confidence:</span>
                        <Badge variant={analysis.confidence > 80 ? "default" : "secondary"}>
                          {analysis.confidence}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">
                      {loading ? 'Analyzing...' : `Found ${searchResults.length} matches`}
                    </h4>
                    <Button
                      onClick={() => setShowFilters(!showFilters)}
                      variant="outline"
                      size="sm"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </div>

                  {/* Filters */}
                  {showFilters && (
                    <Card className="mb-4">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Price Range</label>
                            <Slider
                              value={[filters.priceMin || 0, filters.priceMax || 1000]}
                              onValueChange={([min, max]) => updateFilters({ priceMin: min, priceMax: max })}
                              max={1000}
                              step={50}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>${filters.priceMin || 0}</span>
                              <span>${filters.priceMax || 1000}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Min Rating</label>
                            <Select 
                              value={filters.minRating?.toString()} 
                              onValueChange={(value) => updateFilters({ minRating: parseFloat(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Any rating" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Any rating</SelectItem>
                                <SelectItem value="3">3+ stars</SelectItem>
                                <SelectItem value="4">4+ stars</SelectItem>
                                <SelectItem value="4.5">4.5+ stars</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <span>Finding perfect matches...</span>
                    </div>
                  )}

                  {error && (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-4">{error}</p>
                      <Button onClick={() => selectedImage && performVisualSearch(selectedImage)}>
                        Try Again
                      </Button>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {searchResults.map((product) => (
                        <Card key={product.product_id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              {product.image_url && (
                                <div className="w-16 h-16 flex-shrink-0">
                                  <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    width={64}
                                    height={64}
                                    className="object-cover rounded"
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm line-clamp-1">{product.name}</h5>
                                <p className="text-xs text-gray-600 mb-1">{product.match_reason}</p>
                                
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs">{product.rating?.toFixed(1)}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {product.confidence}% match
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-primary-red">
                                    ${product.base_price?.toFixed(2)}
                                  </span>
                                  <div className="flex gap-1">
                                    <Link href={`/products/${product.slug}`}>
                                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                        View
                                      </Button>
                                    </Link>
                                    <Button 
                                      size="sm" 
                                      className="h-6 px-2 text-xs"
                                      onClick={() => onResultSelect?.(product)}
                                    >
                                      <ShoppingCart className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}