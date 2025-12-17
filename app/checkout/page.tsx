'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Lock, User, MapPin, Loader2 } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import dynamic from "next/dynamic";

// Dynamically import Stripe Payment Request to avoid SSR issues
const StripePaymentRequest = dynamic(
  () => import("@/components/payments/StripePaymentRequest"),
  { 
    ssr: false,
    loading: () => <div className="p-4 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>
  }
);

// Payment Method Icons and Logos
const PaymentIcon = ({ id, type, provider }: { id: string; type: string; provider: string }) => {
  const iconClass = "h-6";
  
  // Handle by payment method ID first for more specific matching
  switch (id) {
    case 'stripe_card':
      return (
        <div className="flex items-center gap-1">
          <img src="/images/payment/visa.svg" alt="Visa" className={iconClass} />
          <img src="/images/payment/mastercard.svg" alt="Mastercard" className={iconClass} />
          <img src="/images/payment/amex.svg" alt="Amex" className={iconClass} />
          <img src="/images/payment/discover.svg" alt="Discover" className={iconClass} />
        </div>
      );
    case 'google_pay':
      return <img src="/images/payment/google-pay.svg" alt="Google Pay" className={iconClass} />;
    case 'apple_pay':
      return <img src="/images/payment/apple-pay.svg" alt="Apple Pay" className={iconClass} />;
    case 'paypal':
      return <img src="/images/payment/paypal.svg" alt="PayPal" className={iconClass} />;
    case 'klarna':
      return <img src="/images/payment/klarna.svg" alt="Klarna" className={iconClass} />;
    case 'afterpay':
      return <img src="/images/payment/afterpay.svg" alt="Afterpay" className={iconClass} />;
    case 'affirm':
      return <img src="/images/payment/affirm.svg" alt="Affirm" className={iconClass} />;
    case 'braintree':
      return <CreditCard className="h-5 w-5 text-gray-600" />;
    default:
      return <CreditCard className="h-5 w-5 text-gray-600" />;
  }
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, pricing, updatePricingWithTax, isLoading } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const stripePaymentRef = useRef<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>('');
  const [paymentData, setPaymentData] = useState({
    // Credit Card fields
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    // Bank Transfer fields
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    accountHolderName: '',
  });
  const [paymentErrors, setPaymentErrors] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
  });

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
        const authResponse = await fetch('/api/v2/auth/me', {
          credentials: 'include' // Ensure cookies are sent
        });
        console.log('Auth check response:', authResponse.status);
        
        if (!authResponse.ok) {
          console.log('Auth failed, setting as guest');
          setIsGuest(true);
        } else {
          const authData = await authResponse.json();
          console.log('Auth data:', authData);
          
          // Handle V2 API response format { success: true, data: { user: {...} } }
          const userData = authData.data?.user || authData.user || authData.data || authData;
          console.log('Extracted user data:', userData);
          
          if (userData && (userData.user_id || userData.userId)) {
            setFormData(prev => ({
              ...prev,
              firstName: userData.firstName || userData.first_name || '',
              lastName: userData.lastName || userData.last_name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              cardName: `${userData.firstName || userData.first_name || ''} ${userData.lastName || userData.last_name || ''}`.trim(),
            }));
            
            // Load default address
            try {
              const addressResponse = await fetch('/api/v2/users/addresses');
              if (addressResponse.ok) {
                const addressData = await addressResponse.json();
                const addresses = addressData.data?.addresses || addressData.addresses || [];
                const defaultAddress = addresses.find((addr: any) => addr.isDefault);
                
                if (defaultAddress) {
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
            console.log('User authenticated, setting isGuest to false');
          } else {
            setIsGuest(true);
            console.log('No user data found, setting isGuest to true');
          }
        }

        // Load available payment methods based on order total
        const amount = total || 100; // Use 100 as default if total is 0
        const paymentResponse = await fetch(`/api/v2/commerce/payment-methods?amount=${amount}&currency=USD&country=US`);
        
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          // Handle V2 API response format { success: true, data: {...} }
          const methods = paymentData.data?.payment_methods || paymentData.payment_methods || [];
          setPaymentMethods(methods);
          
          // Extract Stripe publishable key from any Stripe payment method
          const stripeMethod = methods.find((m: any) => m.provider === 'stripe' && m.publishable_key);
          if (stripeMethod) {
            setStripePublishableKey(stripeMethod.publishable_key);
          }
          
          // Auto-select the first recommended method
          const recommended = methods.find((m: any) => m.recommended);
          if (recommended) {
            setSelectedPaymentMethod(recommended.id);
          } else if (methods.length > 0) {
            setSelectedPaymentMethod(methods[0].id);
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

  const handlePaymentDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      // Validate card number
      if (value.replace(/\s/g, '').length > 0 && !/^\d+$/.test(value.replace(/\s/g, ''))) {
        setPaymentErrors(prev => ({ ...prev, cardNumber: 'Card number must contain only digits' }));
      } else if (value.replace(/\s/g, '').length > 0 && value.replace(/\s/g, '').length < 13) {
        setPaymentErrors(prev => ({ ...prev, cardNumber: 'Card number must be at least 13 digits' }));
      } else {
        setPaymentErrors(prev => ({ ...prev, cardNumber: '' }));
      }
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/[^\d]/g, '');
      if (formattedValue.length >= 3) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
      // Validate expiry date
      if (formattedValue.length === 5) {
        const month = parseInt(formattedValue.slice(0, 2));
        const year = parseInt('20' + formattedValue.slice(3, 5));
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        if (month < 1 || month > 12) {
          setPaymentErrors(prev => ({ ...prev, expiryDate: 'Invalid month' }));
        } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
          setPaymentErrors(prev => ({ ...prev, expiryDate: 'Card has expired' }));
        } else {
          setPaymentErrors(prev => ({ ...prev, expiryDate: '' }));
        }
      }
    }
    
    // Validate CVC
    if (name === 'cvc') {
      if (!/^\d*$/.test(value)) {
        setPaymentErrors(prev => ({ ...prev, cvc: 'CVC must contain only digits' }));
        return;
      } else if (value.length > 0 && value.length < 3) {
        setPaymentErrors(prev => ({ ...prev, cvc: 'CVC must be at least 3 digits' }));
      } else {
        setPaymentErrors(prev => ({ ...prev, cvc: '' }));
      }
    }
    
    // Validate cardholder name
    if (name === 'cardholderName') {
      if (value.length > 0 && value.length < 2) {
        setPaymentErrors(prev => ({ ...prev, cardholderName: 'Name must be at least 2 characters' }));
      } else if (!/^[a-zA-Z\s]*$/.test(value)) {
        setPaymentErrors(prev => ({ ...prev, cardholderName: 'Name must contain only letters' }));
      } else {
        setPaymentErrors(prev => ({ ...prev, cardholderName: '' }));
      }
    }
    
    setPaymentData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  // Calculate tax when ZIP code changes
  const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if ((name === 'billingZipCode' || (name === 'zipCode' && formData.sameAsShipping)) && value && value.trim().length >= 5) {
      try {
        let customerId = undefined;
        try {
          const authResponse = await fetch('/api/v2/auth/me');
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

        const response = await fetch('/api/v2/commerce/cart/calculate-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pricingRequest)
        });

        if (response.ok) {
          const result = await response.json();
          const data = result.data || result;
          updatePricingWithTax({
            subtotal: data.subtotal,
            vendor_discounts: data.vendor_discounts || [],
            vendor_coupons: data.vendor_coupons || [],
            total_discount_amount: data.total_discount_amount || 0,
            applied_discounts_list: data.applied_discounts_list || [],
            shipping: data.shipping,
            tax: data.tax,
            tax_rate: data.tax_rate,
            tax_breakdown: data.tax_breakdown,
            tax_jurisdiction: data.tax_jurisdiction,
            zip_code: data.zip_code,
            total: data.total,
            vendors_in_cart: data.vendors_in_cart || 1,
            applied_promotions: data.applied_promotions || {}
          });
        }
      } catch (error) {
        console.error('Error calculating tax:', error);
      }
    }
  };

  // Validate payment details based on selected method
  const isPaymentDetailsValid = () => {
    if (!selectedPaymentMethod) return false;
    
    console.log('isPaymentDetailsValid called for:', selectedPaymentMethod);
    
    if (selectedPaymentMethod === 'stripe_card') {
      // Check if card details are filled and valid
      const hasErrors = !!(
        paymentErrors.cardNumber ||
        paymentErrors.expiryDate ||
        paymentErrors.cvc ||
        paymentErrors.cardholderName
      );
      
      const isComplete = !!(
        paymentData.cardNumber && 
        paymentData.cardNumber.replace(/\s/g, '').length >= 13 &&
        paymentData.expiryDate && 
        paymentData.expiryDate.length === 5 &&
        paymentData.cvc && 
        paymentData.cvc.length >= 3 &&
        (paymentData.cardholderName || `${formData.firstName} ${formData.lastName}`.trim())
      );
      
      return !hasErrors && isComplete;
    }
    
    // For all other payment methods (PayPal, Klarna, Afterpay, Apple Pay, Google Pay, etc.) 
    // no additional details needed as they use external authentication
    return true;
  };

  // Create order after successful payment
  const createOrder = async (paymentResult: any) => {
    const orderData = {
      items: items.map(item => ({
        id: item.product_id || 0,
        vendor_id: item.vendor_id || item.configuration?.vendorId || item.configuration?.vendor_id || 1,
        quantity: item.quantity,
        price: item.unit_price,
        name: item.name,
        width: item.width,
        height: item.height,
        colorName: item.colorName || '',
        colorId: item.color_id || 0,
        configuration: item.configuration || {},
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
        transaction_id: paymentResult.provider_response?.id || 'payment_success',
        status: 'completed'
      },
      subtotal: pricing.subtotal,
      shipping_cost: pricing.shipping,
      tax: pricing.tax,
      total: pricing.total,
      discount_amount: pricing.total_discount,
      special_instructions: formData.specialInstructions
    };

    const apiEndpoint = isGuest ? '/api/v2/commerce/orders/create-guest' : '/api/v2/commerce/orders/create';
    
    const finalOrderData = isGuest ? {
      ...orderData,
      createAccount: formData.createAccount,
      guestPassword: formData.guestPassword,
      guestConfirmPassword: formData.guestConfirmPassword,
    } : {
      // Format data for logged-in user's createOrder endpoint
      items: items.map(item => ({
        productId: Number(item.product_id) || 0,
        vendorId: Number(item.vendor_id || item.configuration?.vendorId || item.configuration?.vendor_id) || 1,
        quantity: Number(item.quantity) || 1,
        price: Number(item.unit_price) || 0,
        discountAmount: 0,
        taxAmount: 0,
        configuration: {
          ...item.configuration,
          width: item.width,
          height: item.height,
          colorName: item.colorName || '',
          colorId: item.color_id || 0,
          name: item.name,
        }
      })),
      shippingAddress: {
        street: formData.address + (formData.apt ? `, ${formData.apt}` : ''),
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      },
      billingAddress: formData.sameAsShipping ? {
        street: formData.address + (formData.apt ? `, ${formData.apt}` : ''),
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      } : {
        street: formData.billingAddress + (formData.billingApt ? `, ${formData.billingApt}` : ''),
        city: formData.billingCity,
        state: formData.billingState,
        zipCode: formData.billingZipCode,
        country: formData.billingCountry,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      },
      paymentMethod: selectedPaymentMethod,
      paymentDetails: {
        transactionId: paymentResult.provider_response?.id || 'payment_success',
        status: 'completed',
        amount: pricing.total
      },
      notes: formData.specialInstructions || '',
      subtotal: pricing.subtotal,
      shippingCost: pricing.shipping,
      tax: pricing.tax,
      total: pricing.total,
      discountAmount: pricing.total_discount
    };

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

    const result = await response.json();
    
    // Extract order data from V2 API response
    const orderInfo = result.data || result;
    const orderNumber = orderInfo.order_number || orderInfo.orderNumber || 'Order confirmed';
    
    // Redirect to success page (cart already cleared by order creation)
    router.push(`/checkout/success?order=${orderNumber}`);
  };

  // Handle Stripe Payment Request (Google Pay / Apple Pay)
  const handleStripePaymentMethod = async (paymentData: any) => {
    setLoading(true);
    
    try {
      const paymentRequest = {
        payment_method_id: paymentData.paymentMethod.id,
        amount: pricing.total,
        currency: 'USD',
        payment_data: {
          // Payment method ID from Stripe
          stripe_payment_method_id: paymentData.paymentMethod.id,
        },
        billing_address: {
          email: paymentData.billingDetails.email || formData.email,
          firstName: paymentData.billingDetails.name?.split(' ')[0] || formData.firstName,
          lastName: paymentData.billingDetails.name?.split(' ').slice(1).join(' ') || formData.lastName,
          address: paymentData.billingDetails.address.line1,
          city: paymentData.billingDetails.address.city,
          state: paymentData.billingDetails.address.state,
          zipCode: paymentData.billingDetails.address.postal_code,
          country: paymentData.billingDetails.address.country || 'US'
        },
        shipping_address: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone
        },
        order_items: items.map(item => ({
          name: item.name || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_id: item.product_id?.toString() || ''
        }))
      };

      // Process payment
      const paymentResponse = await fetch('/api/v2/commerce/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      const paymentResult = await paymentResponse.json();
      
      if (!paymentResponse.ok || !paymentResult.success) {
        const errorMessage = paymentResult.error || paymentResult.message || 'Payment failed. Please try again.';
        throw new Error(errorMessage);
      }
      
      // Payment successful, create order
      await createOrder(paymentResult);
    } catch (error) {
      console.error('Payment error:', error);
      throw error; // Re-throw to be handled by the payment request component
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For Google Pay and Apple Pay, trigger the payment through the ref
    if (selectedPaymentMethod === 'google_pay' || selectedPaymentMethod === 'apple_pay') {
      if (stripePaymentRef.current?.triggerPayment) {
        await stripePaymentRef.current.triggerPayment();
      } else {
        console.error('Stripe Payment Request component not ready');
        alert('Payment method not available. Please try again.');
      }
      return;
    }
    
    // Validate payment details for other payment methods
    if (!isPaymentDetailsValid()) {
      if (selectedPaymentMethod === 'stripe_card') {
        // Check for specific errors
        if (paymentErrors.cardNumber || paymentErrors.expiryDate || paymentErrors.cvc || paymentErrors.cardholderName) {
          alert('Please correct the errors in your payment information');
        } else {
          alert('Please complete all required payment information');
        }
      } else {
        alert('Please select a payment method');
      }
      return;
    }
    
    setLoading(true);

    try {
      // First, process the payment
      const paymentRequest = {
        payment_method_id: selectedPaymentMethod,
        amount: pricing.total,
        currency: 'USD',
        payment_data: paymentData,
        billing_address: {
          email: formData.email,
          firstName: formData.sameAsShipping ? formData.firstName : formData.firstName,
          lastName: formData.sameAsShipping ? formData.lastName : formData.lastName,
          address: formData.sameAsShipping ? formData.address : formData.billingAddress,
          city: formData.sameAsShipping ? formData.city : formData.billingCity,
          state: formData.sameAsShipping ? formData.state : formData.billingState,
          zipCode: formData.sameAsShipping ? formData.zipCode : formData.billingZipCode,
          country: formData.sameAsShipping ? formData.country : formData.billingCountry
        },
        shipping_address: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone
        },
        order_items: items.map(item => ({
          name: item.name || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_id: item.product_id?.toString() || ''
        }))
      };

      // Process payment
      const paymentResponse = await fetch('/api/v2/commerce/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      const paymentResult = await paymentResponse.json();
      
      // Handle providers that require redirect or additional action
      if (paymentResult.requires_action) {
        if (paymentResult.provider === 'klarna') {
          // In production, integrate Klarna SDK and redirect to their checkout
          console.log('Klarna session created:', paymentResult.session_id);
          alert('Klarna integration requires frontend SDK implementation. Session ID: ' + paymentResult.session_id);
          throw new Error('Klarna checkout requires additional implementation');
        } else if (paymentResult.provider === 'affirm') {
          // In production, integrate Affirm.js and open their checkout
          console.log('Affirm checkout data:', paymentResult.checkout_data);
          alert('Affirm integration requires frontend SDK implementation.');
          throw new Error('Affirm checkout requires additional implementation');
        } else if (paymentResult.provider === 'paypal') {
          // Redirect to PayPal for approval
          if (paymentResult.approval_url) {
            // Store order data in session/localStorage for when user returns
            localStorage.setItem('pending_order', JSON.stringify({
              paypal_order_id: paymentResult.order_id,
              order_data: orderData,
            }));
            // Redirect to PayPal
            window.location.href = paymentResult.approval_url;
            return; // Stop execution here
          } else {
            throw new Error('PayPal approval URL not provided');
          }
        } else if (paymentResult.provider === 'braintree') {
          // In production, use Braintree Drop-in UI
          console.log('Braintree configuration:', paymentResult);
          alert('Braintree requires Drop-in UI implementation on frontend.');
          throw new Error('Braintree checkout requires additional implementation');
        } else if (paymentResult.client_secret) {
          // Stripe 3D Secure
          alert('This payment requires additional authentication. Please implement Stripe 3D Secure handling.');
          throw new Error('Payment requires authentication');
        }
      }
      
      
      if (!paymentResponse.ok || !paymentResult.success) {
        const errorMessage = paymentResult.error || paymentResult.message || 'Payment failed. Please check your payment details and try again.';
        throw new Error(errorMessage);
      }
      
      // If payment succeeds, create the order
      const orderData = {
        items: items.map(item => ({
          id: item.product_id || 0,
          vendor_id: item.vendor_id || item.configuration?.vendorId || item.configuration?.vendor_id || 1,
          quantity: item.quantity,
          price: item.unit_price,
          name: item.name,
          width: item.width,
          height: item.height,
          colorName: item.colorName || '',
          colorId: item.color_id || 0,
          configuration: item.configuration || {},
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
          transaction_id: paymentResult.provider_response?.id || 'payment_success',
          status: 'completed'
        },
        subtotal: pricing.subtotal,
        shipping_cost: pricing.shipping,
        tax: pricing.tax,
        total: pricing.total,
        discount_amount: pricing.total_discount,
        special_instructions: formData.specialInstructions
      };

      const apiEndpoint = isGuest ? '/api/v2/commerce/orders/create-guest' : '/api/v2/commerce/orders/create';
      console.log('Creating order with endpoint:', apiEndpoint, 'isGuest:', isGuest);
      console.log('Current isGuest state:', isGuest);
      console.log('Form email:', formData.email);
      
      const finalOrderData = isGuest ? {
        ...orderData,
        createAccount: formData.createAccount,
        guestPassword: formData.guestPassword,
        guestConfirmPassword: formData.guestConfirmPassword,
      } : {
        // Format data for logged-in user's createOrder endpoint
        items: items.map(item => ({
          productId: Number(item.product_id) || 0,
          vendorId: Number(item.vendor_id || item.configuration?.vendorId || item.configuration?.vendor_id) || 1,
          quantity: Number(item.quantity) || 1,
          price: Number(item.unit_price) || 0,
          discountAmount: 0,
          taxAmount: 0,
          configuration: {
            ...item.configuration,
            width: item.width,
            height: item.height,
            colorName: item.colorName || '',
            colorId: item.color_id || 0,
            name: item.name,
          }
        })),
        shippingAddress: {
          street: formData.address + (formData.apt ? `, ${formData.apt}` : ''),
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        billingAddress: formData.sameAsShipping ? {
          street: formData.address + (formData.apt ? `, ${formData.apt}` : ''),
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        } : {
          street: formData.billingAddress + (formData.billingApt ? `, ${formData.billingApt}` : ''),
          city: formData.billingCity,
          state: formData.billingState,
          zipCode: formData.billingZipCode,
          country: formData.billingCountry,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        paymentMethod: selectedPaymentMethod,
        paymentDetails: {
          transactionId: paymentResult.provider_response?.id || 'payment_success',
          status: 'completed',
          amount: pricing.total
        },
        notes: formData.specialInstructions || '',
        subtotal: pricing.subtotal,
        shippingCost: pricing.shipping,
        tax: pricing.tax,
        total: pricing.total,
        discountAmount: pricing.total_discount
      };

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

      const result = await response.json();
      
      // Extract order data from V2 API response
      const orderInfo = result.data || result;
      const orderNumber = orderInfo.order_number || orderInfo.orderNumber || 'Order confirmed';
      
      // Redirect to success page (cart already cleared by order creation)
      router.push(`/checkout/success?order=${orderNumber}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentStatus('failed');
      setOrderCompleted(true);
    } finally {
      setLoading(false);
    }
  };

  // Order confirmation
  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
          {paymentStatus === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">Thank you for your purchase. Your payment has been processed successfully.</p>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 inline-block">
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="text-lg font-medium text-gray-900">{orderNumber}</p>
              </div>

              <p className="text-gray-600 mb-8">
                We've sent a confirmation email to <span className="font-medium">{formData.email}</span> with all the details of your order and payment.
              </p>

              <Link href="/" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl inline-block">
                Continue Shopping
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Payment Failed</h1>
              <p className="text-gray-600 mb-6">There was an issue processing your payment. Please try again.</p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>What happened?</strong> Your payment could not be processed. This could be due to:
                </p>
                <ul className="text-xs text-red-700 mt-2 text-left list-disc list-inside">
                  <li>Invalid card details</li>
                  <li>Insufficient funds</li>
                  <li>Bank declined the transaction</li>
                  <li>Network connectivity issues</li>
                </ul>
              </div>

              <div className="space-x-4">
                <button
                  onClick={() => {
                    setOrderCompleted(false);
                    setPaymentStatus(null);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Try Again
                </button>
                <Link href="/cart" className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl inline-block">
                  Back to Cart
                </Link>
              </div>
            </>
          )}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-3">
              <h1 className="text-lg font-bold text-gray-900 mb-3">Checkout</h1>
              

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        First Name *
                        {!isGuest && formData.firstName && (
                          <span className="text-[10px] text-green-600 ml-0.5">(saved)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
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
                        className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
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
                        className={`w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!isGuest ? 'bg-gray-50 text-gray-600' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone Number *</label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        country="US"
                        showCountrySelector={false}
                        required
                        className="w-full [&_input]:h-auto [&_input]:p-1.5 [&_input]:text-sm [&_input]:py-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center">
                    <Truck className="w-3.5 h-3.5 mr-1" />
                    Shipping Address
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Street Address *</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Apt/Suite</label>
                        <input
                          type="text"
                          name="apt"
                          value={formData.apt}
                          onChange={handleInputChange}
                          className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Apt #"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">ZIP *</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          onBlur={handleZipCodeBlur}
                          required
                          className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    Billing Address
                  </h3>
                  <div className="mb-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="sameAsShipping"
                        checked={formData.sameAsShipping}
                        onChange={handleInputChange}
                        className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-1.5 text-xs text-gray-700">Same as shipping address</span>
                    </label>
                  </div>
                  
                  {!formData.sameAsShipping && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">Street Address *</label>
                          <input
                            type="text"
                            name="billingAddress"
                            value={formData.billingAddress}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">Apt/Suite</label>
                          <input
                            type="text"
                            name="billingApt"
                            value={formData.billingApt}
                            onChange={handleInputChange}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">City *</label>
                          <input
                            type="text"
                            name="billingCity"
                            value={formData.billingCity}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">State *</label>
                          <input
                            type="text"
                            name="billingState"
                            value={formData.billingState}
                            onChange={handleInputChange}
                            required={!formData.sameAsShipping}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">ZIP *</label>
                          <input
                            type="text"
                            name="billingZipCode"
                            value={formData.billingZipCode}
                            onChange={handleInputChange}
                            onBlur={handleZipCodeBlur}
                            required={!formData.sameAsShipping}
                            className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select a payment method
                  </h3>
                  
                  {loadingPaymentMethods ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-sm">Loading payment options...</span>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      No payment methods are currently available. Please contact support.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Dynamically render all payment methods from API */}
                      {paymentMethods.map((method) => (
                        <div 
                          key={method.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPaymentMethod === method.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={selectedPaymentMethod === method.id}
                              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{method.name}</span>
                                  <p className="text-xs text-gray-500">{method.description}</p>
                                  {/* Show installment info for BNPL methods */}
                                  {method.type === 'bnpl' && method.installments && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      {method.installments} interest-free payments
                                    </p>
                                  )}
                                </div>
                                <PaymentIcon id={method.id} type={method.type} provider={method.provider} />
                              </div>
                            </div>
                          </label>
                          
                          {/* Card Input Form - only show for stripe_card */}
                          {selectedPaymentMethod === 'stripe_card' && method.id === 'stripe_card' && (
                            <div className="mt-4 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    name="cardNumber"
                                    value={paymentData.cardNumber}
                                    onChange={handlePaymentDataChange}
                                    placeholder="1234 5678 9012 3456"
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                                      paymentErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    maxLength="19"
                                  />
                                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <CreditCard className="h-5 w-5 text-gray-400" />
                                  </div>
                                </div>
                                {paymentErrors.cardNumber && (
                                  <p className="mt-1 text-sm text-red-600">{paymentErrors.cardNumber}</p>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                  <input
                                    type="text"
                                    name="expiryDate"
                                    value={paymentData.expiryDate}
                                    onChange={handlePaymentDataChange}
                                    placeholder="MM/YY"
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                                      paymentErrors.expiryDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    maxLength="5"
                                  />
                                  {paymentErrors.expiryDate && (
                                    <p className="mt-1 text-sm text-red-600">{paymentErrors.expiryDate}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                                  <input
                                    type="text"
                                    name="cvc"
                                    value={paymentData.cvc}
                                    onChange={handlePaymentDataChange}
                                    placeholder="123"
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                                      paymentErrors.cvc ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    maxLength="4"
                                  />
                                  {paymentErrors.cvc && (
                                    <p className="mt-1 text-sm text-red-600">{paymentErrors.cvc}</p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                                <input
                                  type="text"
                                  name="cardholderName"
                                  value={paymentData.cardholderName || `${formData.firstName} ${formData.lastName}`.trim()}
                                  onChange={handlePaymentDataChange}
                                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                                    paymentErrors.cardholderName ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                                {paymentErrors.cardholderName && (
                                  <p className="mt-1 text-sm text-red-600">{paymentErrors.cardholderName}</p>
                                )}
                              </div>
                              <div className="pt-2 text-xs text-gray-500 flex items-center">
                                <Lock className="h-3 w-3 mr-1" />
                                Your payment information is encrypted and secure
                              </div>
                            </div>
                          )}
                          
                          {/* Stripe Payment Request for Google Pay and Apple Pay */}
                          {(selectedPaymentMethod === 'google_pay' || selectedPaymentMethod === 'apple_pay') && 
                           method.id === selectedPaymentMethod && stripePublishableKey && (
                            <StripePaymentRequest
                              ref={stripePaymentRef}
                              amount={pricing.total}
                              currency="USD"
                              country="US"
                              publishableKey={stripePublishableKey}
                              onPaymentMethod={handleStripePaymentMethod}
                              onError={(error) => {
                                console.error('Payment error:', error);
                                setPaymentStatus('failed');
                                setOrderCompleted(true);
                              }}
                              selectedMethod={selectedPaymentMethod}
                              billingDetails={{
                                email: formData.email,
                                name: `${formData.firstName} ${formData.lastName}`.trim(),
                                phone: formData.phone,
                                address: {
                                  line1: formData.address,
                                  city: formData.city,
                                  state: formData.state,
                                  postal_code: formData.zipCode,
                                  country: 'US'
                                }
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Terms and Submit */}
                <div className="space-y-2">
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
                  
                  {/* Show helpful message if button is disabled */}
                  {!loading && selectedPaymentMethod && !formData.acceptTerms && (
                    <p className="text-xs text-red-600 mt-1">
                      Please accept the terms and conditions to continue
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !selectedPaymentMethod || paymentMethods.length === 0 || !isPaymentDetailsValid() || !formData.acceptTerms}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pay Now - ${Number(total ?? 0).toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <div className="bg-white rounded-lg shadow-sm border p-3">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Order Summary</h2>

              <div className="max-h-48 overflow-y-auto mb-2">
                {items.map((item) => (
                  <div key={item.cart_item_id} className="flex items-start py-1.5 border-b border-gray-200 last:border-b-0">
                    <div className="w-8 h-8 flex-shrink-0 rounded overflow-hidden border border-gray-200 mr-2">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-[8px]">IMG</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-medium leading-tight">{item.name}</h3>
                      {(item.width && item.height) && (
                        <p className="text-[10px] text-gray-500">{item.width}" × {item.height}"</p>
                      )}
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-xs font-medium">${Number(item.unit_price ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-gray-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${Number(pricing?.subtotal ?? 0).toFixed(2)}</span>
                </div>
                
                {/* Show vendor discounts */}
                {pricing?.vendor_discounts && pricing.vendor_discounts.length > 0 && (
                  <>
                    {pricing.vendor_discounts.map((discount, idx) => (
                      <div key={idx} className="flex justify-between text-green-600">
                        <span className="text-[10px]">{discount.name}</span>
                        <span>-${Number(discount.amount ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Show coupon discounts */}
                {pricing?.vendor_coupons && pricing.vendor_coupons.length > 0 && (
                  <>
                    {pricing.vendor_coupons.map((coupon, idx) => (
                      <div key={idx} className="flex justify-between text-green-600">
                        <span className="text-[10px]">Coupon: {coupon.code}</span>
                        <span>-${Number(coupon.amount ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
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
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200 mt-1">
                  <span>Total</span>
                  <span>${Number(pricing?.total ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-center text-[10px] text-gray-600">
                  <Truck className="h-3 w-3 mr-1" />
                  Free shipping on orders over $100
                </div>
                <div className="flex items-center text-[10px] text-gray-600">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Secure checkout guaranteed
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}