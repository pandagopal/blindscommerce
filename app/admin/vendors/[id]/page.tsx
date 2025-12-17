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
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface VendorDetails {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  isVerified: boolean;
  approvalStatus: string;
  totalSales: number;
  rating: number;
  createdAt: string;
}

export default function VendorDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch(`/api/admin/vendors/${params.id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch vendor');
        }
        const data = await response.json();
        setVendor(data);
      } catch (err) {
        console.error('Error fetching vendor:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vendor');
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
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
            onClick={() => router.push('/admin/vendors')}
            className="mt-4 text-primary-red hover:text-red-900"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Vendor not found</p>
          <button
            onClick={() => router.push('/admin/vendors')}
            className="mt-4 text-primary-red hover:text-red-900"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/admin/vendors')}
          className="text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Vendor Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="font-medium">Name</div>
                  <div className="text-gray-600">
                    {vendor.firstName} {vendor.lastName}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-gray-600">{vendor.email}</div>
                </div>
                <div>
                  <div className="font-medium">Phone</div>
                  <div className="text-gray-600">{vendor.contactPhone || 'Not provided'}</div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="font-medium">Company Name</div>
                  <div className="text-gray-600">{vendor.companyName}</div>
                </div>
                <div>
                  <div className="font-medium">Business Email</div>
                  <div className="text-gray-600">{vendor.contactEmail}</div>
                </div>
                <div>
                  <div className="font-medium">Status</div>
                  <div className="text-gray-600">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vendor.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vendor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Total Sales</div>
                <div className="text-2xl font-semibold">
                  ${vendor.totalSales.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Rating</div>
                <div className="text-2xl font-semibold">
                  {vendor.rating.toFixed(1)} / 5.0
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Member Since</div>
                <div className="text-2xl font-semibold">
                  {new Date(vendor.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Link
              href={`/admin/vendors/${vendor.id}/edit`}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-primary-dark"
            >
              Edit Vendor
            </Link>
            <button
              onClick={() => router.push('/admin/vendors')}
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