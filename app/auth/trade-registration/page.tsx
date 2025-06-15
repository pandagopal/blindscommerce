'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface TradeApplicationData {
  // Business Information
  businessName: string;
  businessType: 'interior_designer' | 'contractor' | 'architect' | 'decorator' | 'retailer' | 'other';
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessPhone: string;
  businessEmail: string;
  website: string;
  
  // Professional Details
  licenseNumber: string;
  yearsInBusiness: number;
  portfolioLinks: string;
  references: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  
  // Trade Benefits Requested
  requestedDiscountLevel: 'TRADE_L1' | 'TRADE_L2';
  paymentTerms: 'net_15' | 'net_30' | 'net_45';
  creditLimit: number;
  
  // Supporting Documents
  businessLicense: File | null;
  insuranceCertificate: File | null;
  portfolioSamples: File | null;
}

const businessTypes = [
  { value: 'interior_designer', label: 'Interior Designer' },
  { value: 'contractor', label: 'General Contractor' },
  { value: 'architect', label: 'Architect' },
  { value: 'decorator', label: 'Decorator' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'other', label: 'Other' },
];

const discountLevels = [
  { value: 'TRADE_L1', label: 'Level 1 (10% discount)', description: 'For qualified professionals' },
  { value: 'TRADE_L2', label: 'Level 2 (15% discount)', description: 'For high-volume professionals' },
];

const paymentTermOptions = [
  { value: 'net_15', label: 'Net 15 days' },
  { value: 'net_30', label: 'Net 30 days' },
  { value: 'net_45', label: 'Net 45 days' },
];

export default function TradeRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<TradeApplicationData>({
    businessName: '',
    businessType: 'interior_designer',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    licenseNumber: '',
    yearsInBusiness: 1,
    portfolioLinks: '',
    references: '',
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    requestedDiscountLevel: 'TRADE_L1',
    paymentTerms: 'net_30',
    creditLimit: 5000,
    businessLicense: null,
    insuranceCertificate: null,
    portfolioSamples: null,
  });

  const handleInputChange = (field: keyof TradeApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: keyof TradeApplicationData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          submitData.append(key, value);
        } else if (value !== null && value !== undefined) {
          submitData.append(key, value.toString());
        }
      });

      const response = await fetch('/api/auth/trade-application', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Application Submitted!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Thank you for applying for a trade professional account. We'll review your application and contact you within 2-3 business days.
              </p>
              <div className="mt-6">
                <Link
                  href="/"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-red hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-primary-red hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Trade Professional Application</h1>
          <p className="mt-2 text-gray-600">
            Join our trade professional program to access exclusive pricing and benefits
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    stepNum <= step
                      ? 'bg-primary-red text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      stepNum < step ? 'bg-primary-red' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Business Info</span>
            <span>Professional Details</span>
            <span>Personal Info</span>
            <span>Documents</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* Step 1: Business Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Type *</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  >
                    {businessTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Business Address *</label>
                <input
                  type="text"
                  required
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessCity}
                    onChange={(e) => handleInputChange('businessCity', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessState}
                    onChange={(e) => handleInputChange('businessState', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessZip}
                    onChange={(e) => handleInputChange('businessZip', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                />
              </div>
            </div>
          )}

          {/* Step 2: Professional Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Professional Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Years in Business *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.yearsInBusiness}
                    onChange={(e) => handleInputChange('yearsInBusiness', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Portfolio Links</label>
                <textarea
                  rows={3}
                  value={formData.portfolioLinks}
                  onChange={(e) => handleInputChange('portfolioLinks', e.target.value)}
                  placeholder="Please provide links to your online portfolio or project galleries"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Professional References</label>
                <textarea
                  rows={4}
                  value={formData.references}
                  onChange={(e) => handleInputChange('references', e.target.value)}
                  placeholder="Please provide 2-3 professional references with contact information"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Requested Discount Level *</label>
                <div className="mt-2 space-y-3">
                  {discountLevels.map((level) => (
                    <div key={level.value} className="flex items-start">
                      <input
                        type="radio"
                        name="discountLevel"
                        value={level.value}
                        checked={formData.requestedDiscountLevel === level.value}
                        onChange={(e) => handleInputChange('requestedDiscountLevel', e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{level.label}</div>
                        <div className="text-sm text-gray-600">{level.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Personal Information */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Principal Designer, Project Manager, Owner"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Terms *</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  >
                    {paymentTermOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested Credit Limit</label>
                  <input
                    type="number"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={formData.creditLimit}
                    onChange={(e) => handleInputChange('creditLimit', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-red focus:border-primary-red"
                  />
                  <p className="mt-1 text-sm text-gray-500">Minimum $1,000, maximum $100,000</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Supporting Documents</h2>
              <p className="text-gray-600">
                Please upload the following documents to support your application:
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business License or Registration
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('businessLicense', e.target.files?.[0] || null)}
                      className="hidden"
                      id="businessLicense"
                    />
                    <label htmlFor="businessLicense" className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {formData.businessLicense ? formData.businessLicense.name : 'Click to upload business license'}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Certificate
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('insuranceCertificate', e.target.files?.[0] || null)}
                      className="hidden"
                      id="insuranceCertificate"
                    />
                    <label htmlFor="insuranceCertificate" className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {formData.insuranceCertificate ? formData.insuranceCertificate.name : 'Click to upload insurance certificate'}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio Samples (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('portfolioSamples', e.target.files?.[0] || null)}
                      className="hidden"
                      id="portfolioSamples"
                    />
                    <label htmlFor="portfolioSamples" className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {formData.portfolioSamples ? formData.portfolioSamples.name : 'Click to upload portfolio samples'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Application Review Process</p>
                    <p className="mt-1">
                      Applications are typically reviewed within 2-3 business days. You'll receive an email confirmation once your application has been approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(Math.min(4, step + 1))}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-red border border-transparent rounded-md hover:bg-primary-red-dark"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-red border border-transparent rounded-md hover:bg-primary-red-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}