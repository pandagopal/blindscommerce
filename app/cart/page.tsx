'use client';

import { useCart, CartItem } from "@/context/CartContext";
import { useState } from "react";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HelpButton from "@/components/customer/HelpButton";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart, pricing, applyCoupon, removeCoupon, isLoading, pricingError } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const router = useRouter();

  const applyPromoCode = async () => {
    setApplyingCoupon(true);
    const result = await applyCoupon(promoCode);
    
    if (result.success) {
      setPromoCode("");
    } else {
      alert(result.message || "Invalid promo code");
    }
    setApplyingCoupon(false);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-8 max-w-md mx-auto">
          <div className="mb-6">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-red hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Shopping Cart</h1>
          <HelpButton className="bg-purple-600 hover:bg-purple-700 text-white" />
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items - Left Side */}
        <div className="lg:col-span-8">
          <div className="bg-white shadow-lg rounded-xl border border-purple-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 font-medium">Product</div>
                <div className="col-span-2 font-medium text-center">Price</div>
                <div className="col-span-2 font-medium text-center">Quantity</div>
                <div className="col-span-2 font-medium text-right">Total</div>
              </div>
            </div>

            {items.map((item) => (
              <div key={item.id} className="p-4 border-b border-gray-100">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Product Image and Info */}
                  <div className="col-span-6">
                    <div className="flex">
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={item.image || '/placeholder-product.jpg'}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <div className="mt-1 text-sm text-gray-500">
                          <p>Dimensions: {item.width}" × {item.height}"</p>
                          {item.colorName && <p>Color: {item.colorName}</p>}
                          {item.materialName && <p>Material: {item.materialName}</p>}
                          {item.mountTypeName && <p>Mount: {item.mountTypeName}</p>}
                          {item.controlType && <p>Control: {item.controlType}</p>}
                          {item.headrailName && <p>Headrail: {item.headrailName}</p>}
                          {item.bottomRailName && <p>Bottom Rail: {item.bottomRailName}</p>}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="mt-2 flex items-center text-sm text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-center">
                    ${(item.price ?? 0).toFixed(2)}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 border border-gray-300 rounded-l"
                      >
                        <Minus className="h-4 w-4 text-gray-500" />
                      </button>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            updateQuantity(item.id, val);
                          }
                        }}
                        className="w-10 text-center border-t border-b border-gray-300"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 border border-gray-300 rounded-r"
                      >
                        <Plus className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="col-span-2 text-right font-medium">
                    ${(item.totalPrice ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <div className="p-4 flex justify-between items-center">
              <button
                onClick={() => clearCart()}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Cart
              </button>
              <Link
                href="/products"
                className="text-sm bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700 font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Order Summary - Right Side */}
        <div className="lg:col-span-4">
          <div className="bg-white shadow-lg rounded-xl border border-purple-100 p-6">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span>Subtotal</span>
                <span>${(pricing?.subtotal || 0).toFixed(2)}</span>
              </div>

              {/* Promo Code */}
              <div className="border-b pb-4">
                <p className="mb-2">Promo Code</p>
                <div className="flex">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 p-2 border border-gray-300 rounded-l"
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={applyingCoupon || isLoading}
                    className="px-4 bg-gray-100 border border-l-0 border-gray-300 rounded-r disabled:opacity-50"
                  >
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {pricing.applied_promotions?.coupon_code && (
                  <div className="mt-2 text-sm text-green-600 flex items-center justify-between">
                    <span>Promo code {pricing.applied_promotions.coupon_code} applied!</span>
                    <button
                      onClick={removeCoupon}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="border-b pb-4 space-y-2">
                {(pricing?.volume_discount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Volume Discount</span>
                    <span>-${(pricing?.volume_discount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(pricing?.coupon_discount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-${(pricing?.coupon_discount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(pricing?.campaign_discount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promotional Discount</span>
                    <span>-${(pricing?.campaign_discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{(pricing?.shipping || 0) === 0 ? 'Free' : `$${(pricing?.shipping || 0).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${(pricing?.tax || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${(pricing?.total || 0).toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-primary-red hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Proceed to Checkout
              </button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By proceeding to checkout, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
