'use client';

import { useState, useEffect } from 'react';
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
  recommendations?: RoomRecommendation[];
  onChange: (recommendations: RoomRecommendation[]) => void;
  isReadOnly?: boolean;
}

interface RoomType {
  id: number;
  name: string;
}

export default function RoomRecommendations({ recommendations, onChange, isReadOnly = false }: RoomRecommendationsProps) {
  // Add null safety check
  const safeRecommendations = recommendations || [];
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newRecommendation, setNewRecommendation] = useState<RoomRecommendation>({
    id: '',
    roomType: '',
    recommendation: '',
    priority: safeRecommendations.length + 1
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch room types from API
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (response.ok) {
          const data = await response.json();
          setRoomTypes(data.rooms || []);
        }
      } catch (error) {
        console.error('Error fetching room types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomTypes();
  }, []);

  const handleAddRecommendation = () => {
    if (!newRecommendation.roomType || !newRecommendation.recommendation || isReadOnly) return;

    const recommendation = {
      ...newRecommendation,
      id: `room-${Date.now()}-${Math.random().toString(36).substring(7)}`
    };

    onChange([...safeRecommendations, recommendation]);
    setNewRecommendation({
      id: '',
      roomType: '',
      recommendation: '',
      priority: safeRecommendations.length + 2
    });
  };

  const handleRemoveRecommendation = (index: number) => {
    if (isReadOnly) return;

    const newRecommendations = [...safeRecommendations];
    newRecommendations.splice(index, 1);
    
    // Update priorities
    const updatedRecommendations = newRecommendations.map((rec, i) => ({
      ...rec,
      priority: i + 1
    }));
    
    onChange(updatedRecommendations);
  };

  const handleDragStart = (index: number) => {
    if (isReadOnly) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newRecommendations = [...safeRecommendations];
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

  const handleUpdateRecommendation = (index: number, field: keyof RoomRecommendation, value: string) => {
    if (isReadOnly) return;

    const newRecommendations = [...safeRecommendations];
    newRecommendations[index] = {
      ...newRecommendations[index],
      [field]: value
    };
    onChange(newRecommendations);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Room Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isReadOnly && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Select
                value={newRecommendation.roomType}
                onValueChange={(value) =>
                  setNewRecommendation({ ...newRecommendation, roomType: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading rooms..." : "Select room type"} />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((room) => (
                    <SelectItem key={`new-room-${room.id}`} value={room.name}>
                      {room.name}
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
              <Button type="button" onClick={handleAddRecommendation}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Recommendation
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {safeRecommendations.map((rec, index) => (
            <div
              key={rec.id}
              draggable={!isReadOnly}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-start gap-4 p-4 rounded-lg border bg-card
                ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <GripVertical className="h-5 w-5 cursor-move text-muted-foreground" />
                )}
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                  {rec.priority}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  {isReadOnly ? (
                    <h4 className="font-medium">{rec.roomType}</h4>
                  ) : (
                    <Select
                      value={rec.roomType}
                      onValueChange={(value) => handleUpdateRecommendation(index, 'roomType', value)}
                    >
                      <SelectTrigger className="max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((room) => (
                          <SelectItem key={`edit-room-${room.id}-${index}`} value={room.name}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {!isReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecommendation(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isReadOnly ? (
                  <p className="text-sm text-muted-foreground">
                    {rec.recommendation}
                  </p>
                ) : (
                  <Textarea
                    value={rec.recommendation}
                    onChange={(e) => handleUpdateRecommendation(index, 'recommendation', e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}