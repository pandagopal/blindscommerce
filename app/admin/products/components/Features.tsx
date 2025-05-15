'use client';

import { useState } from 'react';
import { PlusIcon, X, GripVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesProps {
  features: Feature[];
  onChange: (features: Feature[]) => void;
}

export default function Features({ features, onChange }: FeaturesProps) {
  const [newFeature, setNewFeature] = useState<Feature>({
    id: '',
    title: '',
    description: '',
    icon: ''
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddFeature = () => {
    if (!newFeature.title || !newFeature.description) return;

    const feature = {
      ...newFeature,
      id: Math.random().toString(36).substring(7)
    };

    onChange([...features, feature]);
    setNewFeature({
      id: '',
      title: '',
      description: '',
      icon: ''
    });
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = [...features];
    newFeatures.splice(index, 1);
    onChange(newFeatures);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Product Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <Input
              placeholder="Icon name (optional)"
              value={newFeature.icon || ''}
              onChange={(e) =>
                setNewFeature({ ...newFeature, icon: e.target.value })
              }
            />
            <Button onClick={handleAddFeature}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-start gap-4 p-4 rounded-lg border bg-card
                ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <GripVertical className="h-5 w-5 mt-1 cursor-move text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{feature.title}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                {feature.icon && (
                  <p className="text-xs text-muted-foreground">
                    Icon: {feature.icon}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 