'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface CartItem {
  cart_item_id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  width?: number;
  height?: number;
  color_id?: number;
  material_id?: number;
  unit_price: number;
  // UI fields
  name?: string;
  slug?: string;
  colorName?: string;
  materialName?: string;
  mountType?: number;
  mountTypeName?: string;
  controlType?: string;
  headrailId?: number;
  headrailName?: string;
  bottomRailId?: number;
  bottomRailName?: string;
  image?: string;
  totalPrice?: number;
}

interface PricingDetails {
  subtotal: number;
  volume_discount: number;
  coupon_discount: number;
  campaign_discount: number;
  total_discount: number;
  shipping: number;
  tax: number;
  total: number;
  applied_promotions?: {
    coupon_code?: string;
    campaign_code?: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (cart_item_id: number) => Promise<void>;
  updateQuantity: (cart_item_id: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  pricing: PricingDetails;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => void;
  isLoading: boolean;
  pricingError: string | null;
}

const defaultPricing: PricingDetails = {
  subtotal: 0,
  volume_discount: 0,
  coupon_discount: 0,
  campaign_discount: 0,
  total_discount: 0,
  shipping: 0,
  tax: 0,
  total: 0
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  itemCount: 0,
  subtotal: 0,
  pricing: defaultPricing,
  applyCoupon: async () => ({ success: false }),
  removeCoupon: () => {},
  isLoading: false,
  pricingError: null,
});

export const useCart = () => useContext(CartContext);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [pricing, setPricing] = useState<PricingDetails>(defaultPricing);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<{ id?: number; type?: string } | null>(null);

  // Helper function to save cart to localStorage
  const saveGuestCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem('guest_cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  };

  // Helper function to check if user is authenticated
  const isAuthenticated = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCustomerData({ 
          id: data.user?.user_id, 
          type: data.user?.role === 'customer' ? 'retail' : data.user?.role 
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Calculate pricing using the pricing API
  const calculatePricing = async (cartItems: CartItem[], couponCode?: string | null) => {
    if (cartItems.length === 0) {
      setPricing(defaultPricing);
      return;
    }

    try {
      setIsLoading(true);
      setPricingError(null);

      const pricingRequest = {
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          base_price: item.unit_price
        })),
        customer_id: customerData?.id,
        customer_type: customerData?.type,
        coupon_code: couponCode || appliedCoupon,
        shipping_state: 'TX' // TODO: Get from user address
      };

      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingRequest)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to calculate pricing');
      }

      const data = await response.json();
      
      // Calculate shipping based on subtotal after discounts
      const discountedSubtotal = data.pricing.subtotal - data.pricing.discounts.total_discount;
      const shipping = discountedSubtotal > 100 ? 0 : 15.99;
      
      // Calculate tax on discounted subtotal
      const tax = discountedSubtotal * 0.0825; // 8.25% tax rate

      setPricing({
        subtotal: data.pricing.subtotal,
        volume_discount: data.pricing.discounts.volume_discount,
        coupon_discount: data.pricing.discounts.coupon_discount,
        campaign_discount: data.pricing.discounts.campaign_discount,
        total_discount: data.pricing.discounts.total_discount,
        shipping,
        tax,
        total: discountedSubtotal + shipping + tax,
        applied_promotions: data.pricing.applied_promotions
      });

      if (data.coupon_error) {
        setPricingError(data.coupon_error);
        setAppliedCoupon(null);
      }

    } catch (error) {
      console.error('Error calculating pricing:', error);
      setPricingError(error instanceof Error ? error.message : 'Failed to calculate pricing');
      
      // Fallback to basic calculation
      const subtotal = cartItems.reduce((total, item) => total + ((item.unit_price ?? 0) * (item.quantity ?? 1)), 0);
      const shipping = subtotal > 100 ? 0 : 15.99;
      const tax = subtotal * 0.0825;
      
      setPricing({
        ...defaultPricing,
        subtotal,
        shipping,
        tax,
        total: subtotal + shipping + tax
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load cart from API or localStorage on mount
    const loadCart = async () => {
      try {
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          const response = await fetch('/api/account/cart');
          if (response.ok) {
            const data = await response.json();
            setItems(data.items || []);
          }
        } else {
          const savedCart = localStorage.getItem('guest_cart');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setItems(parsedCart);
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    loadCart();
  }, []);

  // Recalculate pricing when items change
  useEffect(() => {
    calculatePricing(items);
  }, [items, customerData]);

  // Add an item to cart
  const addItem = async (newItem: CartItem) => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch('/api/account/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
        }
      } else {
        // Handle guest cart with localStorage
        const existingItemIndex = items.findIndex(
          item => item.product_id === newItem.product_id && 
                  item.width === newItem.width && 
                  item.height === newItem.height &&
                  item.color_id === newItem.color_id
        );

        let updatedItems;
        if (existingItemIndex > -1) {
          // Update existing item quantity
          updatedItems = items.map((item, index) => 
            index === existingItemIndex 
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          );
        } else {
          // Add new item with temporary cart_item_id
          const guestItem = {
            ...newItem,
            cart_item_id: Date.now(), // Temporary ID for guest
            cart_id: 0 // Guest cart ID
          };
          updatedItems = [...items, guestItem];
        }
        
        setItems(updatedItems);
        saveGuestCart(updatedItems);
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  // Remove an item from cart
  const removeItem = async (cart_item_id: number) => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch(`/api/account/cart/items/${cart_item_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
        }
      } else {
        // Handle guest cart
        const updatedItems = items.filter(item => item.cart_item_id !== cart_item_id);
        setItems(updatedItems);
        saveGuestCart(updatedItems);
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  // Update item quantity
  const updateQuantity = async (cart_item_id: number, quantity: number) => {
    try {
      if (quantity <= 0) {
        return removeItem(cart_item_id);
      }

      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch(`/api/account/cart/items/${cart_item_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity })
        });
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
        }
      } else {
        // Handle guest cart
        const updatedItems = items.map(item => 
          item.cart_item_id === cart_item_id 
            ? { ...item, quantity }
            : item
        );
        setItems(updatedItems);
        saveGuestCart(updatedItems);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch('/api/account/cart', {
          method: 'DELETE'
        });
        if (response.ok) {
          setItems([]);
          setAppliedCoupon(null);
        }
      } else {
        // Handle guest cart
        setItems([]);
        setAppliedCoupon(null);
        localStorage.removeItem('guest_cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Apply coupon code
  const applyCoupon = async (code: string): Promise<{ success: boolean; message?: string }> => {
    if (!code) {
      return { success: false, message: 'Please enter a coupon code' };
    }

    setAppliedCoupon(code);
    await calculatePricing(items, code);

    if (pricingError) {
      return { success: false, message: pricingError };
    }

    return { success: true, message: 'Coupon applied successfully' };
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    calculatePricing(items, null);
  };

  // Calculate total number of items
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Calculate subtotal
  const subtotal = items.reduce((total, item) => total + (item.unit_price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        pricing,
        applyCoupon,
        removeCoupon,
        isLoading,
        pricingError
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;
