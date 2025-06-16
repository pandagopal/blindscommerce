'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import SatisfactionGuarantee from "@/components/ui/SatisfactionGuarantee";
import PriceMatchGuarantee from "@/components/ui/PriceMatchGuarantee";

// Initialize Stripe with the publishable key from environment variables
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

// Payment Form Component
const PaymentForm = ({
  onSubmit,
  loading,
  formData,
  handleInputChange,
  prevStep,
  total,
  onPaymentSuccess
}: {
  onSubmit: (e: React.FormEvent) => Promise<void>,
  loading: boolean,
  formData: any,
  handleInputChange: (e: React.ChangeEvent<any>) => void,
  prevStep: () => void,
  total: number,
  onPaymentSuccess: (paymentResult: any) => void
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: total,
            customer_email: formData.email,
            metadata: {
              order_type: 'blindscommerce_purchase',
              applied_discounts: JSON.stringify({
                volume: pricing.volume_discount,
                coupon: pricing.coupon_discount,
                campaign: pricing.campaign_discount,
                total: pricing.total_discount
              }),
              applied_promotions: JSON.stringify(pricing.applied_promotions || {})
            },
            shipping: {
              name: `${formData.firstName} ${formData.lastName}`,
              address: {
                line1: formData.address,
                line2: formData.apt || '',
                city: formData.city,
                state: formData.state,
                postal_code: formData.zipCode,
                country: formData.country,
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setCardError('Unable to process payment. Please try again later.');
      }
    };

    if (total > 0) {
      createPaymentIntent();
    }
  }, [formData, total]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      // Stripe.js has not loaded yet or payment intent wasn't created
      return;
    }

    if (!formData.acceptTerms) {
      setCardError("Please accept the terms and conditions");
      return;
    }

    setPaymentProcessing(true);
    setCardError(null);

    // Get card element
    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentProcessing(false);
      setCardError("Card element not found");
      return;
    }

    // Confirm the payment with Stripe
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: formData.cardName || `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          address: {
            line1: formData.sameAsShipping ? formData.address : formData.billingAddress,
            line2: formData.sameAsShipping ? formData.apt : formData.billingApt,
            city: formData.sameAsShipping ? formData.city : formData.billingCity,
            state: formData.sameAsShipping ? formData.state : formData.billingState,
            postal_code: formData.sameAsShipping ? formData.zipCode : formData.billingZipCode,
            country: formData.sameAsShipping ? formData.country : formData.billingCountry,
          }
        }
      }
    });

    if (error) {
      setCardError(error.message || "An error occurred with your payment");
      setPaymentProcessing(false);
      return;
    }

    // Payment successful, call onSubmit to complete the order
    if (paymentIntent.status === 'succeeded') {
      onPaymentSuccess(paymentIntent);
      await onSubmit(e);
    } else {
      setCardError("Payment processing failed. Please try again.");
    }
    setPaymentProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold mb-4 flex items-center">
        <CreditCard className="mr-2 h-5 w-5" />
        Payment Information
      </h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 flex items-center">
          <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
          Your payment information is encrypted and secure.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name on Card *
        </label>
        <input
          type="text"
          name="cardName"
          value={formData.cardName}
          onChange={handleInputChange}
          required
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Details *
        </label>
        <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-red focus-within:border-primary-red">
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
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        {cardError && (
          <p className="mt-1 text-sm text-red-600">{cardError}</p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            required
            className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded mt-1"
          />
          <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
            I agree to the <Link href="/terms" className="text-primary-red hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary-red hover:underline">Privacy Policy</Link>
          </label>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={prevStep}
          className="border border-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || paymentProcessing || !stripe || !clientSecret}
          className={`bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center ${
            (loading || paymentProcessing || !stripe || !clientSecret) ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading || paymentProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {paymentProcessing ? 'Processing Payment...' : 'Processing...'}
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Pay Now ${total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, pricing } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [activeStep, setActiveStep] = useState(1); // 1: Shipping, 2: Billing, 3: Payment
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showGuestOptions, setShowGuestOptions] = useState(true);

  // Simplified checkout state
  const [formData, setFormData] = useState({
    // Shipping info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apt: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",

    // Billing info
    sameAsShipping: true,
    billingFirstName: "",
    billingLastName: "",
    billingAddress: "",
    billingApt: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "United States",

    // Payment
    cardName: "",

    // Other
    specialInstructions: "",
    acceptTerms: false,
    
    // Guest options
    createAccount: false,
    guestPassword: "",
    guestConfirmPassword: "",
  });

  // Use pricing from cart context which includes all discounts
  const { shipping, tax, total } = pricing;

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (items.length === 0 && !orderCompleted) {
      router.push("/cart");
    }
    
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          setIsGuest(true);
        }
      } catch (error) {
        setIsGuest(true);
      }
    };
    
    checkAuth();
  }, [items, router, orderCompleted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // If "same as shipping" is checked, copy shipping info to billing
    if (name === 'sameAsShipping' && checked) {
      setFormData((prev) => ({
        ...prev,
        billingFirstName: prev.firstName,
        billingLastName: prev.lastName,
        billingAddress: prev.address,
        billingApt: prev.apt,
        billingCity: prev.city,
        billingState: prev.state,
        billingZipCode: prev.zipCode,
        billingCountry: prev.country,
      }));
    }
  };

  // Move to next step
  const nextStep = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Move to previous step
  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create order in database after successful payment
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
          firstName: formData.sameAsShipping ? formData.firstName : formData.billingFirstName,
          lastName: formData.sameAsShipping ? formData.lastName : formData.billingLastName,
          address: formData.sameAsShipping ? formData.address : formData.billingAddress,
          apt: formData.sameAsShipping ? formData.apt : formData.billingApt,
          city: formData.sameAsShipping ? formData.city : formData.billingCity,
          state: formData.sameAsShipping ? formData.state : formData.billingState,
          zipCode: formData.sameAsShipping ? formData.zipCode : formData.billingZipCode,
          country: formData.sameAsShipping ? formData.country : formData.billingCountry
        },
        payment: {
          id: paymentData?.id || 'test_payment_id' // In a real app, this would be the Stripe payment intent ID
        },
        subtotal: pricing.subtotal,
        shipping_cost: pricing.shipping,
        tax: pricing.tax,
        total: pricing.total,
        discount_amount: pricing.total_discount,
        volume_discount_amount: pricing.volume_discount,
        coupon_code: pricing.applied_promotions?.coupon_code,
        campaign_code: pricing.applied_promotions?.campaign_code,
        special_instructions: formData.specialInstructions
      };

      // Choose API endpoint based on authentication status
      const apiEndpoint = isGuest ? '/api/orders/guest' : '/api/orders/create';
      
      // Prepare order data for guest or authenticated user
      const finalOrderData = isGuest ? {
        ...orderData,
        createAccount: formData.createAccount,
        guestPassword: formData.guestPassword,
        guestConfirmPassword: formData.guestConfirmPassword,
        payment: paymentData
      } : orderData;

      // Make API call to appropriate orders endpoint
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

      // Use the order number from the API response
      setOrderNumber(data.orderNumber);
      setOrderCompleted(true);
      clearCart(); // Clear the cart after successful order
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set payment data when payment is successful
  const onPaymentSuccess = (paymentResult: any) => {
    setPaymentData(paymentResult);
  };

  // Order confirmation display
  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-purple-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/cart" className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700 font-semibold flex items-center">
          <ChevronLeft size={16} className="mr-1" />
          Back to Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-purple-100 rounded-xl shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Checkout</h1>
            
            {/* Guest Checkout Options */}
            {isGuest && showGuestOptions && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Checkout Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="guestCheckout"
                      name="checkoutType"
                      value="guest"
                      checked={!formData.createAccount}
                      onChange={() => setFormData(prev => ({ ...prev, createAccount: false }))}
                      className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300"
                    />
                    <label htmlFor="guestCheckout" className="ml-2 text-sm font-medium text-gray-700">
                      Continue as Guest
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="createAccount"
                      name="checkoutType"
                      value="account"
                      checked={formData.createAccount}
                      onChange={() => setFormData(prev => ({ ...prev, createAccount: true }))}
                      className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300"
                    />
                    <label htmlFor="createAccount" className="ml-2 text-sm font-medium text-gray-700">
                      Create Account & Checkout
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuestOptions(false)}
                  className="mt-3 text-sm text-primary-red hover:text-primary-red-dark"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Progress steps */}
            <div className="flex items-center justify-between mb-8">
              <div
                className={`flex flex-col items-center ${activeStep >= 1 ? 'text-primary-red' : 'text-gray-400'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  activeStep > 1 ? 'bg-primary-red text-white' :
                  activeStep === 1 ? 'border-2 border-primary-red text-primary-red' :
                  'border border-gray-300 text-gray-400'
                }`}>
                  {activeStep > 1 ? '✓' : '1'}
                </div>
                <span className="text-xs">Shipping</span>
              </div>

              <div className="flex-1 h-1 mx-4 bg-gray-200">
                <div className={`h-full bg-primary-red transition-all ${activeStep > 1 ? 'w-full' : 'w-0'}`}></div>
              </div>

              <div
                className={`flex flex-col items-center ${activeStep >= 2 ? 'text-primary-red' : 'text-gray-400'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  activeStep > 2 ? 'bg-primary-red text-white' :
                  activeStep === 2 ? 'border-2 border-primary-red text-primary-red' :
                  'border border-gray-300 text-gray-400'
                }`}>
                  {activeStep > 2 ? '✓' : '2'}
                </div>
                <span className="text-xs">Billing</span>
              </div>

              <div className="flex-1 h-1 mx-4 bg-gray-200">
                <div className={`h-full bg-primary-red transition-all ${activeStep > 2 ? 'w-full' : 'w-0'}`}></div>
              </div>

              <div
                className={`flex flex-col items-center ${activeStep >= 3 ? 'text-primary-red' : 'text-gray-400'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  activeStep === 3 ? 'border-2 border-primary-red text-primary-red' :
                  'border border-gray-300 text-gray-400'
                }`}>
                  3
                </div>
                <span className="text-xs">Payment</span>
              </div>
            </div>

            {/* Step 1: Shipping Information */}
            {activeStep === 1 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Shipping Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      className="w-full p-2 border border-gray-300 rounded-md"
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
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apartment, suite, etc. (optional)
                  </label>
                  <input
                    type="text"
                    name="apt"
                    value={formData.apt}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Apt #"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP/Postal Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Guest Account Creation Fields */}
                {isGuest && formData.createAccount && (
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          name="guestPassword"
                          value={formData.guestPassword}
                          onChange={handleInputChange}
                          required={formData.createAccount}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Create a password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          name="guestConfirmPassword"
                          value={formData.guestConfirmPassword}
                          onChange={handleInputChange}
                          required={formData.createAccount}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions (optional)
                  </label>
                  <textarea
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Add any special delivery instructions"
                  ></textarea>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    Continue to Billing
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Billing Information */}
            {activeStep === 2 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Billing Information</h2>

                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sameAsShipping"
                      name="sameAsShipping"
                      checked={formData.sameAsShipping}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
                    />
                    <label htmlFor="sameAsShipping" className="ml-2 block text-sm text-gray-700">
                      Same as shipping address
                    </label>
                  </div>
                </div>

                {!formData.sameAsShipping && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="billingFirstName"
                          value={formData.billingFirstName}
                          onChange={handleInputChange}
                          required={!formData.sameAsShipping}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="billingLastName"
                          value={formData.billingLastName}
                          onChange={handleInputChange}
                          required={!formData.sameAsShipping}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        required={!formData.sameAsShipping}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apartment, suite, etc. (optional)
                      </label>
                      <input
                        type="text"
                        name="billingApt"
                        value={formData.billingApt}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          name="billingCity"
                          value={formData.billingCity}
                          onChange={handleInputChange}
                          required={!formData.sameAsShipping}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province *
                        </label>
                        <input
                          type="text"
                          name="billingState"
                          value={formData.billingState}
                          onChange={handleInputChange}
                          required={!formData.sameAsShipping}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP/Postal Code *
                        </label>
                        <input
                          type="text"
                          name="billingZipCode"
                          value={formData.billingZipCode}
                          onChange={handleInputChange}
                          required={!formData.sameAsShipping}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="border border-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Information */}
            {activeStep === 3 && (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  onSubmit={handleSubmit}
                  loading={loading}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  prevStep={prevStep}
                  total={total}
                  onPaymentSuccess={onPaymentSuccess}
                />
              </Elements>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Order Summary</h2>

            <div className="max-h-80 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.cart_item_id} className="flex items-start py-3 border-b border-gray-200 last:border-b-0">
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-gray-200 mr-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{item.name}</h3>
                    {(item.width && item.height) && (
                      <p className="text-xs text-gray-500">
                        {item.width}" × {item.height}"
                      </p>
                    )}
                    {item.colorName && (
                      <p className="text-xs text-gray-500">
                        Color: {item.colorName}
                      </p>
                    )}
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                      <span className="text-sm font-medium">${item.unit_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${pricing.subtotal.toFixed(2)}</span>
              </div>
              {pricing.total_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-gray-600">Discounts</span>
                  <span>-${pricing.total_discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                {pricing.shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span>${pricing.shipping.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${pricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                <span>Total</span>
                <span>${pricing.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  Free shipping on orders over $100
                </span>
              </div>
              <div className="flex items-center">
                <ShieldCheck className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  Secure checkout with Stripe
                </span>
              </div>
            </div>

            {/* Guarantees */}
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
