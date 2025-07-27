'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building, Users, Shield, Clock, Award, Phone, CheckCircle, Calculator, FileText } from 'lucide-react';

export default function CommercialPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    projectType: '',
    timeline: '',
    budget: '',
    description: ''
  });

  const commercialServices = [
    {
      icon: <Building className="h-8 w-8 text-blue-600" />,
      title: 'Office Buildings',
      description: 'Professional window treatments for corporate environments',
      features: ['Energy efficiency', 'Professional appearance', 'Easy maintenance', 'Motorized options']
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: 'Healthcare Facilities',
      description: 'Specialized treatments for hospitals and medical offices',
      features: ['Antimicrobial materials', 'Easy to sanitize', 'Privacy control', 'Light management']
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: 'Educational Institutions',
      description: 'Durable solutions for schools and universities',
      features: ['Child safety features', 'Vandal resistant', 'Classroom darkening', 'Budget-friendly']
    },
    {
      icon: <Award className="h-8 w-8 text-orange-600" />,
      title: 'Hospitality',
      description: 'Elegant treatments for hotels and restaurants',
      features: ['Custom designs', 'Brand coordination', 'Guest comfort', 'Maintenance support']
    }
  ];

  const projectTypes = [
    'Office Building',
    'Medical Facility',
    'School/University',
    'Hotel/Restaurant',
    'Retail Store',
    'Government Building',
    'Manufacturing Facility',
    'Other'
  ];

  const timelines = [
    'Immediate (1-2 weeks)',
    'Soon (1-2 months)',
    'Planned (3-6 months)',
    'Future (6+ months)'
  ];

  const budgetRanges = [
    'Under $5,000',
    '$5,000 - $15,000',
    '$15,000 - $50,000',
    '$50,000 - $100,000',
    '$100,000+'
  ];

  const benefits = [
    {
      icon: <Calculator className="h-8 w-8 text-blue-600" />,
      title: 'Volume Pricing',
      description: 'Competitive rates for large projects and bulk orders'
    },
    {
      icon: <Clock className="h-8 w-8 text-green-600" />,
      title: 'Project Management',
      description: 'Dedicated team to manage timelines and installation'
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: 'Commercial Warranty',
      description: 'Extended warranty coverage for commercial applications'
    },
    {
      icon: <FileText className="h-8 w-8 text-orange-600" />,
      title: 'Specification Support',
      description: 'Technical documentation and specification assistance'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Commercial inquiry submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Commercial Window Solutions
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Transform your commercial space with professional-grade window treatments. 
              From office buildings to healthcare facilities, we deliver quality solutions 
              that enhance productivity, comfort, and energy efficiency.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <Building className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Professional Installation</h3>
                <p className="text-blue-100">Certified commercial installers and project managers</p>
              </div>
              <div className="text-center">
                <Clock className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">On-Time Delivery</h3>
                <p className="text-blue-100">Meeting deadlines with efficient project management</p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Commercial Grade</h3>
                <p className="text-blue-100">Durable materials designed for heavy commercial use</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Commercial Applications
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We specialize in window treatments for various commercial environments, 
            each with unique requirements and regulations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {commercialServices.map((service, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                {service.icon}
                <h3 className="text-xl font-bold text-gray-900 ml-3">{service.title}</h3>
              </div>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="grid grid-cols-2 gap-2">
                {service.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Smart Blinds for Commercial Projects?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Showcase */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Commercial Product Solutions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center">
                <span className="text-blue-800 font-medium">Motorized Solar Shades</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Solar Shades</h3>
                <p className="text-gray-600 mb-4">
                  Reduce glare and heat while maintaining outdoor views. Perfect for office buildings and reception areas.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• UV protection</li>
                  <li>• Energy efficiency</li>
                  <li>• Motorized options</li>
                  <li>• Various openness factors</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-green-200 to-teal-300 flex items-center justify-center">
                <span className="text-green-800 font-medium">Cellular Shades</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cellular Shades</h3>
                <p className="text-gray-600 mb-4">
                  Maximum energy efficiency with excellent insulation properties. Ideal for healthcare and educational facilities.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Superior insulation</li>
                  <li>• Sound absorption</li>
                  <li>• Blackout options</li>
                  <li>• Easy maintenance</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
                <span className="text-amber-800 font-medium">Commercial Blinds</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Vertical & Horizontal Blinds</h3>
                <p className="text-gray-600 mb-4">
                  Durable aluminum and vinyl blinds designed for high-traffic commercial environments.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Heavy-duty construction</li>
                  <li>• Easy to clean</li>
                  <li>• Precise light control</li>
                  <li>• Multiple colors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Request Form */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-blue-800 text-white p-6">
              <h2 className="text-2xl font-bold mb-2">Request Commercial Quote</h2>
              <p className="text-gray-200">Tell us about your project and we'll provide a detailed proposal.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      name="contactName"
                      required
                      value={formData.contactName}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select project type</option>
                      {projectTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                    <select
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select timeline</option>
                      {timelines.map(timeline => (
                        <option key={timeline} value={timeline}>{timeline}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select budget range</option>
                      {budgetRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please describe your project requirements, number of windows, specific needs, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Request Quote
                </button>
                <a
                  href="tel:+1-316-530-2635"
                  className="flex items-center justify-center border border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call (316) 530-2635
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Commercial Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Consultation</h3>
              <p className="text-gray-600">Site visit and needs assessment</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Proposal</h3>
              <p className="text-gray-600">Detailed quote and specifications</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Manufacturing</h3>
              <p className="text-gray-600">Custom production and quality control</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Installation</h3>
              <p className="text-gray-600">Professional installation and testing</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-gray-800 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Enhance Your Commercial Space?
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Contact our commercial team today for a free consultation and detailed proposal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+1-316-530-2635"
              className="bg-white text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <Phone className="h-5 w-5 mr-2" />
              Call Commercial Team
            </a>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-800 transition-colors"
            >
              Send Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}