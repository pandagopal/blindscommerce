'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, MapPin, Package, Star, CheckCircle, AlertCircle, ChevronRight, Edit3, X, Phone } from 'lucide-react';

interface ShippingAddress {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface EligibleOrder {
  order_id: number;
  order_number: string;
  status: string;
  shipped_at: string;
  total_amount: number;
  earliest_appointment_date: string;
  shipping_address: ShippingAddress;
}

interface Installer {
  company_id: number;
  company_name: string;
  phone: string;
  email: string;
  location: string;
  rating: number;
  total_reviews: number;
  total_installations: number;
  base_service_fee: number;
  hourly_rate: number;
  additional_travel_fee: number;
  services_offered: string[];
  lead_time_days: number;
  max_advance_days: number;
  service_days: number[];
  service_hours: string;
  is_primary_area: boolean;
}

interface TimeSlot {
  slot_id: number;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  premium_fee: number;
  display: string;
}

interface BookedAppointment {
  appointment_id: number;
  appointment_date: string;
  time_slot: string;
  time_range: string;
  installation_type: string;
  status: string;
  installer_name: string;
  installer_phone: string;
  installer_email: string;
  order_number: string;
}

interface MyAppointment {
  appointment_id: number;
  order_id: number;
  order_number: string;
  appointment_date: string;
  time_slot: string;
  time_range: string;
  installation_type: string;
  status: string;
  special_requirements: string | null;
  installation_address: any;
  contact_phone: string;
  base_cost: number;
  total_cost: number;
  technician: {
    name: string;
    phone: string;
    email: string;
  };
  created_at: string;
}

type Step = 'select-order' | 'select-installer' | 'select-datetime' | 'confirm' | 'success';

export default function InstallationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('select-order');

  // Data states
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([]);
  const [myAppointments, setMyAppointments] = useState<MyAppointment[]>([]);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Selection states
  const [selectedOrder, setSelectedOrder] = useState<EligibleOrder | null>(null);
  const [selectedInstaller, setSelectedInstaller] = useState<Installer | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Booking result
  const [bookedAppointment, setBookedAppointment] = useState<BookedAppointment | null>(null);
  const [booking, setBooking] = useState(false);

  // Reschedule/Cancel states
  const [selectedAppointment, setSelectedAppointment] = useState<MyAppointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<TimeSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch eligible orders and appointments on mount
  useEffect(() => {
    fetchEligibleOrders();
    fetchMyAppointments();
    fetchTimeSlots();
  }, []);

