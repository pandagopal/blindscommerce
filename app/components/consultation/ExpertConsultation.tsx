import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Expert {
  id: string;
  name: string;
  specialty: string;
  availability: string[];
  image: string;
  experience: string;
}

interface ConsultationSlot {
  time: string;
  available: boolean;
}

export default function ExpertConsultation() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedExpert, setSelectedExpert] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [consultationType, setConsultationType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [timeSlots, setTimeSlots] = useState<ConsultationSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock experts data (replace with API call)
  useEffect(() => {
    setExperts([
      {
        id: '1',
        name: 'Sarah Johnson',
        specialty: 'Window Treatment Design',
        availability: ['Monday', 'Wednesday', 'Friday'],
        image: '/images/experts/sarah.jpg',
        experience: '10+ years'
      },
      {
        id: '2',
        name: 'Michael Chen',
        specialty: 'Smart Home Integration',
        availability: ['Tuesday', 'Thursday', 'Saturday'],
        image: '/images/experts/michael.jpg',
        experience: '8+ years'
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        specialty: 'Interior Design',
        availability: ['Monday', 'Tuesday', 'Thursday'],
        image: '/images/experts/emily.jpg',
        experience: '12+ years'
      }
    ]);
    setLoading(false);
  }, []);

  // Generate time slots based on selected date and expert
  useEffect(() => {
    if (selectedDate && selectedExpert) {
      // In a real app, this would fetch available slots from the API
      const slots: ConsultationSlot[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        const time = `${hour}:00`;
        slots.push({
          time,
          available: Math.random() > 0.3 // Randomly mark slots as available
        });
      }
      setTimeSlots(slots);
    }
  }, [selectedDate, selectedExpert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedExpert || !selectedTimeSlot || !consultationType) {
      return;
    }

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expertId: selectedExpert,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          consultationType,
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to book consultation');
      }

      router.push('/account/consultations');
    } catch (error) {
      console.error('Error booking consultation:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Book an Expert Consultation</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Expert Selection */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Choose an Expert</h3>
          <div className="space-y-4">
            {experts.map((expert) => (
              <div
                key={expert.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedExpert === expert.id
                    ? 'border-primary-red bg-red-50'
                    : 'border-gray-200 hover:border-primary-red'
                }`}
                onClick={() => setSelectedExpert(expert.id)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={expert.image}
                    alt={expert.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium">{expert.name}</h4>
                    <p className="text-sm text-gray-600">{expert.specialty}</p>
                    <p className="text-sm text-gray-500">{expert.experience}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div>
          <h3 className="text-lg font-medium mb-4">Select Date</h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            disabled={(date) =>
              date < new Date() || // Past dates
              date.getDay() === 0 || // Sundays
              date.getDay() === 6    // Saturdays
            }
          />
        </div>

        {/* Time Slots and Details */}
        <div className="space-y-6">
          {selectedDate && selectedExpert && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-4">Select Time</h3>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTimeSlot(slot.time)}
                      disabled={!slot.available}
                      className={`p-2 text-sm rounded-md transition-colors ${
                        selectedTimeSlot === slot.time
                          ? 'bg-primary-red text-white'
                          : slot.available
                          ? 'bg-gray-100 hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Consultation Details</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Type of Consultation
                    </label>
                    <Select
                      value={consultationType}
                      onValueChange={setConsultationType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select consultation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="design">Design Consultation</SelectItem>
                        <SelectItem value="measurement">Measurement Review</SelectItem>
                        <SelectItem value="installation">Installation Planning</SelectItem>
                        <SelectItem value="automation">Smart Home Integration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Additional Notes
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe your needs or any specific questions..."
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedTimeSlot || !consultationType}
                  >
                    Book Consultation
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 