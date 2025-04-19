'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ChevronLeft, CreditCard, Truck, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [activeStep, setActiveStep] = useState(1); // 1: Shipping, 2: Billing, 3: Payment

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
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",

    // Other
    specialInstructions: "",
    acceptTerms: false,
  });

  // Shipping and tax calculations
  const shipping = subtotal > 100 ? 0 : 15.99;
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + shipping + tax;

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (items.length === 0 && !orderCompleted) {
      router.push("/cart");
    }
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
      // In a real application, this would be an API call to process the order
      // For this example, we'll just simulate a successful order after a delay

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      // Generate a random order number
      const newOrderNumber = `SBH-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderNumber(newOrderNumber);
      setOrderCompleted(true);
      clearCart(); // Clear the cart after successful order
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Order confirmation display
  if (orderCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been received.</p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6 inline-block">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-lg font-medium text-gray-900">{orderNumber}</p>
          </div>

          <p className="text-gray-600 mb-8">
            We've sent a confirmation email to <span className="font-medium">{formData.email}</span> with all the details of your order.
          </p>

          <Link href="/" className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/cart" className="text-primary-red hover:underline flex items-center">
          <ChevronLeft size={16} className="mr-1" />
          Back to Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6">Checkout</h1>

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

            <form onSubmit={handleSubmit}>
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
                <div>
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
                      Card Number *
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="**** **** **** ****"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
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

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        required
                        placeholder="MM/YY"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        required
                        placeholder="***"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
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
                      disabled={loading}
                      className={`bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        `Place Order - $${total.toFixed(2)}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>

            <div className="max-h-80 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start py-3 border-b border-gray-200 last:border-b-0">
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
                      <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                {shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span>${shipping.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
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
                  Secure checkout with 256-bit encryption
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