  const fetchEligibleOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/commerce/installation/eligible-orders');
      if (res.ok) {
        const result = await res.json();
        setEligibleOrders(result.data?.orders || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch eligible orders');
      }
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const res = await fetch('/api/v2/commerce/installation/my-appointments');
      if (res.ok) {
        const result = await res.json();
        setMyAppointments(result.data?.appointments || []);
      }
    } catch (err) {
      console.error('Failed to fetch appointments');
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const res = await fetch('/api/v2/commerce/installation/time-slots');
      if (res.ok) {
        const result = await res.json();
        setTimeSlots(result.data?.time_slots || []);
      }
    } catch (err) {
      console.error('Failed to fetch time slots');
    }
  };

  const openRescheduleModal = (apt: MyAppointment) => {
    setSelectedAppointment(apt);
    setRescheduleDate('');
    setRescheduleTimeSlot(null);
    setRescheduleReason('');
    setShowRescheduleModal(true);
  };

  const openCancelModal = (apt: MyAppointment) => {
    setSelectedAppointment(apt);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTimeSlot) {
      setError('Please select a new date and time slot');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const res = await fetch(`/api/v2/commerce/installation/appointments/${selectedAppointment.appointment_id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_date: rescheduleDate,
          time_slot_id: rescheduleTimeSlot.slot_id,
          reason: rescheduleReason || undefined
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setShowRescheduleModal(false);
        setSelectedAppointment(null);
        fetchMyAppointments(); // Refresh appointments
        fetchEligibleOrders(); // Refresh eligible orders
      } else {
        setError(result.error || 'Failed to reschedule appointment');
      }
    } catch (err) {
      setError('Failed to reschedule appointment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;

    try {
      setProcessing(true);
      setError('');

      const res = await fetch(`/api/v2/commerce/installation/appointments/${selectedAppointment.appointment_id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason || undefined
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setShowCancelModal(false);
        setSelectedAppointment(null);
        fetchMyAppointments(); // Refresh appointments
        fetchEligibleOrders(); // Refresh eligible orders (cancelled order becomes available again)
      } else {
        setError(result.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getRescheduleMinDate = () => {
    // Minimum date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const fetchInstallers = async (zipCode: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v2/commerce/installation/installers?zip_code=${zipCode}`);
      if (res.ok) {
        const result = await res.json();
        setInstallers(result.data?.installers || []);
        if ((result.data?.installers || []).length === 0) {
          setError('No installers available in your area. Please contact support.');
        }
      } else {
        setError('Failed to fetch installers');
      }
    } catch (err) {
      setError('Failed to load installers');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order: EligibleOrder) => {
    setSelectedOrder(order);
    setError('');
    if (order.shipping_address.postal_code) {
      fetchInstallers(order.shipping_address.postal_code);
      setStep('select-installer');
    } else {
      setError('Order shipping address is missing postal code');
    }
  };

  const handleInstallerSelect = (installer: Installer) => {
    setSelectedInstaller(installer);
    setError('');
    setStep('select-datetime');
  };

  const handleDateTimeConfirm = () => {
    if (!selectedDate || !selectedTimeSlot) {
      setError('Please select both date and time slot');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleBookAppointment = async () => {
    if (!selectedOrder || !selectedInstaller || !selectedDate || !selectedTimeSlot) {
      setError('Missing required information');
      return;
    }

    try {
      setBooking(true);
      setError('');

      const res = await fetch('/api/v2/commerce/installation/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.order_id,
          installer_company_id: selectedInstaller.company_id,
          appointment_date: selectedDate,
          time_slot_id: selectedTimeSlot.slot_id,
          installation_type: 'installation',
          special_requirements: specialRequirements || null
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setBookedAppointment(result.data?.appointment);
        setStep('success');
      } else {
        setError(result.error || 'Failed to book appointment');
      }
    } catch (err) {
      setError('Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const resetBooking = () => {
    setSelectedOrder(null);
    setSelectedInstaller(null);
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setSpecialRequirements('');
    setBookedAppointment(null);
    setStep('select-order');
    fetchEligibleOrders();
    fetchMyAppointments();
  };

  const getMinDate = () => {
    if (!selectedOrder) return '';
    const earliest = new Date(selectedOrder.earliest_appointment_date);

    // Also consider installer lead time
    if (selectedInstaller) {
      const today = new Date();
      const leadTimeDate = new Date(today);
      leadTimeDate.setDate(leadTimeDate.getDate() + selectedInstaller.lead_time_days);

      return earliest > leadTimeDate
        ? earliest.toISOString().split('T')[0]
        : leadTimeDate.toISOString().split('T')[0];
    }

    return earliest.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    if (!selectedInstaller) return '';
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + selectedInstaller.max_advance_days);
    return maxDate.toISOString().split('T')[0];
  };

  if (loading && step === 'select-order') {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Schedule Installation</h1>

      {/* Progress Steps */}
      <div className="flex items-center mb-8 overflow-x-auto">
        {['Select Order', 'Choose Installer', 'Date & Time', 'Confirm'].map((label, idx) => {
          const stepMap: Step[] = ['select-order', 'select-installer', 'select-datetime', 'confirm'];
          const isActive = stepMap.indexOf(step) >= idx || step === 'success';
          const isCurrent = stepMap[idx] === step;

          return (
            <div key={label} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                isActive ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              } ${isCurrent ? 'ring-2 ring-red-300' : ''}`}>
                {step === 'success' && idx < 4 ? <CheckCircle size={16} /> : idx + 1}
              </div>
              <span className={`ml-2 text-sm whitespace-nowrap ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                {label}
              </span>
              {idx < 3 && <ChevronRight size={20} className="mx-3 text-gray-300" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Select Order */}
      {step === 'select-order' && (
        <div>
          {/* Existing Appointments Section */}
          {myAppointments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar size={20} className="mr-2 text-green-600" />
                Your Scheduled Appointments
              </h2>
              <div className="space-y-4">
                {myAppointments.map(apt => (
                  <div
                    key={apt.appointment_id}
                    className="border border-green-200 bg-green-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-green-800">
                          Order #{apt.order_number}
                        </h3>
                        <p className="text-sm text-green-700 mt-1 flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-green-700 flex items-center">
                          <Clock size={14} className="mr-1" />
                          {apt.time_slot} ({apt.time_range})
                        </p>
                        {apt.technician?.name && (
                          <p className="text-sm text-green-700 mt-2">
                            <strong>Installer:</strong> {apt.technician.name}
                            {apt.technician.phone && ` - ${apt.technician.phone}`}
                          </p>
                        )}
                        {apt.installation_address && (
                          <p className="text-sm text-green-700 flex items-center mt-1">
                            <MapPin size={14} className="mr-1" />
                            {apt.installation_address.city}, {apt.installation_address.state} {apt.installation_address.postal_code}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                        <p className="text-xs text-green-600 mt-2">
                          {apt.installation_type}
                        </p>
                        {/* Action buttons for scheduled appointments */}
                        {apt.status === 'scheduled' && (
                          <div className="mt-3 flex flex-col gap-2">
                            <button
                              onClick={() => openRescheduleModal(apt)}
                              className="flex items-center justify-center px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              <Edit3 size={12} className="mr-1" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => openCancelModal(apt)}
                              className="flex items-center justify-center px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              <X size={12} className="mr-1" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {apt.special_requirements && (
                      <div className="mt-2 text-sm text-green-700 bg-green-100 p-2 rounded">
                        <strong>Notes:</strong> {apt.special_requirements}
                      </div>
                    )}
                    {/* Contact installer info */}
                    {apt.status === 'scheduled' && apt.technician?.phone && (
                      <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between">
                        <span className="text-xs text-green-600">Need to contact the installer?</span>
                        <a
                          href={`tel:${apt.technician.phone}`}
                          className="flex items-center text-xs text-green-700 hover:text-green-800 font-medium"
                        >
                          <Phone size={12} className="mr-1" />
                          {apt.technician.phone}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <hr className="my-6 border-gray-200" />
            </div>
          )}

          {/* Schedule New Appointment Section */}
          <h2 className="text-lg font-semibold mb-4">Schedule New Installation</h2>
          <p className="text-gray-600 mb-6">
            Only shipped orders are eligible for installation scheduling. The appointment must be at least 7 days after shipment.
          </p>

          {eligibleOrders.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {myAppointments.length > 0 ? 'No Additional Orders Available' : 'No Eligible Orders'}
              </h3>
              <p className="text-gray-500">
                {myAppointments.length > 0
                  ? 'All your shipped orders already have scheduled appointments.'
                  : 'You don\'t have any shipped orders eligible for installation scheduling. Orders must be in "shipped" status to book an installation appointment.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eligibleOrders.map(order => (
                <div
                  key={order.order_id}
                  onClick={() => handleOrderSelect(order)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Order #{order.order_number}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Shipped: {new Date(order.shipped_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <MapPin size={14} className="inline mr-1" />
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Shipped
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        Earliest: {new Date(order.earliest_appointment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Installer */}
      {step === 'select-installer' && (
        <div>
          <button
            onClick={() => setStep('select-order')}
            className="text-red-600 hover:text-red-700 mb-4 flex items-center text-sm"
          >
            &larr; Back to orders
          </button>

          <h2 className="text-lg font-semibold mb-4">Choose an Installer</h2>
          <p className="text-gray-600 mb-6">
            Select an installer that serves your area: <strong>{selectedOrder?.shipping_address.postal_code}</strong>
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : installers.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Installers Available</h3>
              <p className="text-gray-600">
                We don't have installation partners in your area yet.
                Please contact our support team for assistance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {installers.map(installer => (
                <div
                  key={installer.company_id}
                  onClick={() => handleInstallerSelect(installer)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium">{installer.company_name}</h3>
                        {installer.is_primary_area && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                            Primary Area
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <MapPin size={14} className="inline mr-1" />
                        {installer.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        <Clock size={14} className="inline mr-1" />
                        {installer.service_hours}
                      </p>
                      <div className="flex items-center mt-2">
                        <Star size={14} className="text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{installer.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({installer.total_reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-gray-900">
                        ${installer.base_service_fee.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Base fee</p>
                      {installer.additional_travel_fee > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          +${installer.additional_travel_fee.toFixed(2)} travel fee
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Date & Time */}
      {step === 'select-datetime' && (
        <div>
          <button
            onClick={() => setStep('select-installer')}
            className="text-red-600 hover:text-red-700 mb-4 flex items-center text-sm"
          >
            &larr; Back to installers
          </button>

          <h2 className="text-lg font-semibold mb-4">Select Date & Time</h2>
          <p className="text-gray-600 mb-6">
            Choose your preferred installation date and time slot with <strong>{selectedInstaller?.company_name}</strong>
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Appointment Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {getMinDate()} to {getMaxDate()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-2" />
                Time Slot
              </label>
              <div className="space-y-2">
                {timeSlots.map(slot => (
                  <label
                    key={slot.slot_id}
                    className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedTimeSlot?.slot_id === slot.slot_id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="timeSlot"
                        checked={selectedTimeSlot?.slot_id === slot.slot_id}
                        onChange={() => setSelectedTimeSlot(slot)}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">{slot.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({slot.display})</span>
                      </div>
                    </div>
                    {slot.premium_fee > 0 && (
                      <span className="text-sm text-orange-600">+${slot.premium_fee.toFixed(2)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requirements (Optional)
            </label>
            <textarea
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="Any special instructions for the installer..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <button
            onClick={handleDateTimeConfirm}
            disabled={!selectedDate || !selectedTimeSlot}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue to Confirmation
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && (
        <div>
          <button
            onClick={() => setStep('select-datetime')}
            className="text-red-600 hover:text-red-700 mb-4 flex items-center text-sm"
          >
            &larr; Back to date selection
          </button>

          <h2 className="text-lg font-semibold mb-4">Confirm Your Appointment</h2>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="font-medium mb-4">Appointment Details</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order</span>
                <span className="font-medium">#{selectedOrder?.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Installer</span>
                <span className="font-medium">{selectedInstaller?.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">{selectedTimeSlot?.name} ({selectedTimeSlot?.display})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-medium text-right">
                  {selectedOrder?.shipping_address.address_line1}<br />
                  {selectedOrder?.shipping_address.city}, {selectedOrder?.shipping_address.state} {selectedOrder?.shipping_address.postal_code}
                </span>
              </div>
              {specialRequirements && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Special Notes</span>
                  <span className="font-medium text-right max-w-xs">{specialRequirements}</span>
                </div>
              )}
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Service Fee</span>
                <span>${selectedInstaller?.base_service_fee.toFixed(2)}</span>
              </div>
              {(selectedInstaller?.additional_travel_fee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Travel Fee</span>
                  <span>${selectedInstaller?.additional_travel_fee.toFixed(2)}</span>
                </div>
              )}
              {(selectedTimeSlot?.premium_fee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Slot Premium</span>
                  <span>${selectedTimeSlot?.premium_fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg pt-2 border-t">
                <span>Estimated Total</span>
                <span>
                  ${((selectedInstaller?.base_service_fee || 0) +
                     (selectedInstaller?.additional_travel_fee || 0) +
                     (selectedTimeSlot?.premium_fee || 0)).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                * Final cost may vary based on installation complexity and materials
              </p>
            </div>
          </div>

          <button
            onClick={handleBookAppointment}
            disabled={booking}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {booking ? 'Booking...' : 'Confirm Appointment'}
          </button>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 'success' && bookedAppointment && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
          <p className="text-gray-600 mb-6">
            Your installation appointment has been scheduled successfully.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto text-left mb-6">
            <h3 className="font-medium mb-4 text-center">Appointment Details</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Confirmation #</span>
                <span className="font-medium">{bookedAppointment.appointment_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order</span>
                <span className="font-medium">#{bookedAppointment.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{new Date(bookedAppointment.appointment_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">{bookedAppointment.time_range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Installer</span>
                <span className="font-medium">{bookedAppointment.installer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact</span>
                <span className="font-medium">{bookedAppointment.installer_phone}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            The installer will contact you to confirm the appointment.
            You will receive a confirmation email shortly.
          </p>

          <button
            onClick={resetBooking}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Book Another Appointment
          </button>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reschedule Appointment</h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                <strong>Order:</strong> #{selectedAppointment.order_number}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Current Date:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Current Time:</strong> {selectedAppointment.time_slot} ({selectedAppointment.time_range})
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={getRescheduleMinDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Time Slot
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {timeSlots.map(slot => (
                    <label
                      key={slot.slot_id}
                      className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors ${
                        rescheduleTimeSlot?.slot_id === slot.slot_id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rescheduleTimeSlot"
                        checked={rescheduleTimeSlot?.slot_id === slot.slot_id}
                        onChange={() => setRescheduleTimeSlot(slot)}
                        className="mr-2"
                      />
                      <span className="text-sm">{slot.name} ({slot.display})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Why do you need to reschedule?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTimeSlot || processing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Cancel Appointment</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 font-medium mb-2">
                Are you sure you want to cancel this appointment?
              </p>
              <p className="text-sm text-red-600">
                <strong>Order:</strong> #{selectedAppointment.order_number}
              </p>
              <p className="text-sm text-red-600">
                <strong>Date:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-red-600">
                <strong>Time:</strong> {selectedAppointment.time_slot} ({selectedAppointment.time_range})
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please let us know why you're cancelling..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Note: After cancellation, you can schedule a new appointment from the Installation page.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={processing}
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
