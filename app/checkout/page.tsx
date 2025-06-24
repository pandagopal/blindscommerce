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
import PhoneInput from "@/components/ui/PhoneInput";

// Stripe promise will be initialized dynamically
let stripePromise: Promise<any> | null = null;

// Function to get Stripe instance with database credentials
const getStripe = async () => {
  if (!stripePromise) {
    try {
      const response = await fetch('/api/stripe/config');
      if (!response.ok) {
        console.warn('Stripe not configured - using test mode');
        // Return null but still resolve the promise so the form loads
        stripePromise = Promise.resolve(null);
        return stripePromise;
      }
      const config = await response.json();
      if (!config.publishableKey) {
        console.warn('Stripe publishable key not found - payment form will load in test mode');
        stripePromise = Promise.resolve(null);
      } else {
        stripePromise = loadStripe(config.publishableKey);
      }
    } catch (error) {
      console.error('Error loading Stripe:', error);
      // Still resolve with null so the form loads
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
};

// Payment Form Component
const PaymentForm = ({
  onSubmit,
  loading,
  formData,
  handleInputChange,
  prevStep,
  total,
  onPaymentSuccess,
  pricing,
  isStripeEnabled = false
}: {
  onSubmit: (e: React.FormEvent) => Promise<void>,
  loading: boolean,
  formData: any,
  handleInputChange: (e: React.ChangeEvent<any>) => void,
  prevStep: () => void,
  total: number,
  onPaymentSuccess: (paymentResult: any) => void,
  pricing: any,
  isStripeEnabled?: boolean
}) => {
  // Only use Stripe hooks if Stripe is enabled and available
  const stripe = isStripeEnabled ? useStripe() : null;
  const elements = isStripeEnabled ? useElements() : null;
  const [cardError, setCardError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Create payment intent when component mounts (only for Stripe-enabled payments)
  useEffect(() => {
    if (!isStripeEnabled || !stripe) return;

    const createPaymentIntent = async () => {
      try {
        console.log('Creating payment intent with:', {
          total,
          email: formData.email,
          pricing: pricing
        });
        
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
                volume: pricing?.volume_discount || 0,
                coupon: pricing?.coupon_discount || 0,
                campaign: pricing?.campaign_discount || 0,
                total: pricing?.total_discount || 0
              }),
              applied_promotions: JSON.stringify(pricing?.applied_promotions || {})
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
          const errorData = await response.json().catch(() => null);
          console.error('Payment intent creation failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(`Payment setup failed: ${errorData?.error || response.statusText}`);
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setCardError(error instanceof Error ? error.message : 'Unable to process payment. Please try again later.');
      }
    };

    if (total > 0) {
      createPaymentIntent();
    }
  }, [formData, total, isStripeEnabled, stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      setCardError("Please accept the terms and conditions");
      return;
    }

    setPaymentProcessing(true);
    setCardError(null);

    // If Stripe is not configured, process as test order
    if (!isStripeEnabled || !stripe || !elements) {
      console.warn('Processing order in test mode - Stripe not configured');
      // Create a mock payment intent for test mode
      const testPaymentIntent = {
        id: `test_pi_${Date.now()}`,
        status: 'succeeded',
        amount: total * 100,
        currency: 'usd',
        payment_method: 'test_card',
        created: Date.now() / 1000
      };
      onPaymentSuccess(testPaymentIntent);
      await onSubmit(e);
      setPaymentProcessing(false);
      return;
    }

    // If we have Stripe but no clientSecret, there was an issue creating payment intent
    if (!clientSecret) {
      setCardError("Unable to process payment. Please try again later.");
      setPaymentProcessing(false);
      return;
    }

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

      {!isStripeEnabled && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Test Mode:</strong> Payment processing is not fully configured. You can still complete the checkout for testing purposes.
          </p>
        </div>
      )}

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
        {isStripeEnabled && stripe && elements ? (
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
        ) : (
          <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
            <p className="text-sm text-gray-500">Card payment form (Test Mode - Enter any details)</p>
            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full p-2 text-sm border border-gray-200 rounded"
                disabled={!isStripeEnabled}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-1/2 p-2 text-sm border border-gray-200 rounded"
                  disabled={!isStripeEnabled}
                />
                <input
                  type="text"
                  placeholder="CVC"
                  className="w-1/2 p-2 text-sm border border-gray-200 rounded"
                  disabled={!isStripeEnabled}
                />
              </div>
            </div>
          </div>
        )}
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

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={loading || paymentProcessing}
          className={`bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center ${
            (loading || paymentProcessing) ? 'opacity-70 cursor-not-allowed' : ''
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
              {stripe ? `Pay Now $${Number(total ?? 0).toFixed(2)}` : `Complete Order $${Number(total ?? 0).toFixed(2)} (Test Mode)`}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, pricing, updateZipCode, updatePricingWithTax, isLoading } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [activeStep, setActiveStep] = useState(1); // 1: Shipping, 2: Billing, 3: Payment
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showGuestOptions, setShowGuestOptions] = useState(true);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);

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
    // Initialize Stripe
    const initStripe = async () => {
      const stripe = await getStripe();
      setStripeInstance(stripe);
      setStripeLoaded(true); // Mark as loaded regardless of success/failure
    };
    initStripe();
  }, []);

  useEffect(() => {
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
  }, []);

  // Track if we've attempted to load the cart at least once
  const [cartLoadAttempted, setCartLoadAttempted] = useState(false);

  // Separate effect for cart redirect to avoid race conditions on page load
  useEffect(() => {
    // Mark that we've attempted to load cart data
    if (!cartLoadAttempted && (items.length > 0 || !isLoading)) {
      setCartLoadAttempted(true);
    }

    // Only redirect to cart if we've attempted to load cart data and it's actually empty
    const timer = setTimeout(() => {
      if (cartLoadAttempted && items.length === 0 && !orderCompleted && !isLoading) {
        router.push("/cart");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [items, router, orderCompleted, isLoading, cartLoadAttempted]);

  const [taxCalculating, setTaxCalculating] = useState(false);

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

  // Calculate tax when billing ZIP code changes (on blur for better UX)
  const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Only calculate tax for billing ZIP codes and if ZIP is valid (5+ digits)
    if ((name === 'billingZipCode' || (name === 'zipCode' && formData.sameAsShipping)) && value && value.trim().length >= 5) {
      setTaxCalculating(true);
      
      try {
        // Get current customer ID if authenticated
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
          // Guest user, continue without customer ID
        }

        // Use the same pricing API but with ZIP code for tax calculation
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
          zip_code: value.trim() // This will trigger tax calculation
        };

        const response = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pricingRequest)
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update pricing context with tax calculation
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
        } else {
          console.error('Tax calculation failed:', response.status);
        }
      } catch (error) {
        console.error('Error calculating tax:', error);
      } finally {
        setTaxCalculating(false);
      }
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

            {/* Single Page Checkout Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Order</h1>
              <p className="text-sm text-gray-600">Fill out all sections below to place your order</p>
            </div>

            {/* Single Page Layout - All Sections */}
            <div className="space-y-6">
              
              {/* Shipping Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Shipping Information
                </h2>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number *</label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        country="US"
                        showCountrySelector={false}
                        required
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Shipping Address
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Street Address *</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Apt/Suite</label>
                        <input
                          type="text"
                          name="apt"
                          value={formData.apt}
                          onChange={handleInputChange}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          placeholder="Apt #"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">ZIP *</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          onBlur={handleZipCodeBlur}
                          required
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                        {taxCalculating && formData.sameAsShipping && (
                          <p className="text-xs text-blue-600 mt-1">Calculating tax...</p>
                        )}
                      </div>
                    </div>
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


            {/* Step 2: Billing Information */}
              </div>
              
              {/* Billing Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Billing Information
                </h2>

                {/* Billing Address */}
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing Address
                  </h3>
                  
                  <div className="mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sameAsShipping"
                        name="sameAsShipping"
                        checked={formData.sameAsShipping}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
                      />
                      <label htmlFor="sameAsShipping" className="ml-2 block text-xs text-gray-600">
                        Same as shipping address
                      </label>
                    </div>
                  </div>

                  {!formData.sameAsShipping && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                          <input
                            type="text"
                            name="billingFirstName"
                            value={formData.billingFirstName}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                          <input
                            type="text"
                            name="billingLastName"
                            value={formData.billingLastName}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Street Address *</label>
                          <input
                            type="text"
                            name="billingAddress"
                            value={formData.billingAddress}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Apt/Suite</label>
                          <input
                            type="text"
                            name="billingApt"
                            value={formData.billingApt}
                            onChange={handleInputChange}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                          <input
                            type="text"
                            name="billingCity"
                            value={formData.billingCity}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
                          <input
                            type="text"
                            name="billingState"
                            value={formData.billingState}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">ZIP *</label>
                          <input
                            type="text"
                            name="billingZipCode"
                            value={formData.billingZipCode}
                            onChange={handleInputChange}
                            onBlur={handleZipCodeBlur}
                            required={!formData.sameAsShipping}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          />
                          {taxCalculating && !formData.sameAsShipping && (
                            <p className="text-xs text-blue-600 mt-1">Calculating tax...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Payment Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                {!stripeLoaded ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading payment form...</p>
                    </div>
                  </div>
                ) : stripeInstance ? (
                  <Elements stripe={stripeInstance}>
                    <PaymentForm
                      onSubmit={handleSubmit}
                      loading={loading}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      prevStep={() => {}} // Remove step navigation
                      total={total}
                      onPaymentSuccess={onPaymentSuccess}
                      pricing={pricing}
                      isStripeEnabled={true}
                    />
                  </Elements>
                ) : (
                  <PaymentForm
                    onSubmit={handleSubmit}
                    loading={loading}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    prevStep={() => {}} // Remove step navigation
                    total={total}
                    onPaymentSuccess={onPaymentSuccess}
                    pricing={pricing}
                    isStripeEnabled={false}
                  />
                )}
              </div>
              
            </div> {/* End of space-y-6 container */}
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
                <span className="text-gray-600">
                  Tax
                  {pricing.tax_jurisdiction && (
                    <span className="text-xs text-gray-400 block">
                      {pricing.tax_jurisdiction} ({Number(pricing?.tax_rate ?? 0).toFixed(2)}%)
                    </span>
                  )}
                </span>
                <span>${Number(pricing?.tax ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                <span>Total</span>
                <span>${Number(pricing?.total ?? 0).toFixed(2)}</span>
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
