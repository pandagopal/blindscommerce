'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VendorForm from '../../VendorForm';

interface VendorData {
  company_name: string;
  contact_email: string;
  contact_phone: string;
  business_description: string;
  is_active: boolean;
  is_verified: boolean;
  approval_status: string;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function EditVendorPage() {
  const params = useParams();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVendor() {
      try {
        if (!params?.id) {
          setError('Vendor ID is required');
          setLoading(false);
          return;
        }

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
    }

    fetchVendor();
  }, [params?.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!vendor) {
    return <div>No vendor data found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Vendor</h1>
      <VendorForm vendorId={Number(params?.id)} initialData={vendor} />
    </div>
  );
} 