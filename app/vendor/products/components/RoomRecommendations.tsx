import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bed, 
  Bath, 
  ChefHat, 
  Sofa, 
  Building, 
  Home,
  X,
  Plus,
  Lightbulb
} from 'lucide-react';

interface RoomRecommendation {
  id: string;
  roomType: string;
  isRecommended: boolean;
  reasoning: string;
  benefits: string[];
  considerations: string[];
}

interface RoomRecommendationsProps {
  recommendations: RoomRecommendation[];
  onChange: (recommendations: RoomRecommendation[]) => void;
}

const ROOM_TYPES = [
  { value: 'living-room', label: 'Living Room', icon: Sofa },
  { value: 'bedroom', label: 'Bedroom', icon: Bed },
  { value: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { value: 'bathroom', label: 'Bathroom', icon: Bath },
  { value: 'office', label: 'Home Office', icon: Building },
  { value: 'dining-room', label: 'Dining Room', icon: Home },
  { value: 'nursery', label: 'Nursery', icon: Home },
  { value: 'basement', label: 'Basement', icon: Home },
  { value: 'sunroom', label: 'Sunroom', icon: Home },
  { value: 'patio', label: 'Patio/Outdoor', icon: Home }
];

const COMMON_BENEFITS = [
  'Privacy control',
  'Light filtering',
  'Blackout capability',
  'Energy efficiency',
  'UV protection',
  'Easy cleaning',
  'Child safety',
  'Noise reduction',
  'Style enhancement',
  'Moisture resistance'
];

const COMMON_CONSIDERATIONS = [
  'High humidity environment',
  'Direct sunlight exposure',
  'Heavy traffic area',
  'Child safety requirements',
  'Pet considerations',
  'Frequent cleaning needs',
  'Size limitations',
  'Installation complexity'
];

export default function RoomRecommendations({ recommendations, onChange }: RoomRecommendationsProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [newBenefit, setNewBenefit] = useState<string>('');
  const [newConsideration, setNewConsideration] = useState<string>('');

  const addRoom = (roomType: string) => {
    if (recommendations.find(r => r.roomType === roomType)) return;

    const newRecommendation: RoomRecommendation = {
      id: Date.now().toString(),
      roomType,
      isRecommended: true,
      reasoning: '',
      benefits: [],
      considerations: []
    };

    onChange([...recommendations, newRecommendation]);
  };

  const removeRoom = (roomId: string) => {
    onChange(recommendations.filter(r => r.id !== roomId));
  };

  const updateRecommendation = (roomId: string, updates: Partial<RoomRecommendation>) => {
    onChange(recommendations.map(r => r.id === roomId ? { ...r, ...updates } : r));
  };

  const addBenefit = (roomId: string, benefit: string) => {
    const room = recommendations.find(r => r.id === roomId);
    if (!room || room.benefits.includes(benefit)) return;

    updateRecommendation(roomId, {
      benefits: [...room.benefits, benefit]
    });
  };

  const removeBenefit = (roomId: string, benefit: string) => {
    const room = recommendations.find(r => r.id === roomId);
    if (!room) return;

    updateRecommendation(roomId, {
      benefits: room.benefits.filter(b => b !== benefit)
    });
  };

  const addConsideration = (roomId: string, consideration: string) => {
    const room = recommendations.find(r => r.id === roomId);
    if (!room || room.considerations.includes(consideration)) return;

    updateRecommendation(roomId, {
      considerations: [...room.considerations, consideration]
    });
  };

  const removeConsideration = (roomId: string, consideration: string) => {
    const room = recommendations.find(r => r.id === roomId);
    if (!room) return;

    updateRecommendation(roomId, {
      considerations: room.considerations.filter(c => c !== consideration)
    });
  };

  const getRoomIcon = (roomType: string) => {
    const room = ROOM_TYPES.find(r => r.value === roomType);
    const Icon = room?.icon || Home;
    return <Icon className="h-4 w-4" />;
  };

  const getRoomLabel = (roomType: string) => {
    const room = ROOM_TYPES.find(r => r.value === roomType);
    return room?.label || roomType;
  };

  const availableRooms = ROOM_TYPES.filter(room => 
    !recommendations.find(r => r.roomType === room.value)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Room Recommendations</h3>
        <p className="text-sm text-gray-600 mb-6">
          Specify which rooms this product is suitable for and provide guidance to customers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Room Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {availableRooms.map(room => (
              <Button
                key={room.value}
                variant="outline"
                onClick={() => addRoom(room.value)}
                className="flex items-center gap-2 h-auto p-3"
              >
                {React.createElement(room.icon, { className: "h-4 w-4" })}
                <span className="text-sm">{room.label}</span>
              </Button>
            ))}
          </div>
          {availableRooms.length === 0 && (
            <p className="text-sm text-gray-500 italic">All room types have been added</p>
          )}
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRoomIcon(room.roomType)}
                    <CardTitle className="text-base">{getRoomLabel(room.roomType)}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`recommended-${room.id}`} className="text-sm">
                        Recommended
                      </Label>
                      <Switch
                        id={`recommended-${room.id}`}
                        checked={room.isRecommended}
                        onCheckedChange={(checked) => 
                          updateRecommendation(room.id, { isRecommended: checked })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoom(room.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Reasoning</Label>
                  <Textarea
                    value={room.reasoning}
                    onChange={(e) => updateRecommendation(room.id, { reasoning: e.target.value })}
                    placeholder="Explain why this product is suitable for this room..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Benefits</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {room.benefits.map(benefit => (
                        <Badge key={benefit} variant="secondary" className="gap-1">
                          {benefit}
                          <button
                            onClick={() => removeBenefit(room.id, benefit)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {COMMON_BENEFITS
                        .filter(benefit => !room.benefits.includes(benefit))
                        .slice(0, 5)
                        .map(benefit => (
                          <Button
                            key={benefit}
                            variant="outline"
                            size="sm"
                            onClick={() => addBenefit(room.id, benefit)}
                            className="text-xs h-6"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {benefit}
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Considerations</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {room.considerations.map(consideration => (
                        <Badge key={consideration} variant="outline" className="gap-1">
                          {consideration}
                          <button
                            onClick={() => removeConsideration(room.id, consideration)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {COMMON_CONSIDERATIONS
                        .filter(consideration => !room.considerations.includes(consideration))
                        .slice(0, 3)
                        .map(consideration => (
                          <Button
                            key={consideration}
                            variant="outline"
                            size="sm"
                            onClick={() => addConsideration(room.id, consideration)}
                            className="text-xs h-6"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {consideration}
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No room recommendations yet</h3>
              <p className="text-sm">Add room types where this product would be suitable</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Tips for Room Recommendations</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Consider the room's lighting needs and privacy requirements</li>
              <li>• Think about moisture levels, especially for bathrooms and kitchens</li>
              <li>• Factor in safety considerations for children's rooms</li>
              <li>• Consider the room's décor style and color scheme</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}