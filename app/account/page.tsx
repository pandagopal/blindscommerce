'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserCircle, KeyRound, MapPin, ShoppingBag, Ruler,
  BookmarkIcon, Save, AlertTriangle, CheckCircle2
} from 'lucide-react';

interface UserProfile {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Address {
  addressId: number;
  addressType: string;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminViewUserId = searchParams.get('admin_view');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [viewedCustomer, setViewedCustomer] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
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
    // Fetch user profile
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Authentication required');
        }
        const userData = await response.json();

        // Check if admin is viewing another user's dashboard
        if (adminViewUserId && userData.role === 'admin') {
          setIsAdminView(true);
          setUser({
            userId: userData.userId,
            email: userData.email,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || ''
          }); // Keep admin user for permissions
          
          // Store AdminViewId in session
          sessionStorage.setItem('AdminViewId', adminViewUserId);
          
          // Fetch the customer being viewed
          const customerRes = await fetch(`/api/admin/users/${adminViewUserId}`);
          if (customerRes.ok) {
            const customerData = await customerRes.json();
            if (customerData.user.role !== 'customer') {
              alert('Selected user is not a customer');
              router.push('/admin/users');
              return;
            }
            setViewedCustomer({
              userId: customerData.user.user_id,
              email: customerData.user.email,
              firstName: customerData.user.first_name || '',
              lastName: customerData.user.last_name || '',
              phone: customerData.user.phone || ''
            });
          } else {
            alert('Failed to fetch customer information');
            router.push('/admin/users');
            return;
          }
        } else {
          // Format the data to match our interface
          setUser({
            userId: userData.userId,
            email: userData.email,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || ''
          });
          setViewedCustomer({
            userId: userData.userId,
            email: userData.email,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || ''
          });
          // Clear admin view session if not in admin mode
          sessionStorage.removeItem('AdminViewId');
        }

        // We would also fetch addresses in a real application
        // Mock addresses for now
        setAddresses([
          {
            addressId: 1,
            addressType: 'shipping',
            isDefault: true,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            addressLine1: '123 Main St',
            city: 'Seattle',
            state: 'WA',
            postalCode: '98101',
            country: 'United States',
            phone: userData.phone || ''
          },
          {
            addressId: 2,
            addressType: 'billing',
            isDefault: true,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            addressLine1: '123 Main St',
            city: 'Seattle',
            state: 'WA',
            postalCode: '98101',
            country: 'United States'
          }
        ]);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Redirect to login if not authenticated
        router.push('/login?redirect=/account');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    setMessage(null);

    try {
      // In a real application, send update to the API
      // const response = await fetch('/api/account/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(user)
      // });

      // Mock successful update
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });

      // Clear message after a delay
      setTimeout(() => {
        setMessage(null);
      }, 5000);
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

    if (!validatePasswordChange()) {
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      // In a real application, send update to the API
      // const response = await fetch('/api/account/password', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     currentPassword: passwordForm.currentPassword,
      //     newPassword: passwordForm.newPassword
      //   })
      // });

      // Mock successful update
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

      setMessage({
        type: 'success',
        text: 'Password updated successfully!'
      });

      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Clear message after a delay
      setTimeout(() => {
        setMessage(null);
      }, 5000);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center">
            <UserCircle className="mr-2 h-5 w-5" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5" />
            <span>Password</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            <span>Addresses</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="measurements" className="flex items-center">
            <Ruler className="mr-2 h-5 w-5" />
            <span>Measurements</span>
          </TabsTrigger>
          <TabsTrigger value="configurations" className="flex items-center">
            <BookmarkIcon className="mr-2 h-5 w-5" />
            <span>Saved Configs</span>
          </TabsTrigger>
        </TabsList>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <TabsContent value="profile" className="pt-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

            {user && (
              <form onSubmit={handleUserUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={user.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUser({ ...user, firstName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={user.lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUser({ ...user, lastName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUser({ ...user, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={user.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUser({ ...user, phone: e.target.value })}
                      className="mt-1"
                      placeholder="(xxx) xxx-xxxx"
                    />
                  </div>
                </div>

                <Button type="submit" className="flex items-center" disabled={updating}>
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </TabsContent>

        <TabsContent value="password" className="pt-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>

            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className={`mt-1 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className={`mt-1 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className={`mt-1 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="flex items-center" disabled={updating}>
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="addresses" className="pt-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Addresses</h2>
              <Button className="bg-primary-red hover:bg-primary-red-dark">
                Add New Address
              </Button>
            </div>

            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map(address => (
                  <div key={address.addressId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <h3 className="font-medium">
                          {address.addressType.charAt(0).toUpperCase() + address.addressType.slice(1)} Address
                        </h3>
                        {address.isDefault && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                        <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                      <p>{address.firstName} {address.lastName}</p>
                      {address.company && <p>{address.company}</p>}
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>{address.city}, {address.state} {address.postalCode}</p>
                      <p>{address.country}</p>
                      {address.phone && <p>{address.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No addresses found</h3>
                <p className="text-gray-500 mb-4">You haven't added any addresses yet.</p>
                <Button className="bg-primary-red hover:bg-primary-red-dark">
                  Add Your First Address
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="pt-4">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">My Orders</h2>
              <p className="text-gray-500">View and track your order history</p>
            </div>

            <div className="p-6 text-center">
              <Link href="/account/orders" className="text-blue-600 hover:underline">
                Go to Orders Page
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="measurements" className="pt-4">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">My Measurements</h2>
              <p className="text-gray-500">View and manage your window measurements</p>
            </div>

            <div className="p-6 text-center">
              <Link href="/account/measurements" className="text-blue-600 hover:underline">
                Go to Measurements Page
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="configurations" className="pt-4">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Saved Configurations</h2>
              <p className="text-gray-500">View and reuse your saved product configurations</p>
            </div>

            <div className="p-6 text-center">
              <Link href="/account/configurations" className="text-blue-600 hover:underline">
                Go to Saved Configurations Page
              </Link>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
