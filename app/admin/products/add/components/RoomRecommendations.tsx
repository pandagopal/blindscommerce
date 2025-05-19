import { useState } from 'react';

interface RoomRecommendation {
  roomType: string;
  description: string;
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
  'Home Office',
  'Dining Room',
  'Media Room',
  'Sunroom',
  'Patio'
];

export default function RoomRecommendations({ recommendations, onChange }: RoomRecommendationsProps) {
  const [recommendationsList, setRecommendationsList] = useState<RoomRecommendation[]>(recommendations);
  const [newRecommendation, setNewRecommendation] = useState<RoomRecommendation>({
    roomType: '',
    description: '',
    priority: 1
  });

  const addRecommendation = () => {
    if (newRecommendation.roomType && newRecommendation.description) {
      const updatedRecommendations = [...recommendationsList, newRecommendation];
      setRecommendationsList(updatedRecommendations);
      onChange(updatedRecommendations);
      setNewRecommendation({
        roomType: '',
        description: '',
        priority: 1
      });
    }
  };

  const removeRecommendation = (index: number) => {
    const updatedRecommendations = recommendationsList.filter((_, i) => i !== index);
    setRecommendationsList(updatedRecommendations);
    onChange(updatedRecommendations);
  };

  const updateRecommendation = (index: number, field: keyof RoomRecommendation, value: string | number) => {
    const updatedRecommendations = recommendationsList.map((rec, i) =>
      i === index ? { ...rec, [field]: value } : rec
    );
    setRecommendationsList(updatedRecommendations);
    onChange(updatedRecommendations);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Add New Room Recommendation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={newRecommendation.roomType}
            onChange={(e) => setNewRecommendation({ ...newRecommendation, roomType: e.target.value })}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">Select Room Type</option>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            max="10"
            placeholder="Priority (1-10)"
            value={newRecommendation.priority}
            onChange={(e) => setNewRecommendation({ ...newRecommendation, priority: parseInt(e.target.value) })}
            className="border rounded-lg px-4 py-2"
          />
          <textarea
            placeholder="Why is this product recommended for this room type?"
            value={newRecommendation.description}
            onChange={(e) => setNewRecommendation({ ...newRecommendation, description: e.target.value })}
            className="border rounded-lg px-4 py-2 md:col-span-2"
            rows={3}
          />
          <button
            onClick={addRecommendation}
            className="bg-primary-red text-white px-6 py-2 rounded-lg hover:bg-primary-red-dark md:col-span-2"
          >
            Add Recommendation
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {recommendationsList.map((rec, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={rec.roomType}
                onChange={(e) => updateRecommendation(index, 'roomType', e.target.value)}
                className="border rounded-lg px-4 py-2"
              >
                <option value="">Select Room Type</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                max="10"
                value={rec.priority}
                onChange={(e) => updateRecommendation(index, 'priority', parseInt(e.target.value))}
                className="border rounded-lg px-4 py-2"
              />
              <textarea
                value={rec.description}
                onChange={(e) => updateRecommendation(index, 'description', e.target.value)}
                className="border rounded-lg px-4 py-2 md:col-span-2"
                rows={3}
              />
              <button
                onClick={() => removeRecommendation(index)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 