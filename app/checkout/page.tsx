'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Lock, User, MapPin, Loader2 } from "lucide-react";
import SatisfactionGuarantee from "@/components/ui/SatisfactionGuarantee";
import PriceMatchGuarantee from "@/components/ui/PriceMatchGuarantee";
import PhoneInput from "@/components/ui/PhoneInput";

// Payment Method Icons
const PaymentIcon = ({ type, provider }: { type: string; provider: string }) => {
  const iconClass = "w-8 h-8";
  
  if (provider === 'stripe' && type === 'card') {
    return <CreditCard className={iconClass} />;
  }
  if (provider === 'paypal') {
    return <div className={`${iconClass} bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold`}>PP</div>;
  }
  if (provider === 'klarna') {
    return <div className={`${iconClass} bg-pink-500 text-white rounded flex items-center justify-center text-xs font-bold`}>K</div>;
  }
  if (provider === 'afterpay') {
    return <div className={`${iconClass} bg-green-500 text-white rounded flex items-center justify-center text-xs font-bold`}>AP</div>;
  }
  if (provider === 'affirm') {
    return <div className={`${iconClass} bg-blue-400 text-white rounded flex items-center justify-center text-xs font-bold`}>AF</div>;
  }
  
  return <CreditCard className={iconClass} />;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, pricing, updatePricingWithTax, isLoading } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  // Compact form state
  const [formData, setFormData] = useState({
    // Contact
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    
    // Shipping
    address: "",
    apt: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    
    // Billing
    sameAsShipping: true,
    billingAddress: "",
    billingApt: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "United States",
    
    // Payment
    cardName: "",
    acceptTerms: false,
    specialInstructions: "",
    
    // Guest account
    createAccount: false,
    guestPassword: "",
    guestConfirmPassword: "",
  });

  const { shipping, tax, total } = pricing;

  // Load user info and payment methods
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Check authentication and load user info
        const authResponse = await fetch('/api/auth/me');
        console.log('Auth response status:', authResponse.status);
        if (!authResponse.ok) {
          setIsGuest(true);
        } else {
          const authData = await authResponse.json();
          console.log('Auth data received:', authData);
          if (authData.user) {
            console.log('Setting form data with user:', authData.user);
            setFormData(prev => ({
              ...prev,
              firstName: authData.user.firstName || '',
              lastName: authData.user.lastName || '',
              email: authData.user.email || '',
              phone: authData.user.phone || '',
              cardName: `${authData.user.firstName || ''} ${authData.user.lastName || ''}`.trim(),
            }));
            
            // Load default address
            try {
              const addressResponse = await fetch('/api/account/shipping-addresses');
              console.log('Address response status:', addressResponse.status);
              if (addressResponse.ok) {
                const addressData = await addressResponse.json();
                console.log('Address data received:', addressData);
                const defaultAddress = addressData.addresses?.find((addr: any) => addr.isDefault);
                
                if (defaultAddress) {
                  console.log('Setting default address:', defaultAddress);
                  setFormData(prev => ({
                    ...prev,
                    address: defaultAddress.addressLine1 || '',
                    apt: defaultAddress.addressLine2 || '',
                    city: defaultAddress.city || '',
                    state: defaultAddress.stateProvince || '',
                    zipCode: defaultAddress.postalCode || '',
                    country: defaultAddress.country || 'United States',
                  }));
                }
              }
            } catch (addressError) {
              console.log('Address loading error:', addressError);
            }
            
            setIsGuest(false);
          } else {
            setIsGuest(true);
          }
        }

        // Load available payment methods based on order total
        const amount = total || 100; // Use 100 as default if total is 0
        console.log('Fetching payment methods for amount:', amount);
        const paymentResponse = await fetch(`/api/payments/methods?amount=${amount}&currency=USD&country=US`);
        console.log('Payment response status:', paymentResponse.status);
        
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log('Payment data received:', paymentData);
          setPaymentMethods(paymentData.payment_methods || []);
          // Auto-select the first recommended method
          const recommended = paymentData.payment_methods?.find((m: any) => m.recommended);
          if (recommended) {
            setSelectedPaymentMethod(recommended.id);
          } else if (paymentData.payment_methods?.length > 0) {
            setSelectedPaymentMethod(paymentData.payment_methods[0].id);
          }
        } else {
          console.error('Payment methods API failed with status:', paymentResponse.status);
          const errorText = await paymentResponse.text();
          console.error('Error response:', errorText);
          setPaymentMethods([]);
        }
      } catch (error) {
        console.error('Error initializing checkout:', error);
        setIsGuest(true);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    // Always initialize checkout, don't wait for total
    initializeCheckout();
  }, []); // Run only once on mount

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoading && items.length === 0 && !orderCompleted) {
      const timer = setTimeout(() => router.push("/cart"), 1500);
      return () => clearTimeout(timer);
    }
  }, [items, isLoading, orderCompleted, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Copy shipping to billing if same as shipping
    if (name === 'sameAsShipping' && checked) {
      setFormData((prev) => ({
        ...prev,
        billingAddress: prev.address,
        billingApt: prev.apt,
        billingCity: prev.city,
        billingState: prev.state,
        billingZipCode: prev.zipCode,
        billingCountry: prev.country,
      }));
    }
  };

  // Calculate tax when ZIP code changes
  const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if ((name === 'billingZipCode' || (name === 'zipCode' && formData.sameAsShipping)) && value && value.trim().length >= 5) {
      try {
        let customerId = undefined;
        try {
          const authResponse = await fetch('/api/auth/me');
          if (authResponse.ok) {
            const authData = await authResponse.json();
            if (authData.user?.role === 'customer') {
              customerId = authData.user.user_id;
            }
          }
        } catch (error) {
          // Guest user
        }

        const pricingRequest = {
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            base_price: item.unit_price
          })),
          customer_id: customerId,
          customer_type: 'retail',
          coupon_code: pricing?.applied_promotions?.coupon_code,
          shipping_state: 'TX',
          zip_code: value.trim()
        };

        const response = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pricingRequest)
        });

        if (response.ok) {
          const data = await response.json();
          updatePricingWithTax({
            subtotal: data.pricing.subtotal,
            volume_discount: data.pricing.discounts.volume_discount,
            coupon_discount: data.pricing.discounts.coupon_discount,
            campaign_discount: data.pricing.discounts.campaign_discount,
            total_discount: data.pricing.discounts.total_discount,
            shipping: data.pricing.shipping,
            tax: data.pricing.tax,
            tax_rate: data.pricing.tax_rate,
            tax_breakdown: data.pricing.tax_breakdown,
            tax_jurisdiction: data.pricing.tax_jurisdiction,
            zip_code: data.pricing.zip_code,
            total: data.pricing.total,
            applied_promotions: data.pricing.applied_promotions
          });
        }
      } catch (error) {
        console.error('Error calculating tax:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        items: items.map(item => ({
          id: item.product_id || 0,
          quantity: item.quantity,
          price: item.unit_price,
          name: item.name,
          width: item.width,
          height: item.height,
          colorName: item.colorName || '',
          colorId: item.color_id || 0,
        })),
        shipping: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          apt: formData.apt,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        billing: {
          sameAsShipping: formData.sameAsShipping,
          firstName: formData.sameAsShipping ? formData.firstName : formData.firstName,
          lastName: formData.sameAsShipping ? formData.lastName : formData.lastName,
          address: formData.sameAsShipping ? formData.address : formData.billingAddress,
          apt: formData.sameAsShipping ? formData.apt : formData.billingApt,
          city: formData.sameAsShipping ? formData.city : formData.billingCity,
          state: formData.sameAsShipping ? formData.state : formData.billingState,
          zipCode: formData.sameAsShipping ? formData.zipCode : formData.billingZipCode,
          country: formData.sameAsShipping ? formData.country : formData.billingCountry
        },
        payment: {
          method: selectedPaymentMethod,
          id: 'test_payment_id'
        },
        subtotal: pricing.subtotal,
        shipping_cost: pricing.shipping,
        tax: pricing.tax,
        total: pricing.total,
        discount_amount: pricing.total_discount,
        special_instructions: formData.specialInstructions
      };

      const apiEndpoint = isGuest ? '/api/orders/guest' : '/api/orders/create';
      
      const finalOrderData = isGuest ? {
        ...orderData,
        createAccount: formData.createAccount,
        guestPassword: formData.guestPassword,
        guestConfirmPassword: formData.guestConfirmPassword,
      } : orderData;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalOrderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      setOrderNumber(data.orderNumber);
      setOrderCompleted(true);
      clearCart();
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Order confirmation
  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-purple-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been received.</p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6 inline-block">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-lg font-medium text-gray-900">{orderNumber}</p>
          </div>

          <p className="text-gray-600 mb-8">
            We've sent a confirmation email to <span className="font-medium">{formData.email}</span> with all the details of your order.
          </p>

          <Link href="/" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link href="/cart" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
            <ChevronLeft size={16} className="mr-1" />
            Back to Cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
              

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                        {!isGuest && formData.firstName && (
                          <span className="text-xs text-green-600 ml-1">(saved)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                        {!isGuest && formData.lastName && (
                          <span className="text-xs text-green-600 ml-1">(saved)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                        {!isGuest && (
                          <span className="text-xs text-gray-500 ml-1">(account email)</span>
                        )}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        readOnly={!isGuest}
                        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!isGuest ? 'bg-gray-50 text-gray-600' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        country="US"
                        showCountrySelector={false}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Shipping Address
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apt/Suite</label>
                        <input
                          type="text"
                          name="apt"
                          value={formData.apt}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Apt #"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          onBlur={handleZipCodeBlur}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Billing Address
                  </h3>
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="sameAsShipping"
                        checked={formData.sameAsShipping}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Same as shipping address</span>
                    </label>
                  </div>
                  
                  {!formData.sameAsShipping && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                          <input
                            type="text"
                            name="billingAddress"
                            value={formData.billingAddress}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Apt/Suite</label>
                          <input
                            type="text"
                            name="billingApt"
                            value={formData.billingApt}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                          <input
                            type="text"
                            name="billingCity"
                            value={formData.billingCity}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                          <input
                            type="text"
                            name="billingState"
                            value={formData.billingState}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                          <input
                            type="text"
                            name="billingZipCode"
                            value={formData.billingZipCode}
                            onChange={handleInputChange}
                            onBlur={handleZipCodeBlur}
                            required={!formData.sameAsShipping}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Method
                  </h3>
                  
                  {loadingPaymentMethods ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading payment options...</span>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">No payment methods are currently available. Please contact support.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <label key={method.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="ml-3 flex items-center flex-1">
                            <PaymentIcon type={method.type} provider={method.provider} />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {method.name}
                                    {method.recommended && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Recommended</span>}
                                    {method.popular && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Popular</span>}
                                  </p>
                                  <p className="text-xs text-gray-500">{method.description}</p>
                                </div>
                                {method.estimated_fee > 0 && (
                                  <p className="text-xs text-gray-500">
                                    Fee: ${method.estimated_fee.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Terms and Submit */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      required
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                      I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !selectedPaymentMethod || paymentMethods.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Complete Order - ${Number(total ?? 0).toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="max-h-60 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.cart_item_id} className="flex items-start py-3 border-b border-gray-200 last:border-b-0">
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-gray-200 mr-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{item.name}</h3>
                      {(item.width && item.height) && (
                        <p className="text-xs text-gray-500">{item.width}" × {item.height}"</p>
                      )}
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium">${Number(item.unit_price ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${Number(pricing?.subtotal ?? 0).toFixed(2)}</span>
                </div>
                {pricing.total_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-gray-600">Discounts</span>
                    <span>-${Number(pricing?.total_discount ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  {pricing.shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>${Number(pricing?.shipping ?? 0).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${Number(pricing?.tax ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>${Number(pricing?.total ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="h-4 w-4 mr-2" />
                  Free shipping on orders over $100
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Secure checkout guaranteed
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <SatisfactionGuarantee variant="banner" />
                <PriceMatchGuarantee variant="banner" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}