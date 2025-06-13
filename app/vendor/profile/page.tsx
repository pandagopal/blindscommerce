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
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface BusinessHour {
  id: number;
  day: string;
  open: string;
  close: string;
}

interface LegalDoc {
  id: number;
  name: string;
  url: string;
}

interface ShippingAddress {
  id: number;
  address: string;
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

  // Business Hours
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [hourForm, setHourForm] = useState<Partial<BusinessHour>>({ day: '', open: '', close: '' });
  const [editingHourId, setEditingHourId] = useState<number | null>(null);

  // Legal Docs
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [docForm, setDocForm] = useState<Partial<LegalDoc>>({ name: '', url: '' });
  const [editingDocId, setEditingDocId] = useState<number | null>(null);

  // Shipping Addresses
  const [shipping, setShipping] = useState<ShippingAddress[]>([]);
  const [shipForm, setShipForm] = useState<Partial<ShippingAddress>>({ address: '' });
  const [editingShipId, setEditingShipId] = useState<number | null>(null);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await fetch('/api/vendor/profile');
        if (!response.ok) {
          throw new Error('Authentication required');
        }
        const data = await response.json();
        // Use the profile data from the API response
        const profile = data.profile;
        // Ensure all fields have default values to prevent controlled/uncontrolled input issues
        const profileWithDefaults = {
          userId: profile.userId || 0,
          email: profile.email || '',
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          companyName: profile.businessName || '',
          contactEmail: profile.businessEmail || '',
          contactPhone: profile.businessPhone || '',
          businessDescription: profile.businessDescription || '',
          taxId: profile.taxId || '',
          businessLicense: '', // Not in current API
          address: {
            addressLine1: profile.address?.addressLine1 || '',
            addressLine2: profile.address?.addressLine2 || '',
            city: profile.address?.city || '',
            state: profile.address?.state || '',
            postalCode: profile.address?.postalCode || '',
            country: profile.address?.country || 'United States'
          }
        };
        setProfile(profileWithDefaults);
      } catch (error) {
        console.error('Error fetching vendor profile:', error);
        router.push('/login?redirect=/vendor/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = localStorage.getItem('vendor_hours');
      if (h) setHours(JSON.parse(h));
      const d = localStorage.getItem('vendor_docs');
      if (d) setDocs(JSON.parse(d));
      const s = localStorage.getItem('vendor_shipping');
      if (s) setShipping(JSON.parse(s));
    }
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('vendor_hours', JSON.stringify(hours)); }, [hours]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('vendor_docs', JSON.stringify(docs)); }, [docs]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('vendor_shipping', JSON.stringify(shipping)); }, [shipping]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setUpdating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          businessName: profile.companyName,
          businessEmail: profile.contactEmail,
          businessPhone: profile.contactPhone,
          businessDescription: profile.businessDescription,
          taxId: profile.taxId,
          address: profile.address
        })
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

  // Handlers for business hours
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => setHourForm({ ...hourForm, [e.target.name]: e.target.value });
  const handleHourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hourForm.day || !hourForm.open || !hourForm.close) return;
    if (editingHourId) {
      setHours((prev) => prev.map((h) => h.id === editingHourId ? { ...h, ...hourForm } as BusinessHour : h));
      setEditingHourId(null);
    } else {
      setHours((prev) => [...prev, { ...hourForm, id: Date.now() } as BusinessHour]);
    }
    setHourForm({ day: '', open: '', close: '' });
  };
  const handleHourEdit = (id: number) => { const h = hours.find((h) => h.id === id); if (h) { setHourForm(h); setEditingHourId(id); } };
  const handleHourDelete = (id: number) => { setHours((prev) => prev.filter((h) => h.id !== id)); if (editingHourId === id) { setHourForm({ day: '', open: '', close: '' }); setEditingHourId(null); } };

  // Handlers for legal docs
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => setDocForm({ ...docForm, [e.target.name]: e.target.value });
  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name || !docForm.url) return;
    if (editingDocId) {
      setDocs((prev) => prev.map((d) => d.id === editingDocId ? { ...d, ...docForm } as LegalDoc : d));
      setEditingDocId(null);
    } else {
      setDocs((prev) => [...prev, { ...docForm, id: Date.now() } as LegalDoc]);
    }
    setDocForm({ name: '', url: '' });
  };
  const handleDocEdit = (id: number) => { const d = docs.find((d) => d.id === id); if (d) { setDocForm(d); setEditingDocId(id); } };
  const handleDocDelete = (id: number) => { setDocs((prev) => prev.filter((d) => d.id !== id)); if (editingDocId === id) { setDocForm({ name: '', url: '' }); setEditingDocId(null); } };

  // Handlers for shipping addresses
  const handleShipChange = (e: React.ChangeEvent<HTMLInputElement>) => setShipForm({ ...shipForm, [e.target.name]: e.target.value });
  const handleShipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipForm.address) return;
    if (editingShipId) {
      setShipping((prev) => prev.map((s) => s.id === editingShipId ? { ...s, ...shipForm } as ShippingAddress : s));
      setEditingShipId(null);
    } else {
      setShipping((prev) => [...prev, { ...shipForm, id: Date.now() } as ShippingAddress]);
    }
    setShipForm({ address: '' });
  };
  const handleShipEdit = (id: number) => { const s = shipping.find((s) => s.id === id); if (s) { setShipForm(s); setEditingShipId(id); } };
  const handleShipDelete = (id: number) => { setShipping((prev) => prev.filter((s) => s.id !== id)); if (editingShipId === id) { setShipForm({ address: '' }); setEditingShipId(null); } };

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
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="settings">Business Settings</TabsTrigger>
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
                      value={profile.address.addressLine2}
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

              <Button 
                type="submit" 
                disabled={updating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
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

              <Button 
                type="submit" 
                disabled={updating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
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

              <Button 
                type="submit" 
                disabled={updating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
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

        <TabsContent value="settings" className="space-y-6">
          {/* Business Hours */}
          <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Business Hours</h2>
        <form onSubmit={handleHourSubmit} className="flex gap-2 mb-4 flex-wrap">
          <input name="day" value={hourForm.day || ''} onChange={handleHourChange} placeholder="Day" className="border p-2 rounded" required />
          <input name="open" value={hourForm.open || ''} onChange={handleHourChange} placeholder="Open (e.g. 09:00)" className="border p-2 rounded" required />
          <input name="close" value={hourForm.close || ''} onChange={handleHourChange} placeholder="Close (e.g. 17:00)" className="border p-2 rounded" required />
          <button type="submit" className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark">{editingHourId ? 'Update' : 'Add'}</button>
          {editingHourId && <button type="button" onClick={() => { setHourForm({ day: '', open: '', close: '' }); setEditingHourId(null); }} className="text-gray-600 underline ml-2">Cancel</button>}
        </form>
        {hours.length === 0 ? <p className="text-gray-600">No business hours set.</p> : (
          <ul className="space-y-2">
            {hours.map((h) => (
              <li key={h.id} className="flex gap-4 items-center">
                <span className="font-medium w-24">{h.day}</span>
                <span>{h.open} - {h.close}</span>
                <button onClick={() => handleHourEdit(h.id)} className="text-blue-600 hover:underline ml-2">Edit</button>
                <button onClick={() => handleHourDelete(h.id)} className="text-red-600 hover:underline ml-2">Delete</button>
              </li>
            ))}
          </ul>
        )}
          </section>

          {/* Legal Documents */}
          <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Legal Documents</h2>
        <form onSubmit={handleDocSubmit} className="flex gap-2 mb-4 flex-wrap">
          <input name="name" value={docForm.name || ''} onChange={handleDocChange} placeholder="Document Name" className="border p-2 rounded" required />
          <input name="url" value={docForm.url || ''} onChange={handleDocChange} placeholder="URL" className="border p-2 rounded" required />
          <button type="submit" className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark">{editingDocId ? 'Update' : 'Add'}</button>
          {editingDocId && <button type="button" onClick={() => { setDocForm({ name: '', url: '' }); setEditingDocId(null); }} className="text-gray-600 underline ml-2">Cancel</button>}
        </form>
        {docs.length === 0 ? <p className="text-gray-600">No legal documents uploaded.</p> : (
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="flex gap-4 items-center">
                <span className="font-medium w-48">{d.name}</span>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary-red hover:underline">View</a>
                <button onClick={() => handleDocEdit(d.id)} className="text-blue-600 hover:underline ml-2">Edit</button>
                <button onClick={() => handleDocDelete(d.id)} className="text-red-600 hover:underline ml-2">Delete</button>
              </li>
            ))}
          </ul>
        )}
          </section>

          {/* Shipping Addresses */}
          <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Shipping Addresses</h2>
        <form onSubmit={handleShipSubmit} className="flex gap-2 mb-4 flex-wrap">
          <input name="address" value={shipForm.address || ''} onChange={handleShipChange} placeholder="Address" className="border p-2 rounded w-96" required />
          <button type="submit" className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark">{editingShipId ? 'Update' : 'Add'}</button>
          {editingShipId && <button type="button" onClick={() => { setShipForm({ address: '' }); setEditingShipId(null); }} className="text-gray-600 underline ml-2">Cancel</button>}
        </form>
        {shipping.length === 0 ? <p className="text-gray-600">No shipping addresses set.</p> : (
          <ul className="space-y-2">
            {shipping.map((s) => (
              <li key={s.id} className="flex gap-4 items-center">
                <span className="font-medium w-96">{s.address}</span>
                <button onClick={() => handleShipEdit(s.id)} className="text-blue-600 hover:underline ml-2">Edit</button>
                <button onClick={() => handleShipDelete(s.id)} className="text-red-600 hover:underline ml-2">Delete</button>
              </li>
            ))}
          </ul>
        )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
} 