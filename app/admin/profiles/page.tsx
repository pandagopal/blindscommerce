'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Phone, Mail, MapPin, Globe, Building } from 'lucide-react';

interface CompanyProfile {
  companyName: string;
  emergencyHotline: string;
  customerService: string;
  salesPhone: string;
  techSupport: string;
  mainEmail: string;
  salesEmail: string;
  supportEmail: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  website: string;
  businessHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  description: string;
  tagline: string;
}

export default function AdminProfilesPage() {
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: 'Smart Blinds Hub',
    emergencyHotline: '1-800-BLINDS',
    customerService: '1-800-555-0123',
    salesPhone: '1-800-555-0124',
    techSupport: '1-800-555-0125',
    mainEmail: 'info@smartblindshub.com',
    salesEmail: 'sales@smartblindshub.com',
    supportEmail: 'support@smartblindshub.com',
    address: {
      street: '123 Business Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States'
    },
    website: 'https://smartblindshub.com',
    businessHours: {
      weekdays: '9:00 AM - 6:00 PM EST',
      saturday: '10:00 AM - 4:00 PM EST',
      sunday: 'Closed'
    },
    socialMedia: {
      facebook: 'https://facebook.com/smartblindshub',
      twitter: 'https://twitter.com/smartblindshub',
      instagram: 'https://instagram.com/smartblindshub',
      linkedin: 'https://linkedin.com/company/smartblindshub'
    },
    description: 'Premium window treatments and smart blind solutions for homes and businesses.',
    tagline: 'Transform Your Space with Smart Window Solutions'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/admin/company-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // Merge loaded data with default structure to ensure all nested objects exist
          setProfile(prev => ({
            ...prev,
            ...data.profile,
            address: {
              ...prev.address,
              ...(data.profile.address || {})
            },
            businessHours: {
              ...prev.businessHours,
              ...(data.profile.businessHours || {})
            },
            socialMedia: {
              ...prev.socialMedia,
              ...(data.profile.socialMedia || {})
            }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/company-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Company profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (path: string, value: string) => {
    setProfile(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your company information, contact details, and business settings
        </p>
      </div>

      {message && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="social">Social & Web</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Company Information</span>
              </CardTitle>
              <CardDescription>
                Basic company details and branding information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={profile.companyName}
                    onChange={(e) => updateProfile('companyName', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => updateProfile('website', e.target.value)}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Company Tagline</Label>
                <Input
                  id="tagline"
                  value={profile.tagline}
                  onChange={(e) => updateProfile('tagline', e.target.value)}
                  placeholder="Your company's tagline or slogan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => updateProfile('description', e.target.value)}
                  placeholder="Brief description of your company and services"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Phone Numbers</span>
              </CardTitle>
              <CardDescription>
                Configure all customer-facing phone numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyHotline">Emergency Hotline</Label>
                  <Input
                    id="emergencyHotline"
                    value={profile.emergencyHotline}
                    onChange={(e) => updateProfile('emergencyHotline', e.target.value)}
                    placeholder="1-800-BLINDS"
                  />
                  <p className="text-xs text-gray-500">Main customer support line</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerService">Customer Service</Label>
                  <Input
                    id="customerService"
                    value={profile.customerService}
                    onChange={(e) => updateProfile('customerService', e.target.value)}
                    placeholder="1-800-555-0123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesPhone">Sales Phone</Label>
                  <Input
                    id="salesPhone"
                    value={profile.salesPhone}
                    onChange={(e) => updateProfile('salesPhone', e.target.value)}
                    placeholder="1-800-555-0124"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="techSupport">Technical Support</Label>
                  <Input
                    id="techSupport"
                    value={profile.techSupport}
                    onChange={(e) => updateProfile('techSupport', e.target.value)}
                    placeholder="1-800-555-0125"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Addresses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mainEmail">Main Email</Label>
                  <Input
                    id="mainEmail"
                    type="email"
                    value={profile.mainEmail}
                    onChange={(e) => updateProfile('mainEmail', e.target.value)}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesEmail">Sales Email</Label>
                  <Input
                    id="salesEmail"
                    type="email"
                    value={profile.salesEmail}
                    onChange={(e) => updateProfile('salesEmail', e.target.value)}
                    placeholder="sales@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={profile.supportEmail}
                    onChange={(e) => updateProfile('supportEmail', e.target.value)}
                    placeholder="support@company.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Business Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={profile.address?.street || ''}
                  onChange={(e) => updateProfile('address.street', e.target.value)}
                  placeholder="123 Business Avenue"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.address?.city || ''}
                    onChange={(e) => updateProfile('address.city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.address?.state || ''}
                    onChange={(e) => updateProfile('address.state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={profile.address?.zipCode || ''}
                    onChange={(e) => updateProfile('address.zipCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your operating hours for customer reference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weekdays">Weekdays (Mon-Fri)</Label>
                <Input
                  id="weekdays"
                  value={profile.businessHours?.weekdays || ''}
                  onChange={(e) => updateProfile('businessHours.weekdays', e.target.value)}
                  placeholder="9:00 AM - 6:00 PM EST"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saturday">Saturday</Label>
                <Input
                  id="saturday"
                  value={profile.businessHours?.saturday || ''}
                  onChange={(e) => updateProfile('businessHours.saturday', e.target.value)}
                  placeholder="10:00 AM - 4:00 PM EST"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sunday">Sunday</Label>
                <Input
                  id="sunday"
                  value={profile.businessHours?.sunday || ''}
                  onChange={(e) => updateProfile('businessHours.sunday', e.target.value)}
                  placeholder="Closed"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Social Media Links</span>
              </CardTitle>
              <CardDescription>
                Configure your social media presence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={profile.socialMedia?.facebook || ''}
                    onChange={(e) => updateProfile('socialMedia.facebook', e.target.value)}
                    placeholder="https://facebook.com/yourcompany"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={profile.socialMedia?.twitter || ''}
                    onChange={(e) => updateProfile('socialMedia.twitter', e.target.value)}
                    placeholder="https://twitter.com/yourcompany"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={profile.socialMedia?.instagram || ''}
                    onChange={(e) => updateProfile('socialMedia.instagram', e.target.value)}
                    placeholder="https://instagram.com/yourcompany"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={profile.socialMedia?.linkedin || ''}
                    onChange={(e) => updateProfile('socialMedia.linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={saveProfile}
          disabled={loading}
          className="bg-primary-red hover:bg-red-700"
        >
          {loading ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}