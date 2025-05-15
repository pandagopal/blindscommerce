'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';

interface VendorData {
  vendor_info_id: number;
  user_id: number;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  tax_id: string;
  business_license: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function VendorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch(`/api/admin/vendors/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch vendor data');
        }
        const data = await response.json();
        setVendor(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/vendors/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete vendor');
      }

      router.push('/admin/vendors');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const toggleStatus = async () => {
    if (!vendor) return;

    try {
      const response = await fetch(`/api/admin/vendors/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !vendor.is_active
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update vendor status');
      }

      setVendor(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        Vendor not found
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{vendor.company_name}</h1>
          <p className="text-gray-500">Vendor Details</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleStatus}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              vendor.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {vendor.is_active ? 'Active' : 'Inactive'}
          </button>
          <Link
            href={`/admin/vendors/${vendor.vendor_info_id}/edit`}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Company Information</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <Building2 className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Company Name</div>
                <div className="text-gray-600">{vendor.company_name}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Business Email</div>
                <div className="text-gray-600">{vendor.contact_email}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Business Phone</div>
                <div className="text-gray-600">{vendor.contact_phone || 'Not provided'}</div>
              </div>
            </div>
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Tax ID</div>
                <div className="text-gray-600">{vendor.tax_id || 'Not provided'}</div>
              </div>
            </div>
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Business License</div>
                <div className="text-gray-600">{vendor.business_license || 'Not provided'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Contact Person</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Name</div>
                <div className="text-gray-600">
                  {vendor.user.first_name} {vendor.user.last_name}
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-gray-600">{vendor.user.email}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Address</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Business Address</div>
                <div className="text-gray-600">
                  {vendor.address}
                  <br />
                  {vendor.city}, {vendor.state} {vendor.zip_code}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Account Details</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Created</div>
                <div className="text-gray-600">{formatDate(vendor.created_at)}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <div className="font-medium">Last Updated</div>
                <div className="text-gray-600">{formatDate(vendor.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 