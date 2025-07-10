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
  // Room and configuration fields
  roomType?: string;
  configuration?: any;
  // Allow any additional fields for configurator data
  [key: string]: any;
}

interface VendorDiscount {
  type: 'vendor_discount' | 'vendor_coupon';
  vendor_id: number;
  vendor_name: string;
  discount_id?: number;
  coupon_id?: number;
  coupon_code?: string;
  name: string;
  discount_type: string;
  amount: number;
  applied_to: string;
  vendor_subtotal?: number;
  vendor_subtotal_after?: number;
}

interface PricingDetails {
  subtotal: number;
  vendor_discounts: VendorDiscount[];
  vendor_coupons: VendorDiscount[];
  total_discount_amount: number;
  applied_discounts_list: VendorDiscount[];
  shipping: number;
  tax: number;
  tax_rate: number;
  tax_breakdown?: {
    state_tax: number;
    county_tax: number;
    city_tax: number;
    special_district_tax: number;
  };
  tax_jurisdiction?: string;
  zip_code?: string;
  total: number;
  vendors_in_cart: number;
  applied_promotions?: {
    coupon_code?: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (cart_item_id: number) => Promise<void>;
  updateQuantity: (cart_item_id: number, quantity: number) => Promise<void>;
  updateItem: (cart_item_id: number, item: CartItem) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  pricing: PricingDetails;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => void;
  updateZipCode: (zipCode: string) => void;
  updatePricingWithTax: (newPricing: PricingDetails) => void;
  isLoading: boolean;
  pricingError: string | null;
}

const defaultPricing: PricingDetails = {
  subtotal: 0,
  vendor_discounts: [],
  vendor_coupons: [],
  total_discount_amount: 0,
  applied_discounts_list: [],
  shipping: 0,
  tax: 0,
  tax_rate: 0,
  total: 0,
  vendors_in_cart: 0,
  applied_promotions: {}
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  updateItem: async () => {},
  clearCart: async () => {},
  itemCount: 0,
  subtotal: 0,
  pricing: defaultPricing,
  applyCoupon: async () => ({ success: false }),
  removeCoupon: () => {},
  updateZipCode: () => {},
  updatePricingWithTax: () => {},
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
  const [zipCode, setZipCode] = useState<string>('78701'); // Default to Austin, TX

  // Helper function to save cart to localStorage
  const saveGuestCart = (cartItems: CartItem[]) => {
    try {
      const cartData = {
        items: cartItems,
        appliedCoupon,
        zipCode
      };
      localStorage.setItem('guest_cart', JSON.stringify(cartData));
    } catch (error) {
      // Error saving to localStorage
    }
  };

  // Helper function to check if user is authenticated and is a customer
  const isAuthenticated = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/v2/auth/me');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;// Only allow customers to use the cart
        if (data.user?.role === 'customer') {
          setCustomerData({ 
            id: data.user?.user_id, 
            type: 'retail'
          });
          return true;
        }
        // For non-customers, clear customer data and return false
        setCustomerData(null);
        return false;
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
        coupon_code: couponCode || appliedCoupon
        // Note: tax calculation only happens at checkout with ZIP code
      };

      // Create cache key based on request content
      // Calculate pricing without cache

