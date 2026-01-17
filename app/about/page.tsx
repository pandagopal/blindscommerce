'use client';

import Link from 'next/link';
import { Award, Users, Home, Heart, Shield, Star, Clock, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  const milestones = [
    { year: '2010', event: 'Smart Blinds founded in Redmond, Washington' },
    { year: '2012', event: 'Opened first design center' },
    { year: '2015', event: 'Expanded to serve greater Washington City area' },
    { year: '2018', event: 'Launched premium motorized product line' },
    { year: '2020', event: 'Introduced virtual consultation services' },
    { year: '2023', event: 'Achieved 50,000+ satisfied customers' }
  ];

  const values = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: 'Customer First',
      description: 'Every decision we make puts our customers\' needs and satisfaction first.'
    },
    {
      icon: <Award className="h-8 w-8 text-yellow-500" />,
      title: 'Quality Excellence',
      description: 'We source and manufacture only the highest quality window treatments.'
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: 'Integrity',
      description: 'Honest pricing, transparent processes, and trustworthy service.'
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: 'Community',
      description: 'Supporting our local Washington community and giving back where we can.'
    }
  ];

  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      bio: 'With over 15 years in interior design, Sarah founded Smart Blinds to bring quality window treatments to Washington families.',
      image: '/images/team/sarah-johnson.jpg'
    },
    {
      name: 'Mike Chen',
      role: 'Lead Design Consultant',
      bio: 'Mike has helped over 5,000 customers find their perfect window treatments with his expert design eye.',
      image: '/images/team/mike-chen.jpg'
    },
    {
      name: 'Lisa Rodriguez',
      role: 'Installation Manager',
      bio: 'Lisa ensures every installation is perfect, leading our team of certified professional installers.',
      image: '/images/team/lisa-rodriguez.jpg'
    },
    {
      name: 'David Thompson',
      role: 'Customer Service Director',
      bio: 'David and his team provide exceptional support, maintaining our 98% customer satisfaction rating.',
      image: '/images/team/david-thompson.jpg'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Happy Customers' },
    { number: '15+', label: 'Years Experience' },
    { number: '98%', label: 'Satisfaction Rate' },
    { number: '8:00AM (PST) to 7:00PM (PST)', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-900 to-red-950 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              About Smart Blinds
            </h1>
            <p className="text-xl md:text-2xl mb-2 text-white/90">
              Premium Custom Window Treatments
            </p>
            <p className="text-lg mb-8 text-white/80 max-w-3xl mx-auto">
              For over a decade, we've been Washington's trusted partner for premium window treatments. 
              From our humble beginnings in Redmond to serving thousands of satisfied customers, 
              our commitment to quality and service remains unwavering.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            To transform homes across Washington with beautiful, functional window treatments while providing 
            exceptional customer service, expert installation, and products that enhance both comfort and style. 
            We believe every window deserves the perfect treatment, and every customer deserves the perfect experience.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-primary-red to-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Smart Blinds began in 2010 when founder Sarah Johnson recognized that Washington families 
                  deserved better options for window treatments. Frustrated by limited selections and 
                  poor service from national chains, she set out to create a local company that would 
                  prioritize quality products and exceptional customer care.
                </p>
                <p>
                  What started as a small operation in Redmond has grown into Washington's premier window 
                  treatment company. We've helped over 50,000 customers transform their homes with 
                  custom blinds, shades, and shutters that perfectly match their style and needs.
                </p>
                <p>
                  Today, we're proud to be a Washington-based business that supports our local community 
                  while providing the kind of personal service that national chains simply can't match. 
                  Every customer is family to us.
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Our Journey</h3>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                      {milestone.year.slice(-2)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{milestone.year}</div>
                      <div className="text-gray-600">{milestone.event}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  <div className="h-64 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    <span className="text-red-800 font-medium text-center px-4">{member.name}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Washington Chooses Smart Blinds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Home className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Local Expertise</h3>
              <p className="text-gray-600">
                Washington-based company with deep understanding of local styles, climate, and customer needs.
              </p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Only the finest materials and craftsmanship, backed by comprehensive warranties.
              </p>
            </div>
            <div className="text-center">
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Service</h3>
              <p className="text-gray-600">
                From consultation to installation, we handle every detail with expertise and care.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Involvement */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Community Commitment</h2>
          <p className="text-xl text-gray-600 mb-8">
            As a Washington business, we're committed to giving back to the communities that have supported us. 
            We partner with local charities, sponsor community events, and support Washington families in need.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Habitat for Humanity</h3>
              <p className="text-gray-600 text-sm">Donating window treatments for new homes</p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Local Schools</h3>
              <p className="text-gray-600 text-sm">Supporting education through fundraising events</p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Senior Centers</h3>
              <p className="text-gray-600 text-sm">Providing discounted services for seniors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Awards & Recognition */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Awards & Recognition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900">2023 Best of Washington</h3>
              <p className="text-gray-600 text-sm">Window Treatment Specialists</p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900">A+ BBB Rating</h3>
              <p className="text-gray-600 text-sm">Better Business Bureau</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900">Angie's List</h3>
              <p className="text-gray-600 text-sm">Super Service Award</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900">Customer Choice</h3>
              <p className="text-gray-600 text-sm">98% Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-red to-primary-dark text-white py-20">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Join the Smart Blinds Family?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Discover why over 50,000 Washington families have trusted us with their window treatment needs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/consultation"
              className="bg-primary-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Schedule Free Consultation
            </Link>
            <Link
              href="/contact"
              className="bg-white/90 backdrop-blur hover:bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Contact Us Today
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}