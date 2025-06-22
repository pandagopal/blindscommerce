import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConsultationType {
  id: string;
  name: string;
  duration: string;
  description: string;
}

const consultationTypes: ConsultationType[] = [
  {
    id: 'design',
    name: 'Design Consultation',
    duration: '30 minutes',
    description: 'Get expert advice on window treatment styles and design options'
  },
  {
    id: 'measure',
    name: 'Measurement Consultation',
    duration: '45 minutes',
    description: 'Professional guidance on measuring your windows correctly'
  },
  {
    id: 'install',
    name: 'Installation Consultation',
    duration: '30 minutes',
    description: 'Learn about installation options and requirements'
  }
];

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM'
];

export default function ConsultationBooking() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedType) return;

    // TODO: Implement API call to book consultation
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Book an Expert Consultation</h2>
        <p className="text-gray-600">
          Schedule a free consultation with our window treatment experts
        </p>
      </div>

      {/* Consultation Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {consultationTypes.map((type) => (
          <div
            key={type.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all
              ${selectedType === type.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-gray-300'}`}
            onClick={() => setSelectedType(type.id)}
          >
            <h3 className="font-medium mb-2">{type.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{type.description}</p>
            <p className="text-sm font-medium">{type.duration}</p>
          </div>
        ))}
      </div>

      {/* Date and Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-3">Select Date</h3>
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

        <div>
          <h3 className="font-medium mb-3">Select Time</h3>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`p-2 text-sm rounded-md transition-colors
                  ${selectedTime === time
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                  }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-medium">Contact Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={contactInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={contactInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Your email address"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <Input
            type="tel"
            value={contactInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Your phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Additional Notes</label>
          <Textarea
            value={contactInfo.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any specific questions or concerns?"
            rows={4}
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={!selectedDate || !selectedTime || !selectedType || !contactInfo.name || !contactInfo.email || !contactInfo.phone}
      >
        Book Consultation
      </Button>
    </div>
  );
} 