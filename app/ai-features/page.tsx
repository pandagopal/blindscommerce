'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Camera, 
  Search, 
  Brain, 
  Ruler, 
  Eye,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  Star,
  Zap,
  Target,
  Palette
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import EnhancedSearch from '@/components/search/EnhancedSearch';
import VisualSearch from '@/components/search/VisualSearch';
import AIProductRecommendations from '@/components/products/AIProductRecommendations';
import MLRoomVisualizer from '@/app/components/room-visualizer/MLRoomVisualizer';

export default function AIFeaturesPage() {
  const [activeDemo, setActiveDemo] = useState<string>('search');

  const features = [
    {
      id: 'visual-search',
      title: 'AI Visual Search',
      description: 'Upload a photo of your room and find matching blinds instantly',
      icon: Camera,
      gradient: 'from-primary-red to-primary-dark',
      benefits: ['22-40% fewer returns', 'Instant style matching', 'Smart color analysis'],
      demoTab: 'visual-search'
    },
    {
      id: 'smart-recommendations',
      title: 'Smart Recommendations',
      description: 'Personalized product suggestions powered by machine learning',
      icon: Brain,
      gradient: 'from-primary-red to-primary-dark',
      benefits: ['35% increase in satisfaction', 'Personalized for you', 'Trending insights'],
      demoTab: 'recommendations'
    },
    {
      id: 'room-visualizer',
      title: 'AI Room Visualizer',
      description: 'See how blinds look in your actual room with AR technology',
      icon: Eye,
      gradient: 'from-primary-red to-primary-dark',
      benefits: ['Try before you buy', 'Multiple lighting conditions', 'Accurate measurements'],
      demoTab: 'visualizer'
    },
    {
      id: 'smart-measurement',
      title: 'Smart Measurement',
      description: 'AI-powered window detection and measurement tools',
      icon: Ruler,
      gradient: 'from-primary-red to-primary-dark',
      benefits: ['Auto window detection', 'Precise measurements', 'Professional accuracy'],
      demoTab: 'search'
    }
  ];

  const stats = [
    { label: 'Accuracy Rate', value: '94%', icon: Target },
    { label: 'Time Saved', value: '75%', icon: Zap },
    { label: 'Customer Satisfaction', value: '4.8/5', icon: Star },
    { label: 'Style Matches', value: '98%', icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-600 to-red-700">
        <div className="absolute inset-0 bg-red-700/20"></div>
        <div className="relative container mx-auto px-4 py-10 text-center">
          <div className="max-w-4xl mx-auto">

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              The Future of
              <span className="bg-gradient-to-r from-accent-yellow to-white bg-clip-text text-transparent">
                {' '}Window Shopping
              </span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Experience the power of AI with smart recommendations, visual search, 
              and augmented reality visualization. Your perfect blinds are just one click away.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <VisualSearch
                trigger={
                  <Button size="lg" className="bg-white text-primary-red hover:bg-gray-100">
                    <Camera className="h-5 w-5 mr-2" />
                    Try Visual Search
                  </Button>
                }
              />
              <Link href="/products">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-red">
                  Browse Products
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-primary-red to-primary-dark text-white mb-4">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cutting-edge artificial intelligence makes finding and visualizing 
              your perfect window treatments effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={feature.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} text-white mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{feature.title}</CardTitle>
                  <p className="text-gray-600">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-gray-900 group-hover:text-white transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDemo(feature.demoTab);
                      toast.success(`Loading ${feature.title} demo...`);
                      // Scroll to demo section
                      setTimeout(() => {
                        const demoSection = document.getElementById('demo-section');
                        if (demoSection) {
                          demoSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                        }
                      }, 100);
                    }}
                  >
                    Try Demo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo-section" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Experience AI in Action
            </h2>
            <p className="text-xl text-gray-600">
              Try our AI features with live demos
            </p>
          </div>

          <Tabs value={activeDemo} onValueChange={setActiveDemo} className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Smart Search
              </TabsTrigger>
              <TabsTrigger value="visual-search" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Visual Search
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Recommendations
              </TabsTrigger>
              <TabsTrigger value="visualizer" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Room Visualizer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary-red" />
                    Enhanced AI Search
                  </CardTitle>
                  <p className="text-gray-600">
                    Smart autocomplete, recent searches, and intelligent suggestions
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="max-w-2xl mx-auto">
                    <EnhancedSearch placeholder="Try searching for 'modern blinds' or 'blackout shades'..." />
                  </div>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <Lightbulb className="h-8 w-8 text-primary-red mx-auto mb-2" />
                      <h4 className="font-semibold">Smart Suggestions</h4>
                      <p className="text-sm text-gray-600">AI learns from your search patterns</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-primary-red mx-auto mb-2" />
                      <h4 className="font-semibold">Trending Results</h4>
                      <p className="text-sm text-gray-600">Popular products surface first</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <Target className="h-8 w-8 text-primary-red mx-auto mb-2" />
                      <h4 className="font-semibold">Precise Matching</h4>
                      <p className="text-sm text-gray-600">Find exactly what you need</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visual-search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary-red" />
                    AI Visual Search Demo
                  </CardTitle>
                  <p className="text-gray-600">
                    Upload a room photo and let AI find matching blinds
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <VisualSearch
                      trigger={
                        <Button size="lg" className="mb-6">
                          <Camera className="h-5 w-5 mr-2" />
                          Start Visual Search Demo
                        </Button>
                      }
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">How it works:</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary-red text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                            <p className="text-sm">Upload or take a photo of your room</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary-red text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                            <p className="text-sm">AI analyzes colors, style, and lighting</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary-red text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                            <p className="text-sm">Get personalized product matches</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Key Benefits:</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">95% style accuracy</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">40% reduction in returns</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">Instant results</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary-red" />
                    AI Product Recommendations
                  </CardTitle>
                  <p className="text-gray-600">
                    Machine learning powered suggestions based on your preferences
                  </p>
                </CardHeader>
                <CardContent>
                  <AIProductRecommendations
                    type="trending"
                    maxItems={4}
                    title="Trending This Week"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visualizer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-500" />
                    AI Room Visualizer
                  </CardTitle>
                  <p className="text-gray-600">
                    See how blinds look in your room with advanced AR technology
                  </p>
                </CardHeader>
                <CardContent>
                  <MLRoomVisualizer />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of customers who are already using AI to find their perfect window treatments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Start Shopping
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/measure-install">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
                Schedule Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}