'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  KeyRound,
  FileText,
  Save,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface VendorProfile {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  businessDescription: string;
  taxId: string;
  businessLicense: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export default function VendorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await fetch('/api/vendor/profile');
        if (!response.ok) {
          throw new Error('Authentication required');
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching vendor profile:', error);
        router.push('/login?redirect=/vendor/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setUpdating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const validatePasswordChange = () => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    let isValid = true;

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordChange()) return;

    setUpdating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      setMessage({
        type: 'success',
        text: 'Password updated successfully!'
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update password. Please try again.'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="companyName"
                      value={profile.companyName}
                      onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactEmail">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="contactEmail"
                      type="email"
                      value={profile.contactEmail}
                      onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactPhone">Business Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="contactPhone"
                      value={profile.contactPhone}
                      onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="taxId"
                      value={profile.taxId}
                      onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={profile.businessDescription}
                  onChange={(e) => setProfile({ ...profile, businessDescription: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="addressLine1"
                        value={profile.address.addressLine1}
                        onChange={(e) => setProfile({
                          ...profile,
                          address: { ...profile.address, addressLine1: e.target.value }
                        })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={profile.address.addressLine2 || ''}
                      onChange={(e) => setProfile({
                        ...profile,
                        address: { ...profile.address, addressLine2: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.address.city}
                      onChange={(e) => setProfile({
                        ...profile,
                        address: { ...profile.address, city: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profile.address.state}
                      onChange={(e) => setProfile({
                        ...profile,
                        address: { ...profile.address, state: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={profile.address.postalCode}
                      onChange={(e) => setProfile({
                        ...profile,
                        address: { ...profile.address, postalCode: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.address.country}
                      onChange={(e) => setProfile({
                        ...profile,
                        address: { ...profile.address, country: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className={`pl-10 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                  />
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-500">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className={`pl-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                  />
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className={`pl-10 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 