'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Package, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

interface DeliverySlot {
  slotId: number;
  slotName: string;
  slotCode: string;
  timeWindow: {
    start: string;
    end: string;
  };
  availableCapacity: number;
  totalCapacity: number;
  additionalFee: number;
  requiresSignature: boolean;
  allowsSpecificTimeRequest: boolean;
  isAvailable: boolean;
}

interface DeliveryDate {
  date: string;
  dayOfWeek: number;
  daysFromToday: number;
  slots: DeliverySlot[];
  blackouts: Array<{
    name: string;
    message?: string;
  }>;
}

interface DeliverySchedule {
  scheduleId: number;
  orderId: number;
  deliveryDate: string;
  timeSlot: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    additionalFee: number;
  };
  status: string;
  customerNotes?: string;
  createdAt: string;
}

interface DeliverySchedulerProps {
  orderId: number;
  onScheduleComplete?: (schedule: DeliverySchedule) => void;
  allowReschedule?: boolean;
}

export default function DeliveryScheduler({ 
  orderId, 
  onScheduleComplete, 
  allowReschedule = true 
}: DeliverySchedulerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate[]>([]);
  const [existingSchedule, setExistingSchedule] = useState<DeliverySchedule | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [specificTime, setSpecificTime] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('front_door');
  const [accessInstructions, setAccessInstructions] = useState<string>('');
  const [alternativeRecipient, setAlternativeRecipient] = useState<string>('');
  const [alternativePhone, setAlternativePhone] = useState<string>('');
  
  const [notifyDayBefore, setNotifyDayBefore] = useState(true);
  const [notifyDeliveryDay, setNotifyDeliveryDay] = useState(true);
  const [notifyOneHourBefore, setNotifyOneHourBefore] = useState(true);

  useEffect(() => {
    fetchExistingSchedule();
    fetchAvailableSlots();
  }, [orderId]);

  const fetchExistingSchedule = async () => {
    try {
      const response = await fetch(`/api/delivery/schedule?order_id=${orderId}`);
      const data = await response.json();
      
      if (data.success && data.schedule) {
        setExistingSchedule(data.schedule);
        
        // Pre-fill form with existing data
        setSelectedDate(data.schedule.deliveryDate);
        setSelectedSlot(data.schedule.timeSlot.id);
        setCustomerNotes(data.schedule.customerNotes || '');
        setDeliveryLocation(data.schedule.deliveryLocation || 'front_door');
        setAccessInstructions(data.schedule.accessInstructions || '');
        setAlternativeRecipient(data.schedule.alternativeRecipient || '');
        setAlternativePhone(data.schedule.alternativePhone || '');
        setSpecificTime(data.schedule.specificTimeRequested || '');
        
        if (data.schedule.notifications) {
          setNotifyDayBefore(data.schedule.notifications.dayBefore);
          setNotifyDeliveryDay(data.schedule.notifications.deliveryDay);
          setNotifyOneHourBefore(data.schedule.notifications.oneHourBefore);
        }
      }
    } catch (error) {
      console.error('Error fetching existing schedule:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30); // Next 30 days

      const response = await fetch(
        `/api/delivery/slots?start_date=${today.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
      );
      const data = await response.json();
      
      if (data.success) {
        setDeliveryDates(data.deliverySlots);
      } else {
        setError(data.error || 'Failed to fetch delivery slots');
      }
    } catch (error) {
      console.error('Error fetching delivery slots:', error);
      setError('Failed to fetch delivery slots');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleDelivery = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select a delivery date and time slot');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/delivery/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          delivery_date: selectedDate,
          time_slot_id: selectedSlot,
          specific_time_requested: specificTime || undefined,
          customer_notes: customerNotes || undefined,
          alternative_recipient: alternativeRecipient || undefined,
          alternative_phone: alternativePhone || undefined,
          delivery_location: deliveryLocation,
          access_instructions: accessInstructions || undefined,
          notification_preferences: {
            email: true,
            sms: false,
            phone: false
          },
          notify_on_day_before: notifyDayBefore,
          notify_on_delivery_day: notifyDeliveryDay,
          notify_one_hour_before: notifyOneHourBefore
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(data.message);
        setExistingSchedule(data.schedule);
        
        if (onScheduleComplete) {
          onScheduleComplete(data.schedule);
        }
        
        // Refresh available slots to update capacity
        await fetchAvailableSlots();
      } else {
        setError(data.error || 'Failed to schedule delivery');
      }
    } catch (error) {
      console.error('Error scheduling delivery:', error);
      setError('Failed to schedule delivery');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSelectedSlotInfo = () => {
    if (!selectedDate || !selectedSlot) return null;
    
    const dateInfo = deliveryDates.find(d => d.date === selectedDate);
    if (!dateInfo) return null;
    
    return dateInfo.slots.find(s => s.slotId === selectedSlot);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center">
          <Package className="w-6 h-6 mr-3 text-purple-600" />
          {existingSchedule ? 'Delivery Scheduled' : 'Schedule Delivery'}
        </h2>
        {existingSchedule && (
          <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">
                Scheduled for {formatDate(existingSchedule.deliveryDate)} 
                at {formatTime(existingSchedule.timeSlot.startTime)} - {formatTime(existingSchedule.timeSlot.endTime)}
              </span>
            </div>
            {existingSchedule.status && (
              <p className="text-sm text-green-600 mt-1">
                Status: {existingSchedule.status.charAt(0).toUpperCase() + existingSchedule.status.slice(1)}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}

      {(!existingSchedule || allowReschedule) && (
        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Select Delivery Date
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {deliveryDates.map((dateInfo) => (
                <button
                  key={dateInfo.date}
                  onClick={() => {
                    setSelectedDate(dateInfo.date);
                    setSelectedSlot(null);
                  }}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedDate === dateInfo.date
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{formatDate(dateInfo.date)}</div>
                  <div className="text-sm text-gray-600">
                    {dateInfo.slots.filter(s => s.isAvailable).length} slots available
                  </div>
                  {dateInfo.blackouts.length > 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      Limited availability
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Select Time Slot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {deliveryDates
                  .find(d => d.date === selectedDate)
                  ?.slots.map((slot) => (
                    <button
                      key={slot.slotId}
                      onClick={() => setSelectedSlot(slot.slotId)}
                      disabled={!slot.isAvailable}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedSlot === slot.slotId
                          ? 'border-purple-500 bg-purple-50'
                          : slot.isAvailable
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{slot.slotName}</div>
                          <div className="text-sm text-gray-600">
                            {formatTime(slot.timeWindow.start)} - {formatTime(slot.timeWindow.end)}
                          </div>
                          {slot.additionalFee > 0 && (
                            <div className="text-sm text-purple-600 font-medium">
                              +${slot.additionalFee.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-sm ${slot.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {slot.isAvailable ? 'Available' : 'Full'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {slot.availableCapacity}/{slot.totalCapacity} spots
                          </div>
                        </div>
                      </div>
                      {slot.requiresSignature && (
                        <div className="text-xs text-blue-600 mt-2">
                          Signature required
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Additional Options */}
          {selectedSlot && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Delivery Details
              </h3>

              {getSelectedSlotInfo()?.allowsSpecificTimeRequest && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Specific Time (optional)
                  </label>
                  <input
                    type="time"
                    value={specificTime}
                    onChange={(e) => setSpecificTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Request a specific time within the selected slot (subject to availability)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Location
                </label>
                <select
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="front_door">Front Door</option>
                  <option value="back_door">Back Door</option>
                  <option value="garage">Garage</option>
                  <option value="reception">Reception/Front Desk</option>
                  <option value="mailroom">Mailroom</option>
                  <option value="other">Other (specify in instructions)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternative Recipient (optional)
                  </label>
                  <input
                    type="text"
                    value={alternativeRecipient}
                    onChange={(e) => setAlternativeRecipient(e.target.value)}
                    placeholder="Someone else who can receive the delivery"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternative Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={alternativePhone}
                    onChange={(e) => setAlternativePhone(e.target.value)}
                    placeholder="Alternative contact number"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Instructions (optional)
                </label>
                <textarea
                  value={accessInstructions}
                  onChange={(e) => setAccessInstructions(e.target.value)}
                  rows={3}
                  placeholder="Gate codes, building access, parking instructions, etc."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Notes (optional)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special instructions or requests for the delivery"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Notification Preferences */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Delivery Notifications</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notifyDayBefore}
                      onChange={(e) => setNotifyDayBefore(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Notify me the day before delivery
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notifyDeliveryDay}
                      onChange={(e) => setNotifyDeliveryDay(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Notify me on delivery day
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notifyOneHourBefore}
                      onChange={(e) => setNotifyOneHourBefore(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Notify me 1 hour before delivery
                    </span>
                  </label>
                </div>
              </div>

              {/* Schedule Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleScheduleDelivery}
                  disabled={saving || !selectedDate || !selectedSlot}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {existingSchedule ? 'Rescheduling...' : 'Scheduling...'}
                    </div>
                  ) : (
                    <>
                      {existingSchedule ? 'Reschedule Delivery' : 'Schedule Delivery'}
                      {getSelectedSlotInfo()?.additionalFee && getSelectedSlotInfo()!.additionalFee > 0 && (
                        <span className="ml-2">
                          (+${getSelectedSlotInfo()!.additionalFee.toFixed(2)})
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}