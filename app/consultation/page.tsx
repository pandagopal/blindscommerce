'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Home, Phone, Mail, MapPin, CheckCircle } from 'lucide-react';

function ConsultationContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    preferredDate: '',
    preferredTime: '',
    serviceType: '',
    roomType: '',
    windowCount: '',
    budget: '',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check for service type in URL parameters and set it
    const serviceParam = searchParams.get('service');
    if (serviceParam && serviceTypes.some(s => s.value === serviceParam)) {
      setFormData(prev => ({ ...prev, serviceType: serviceParam }));
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    setSubmitted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const roomTypes = [
    'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room',
    'Home Office', 'Nursery', 'Multiple Rooms', 'Entire Home'
  ];

  const budgetRanges = [
    'Under $500', '$500 - $1,000', '$1,000 - $2,500', 
    '$2,500 - $5,000', '$5,000 - $10,000', '$10,000+'
  ];

  const serviceTypes = [
    {
      value: 'measurement',
      label: 'Professional Measurement',
      description: 'Accurate window measuring for perfect fit'
    },
    {
      value: 'consultation',
      label: 'Design Consultation',
      description: 'Expert advice on styles, colors, and functionality'
    },
    {
      value: 'support',
      label: 'Installation Support',
      description: 'Help with installation and troubleshooting'
    },
    {
      value: 'commercial',
      label: 'Commercial Services',
      description: 'Solutions for businesses and large projects'
    }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Consultation Scheduled!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for scheduling your free consultation. We'll contact you within 24 hours to confirm your appointment.
          </p>
          <div className="space-y-3">
            <Link 
              href="/products"
              className="w-full bg-primary-red text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors block"
            >
              Browse Products
            </Link>
            <Link 
              href="/"
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors block"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary-red text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Book Your Service
            </h1>
            <p className="text-xl md:text-2xl mb-2 text-white/90">
              Professional Window Treatment Services
            </p>
            <p className="text-lg mb-8 text-white/80 max-w-3xl mx-auto">
              Schedule professional measurement, design consultation, installation support, or commercial services. 
              Our experts will help you find the perfect window treatment solution.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <Home className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">In-Home Service</h3>
                <p className="text-white/80">We come to you for accurate measurements and personalized recommendations</p>
              </div>
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <Clock className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Obligation</h3>
                <p className="text-white/80">Free consultation with no pressure to purchase</p>
              </div>
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Expert Advice</h3>
                <p className="text-white/80">Professional design guidance tailored to your needs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary-red to-primary-dark text-white p-8">
                <h2 className="text-3xl font-bold mb-4">Schedule Your Service</h2>
                <p className="text-red-100 text-lg">Fill out the form below and we'll contact you to confirm your appointment.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Type</h3>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">What service do you need? *</label>
                <select
                  name="serviceType"
                  required
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                >
                  <option value="">Select a service</option>
                  {serviceTypes.map(service => (
                    <option key={service.value} value={service.value}>{service.label}</option>
                  ))}
                </select>
                {formData.serviceType && (
                  <p className="mt-2 text-sm text-gray-600">
                    {serviceTypes.find(s => s.value === formData.serviceType)?.description}
                  </p>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Room Type</label>
                  <select
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  >
                    <option value="">Select a room</option>
                    {roomTypes.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Windows</label>
                  <input
                    type="number"
                    name="windowCount"
                    min="1"
                    value={formData.windowCount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
                  >
                    <option value="">Select a budget range</option>
                    {budgetRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes or Questions</label>
              <textarea
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Tell us about your specific needs, style preferences, or any questions you have..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent"
              />
            </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-red hover:bg-red-700 text-white py-4 px-8 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 flex items-center justify-center"
                  >
                    <Calendar className="h-6 w-6 mr-2" />
                    Schedule Service
                  </button>
                  <div className="flex flex-col sm:flex-row gap-2 text-center sm:text-left">
                    <a
                      href="tel:+1-316-530-2635"
                      className="flex items-center justify-center bg-white/90 backdrop-blur hover:bg-white text-gray-900 py-4 px-8 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                    >
                      <Phone className="h-6 w-6 mr-2" />
                      Call (316) 530-2635
                    </a>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            What to Expect During Your Consultation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional Measurement</h3>
              <p className="text-gray-600 text-lg">
                Our experts will measure your windows for perfect fit and provide installation assessment.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-100 to-red-100 rounded-lg p-6 mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Design Consultation</h3>
              <p className="text-gray-600 text-lg">
                Get personalized recommendations based on your style, budget, and functional needs.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <Mail className="h-12 w-12 text-primary-red" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Custom Quote</h3>
              <p className="text-gray-600 text-lg">
                Receive a detailed quote with no hidden fees and flexible financing options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-red to-primary-dark text-white py-20">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Windows?
          </h2>
          <p className="text-xl mb-8 text-red-100 max-w-3xl mx-auto">
            Join thousands of satisfied customers who chose Smart Blinds for their window treatment needs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/samples"
              className="bg-primary-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Order Free Samples
            </Link>
            <Link
              href="/products"
              className="bg-white/90 backdrop-blur hover:bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
      <ConsultationContent />
    </Suspense>
  );
}