'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit3, Trash2, Check, Star, Truck } from 'lucide-react';

interface ShippingAddress {
  id: number;
  addressName: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  isDefault: boolean;
  isBillingAddress: boolean;
  deliveryInstructions?: string;
  deliveryPreference: string;
  accessCode?: string;
  isVerified: boolean;
  verificationSource?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormData {
  addressName: string;
  firstName: string;
  lastName: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  isDefault: boolean;
  isBillingAddress: boolean;
  deliveryInstructions: string;
  deliveryPreference: 'standard' | 'signature_required' | 'leave_at_door' | 'front_desk';
  accessCode: string;
}

const initialFormData: AddressFormData = {
  addressName: '',
  firstName: '',
  lastName: '',
  company: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: 'United States',
  phone: '',
  email: '',
  isDefault: false,
  isBillingAddress: false,
  deliveryInstructions: '',
  deliveryPreference: 'standard',
  accessCode: ''
};

export default function ShippingAddressManager() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/account/shipping-addresses');
      const data = await response.json();
      
      if (data.success) {
        setAddresses(data.addresses);
      } else {
        setError(data.error || 'Failed to fetch addresses');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const endpoint = editingAddress 
        ? `/api/account/shipping-addresses/${editingAddress.id}`
        : '/api/account/shipping-addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';

      // Filter out empty strings for optional fields
      const submitData = {
        ...formData,
        company: formData.company || undefined,
        addressLine2: formData.addressLine2 || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        deliveryInstructions: formData.deliveryInstructions || undefined,
        accessCode: formData.accessCode || undefined,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAddresses();
        setShowForm(false);
        setEditingAddress(null);
        setFormData(initialFormData);
      } else {
        setError(data.error || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      setError('Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address: ShippingAddress) => {
    setEditingAddress(address);
    setFormData({
      addressName: address.addressName,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      stateProvince: address.stateProvince,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || '',
      email: address.email || '',
      isDefault: address.isDefault,
      isBillingAddress: address.isBillingAddress,
      deliveryInstructions: address.deliveryInstructions || '',
      deliveryPreference: address.deliveryPreference as AddressFormData['deliveryPreference'],
      accessCode: address.accessCode || ''
    });
    setShowForm(true);
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      const response = await fetch(`/api/account/shipping-addresses/${addressId}/default`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAddresses();
      } else {
        setError(data.error || 'Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      setError('Failed to set default address');
    }
  };

  const handleDelete = async (addressId: number, addressName: string) => {
    if (!confirm(`Are you sure you want to delete "${addressName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/account/shipping-addresses/${addressId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAddresses();
      } else {
        setError(data.error || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      setError('Failed to delete address');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAddress(null);
    setFormData(initialFormData);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Shipping Addresses
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Address
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Address List */}
      {!showForm && (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white border border-purple-100 rounded-xl shadow-lg p-6 relative">
              {address.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {address.addressName}
                </h3>
                <div className="text-gray-600">
                  <p className="font-medium">{address.firstName} {address.lastName}</p>
                  {address.company && <p className="text-sm">{address.company}</p>}
                  <p className="text-sm">{address.addressLine1}</p>
                  {address.addressLine2 && <p className="text-sm">{address.addressLine2}</p>}
                  <p className="text-sm">
                    {address.city}, {address.stateProvince} {address.postalCode}
                  </p>
                  <p className="text-sm">{address.country}</p>
                  {address.phone && <p className="text-sm">📞 {address.phone}</p>}
                </div>
              </div>

              {address.isVerified && (
                <div className="flex items-center text-green-600 text-sm mb-3">
                  <Check className="w-4 h-4 mr-1" />
                  Verified{address.verificationSource && ` by ${address.verificationSource}`}
                </div>
              )}

              {address.deliveryInstructions && (
                <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <Truck className="w-4 h-4 inline mr-1" />
                  {address.deliveryInstructions}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                    title="Edit address"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-yellow-600 hover:text-yellow-700 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(address.id, address.addressName)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  Used {address.usageCount} time{address.usageCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No shipping addresses yet</p>
          <p className="mb-4">Add your first shipping address to get started with faster checkout.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Add Your First Address
          </button>
        </div>
      )}

      {/* Address Form */}
      {showForm && (
        <div className="bg-white border border-purple-100 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Name *
                </label>
                <input
                  type="text"
                  name="addressName"
                  value={formData.addressName}
                  onChange={handleInputChange}
                  required
                  placeholder="Home, Work, Mom's House, etc."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company (optional)
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                required
                placeholder="Street address, P.O. Box, etc."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (optional)
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                placeholder="Apartment, suite, unit, building, floor, etc."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <input
                  type="text"
                  name="stateProvince"
                  value={formData.stateProvince}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Preference
              </label>
              <select
                name="deliveryPreference"
                value={formData.deliveryPreference}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="standard">Standard Delivery</option>
                <option value="signature_required">Signature Required</option>
                <option value="leave_at_door">Leave at Door</option>
                <option value="front_desk">Front Desk/Concierge</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Instructions (optional)
              </label>
              <textarea
                name="deliveryInstructions"
                value={formData.deliveryInstructions}
                onChange={handleInputChange}
                rows={3}
                placeholder="Special delivery notes, gate codes, etc."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isBillingAddress"
                  name="isBillingAddress"
                  checked={formData.isBillingAddress}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isBillingAddress" className="ml-2 block text-sm text-gray-700">
                  Can be used for billing
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}