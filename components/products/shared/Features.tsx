'use client';

import { useState } from 'react';
import { PlusIcon, X, GripVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesProps {
  features: Feature[];
  onChange: (features: Feature[]) => void;
  isReadOnly?: boolean;
}

const AVAILABLE_ICONS = [
  { value: 'check', label: 'Check Mark' },
  { value: 'star', label: 'Star' },
  { value: 'shield', label: 'Shield' },
  { value: 'award', label: 'Award' },
  { value: 'heart', label: 'Heart' },
  { value: 'sun', label: 'Sun' },
  { value: 'moon', label: 'Moon' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'droplet', label: 'Droplet' },
  { value: 'flame', label: 'Flame' },
  { value: 'zap', label: 'Lightning' },
  { value: 'wind', label: 'Wind' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'home', label: 'Home' },
  { value: 'building', label: 'Building' },
  { value: 'truck', label: 'Truck' },
  { value: 'package', label: 'Package' },
  { value: 'tag', label: 'Tag' },
  { value: 'percent', label: 'Percent' },
];

export default function Features({ features, onChange, isReadOnly = false }: FeaturesProps) {
  const [newFeature, setNewFeature] = useState<Feature>({
    id: '',
    title: '',
    description: '',
    icon: ''
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddFeature = () => {
    console.log('handleAddFeature called with:', { newFeature, isReadOnly });
    if (!newFeature.title || !newFeature.description || isReadOnly) {
      console.log('handleAddFeature early return:', { 
        hasTitle: !!newFeature.title, 
        hasDescription: !!newFeature.description, 
        isReadOnly 
      });
      return;
    }

    const feature = {
      ...newFeature,
      id: Math.random().toString(36).substring(7)
    };

    console.log('Adding feature:', feature);
    console.log('Current features:', features);
    const newFeatures = [...features, feature];
    console.log('New features array:', newFeatures);
    
    onChange(newFeatures);
    setNewFeature({
      id: '',
      title: '',
      description: '',
      icon: ''
    });
  };

  const handleRemoveFeature = (index: number) => {
    if (isReadOnly) return;

    const newFeatures = [...features];
    newFeatures.splice(index, 1);
    onChange(newFeatures);
  };

  const handleDragStart = (index: number) => {
    if (isReadOnly) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFeatures = [...features];
    const draggedFeature = newFeatures[draggedIndex];
    newFeatures.splice(draggedIndex, 1);
    newFeatures.splice(index, 0, draggedFeature);
    onChange(newFeatures);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleUpdateFeature = (index: number, field: keyof Feature, value: string) => {
    if (isReadOnly) return;

    const newFeatures = [...features];
    newFeatures[index] = {
      ...newFeatures[index],
      [field]: value
    };
    onChange(newFeatures);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Product Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isReadOnly && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Input
                placeholder="Feature title"
                value={newFeature.title}
                onChange={(e) =>
                  setNewFeature({ ...newFeature, title: e.target.value })
                }
              />
              <Textarea
                placeholder="Feature description"
                value={newFeature.description}
                onChange={(e) =>
                  setNewFeature({ ...newFeature, description: e.target.value })
                }
              />
              <Select
                value={newFeature.icon}
                onValueChange={(value) =>
                  setNewFeature({ ...newFeature, icon: value })
                }
              >
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Select an icon (optional)" />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[200px]">
                  {AVAILABLE_ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">{icon.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddFeature}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              draggable={!isReadOnly}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-start gap-4 p-4 rounded-lg border bg-card
                ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {!isReadOnly && (
                <GripVertical className="h-5 w-5 mt-1 cursor-move text-muted-foreground" />
              )}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    value={feature.title}
                    onChange={(e) => handleUpdateFeature(index, 'title', e.target.value)}
                    className="max-w-[300px]"
                    disabled={isReadOnly}
                  />
                  {!isReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={feature.description}
                  onChange={(e) => handleUpdateFeature(index, 'description', e.target.value)}
                  disabled={isReadOnly}
                />
                <Select
                  value={feature.icon}
                  onValueChange={(value) => handleUpdateFeature(index, 'icon', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent className="w-full min-w-[200px]">
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap">{icon.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}