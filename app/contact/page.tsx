'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageSquare, CheckCircle, Headphones, Home } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    setSubmitted(true);
  };

  const inquiryTypes = [
    'General Information',
    'Schedule Consultation',
    'Order Status',
    'Warranty Claim',
    'Installation Support',
    'Product Question',
    'Billing Question',
    'Other'
  ];

  const contactMethods = [
    {
      icon: <Phone className="h-8 w-8 text-blue-600" />,
      title: 'Phone Support',
      description: 'Speak with our experts',
      contact: '(316) 530-2635',
      hours: 'Mon-Fri: 8AM-6PM CST\nSat: 9AM-4PM CST',
      action: 'tel:+1-316-530-2635',
      actionText: 'Call Now'
    },
    {
      icon: <Mail className="h-8 w-8 text-green-600" />,
      title: 'Email Support',
      description: 'Send us your questions',
      contact: 'support@smartblinds.com',
      hours: 'Response within 24 hours',
      action: 'mailto:support@smartblinds.com',
      actionText: 'Send Email'
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary-red" />,
      title: 'Live Chat',
      description: 'Chat with us online',
      contact: 'Available on website',
      hours: 'Mon-Fri: 8AM-6PM CST',
      action: '#',
      actionText: 'Start Chat'
    }
  ];

  const locations = [
    {
      name: 'Smart Blinds Headquarters',
      address: '1234 Window Way\nRedmond, KS 67202',
      phone: '(316) 530-2635',
      hours: 'Mon-Fri: 8AM-6PM\nSat: 9AM-4PM\nSun: Closed'
    },
    {
      name: 'Design Center',
      address: '5678 Shade Street\nOverland Park, KS 66210',
      phone: '(913) 555-0123',
      hours: 'Mon-Fri: 9AM-7PM\nSat: 9AM-5PM\nSun: 12PM-4PM'
    }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Message Sent!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for contacting Smart Blinds. We'll respond to your inquiry within 24 hours.
          </p>
          <div className="space-y-3">
            <Link
              href="/consultation"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors block"
            >
              Schedule Consultation
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
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Contact Smart Blinds
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
              We're here to help with all your window treatment needs. Get in touch with our expert team 
              for consultations, support, or any questions about our products and services.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <Headphones className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Expert Support</h3>
                <p className="text-blue-100">Knowledgeable team ready to assist you</p>
              </div>
              <div className="text-center">
                <Clock className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Quick Response</h3>
                <p className="text-blue-100">Fast replies to all inquiries</p>
              </div>
              <div className="text-center">
                <Home className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Local Service</h3>
                <p className="text-blue-100">Serving Washington and surrounding areas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Get In Touch
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the contact method that works best for you. Our team is standing by to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                {method.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{method.title}</h3>
              <p className="text-gray-600 mb-4">{method.description}</p>
              <div className="mb-4">
                <div className="font-semibold text-gray-900">{method.contact}</div>
                <div className="text-sm text-gray-500 whitespace-pre-line">{method.hours}</div>
              </div>
              <a
                href={method.action}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors inline-block"
              >
                {method.actionText}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-red to-primary-dark text-white p-6">
              <h2 className="text-2xl font-bold mb-2">Send Us a Message</h2>
              <p className="text-blue-100">Fill out the form below and we'll get back to you soon.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Inquiry Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Type</label>
                  <select
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select inquiry type</option>
                    {inquiryTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us how we can help you..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Visit Our Locations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {locations.map((location, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start mb-4">
                  <MapPin className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
                    <p className="text-gray-600 whitespace-pre-line mb-2">{location.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center mb-2">
                      <Phone className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="font-medium">{location.phone}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 whitespace-pre-line">{location.hours}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What are your business hours?</h3>
              <p className="text-gray-600">Our main office is open Monday-Friday 8AM-6PM CST, Saturday 9AM-4PM CST. Our design center has extended hours including Sunday. Phone support is available during business hours.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer free consultations?</h3>
              <p className="text-gray-600">Yes! We offer free in-home consultations where our experts will measure your windows and provide personalized recommendations. Schedule yours today.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What areas do you serve?</h3>
              <p className="text-gray-600">We primarily serve Washington and the greater Washington City metropolitan area. Contact us to confirm service availability in your specific location.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How quickly can you respond to my inquiry?</h3>
              <p className="text-gray-600">We respond to phone calls immediately during business hours. Email inquiries are typically answered within 24 hours, often much sooner.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-red to-primary-dark text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Contact us today for your free consultation and discover why Smart Blinds is the right choice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/consultation"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Schedule Free Consultation
            </Link>
            <Link
              href="/samples"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Order Free Samples
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}