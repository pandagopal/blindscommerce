'use client';

import { useState } from 'react';
import { PlusIcon, X, GripVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoomRecommendation {
  id: string;
  roomType: string;
  recommendation: string;
  priority: number;
}

interface RoomRecommendationsProps {
  recommendations: RoomRecommendation[];
  onChange: (recommendations: RoomRecommendation[]) => void;
}

const ROOM_TYPES = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Dining Room',
  'Home Office',
  'Media Room',
  'Nursery',
  'Sunroom',
  'Basement',
  'Garage',
  'Patio/Outdoor',
];

export default function RoomRecommendations({ recommendations, onChange }: RoomRecommendationsProps) {
  const [newRecommendation, setNewRecommendation] = useState<RoomRecommendation>({
    id: '',
    roomType: '',
    recommendation: '',
    priority: recommendations.length + 1
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddRecommendation = () => {
    if (!newRecommendation.roomType || !newRecommendation.recommendation) return;

    const recommendation = {
      ...newRecommendation,
      id: Math.random().toString(36).substring(7)
    };

    onChange([...recommendations, recommendation]);
    setNewRecommendation({
      id: '',
      roomType: '',
      recommendation: '',
      priority: recommendations.length + 2
    });
  };

  const handleRemoveRecommendation = (index: number) => {
    const newRecommendations = [...recommendations];
    newRecommendations.splice(index, 1);
    
    // Update priorities
    const updatedRecommendations = newRecommendations.map((rec, i) => ({
      ...rec,
      priority: i + 1
    }));
    
    onChange(updatedRecommendations);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newRecommendations = [...recommendations];
    const draggedRecommendation = newRecommendations[draggedIndex];
    newRecommendations.splice(draggedIndex, 1);
    newRecommendations.splice(index, 0, draggedRecommendation);

    // Update priorities after reordering
    const updatedRecommendations = newRecommendations.map((rec, i) => ({
      ...rec,
      priority: i + 1
    }));

    onChange(updatedRecommendations);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Room Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-4">
            <Select
              value={newRecommendation.roomType}
              onValueChange={(value) =>
                setNewRecommendation({ ...newRecommendation, roomType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Enter recommendation for this room type"
              value={newRecommendation.recommendation}
              onChange={(e) =>
                setNewRecommendation({
                  ...newRecommendation,
                  recommendation: e.target.value
                })
              }
            />
            <Button onClick={handleAddRecommendation}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Recommendation
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {recommendations.map((rec, index) => (
            <div
              key={rec.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-start gap-4 p-4 rounded-lg border bg-card
                ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 cursor-move text-muted-foreground" />
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                  {rec.priority}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{rec.roomType}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRecommendation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {rec.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 