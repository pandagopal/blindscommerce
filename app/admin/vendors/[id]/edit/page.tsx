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
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    businessDescription: ''
  });

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch(`/api/admin/vendors/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch vendor');
        }
        const data = await response.json();
        setVendor(data);
        setFormData({
          email: data.user.email,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          companyName: data.company_name,
          contactEmail: data.contact_email,
          contactPhone: data.contact_phone,
          businessDescription: data.business_description || ''
        });
      } catch (error) {
        console.error('Error fetching vendor:', error);
        setError('Failed to fetch vendor data');
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [params.id]);

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