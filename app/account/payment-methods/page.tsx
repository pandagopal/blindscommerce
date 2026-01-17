'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Stripe will be initialized after fetching the public key from settings
let stripePromise: Promise<Stripe | null> | null = null;

interface PaymentMethod {
  id: number;
  stripePaymentMethodId: string;
  type: string;
  isDefault: boolean;
  nickname?: string;
  createdAt: string;
  lastUsedAt?: string;
  card?: {
    brand: string;
    lastFour: string;
    expMonth: number;
    expYear: number;
  };
  bankAccount?: {
    bankName: string;
    lastFour: string;
    accountType: string;
  };
  wallet?: {
    type: string;
    email: string;
  };
  billingAddress: {
    name: string;
    email: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

const PaymentMethodsPage: React.FC = () => {
  const [stripeKey, setStripeKey] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    // Fetch Stripe public key from settings
    const fetchStripeKey = async () => {
      try {
        const response = await fetch('/api/v2/content/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.payments?.stripe_publishable_key) {
            const key = data.data.payments.stripe_publishable_key;
            setStripeKey(key);
            stripePromise = loadStripe(key);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Stripe settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchStripeKey();
  }, []);

  if (settingsLoading) {
    return <div className="p-8">Loading payment settings...</div>;
  }

  if (!stripeKey) {
    return <div className="p-8 text-red-600">Payment system is not configured. Please contact support.</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsContent />
    </Elements>
  );
};

const PaymentMethodsContent: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/users/payment-methods');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.paymentMethods);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Add new payment method
  const handleAddPaymentMethod = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessingAction('adding');
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method with Stripe
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: (event.target as any).billingName.value,
          email: (event.target as any).billingEmail.value,
          address: {
            line1: (event.target as any).billingLine1.value,
            line2: (event.target as any).billingLine2.value,
            city: (event.target as any).billingCity.value,
            state: (event.target as any).billingState.value,
            postal_code: (event.target as any).billingPostalCode.value,
            country: 'US',
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Save payment method to our backend
      const response = await fetch('/api/v2/users/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          nickname: (event.target as any).nickname.value,
          isDefault: (event.target as any).isDefault.checked,
          billingAddress: {
            name: (event.target as any).billingName.value,
            email: (event.target as any).billingEmail.value,
            line1: (event.target as any).billingLine1.value,
            line2: (event.target as any).billingLine2.value,
            city: (event.target as any).billingCity.value,
            state: (event.target as any).billingState.value,
            postalCode: (event.target as any).billingPostalCode.value,
            country: 'US',
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save payment method');
      }

      // Reset form and refresh list
      (event.target as HTMLFormElement).reset();
      setShowAddForm(false);
      await fetchPaymentMethods();

    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    } finally {
      setProcessingAction(null);
    }
  };

  // Set default payment method
  const handleSetDefault = async (paymentMethodId: number) => {
    setProcessingAction(`default-${paymentMethodId}`);
    setError(null);

    try {
      const response = await fetch(`/api/account/payment-methods/${paymentMethodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isDefault: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update payment method');
      }

      await fetchPaymentMethods();

    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
    } finally {
      setProcessingAction(null);
    }
  };

  // Delete payment method
  const handleDelete = async (paymentMethodId: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    setProcessingAction(`delete-${paymentMethodId}`);
    setError(null);

    try {
      const response = await fetch(`/api/account/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete payment method');
      }

      await fetchPaymentMethods();

    } catch (err) {
      console.error('Error deleting payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete payment method');
    } finally {
      setProcessingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Payment Method'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Add Payment Method Form */}
      {showAddForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Payment Method</h2>
          <form onSubmit={handleAddPaymentMethod} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname (Optional)
                </label>
                <input
                  name="nickname"
                  type="text"
                  placeholder="e.g., Personal Card, Business Account"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  name="isDefault"
                  type="checkbox"
                  id="isDefault"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                  Set as default payment method
                </label>
              </div>
            </div>

            {/* Card Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Information
              </label>
              <div className="p-3 border border-gray-300 rounded-md">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Billing Address</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    name="billingName"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="billingEmail"
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    name="billingLine1"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    name="billingLine2"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    name="billingCity"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    name="billingState"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    name="billingPostalCode"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!stripe || processingAction === 'adding'}
                className="bg-primary-red hover:bg-primary-red-dark text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {processingAction === 'adding' ? 'Adding...' : 'Add Payment Method'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">No Payment Methods</h2>
          <p className="text-gray-600 mb-6">Add a payment method for faster checkout.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white border rounded-lg p-6 ${
                method.isDefault ? 'ring-2 ring-red-500 border-red-200' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {method.type === 'card' && method.card && (
                      <>
                        <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                          {method.card.brand.toUpperCase()}
                        </div>
                        <span className="text-lg font-medium">
                          •••• •••• •••• {method.card.lastFour}
                        </span>
                        <span className="text-sm text-gray-500">
                          {method.card.expMonth.toString().padStart(2, '0')}/{method.card.expYear}
                        </span>
                      </>
                    )}
                    {method.isDefault && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  
                  {method.nickname && (
                    <p className="text-sm text-gray-600 mb-1">{method.nickname}</p>
                  )}
                  
                  <p className="text-sm text-gray-500">
                    {method.billingAddress.name} • {method.billingAddress.city}, {method.billingAddress.state}
                  </p>
                  
                  <p className="text-xs text-gray-400">
                    Added {new Date(method.createdAt).toLocaleDateString()}
                    {method.lastUsedAt && (
                      <span> • Last used {new Date(method.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      disabled={processingAction === `default-${method.id}`}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {processingAction === `default-${method.id}` ? 'Setting...' : 'Set Default'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(method.id)}
                    disabled={processingAction === `delete-${method.id}`}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {processingAction === `delete-${method.id}` ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsPage;