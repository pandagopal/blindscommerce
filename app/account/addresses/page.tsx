'use client';

import { useEffect, useState } from 'react';

interface Address {
  id: number;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<Partial<Address>>({ country: 'United States' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('addresses');
      if (saved) setAddresses(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('addresses', JSON.stringify(addresses));
    }
  }, [addresses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.addressLine1 || !form.city || !form.state || !form.postalCode || !form.country) return;
    if (editingId) {
      setAddresses((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...form } as Address : a)));
      setEditingId(null);
    } else {
      setAddresses((prev) => [
        ...prev,
        { ...form, id: Date.now() } as Address,
      ]);
    }
    setForm({ country: 'United States' });
  };

  const handleEdit = (id: number) => {
    const addr = addresses.find((a) => a.id === id);
    if (addr) {
      setForm(addr);
      setEditingId(id);
    }
  };

  const handleDelete = (id: number) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) {
      setForm({ country: 'United States' });
      setEditingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Addresses</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 mb-8 max-w-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="firstName" value={form.firstName || ''} onChange={handleChange} placeholder="First Name" className="border p-2 rounded" required />
          <input name="lastName" value={form.lastName || ''} onChange={handleChange} placeholder="Last Name" className="border p-2 rounded" required />
          <input name="addressLine1" value={form.addressLine1 || ''} onChange={handleChange} placeholder="Address Line 1" className="border p-2 rounded md:col-span-2" required />
          <input name="addressLine2" value={form.addressLine2 || ''} onChange={handleChange} placeholder="Address Line 2" className="border p-2 rounded md:col-span-2" />
          <input name="city" value={form.city || ''} onChange={handleChange} placeholder="City" className="border p-2 rounded" required />
          <input name="state" value={form.state || ''} onChange={handleChange} placeholder="State" className="border p-2 rounded" required />
          <input name="postalCode" value={form.postalCode || ''} onChange={handleChange} placeholder="Postal Code" className="border p-2 rounded" required />
          <input name="country" value={form.country || ''} onChange={handleChange} placeholder="Country" className="border p-2 rounded" required />
          <input name="phone" value={form.phone || ''} onChange={handleChange} placeholder="Phone (optional)" className="border p-2 rounded md:col-span-2" />
        </div>
        <button type="submit" className="mt-4 bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors">
          {editingId ? 'Update Address' : 'Add Address'}
        </button>
        {editingId && (
          <button type="button" onClick={() => { setForm({ country: 'United States' }); setEditingId(null); }} className="ml-2 mt-4 text-gray-600 underline">
            Cancel
          </button>
        )}
      </form>
      {addresses.length === 0 ? (
        <p className="text-gray-600">No addresses saved.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white border rounded-lg p-4">
              <div className="mb-2 font-medium">{addr.firstName} {addr.lastName}</div>
              <div className="text-sm text-gray-700">{addr.addressLine1}</div>
              {addr.addressLine2 && <div className="text-sm text-gray-700">{addr.addressLine2}</div>}
              <div className="text-sm text-gray-700">{addr.city}, {addr.state} {addr.postalCode}</div>
              <div className="text-sm text-gray-700">{addr.country}</div>
              {addr.phone && <div className="text-sm text-gray-700">Phone: {addr.phone}</div>}
              <div className="mt-2 flex gap-2">
                <button onClick={() => handleEdit(addr.id)} className="text-red-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(addr.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 