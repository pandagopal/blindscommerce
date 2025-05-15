'use client';

import VendorForm from '../VendorForm';

export default function NewVendorPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Vendor</h1>
        <p className="text-gray-500">Create a new vendor account</p>
      </div>

      <VendorForm />
    </div>
  );
} 