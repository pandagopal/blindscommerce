'use client';

import { Metadata } from "next";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Calculate shipping cost (simplified for demo)
  const shippingCost = subtotal > 100 ? 0 : 15.99;

  // Calculate tax (simplified for demo - 8%)
  const taxRate = 0.08;
  const taxAmount = (subtotal - discount) * taxRate;

  // Calculate total
  const total = subtotal - discount + shippingCost + taxAmount;

  // Apply promo code
  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === "WELCOME10") {
      // 10% discount
      setDiscount(subtotal * 0.1);
      setPromoApplied(true);
    } else if (promoCode.toUpperCase() === "FREESHIP") {
      // Free shipping discount
      setDiscount(shippingCost);
      setPromoApplied(true);
    } else {
      alert("Invalid promo code");
      setPromoApplied(false);
      setDiscount(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
            <p className="mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
          </div>
          <Link
            href="/products"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="hidden md:grid md:grid-cols-12 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                <div className="md:col-span-6">Product</div>
                <div className="md:col-span-2 text-center">Price</div>
                <div className="md:col-span-2 text-center">Quantity</div>
                <div className="md:col-span-2 text-center">Total</div>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-b border-gray-200 last:border-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                >
                  {/* Product */}
                  <div className="md:col-span-6 flex items-center">
                    <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden border border-gray-200 mr-4">
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
                    <div>
                      <h3 className="font-medium">
                        <Link
                          href={`/products/${item.slug}`}
                          className="hover:text-primary-red"
                        >
                          {item.name}
                        </Link>
                      </h3>
                      {(item.width && item.height) && (
                        <p className="text-sm text-gray-500 mt-1">
                          Dimensions: {item.width}" × {item.height}"
                        </p>
                      )}
                      {item.colorName && (
                        <p className="text-sm text-gray-500">
                          Color: {item.colorName}
                        </p>
                      )}
                      {item.materialName && (
                        <p className="text-sm text-gray-500">
                          Material: {item.materialName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="md:col-span-2 text-center">
                    <div className="flex items-center justify-between md:justify-center">
                      <span className="md:hidden text-sm text-gray-500">Price:</span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-center">
                    <span className="md:hidden text-sm text-gray-500">Quantity:</span>
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-gray-500 hover:text-primary-red border border-gray-300 rounded-l-md p-1"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            updateQuantity(item.id, value);
                          }
                        }}
                        className="w-10 text-center border-t border-b border-gray-300 p-1"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-gray-500 hover:text-primary-red border border-gray-300 rounded-r-md p-1"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-center">
                    <span className="md:hidden text-sm text-gray-500">Total:</span>
                    <div className="flex items-center">
                      <span className="font-medium mr-4">${item.totalPrice.toFixed(2)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-primary-red"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between">
              <Link
                href="/products"
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-6 rounded-lg transition-colors text-center"
              >
                Continue Shopping
              </Link>
              <button
                onClick={() => window.confirm("Are you sure you want to clear your cart?") && useCart().clearCart()}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>${shippingCost.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <label
                  htmlFor="promo-code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Promo Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="promo-code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                    placeholder="Enter code"
                    className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-primary-red focus:border-primary-red disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <button
                    onClick={promoApplied ? () => {
                      setPromoApplied(false);
                      setDiscount(0);
                      setPromoCode("");
                    } : applyPromoCode}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-r-md transition-colors"
                  >
                    {promoApplied ? "Remove" : "Apply"}
                  </button>
                </div>
                {promoApplied && (
                  <p className="text-green-600 text-xs mt-1">
                    Promo code applied successfully!
                  </p>
                )}
              </div>

              <Link
                href="/checkout"
                className="w-full bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg text-center block transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
