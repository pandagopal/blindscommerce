'use client';

import { useCart, CartItem } from "@/context/CartContext";
import { useState } from "react";
import { Trash2, Plus, Minus, ShoppingBag, ChevronDown, ChevronUp, Info, Edit3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HelpButton from "@/components/customer/HelpButton";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, pricing, applyCoupon, removeCoupon, isLoading, pricingError } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [editingItems, setEditingItems] = useState<Set<number>>(new Set());
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

  const toggleExpanded = (cart_item_id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(cart_item_id)) {
      newExpanded.delete(cart_item_id);
    } else {
      newExpanded.add(cart_item_id);
    }
    setExpandedItems(newExpanded);
  };

  const toggleEdit = (cart_item_id: number) => {
    const newEditing = new Set(editingItems);
    if (newEditing.has(cart_item_id)) {
      newEditing.delete(cart_item_id);
    } else {
      newEditing.add(cart_item_id);
    }
    setEditingItems(newEditing);
  };

  const handleEditItem = (item: CartItem) => {
    // Navigate to product configurator with current configuration
    // Get slug from configuration if not directly on item
    const slug = item.slug || item.configuration?.slug;
    const configParams = new URLSearchParams();
    
    // Add current configuration as URL params
    // Configuration fields are directly on the item object
    const configFields = [
      'roomType', 'mountType', 'width', 'height', 'widthFraction', 'heightFraction',
      'fabricType', 'fabricOption', 'fabricName', 'colorOption', 'colorName',
      'liftSystem', 'controlOption', 'controlType', 'valanceOption', 'bottomRailOption',
      'headrailName', 'bottomRailName', 'materialName'
    ];
    
    configFields.forEach(field => {
      if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
        configParams.set(field, String(item[field]));
      }
    });
    
    if (!slug) {
      alert('Unable to edit this item: product information missing');
      return;
    }
    const url = `/products/configure/${slug}?edit=${item.cart_item_id}&${configParams.toString()}`;
    router.push(url);
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
    );
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
                <div key={item.cart_item_id} className="border-b border-gray-100">
                  <div className="p-4">
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
                          <div className="ml-4 flex-1">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            <div className="mt-1 text-sm text-gray-500">
                              <p>Dimensions: {item.width}" × {item.height}"</p>
                              {item.configuration?.mountType && (
                                <p>Mount: {item.configuration.mountType.replace(/-/g, ' ')}</p>
                              )}
                              {item.configuration?.controlType && (
                                <p>Control: {item.configuration.controlType.replace(/-/g, ' ')}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="flex items-center text-sm text-green-600 hover:text-green-800"
                              >
                                <Edit3 className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => removeItem(item.cart_item_id)}
                                className="flex items-center text-sm text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Remove
                              </button>
                              <button
                                onClick={() => toggleExpanded(item.cart_item_id)}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                              >
                                <Info className="h-3.5 w-3.5 mr-1" />
                                {expandedItems.has(item.cart_item_id) ? 'Hide' : 'Show'} Details
                                {expandedItems.has(item.cart_item_id) ? (
                                  <ChevronUp className="h-3.5 w-3.5 ml-1" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-2 text-center">
                        ${Number(item.unit_price ?? 0).toFixed(2)}
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className={`p-1 border border-gray-300 rounded-l ${
                              item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Minus className="h-4 w-4 text-gray-500" />
                          </button>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val >= 1) {
                                updateQuantity(item.cart_item_id, val);
                              }
                            }}
                            className="w-10 text-center border-t border-b border-gray-300"
                          />
                          <button
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                            className="p-1 border border-gray-300 rounded-r hover:bg-gray-50"
                          >
                            <Plus className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="col-span-2 text-right font-medium">
                        ${Number((item.unit_price * item.quantity) ?? 0).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Expandable Configuration Details */}
                    {expandedItems.has(item.cart_item_id) && (
                      <div className="px-4 pb-4 bg-gray-50 mt-4 rounded-lg">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Complete Configuration Details</h4>
                            <button
                              onClick={() => handleEditItem(item)}
                              className="flex items-center text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit Item
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                            {/* Basic Configuration */}
                            <div className="bg-blue-50 p-2 rounded">
                              <h5 className="font-medium text-blue-800 mb-1">Basic Details</h5>
                              {item.roomType && (
                                <div className="flex justify-between text-blue-700">
                                  <span>room:</span>
                                  <span className="font-medium">{item.roomType.toLowerCase()}</span>
                                </div>
                              )}
                              {item.mountType && (
                                <div className="flex justify-between text-blue-700">
                                  <span>mount:</span>
                                  <span className="font-medium">{item.mountType.replace(/-/g, ' ').toLowerCase()}</span>
                                </div>
                              )}
                              {(item.width || item.height) && (
                                <div className="flex justify-between text-blue-700">
                                  <span>size:</span>
                                  <span className="font-medium">{item.width}" × {item.height}"</span>
                                </div>
                              )}
                            </div>

                            {/* Fabric & Materials */}
                            <div className="bg-purple-50 p-2 rounded">
                              <h5 className="font-medium text-purple-800 mb-1">Materials</h5>
                              {(item.fabricName || item.fabricType) && (
                                <div className="flex justify-between text-purple-700">
                                  <span>fabric:</span>
                                  <span className="font-medium">
                                    {(item.fabricName || 
                                     item.fabricOption || 
                                     `fabric #${item.fabricType}`).toLowerCase()}
                                  </span>
                                </div>
                              )}
                              {item.fabricOption && (
                                <div className="flex justify-between text-purple-700">
                                  <span>fabric option:</span>
                                  <span className="font-medium">{item.fabricOption.toLowerCase()}</span>
                                </div>
                              )}
                              {item.colorOption && (
                                <div className="flex justify-between text-purple-700">
                                  <span>color:</span>
                                  <span className="font-medium">{item.colorOption.toLowerCase()}</span>
                                </div>
                              )}
                              {item.colorName && (
                                <div className="flex justify-between text-purple-700">
                                  <span>color name:</span>
                                  <span className="font-medium">{item.colorName.toLowerCase()}</span>
                                </div>
                              )}
                              {item.materialName && (
                                <div className="flex justify-between text-purple-700">
                                  <span>material:</span>
                                  <span className="font-medium">{item.materialName.toLowerCase()}</span>
                                </div>
                              )}
                            </div>

                            {/* Controls & Hardware */}
                            <div className="bg-green-50 p-2 rounded">
                              <h5 className="font-medium text-green-800 mb-1">Controls</h5>
                              {item.controlType && (
                                <div className="flex justify-between text-green-700">
                                  <span>control:</span>
                                  <span className="font-medium">{item.controlType.replace(/-/g, ' ').toLowerCase()}</span>
                                </div>
                              )}
                              {item.liftSystem && (
                                <div className="flex justify-between text-green-700">
                                  <span>lift:</span>
                                  <span className="font-medium">{item.liftSystem.toLowerCase()}</span>
                                </div>
                              )}
                            </div>

                            {/* Rail Options */}
                            <div className="bg-orange-50 p-2 rounded">
                              <h5 className="font-medium text-orange-800 mb-1">Rail Options</h5>
                              {item.valanceOption && (
                                <div className="flex justify-between text-orange-700">
                                  <span>valance:</span>
                                  <span className="font-medium">{item.valanceOption.replace(/-/g, ' ').toLowerCase()}</span>
                                </div>
                              )}
                              {item.bottomRailOption && (
                                <div className="flex justify-between text-orange-700">
                                  <span>bottom rail:</span>
                                  <span className="font-medium">{item.bottomRailOption.replace(/-/g, ' ').toLowerCase()}</span>
                                </div>
                              )}
                              {item.headrailName && (
                                <div className="flex justify-between text-orange-700">
                                  <span>headrail:</span>
                                  <span className="font-medium">{item.headrailName.toLowerCase()}</span>
                                </div>
                              )}
                              {item.bottomRailName && (
                                <div className="flex justify-between text-orange-700">
                                  <span>bottom rail type:</span>
                                  <span className="font-medium">{item.bottomRailName.toLowerCase()}</span>
                                </div>
                              )}
                            </div>

                          </div>

                          <div className="mt-3 pt-2 border-t border-gray-200 text-center">
                            <p className="text-xs text-gray-500">
                              all features displayed in lowercase for compact viewing • 
                              <button 
                                onClick={() => handleEditItem(item)}
                                className="text-green-600 hover:text-green-800 ml-1 underline"
                              >
                                click edit to modify any option
                              </button>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="p-4 flex justify-end items-center">
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
                  <span>${Number(subtotal || 0).toFixed(2)}</span>
                </div>

                {/* Promo Code */}
                <div className="border-b pb-4">
                  <p className="mb-2">Promo Code</p>
                  <div className="flex">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && promoCode.trim()) {
                          applyPromoCode();
                        }
                      }}
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
                  {pricing?.applied_promotions?.coupon_code && (
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
                      <span>-${Number(pricing?.volume_discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(pricing?.coupon_discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span>-${Number(pricing?.coupon_discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(pricing?.campaign_discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Promotional Discount</span>
                      <span>-${Number(pricing?.campaign_discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{Number(pricing?.shipping || 0) === 0 ? 'Free' : `$${Number(pricing?.shipping || 0).toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${Number(subtotal + (pricing?.shipping || 0) - (pricing?.total_discount_amount || 0)).toFixed(2)}</span>
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