      const response = await fetch('/api/v2/commerce/cart/calculate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingRequest)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to calculate pricing');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to calculate pricing');
      }
      const data = result.data;
      
      const pricingData = {
        subtotal: data.subtotal || 0,
        vendor_discounts: data.vendor_discounts || [],
        vendor_coupons: data.vendor_coupons || [],
        total_discount_amount: data.total_discount_amount || 0,
        applied_discounts_list: data.applied_discounts_list || [],
        shipping: data.shipping || 0,
        tax: data.tax || 0,
        tax_rate: data.tax_rate || 0,
        tax_breakdown: data.tax_breakdown,
        tax_jurisdiction: data.tax_jurisdiction,
        zip_code: data.zip_code,
        total: data.total || 0,
        vendors_in_cart: data.vendors_in_cart || 0,
        applied_promotions: data.applied_promotions || {}
      };

      // Pricing data calculated successfully

      setPricing(pricingData);

      if (data.coupon_error) {
        setPricingError(data.coupon_error);
        setAppliedCoupon(null);
      }

    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'Failed to calculate pricing');
      // No fallback - pricing calculation must succeed through the API
      setPricing(defaultPricing);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load cart from API or localStorage on mount
    const loadCart = async () => {
      setIsLoading(true);
      try {
        const authenticated = await isAuthenticated();
        console.log('CartContext: Loading cart, authenticated:', authenticated);
        
        if (authenticated) {
          const response = await fetch('/api/v2/commerce/cart');
          console.log('CartContext: Cart API response status:', response.status);
          if (response.ok) {
            const result = await response.json();
            console.log('CartContext: Cart API result:', result);
            if (result.success) {
              const data = result.data || result;
              setItems(data.items || []);
              console.log('CartContext: Loaded', data.items?.length || 0, 'items from API');
              // Clear localStorage after successful load from API
              try {
                localStorage.removeItem('guest_cart');
              } catch (e) {
                // Ignore localStorage errors
              }
            }
          }
        } else {
          const savedCart = localStorage.getItem('guest_cart');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            // Handle both old format (just items array) and new format (object with items, coupon, zipCode)
            if (Array.isArray(parsedCart)) {
              setItems(parsedCart);
            } else {
              setItems(parsedCart.items || []);
              setAppliedCoupon(parsedCart.appliedCoupon || null);
              setZipCode(parsedCart.zipCode || '78701');
            }
          }
        }
      } catch (error) {
        // Error loading cart
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
    
    // Listen for storage events to reload cart after login
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_changed') {
        console.log('CartContext: Auth changed, reloading cart');
        loadCart();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for login success in URL
    if (window.location.search.includes('login=success')) {
      console.log('CartContext: Login success detected, reloading cart');
      setTimeout(loadCart, 1000); // Delay to ensure auth cookie is set
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Recalculate pricing when items or ZIP code changes
  useEffect(() => {
    calculatePricing(items);
  }, [items, customerData, zipCode]);

  // Add an item to cart
  const addItem = async (newItem: CartItem) => {
    try {
      // Check user role - only customers and guests can add to cart
      const response = await fetch('/api/v2/auth/me');
      console.log('Auth check response status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('Auth check full result:', JSON.stringify(result, null, 2));
        const data = result.data || result;
        // Check if user exists and their role
        const userRole = data.user?.role || data.role;
        console.log('Extracted user role:', userRole);
        if (userRole && userRole !== 'customer') {
          // User is logged in but not a customer
          alert('Only customers can add items to cart. Please log in with a customer account.');
          return;
        }
      } else {
        console.log('Auth check failed:', response.status, 'Treating as guest user');
      }
      // If response is not ok, user is not authenticated (guest user) - allow them to proceed
      
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // Extract only the fields the API expects
        const productId = newItem.productId || newItem.product_id;
        const vendorId = newItem.vendorId || newItem.vendor_id;
        
        // Validate required fields
        if (!productId || !vendorId) {
          console.error('Missing required fields:', { productId, vendorId, newItem });
          alert('Unable to add item to cart. Product information is incomplete.');
          return;
        }
        
        const apiData = {
          productId: parseInt(productId),
          vendorId: parseInt(vendorId),
          quantity: newItem.quantity || 1,
          configuration: {
            // Include display fields that cart page needs
            name: newItem.name || '',
            slug: newItem.slug || '',
            image: newItem.image || '',
            unit_price: newItem.unit_price || 0,
            // Configuration details
            width: newItem.width?.toString() || '0',
            height: newItem.height?.toString() || '0',
            widthFraction: newItem.widthFraction?.toString() || '0',
            heightFraction: newItem.heightFraction?.toString() || '0',
            roomType: newItem.roomType || '',
            mountType: newItem.mountType || '',
            fabricType: newItem.fabricType || '',
            fabricName: newItem.fabricName || '',
            colorOption: newItem.colorOption || '',
            controlOption: newItem.controlOption || newItem.controlType || '',
            valanceOption: newItem.valanceOption || '',
            bottomRailOption: newItem.bottomRailOption || '',
            // Include any other fields from the original configuration
            ...(newItem.configuration || {})
          }
        };
        
        console.log('Sending to cart API:', apiData);
        
        const response = await fetch('/api/v2/commerce/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData)
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // After successfully adding item, reload the entire cart
            const cartResponse = await fetch('/api/v2/commerce/cart');
            if (cartResponse.ok) {
              const cartResult = await cartResponse.json();
              if (cartResult.success) {
                const cartData = cartResult.data || cartResult;
                setItems(cartData.items || []);
              }
            }
          }
        } else {
          // API error adding item
          let errorMessage = 'Failed to add item to cart';
          try {
            const errorData = await response.json();
            console.error('Error adding to cart:', {
              status: response.status,
              statusText: response.statusText,
              errorData,
              sentData: apiData
            });
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          alert(`${errorMessage}. Please try again.`);
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
      // Error adding item to cart
    }
  };

  // Remove an item from cart
  const removeItem = async (cart_item_id: number) => {
    try {
      // Check user role - only customers and guests can modify cart
      const response = await fetch('/api/v2/auth/me');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        if (data.user && data.user.role !== 'customer') {
          alert('Only customers can modify cart items. Please log in with a customer account.');
          return;
        }
      }
      // If response is not ok, user is not authenticated (guest user) - allow them to proceed
      
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch(`/api/v2/commerce/cart/items/${cart_item_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          // After successful deletion, fetch the updated cart
          const cartResponse = await fetch('/api/v2/commerce/cart');
          if (cartResponse.ok) {
            const cartResult = await cartResponse.json();
            if (cartResult.success) {
              const cartData = cartResult.data || cartResult;
              setItems(cartData.items || []);
              // Recalculate pricing
              await calculatePricing(cartData.items || [], appliedCoupon);
            }
          }
        }
      } else {
        // Handle guest cart
        const updatedItems = items.filter(item => item.cart_item_id !== cart_item_id);
        setItems(updatedItems);
        saveGuestCart(updatedItems);
        // Recalculate pricing
        await calculatePricing(updatedItems, appliedCoupon);
      }
    } catch (error) {
      // Error removing item from cart
    }
  };

  // Update item quantity
  const updateQuantity = async (cart_item_id: number, quantity: number) => {
    try {
      if (quantity <= 0) {
        return; // Don't remove item, just prevent zero quantities
      }

      // Check user role - only customers and guests can modify cart
      const response = await fetch('/api/v2/auth/me');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        if (data.user && data.user.role !== 'customer') {
          alert('Only customers can modify cart items. Please log in with a customer account.');
          return;
        }
      }
      // If response is not ok, user is not authenticated (guest user) - allow them to proceed

      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch(`/api/v2/commerce/cart/items/${cart_item_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const data = result.data || result;
            setItems(data.items || []);
          }
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
      // Error updating cart item
    }
  };

  // Update an entire cart item (for editing)
  const updateItem = async (cart_item_id: number, newItem: CartItem) => {
    try {
      // Check user role - only customers and guests can modify cart
      const response = await fetch('/api/v2/auth/me');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        if (data.user && data.user.role !== 'customer') {
          alert('Only customers can modify cart items. Please log in with a customer account.');
          return;
        }
      }
      
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // Extract configuration from newItem
        const configuration = {
          // Include display fields that cart page needs
          name: newItem.name || '',
          slug: newItem.slug || '',
          image: newItem.image || '',
          unit_price: newItem.unit_price || 0,
          // Configuration details
          roomType: newItem.roomType || '',
          mountType: newItem.mountType || '',
          width: newItem.width?.toString() || '0',
          height: newItem.height?.toString() || '0',
          widthFraction: newItem.widthFraction?.toString() || '0',
          heightFraction: newItem.heightFraction?.toString() || '0',
          fabricType: newItem.fabricType || '',
          fabricName: newItem.fabricName || '',
          colorOption: newItem.colorOption || '',
          controlOption: newItem.controlOption || newItem.controlType || '',
          valanceOption: newItem.valanceOption || '',
          bottomRailOption: newItem.bottomRailOption || '',
          // Include any other fields from the original configuration
          ...(newItem.configuration || {})
        };
        
        const response = await fetch(`/api/v2/commerce/cart/items/${cart_item_id}/full`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: newItem.quantity || 1,
            configuration
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const cartData = result.data || result;
            setItems(cartData.items || []);
          }
        } else {
          alert('Failed to update cart item. Please try again.');
        }
      } else {
        // Handle guest cart update
        const updatedItems = items.map(item => 
          item.cart_item_id === cart_item_id 
            ? { ...newItem, cart_item_id } // Keep the same cart_item_id
            : item
        );
        setItems(updatedItems);
        saveGuestCart(updatedItems);
      }
    } catch (error) {
      alert('Failed to update cart item. Please try again.');
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      // Check user role - only customers and guests can modify cart
      const response = await fetch('/api/v2/auth/me');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        if (data.user && data.user.role !== 'customer') {
          alert('Only customers can modify cart items. Please log in with a customer account.');
          return;
        }
      }
      // If response is not ok, user is not authenticated (guest user) - allow them to proceed
      
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch('/api/v2/commerce/cart/clear', {
          method: 'POST'
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setItems([]);
            setAppliedCoupon(null);
          }
        }
      } else {
        // Handle guest cart
        setItems([]);
        setAppliedCoupon(null);
        setZipCode('78701');
        localStorage.removeItem('guest_cart');
      }
    } catch (error) {
      // Error clearing cart
    }
  };

  // Apply coupon code
  const applyCoupon = async (code: string): Promise<{ success: boolean; message?: string }> => {
    if (!code) {
      return { success: false, message: 'Please enter a coupon code' };
    }

    try {
      setIsLoading(true);
      setPricingError(null);

      const pricingRequest = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          base_price: item.unit_price
        })),
        customer_id: customerData?.id,
        customer_type: customerData?.type,
        coupon_code: code
      };

      console.log('Applying coupon with request:', pricingRequest);
      
      const response = await fetch('/api/v2/commerce/cart/calculate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingRequest)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Coupon application failed:', error);
        throw new Error(error.message || error.error || 'Failed to apply coupon');
      }

      const result = await response.json();
      console.log('Coupon API response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to apply coupon');
      }
      
      // Handle double-wrapped response from calculate-pricing endpoint
      const data = result.data?.data || result.data;
      console.log('Extracted pricing data:', data);
      console.log('Coupon validation result:', {
        hasVendorCoupons: data.vendor_coupons?.length > 0,
        vendorCoupons: data.vendor_coupons,
        appliedPromotions: data.applied_promotions,
        totalDiscount: data.total_discount_amount
      });
      
      // Update pricing state with new data
      const pricingData = {
        subtotal: data.subtotal || 0,
        vendor_discounts: data.vendor_discounts || [],
        vendor_coupons: data.vendor_coupons || [],
        total_discount_amount: data.total_discount_amount || 0,
        applied_discounts_list: data.applied_discounts_list || [],
        shipping: data.shipping || 0,
        tax: data.tax || 0,
        tax_rate: data.tax_rate || 0,
        tax_breakdown: data.tax_breakdown,
        tax_jurisdiction: data.tax_jurisdiction,
        zip_code: data.zip_code,
        total: data.total || 0,
        vendors_in_cart: data.vendors_in_cart || 0,
        applied_promotions: data.applied_promotions || {}
      };

      setPricing(pricingData);
      
      // Only set applied coupon if we actually have discounts
      if (data.vendor_coupons?.length > 0 || data.total_discount_amount > 0) {
        setAppliedCoupon(code);
      }
      
      // Check if coupon was successfully applied
      console.log('Checking coupon success:', {
        vendorCouponsLength: data.vendor_coupons?.length,
        vendorCoupons: data.vendor_coupons,
        vendorCouponsType: typeof data.vendor_coupons,
        vendorCouponsIsArray: Array.isArray(data.vendor_coupons),
        appliedPromotionsCode: data.applied_promotions?.coupon_code,
        providedCode: code,
        condition1: data.vendor_coupons?.length > 0,
        condition2: data.applied_promotions?.coupon_code === code,
        dataKeys: Object.keys(data)
      });
      
      // Force success if we have vendor coupons in the response
      const hasCoupons = Array.isArray(data.vendor_coupons) && data.vendor_coupons.length > 0;
      const hasAppliedPromotion = data.applied_promotions?.coupon_code === code;
      
      if (hasCoupons || hasAppliedPromotion) {
        console.log('Coupon successfully applied!', { hasCoupons, hasAppliedPromotion });
        return { success: true, message: 'Coupon applied successfully' };
      } else {
        console.log('Coupon validation failed in frontend', { hasCoupons, hasAppliedPromotion });
        setAppliedCoupon(null);
        return { success: false, message: 'Coupon code not valid for items in cart' };
      }
      
    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'Failed to apply coupon');
      setAppliedCoupon(null);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to apply coupon' };
    } finally {
      setIsLoading(false);
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    calculatePricing(items, null);
  };

  // Update ZIP code for tax calculation
  const updateZipCode = (newZipCode: string) => {
    setZipCode(newZipCode);
  };

  // Update pricing externally (used by checkout page for tax calculation)
  const updatePricingWithTax = (newPricing: PricingDetails) => {
    setPricing(newPricing);
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
        updateItem,
        clearCart,
        itemCount,
        subtotal,
        pricing,
        applyCoupon,
        removeCoupon,
        updateZipCode,
        updatePricingWithTax,
        isLoading,
        pricingError
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;
