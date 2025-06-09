import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Shield, Zap, Home, Leaf } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'style' | 'safety' | 'eco-friendly' | 'technology' | 'warranty';
  icon?: string;
}

interface FeaturesProps {
  features: Feature[];
  onChange: (features: Feature[]) => void;
}

const FEATURE_CATEGORIES = [
  { value: 'performance', label: 'Performance', icon: Zap },
  { value: 'style', label: 'Style & Design', icon: Home },
  { value: 'safety', label: 'Safety', icon: Shield },
  { value: 'eco-friendly', label: 'Eco-Friendly', icon: Leaf },
  { value: 'technology', label: 'Technology', icon: Zap },
  { value: 'warranty', label: 'Warranty', icon: Shield }
];

const COMMON_FEATURES = {
  performance: [
    'Light Filtering',
    'Blackout',
    'Insulating Properties',
    'UV Protection',
    'Energy Efficient'
  ],
  style: [
    'Custom Colors',
    'Pattern Options',
    'Modern Design',
    'Classic Style',
    'Decorative Trim'
  ],
  safety: [
    'Cordless Operation',
    'Child Safety',
    'Fire Resistant',
    'Pet Safe',
    'Breakaway Cords'
  ],
  'eco-friendly': [
    'Sustainable Materials',
    'Recyclable',
    'Low VOC',
    'GREENGUARD Certified',
    'Energy Star Rated'
  ],
  technology: [
    'Smart Home Compatible',
    'Motorized',
    'Remote Control',
    'App Control',
    'Voice Activated'
  ],
  warranty: [
    'Lifetime Warranty',
    '10 Year Warranty',
    '5 Year Warranty',
    'Parts & Labor',
    'Fade Resistance Guarantee'
  ]
};

export default function Features({ features, onChange }: FeaturesProps) {
  const [newFeature, setNewFeature] = useState({
    name: '',
    description: '',
    category: 'performance' as Feature['category']
  });

  const addFeature = () => {
    if (!newFeature.name.trim()) return;

    const feature: Feature = {
      id: Date.now().toString(),
      name: newFeature.name.trim(),
      description: newFeature.description.trim(),
      category: newFeature.category
    };

    onChange([...features, feature]);
    setNewFeature({
      name: '',
      description: '',
      category: 'performance'
    });
  };

  const addCommonFeature = (featureName: string, category: Feature['category']) => {
    // Check if feature already exists
    if (features.some(f => f.name.toLowerCase() === featureName.toLowerCase())) {
      return;
    }

    const feature: Feature = {
      id: Date.now().toString(),
      name: featureName,
      description: '',
      category
    };

    onChange([...features, feature]);
  };

  const removeFeature = (featureId: string) => {
    onChange(features.filter(f => f.id !== featureId));
  };

  const updateFeature = (featureId: string, updates: Partial<Feature>) => {
    onChange(features.map(f => f.id === featureId ? { ...f, ...updates } : f));
  };

  const getCategoryIcon = (category: Feature['category']) => {
    const categoryData = FEATURE_CATEGORIES.find(c => c.value === category);
    const Icon = categoryData?.icon || Zap;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryColor = (category: Feature['category']) => {
    const colors = {
      performance: 'bg-blue-100 text-blue-800',
      style: 'bg-purple-100 text-purple-800',
      safety: 'bg-red-100 text-red-800',
      'eco-friendly': 'bg-green-100 text-green-800',
      technology: 'bg-indigo-100 text-indigo-800',
      warranty: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Product Features</h3>
        <p className="text-sm text-gray-600 mb-6">
          Highlight the key features and benefits of your product
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Feature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Feature name"
                value={newFeature.name}
                onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Select
                value={newFeature.category}
                onValueChange={(value) => setNewFeature(prev => ({ ...prev, category: value as Feature['category'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {FEATURE_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Textarea
            placeholder="Feature description (optional)"
            value={newFeature.description}
            onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          
          <Button onClick={addFeature} disabled={!newFeature.name.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </CardContent>
      </Card>

      {features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Features ({features.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={feature.name}
                          onChange={(e) => updateFeature(feature.id, { name: e.target.value })}
                          className="font-medium bg-white"
                        />
                        <Badge className={`gap-1 ${getCategoryColor(feature.category)}`}>
                          {getCategoryIcon(feature.category)}
                          {FEATURE_CATEGORIES.find(c => c.value === feature.category)?.label}
                        </Badge>
                      </div>
                      
                      <Textarea
                        value={feature.description}
                        onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
                        placeholder="Add description..."
                        rows={2}
                        className="bg-white"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(feature.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Add Common Features</CardTitle>
          <p className="text-sm text-gray-600">
            Click to quickly add common features by category
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FEATURE_CATEGORIES.map(category => (
              <div key={category.value}>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  {getCategoryIcon(category.value)}
                  {category.label}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_FEATURES[category.value as keyof typeof COMMON_FEATURES]?.map(featureName => (
                    <Button
                      key={featureName}
                      variant="outline"
                      size="sm"
                      onClick={() => addCommonFeature(featureName, category.value as Feature['category'])}
                      disabled={features.some(f => f.name.toLowerCase() === featureName.toLowerCase())}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {featureName}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}