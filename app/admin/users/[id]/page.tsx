'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  Calendar,
  Building2,
  MapPin,
  Award,
  DollarSign
} from 'lucide-react';

interface UserDetails {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
  vendor_info: {
    business_name: string;
    business_email: string;
    business_phone: string;
    approval_status: string;
    is_verified: boolean;
    is_active: boolean;
  } | null;
  sales_info: {
    territory: string;
    commission_rate: number;
    is_active: boolean;
  } | null;
  installer_info: {
    certification_number: string;
    service_area: string;
    is_active: boolean;
  } | null;
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${params.id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch user');
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="mt-4 text-primary-red hover:text-red-900"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="mt-4 text-primary-red hover:text-red-900"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="font-medium">Name</div>
                  <div className="text-gray-600">
                    {user.first_name} {user.last_name}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-gray-600">{user.email}</div>
                </div>
                <div>
                  <div className="font-medium">Phone</div>
                  <div className="text-gray-600">{user.phone || 'Not provided'}</div>
                </div>
                <div>
                  <div className="font-medium">Role</div>
                  <div className="text-gray-600 capitalize">{user.role}</div>
                </div>
                <div>
                  <div className="font-medium">Status</div>
                  <div className="text-gray-600">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="font-medium">Last Login</div>
                  <div className="text-gray-600">{formatDate(user.last_login)}</div>
                </div>
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-gray-600">{formatDate(user.created_at)}</div>
                </div>
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-gray-600">{formatDate(user.updated_at)}</div>
                </div>
                <div>
                  <div className="font-medium">Verification Status</div>
                  <div className="text-gray-600">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_verified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role-specific Information */}
          {user.role === 'vendor' && user.vendor_info && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Vendor Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium">Business Name</div>
                  <div className="text-gray-600">{user.vendor_info.business_name}</div>
                </div>
                <div>
                  <div className="font-medium">Business Email</div>
                  <div className="text-gray-600">{user.vendor_info.business_email}</div>
                </div>
                <div>
                  <div className="font-medium">Business Phone</div>
                  <div className="text-gray-600">{user.vendor_info.business_phone}</div>
                </div>
                <div>
                  <div className="font-medium">Approval Status</div>
                  <div className="text-gray-600 capitalize">{user.vendor_info.approval_status}</div>
                </div>
              </div>
            </div>
          )}

          {user.role === 'sales' && user.sales_info && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Sales Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium">Territory</div>
                  <div className="text-gray-600">{user.sales_info.territory}</div>
                </div>
                <div>
                  <div className="font-medium">Commission Rate</div>
                  <div className="text-gray-600">{user.sales_info.commission_rate}%</div>
                </div>
              </div>
            </div>
          )}

          {user.role === 'installer' && user.installer_info && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Installer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium">Certification Number</div>
                  <div className="text-gray-600">{user.installer_info.certification_number}</div>
                </div>
                <div>
                  <div className="font-medium">Service Area</div>
                  <div className="text-gray-600">{user.installer_info.service_area}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-4">
            <Link
              href={`/admin/users/${user.user_id}/edit`}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-primary-dark"
            >
              Edit User
            </Link>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 