'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface CartItem {
  cart_item_id: number;
  cart_id: number;
  product_id: number;
  vendor_id: number;
  vendor_name: string;
  quantity: number;
  width?: number;
  height?: number;
  color_id?: number;
  material_id?: number;
  unit_price: number;
  discounted_price?: number;
  original_price?: number;
  discount_amount?: number;
  saved_for_later: boolean;
  price_at_add?: number;
  expiry_date?: string;
  notes?: string;
  is_gift: boolean;
  gift_message?: string;
  scheduled_delivery_date?: string;
  installation_requested: boolean;
  sample_requested: boolean;
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
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  price_changed?: boolean;
  shipping_address_id?: number;
}

export interface VendorDiscount {
  vendor_id: number;
  vendor_name: string;
  discount_id: number;
  discount_name: string;
  discount_type: 'percentage' | 'fixed_amount' | 'tiered' | 'free_shipping' | 'upgrade';
  discount_amount: number;
  applied_items: Array<{
    cart_item_id: number;
    original_price: number;
    discounted_price: number;
    discount_amount: number;
  }>;
  subtotal_before: number;
  subtotal_after: number;
  is_automatic?: boolean;
  coupon_code?: string;
}

export interface VendorCartSummary {
  vendor_id: number;
  vendor_name: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  discount_amount: number;
  subtotal_after_discount: number;
  applied_discounts: VendorDiscount[];
  applied_coupons: VendorDiscount[];
  shipping_cost?: number;
  tax_amount?: number;
  total: number;
}

export interface CouponValidation {
  isValid: boolean;
  coupon?: any;
  discount_amount?: number;
  applicable_items?: CartItem[];
  error?: string;
  warnings?: string[];
}

interface VendorCartContextType {
  // Core cart functionality
  items: CartItem[];
  savedForLaterItems: CartItem[];
  addItem: (item: Omit<CartItem, 'cart_item_id' | 'cart_id'>) => Promise<void>;
  removeItem: (cart_item_id: number) => Promise<void>;
  updateQuantity: (cart_item_id: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Cart summary by vendor
  vendorSummaries: VendorCartSummary[];
  totalItems: number;
  totalSubtotal: number;
  totalDiscountAmount: number;
  totalAfterDiscounts: number;
  
  // Vendor discount management
  appliedDiscounts: VendorDiscount[];
  appliedCoupons: VendorDiscount[];
  refreshDiscounts: () => Promise<void>;
  
  // Coupon functionality
  applyCoupon: (coupon_code: string) => Promise<{ success: boolean; message: string; error?: string }>;
  removeCoupon: (coupon_code: string) => Promise<{ success: boolean; message: string }>;
  validateCoupon: (coupon_code: string) => Promise<CouponValidation>;
  
  // Loading states
  isLoadingDiscounts: boolean;
  isApplyingCoupon: boolean;
  
  // Bulk operations
  selectedItems: number[];
  toggleItemSelection: (cart_item_id: number) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
  removeSelectedItems: () => Promise<void>;
  
  // Cart state
  cartId: string | null;
  isLoading: boolean;
  error: string | null;
}

const VendorCartContext = createContext<VendorCartContextType | null>(null);

export const useVendorCart = () => {
  const context = useContext(VendorCartContext);
  if (!context) {
    throw new Error('useVendorCart must be used within a VendorCartProvider');
  }
  return context;
};

interface VendorCartProviderProps {
  children: ReactNode;
}

export const VendorCartProvider = ({ children }: VendorCartProviderProps) => {
  // Core state
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Vendor-specific state
  const [vendorSummaries, setVendorSummaries] = useState<VendorCartSummary[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<VendorDiscount[]>([]);
  const [appliedCoupons, setAppliedCoupons] = useState<VendorDiscount[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Initialize cart
  useEffect(() => {
    initializeCart();
  }, []);

  // Recalculate vendor summaries when items or discounts change
  useEffect(() => {
    calculateVendorSummaries();
  }, [items, appliedDiscounts, appliedCoupons]);

  const initializeCart = async () => {
    try {
      setIsLoading(true);
      
      // Get or create cart
      const response = await fetch('/api/cart', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartId(data.cart_id);
        setItems(data.items || []);
        setSavedForLaterItems(data.saved_for_later || []);
        
        // Load discounts after cart is loaded
        if (data.cart_id) {
          await refreshDiscounts(data.cart_id);
        }
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateVendorSummaries = () => {
    // Group items by vendor
    const vendorGroups = items.reduce((acc, item) => {
      if (!acc[item.vendor_id]) {
        acc[item.vendor_id] = {
          vendor_id: item.vendor_id,
          vendor_name: item.vendor_name,
          items: [],
          item_count: 0,
          subtotal: 0,
          discount_amount: 0,
          subtotal_after_discount: 0,
          applied_discounts: [],
          applied_coupons: [],
          total: 0
        };
      }
      
      acc[item.vendor_id].items.push(item);
      acc[item.vendor_id].item_count += item.quantity;
      
      // Use discounted price if available, otherwise original price
      const itemPrice = item.discounted_price || item.unit_price;
      acc[item.vendor_id].subtotal += itemPrice * item.quantity;
      
      // Add discount amount for this item
      if (item.discount_amount) {
        acc[item.vendor_id].discount_amount += item.discount_amount;
      }
      
      return acc;
    }, {} as Record<number, VendorCartSummary>);

    // Add discount information
    [...appliedDiscounts, ...appliedCoupons].forEach(discount => {
      if (vendorGroups[discount.vendor_id]) {
        if (discount.coupon_code) {
          vendorGroups[discount.vendor_id].applied_coupons.push(discount);
        } else {
          vendorGroups[discount.vendor_id].applied_discounts.push(discount);
        }
        
        vendorGroups[discount.vendor_id].subtotal_after_discount = discount.subtotal_after;
      }
    });

    // Calculate totals for each vendor
    Object.values(vendorGroups).forEach(vendor => {
      vendor.total = vendor.subtotal_after_discount || vendor.subtotal;
    });

    setVendorSummaries(Object.values(vendorGroups));
  };

  const refreshDiscounts = async (cart_id?: string) => {
    if (!cart_id && !cartId) return;
    
    try {
      setIsLoadingDiscounts(true);
      
      const response = await fetch('/api/cart/vendor-discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: cart_id || cartId,
          user_id: null // Add user ID if available
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAppliedDiscounts(data.applied_discounts || []);
        
        // Update item prices with discount information
        const updatedItems = items.map(item => {
          const itemDiscount = data.applied_discounts
            .flatMap((d: VendorDiscount) => d.applied_items)
            .find((ai: any) => ai.cart_item_id === item.cart_item_id);
          
          if (itemDiscount) {
            return {
              ...item,
              original_price: itemDiscount.original_price,
              discounted_price: itemDiscount.discounted_price,
              discount_amount: itemDiscount.discount_amount
            };
          }
          
          return item;
        });
        
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Error refreshing discounts:', error);
    } finally {
      setIsLoadingDiscounts(false);
    }
  };

  const validateCoupon = async (coupon_code: string): Promise<CouponValidation> => {
    try {
      const response = await fetch('/api/vendor/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code,
          cart_items: items,
          user_id: null, // Add user ID if available
          total_amount: totalSubtotal
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error validating coupon:', error);
      return {
        isValid: false,
        error: 'Failed to validate coupon'
      };
    }
  };

  const applyCoupon = async (coupon_code: string) => {
    if (!cartId) {
      return { success: false, error: 'Cart not initialized' };
    }

    try {
      setIsApplyingCoupon(true);
      
      const response = await fetch('/api/cart/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: cartId,
          coupon_code,
          user_id: null // Add user ID if available
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Add to applied coupons
        const newCoupon: VendorDiscount = {
          vendor_id: result.coupon.vendor_id,
          vendor_name: result.coupon.vendor_name,
          discount_id: result.coupon.coupon_id,
          discount_name: result.coupon.coupon_name,
          discount_type: result.coupon.discount_type,
          discount_amount: result.coupon.discount_amount,
          applied_items: result.applied_items,
          subtotal_before: result.subtotal_before,
          subtotal_after: result.subtotal_after,
          coupon_code: coupon_code
        };

        setAppliedCoupons(prev => [...prev, newCoupon]);
        
        // Update item prices
        const updatedItems = items.map(item => {
          const itemDiscount = result.applied_items.find((ai: any) => ai.cart_item_id === item.cart_item_id);
          
          if (itemDiscount) {
            return {
              ...item,
              original_price: itemDiscount.original_price,
              discounted_price: itemDiscount.discounted_price,
              discount_amount: (item.discount_amount || 0) + itemDiscount.discount_amount
            };
          }
          
          return item;
        });
        
        setItems(updatedItems);
        
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, error: 'Failed to apply coupon' };
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = async (coupon_code: string) => {
    if (!cartId) {
      return { success: false, message: 'Cart not initialized' };
    }

    try {
      const response = await fetch(`/api/cart/apply-coupon?cart_id=${cartId}&coupon_code=${coupon_code}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        // Remove from applied coupons
        setAppliedCoupons(prev => prev.filter(coupon => coupon.coupon_code !== coupon_code));
        
        // Refresh discounts to recalculate prices
        await refreshDiscounts();
        
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error };
      }
    } catch (error) {
      console.error('Error removing coupon:', error);
      return { success: false, message: 'Failed to remove coupon' };
    }
  };

  // Basic cart operations (simplified - implement full functionality as needed)
  const addItem = async (item: Omit<CartItem, 'cart_item_id' | 'cart_id'>) => {
    // Implementation for adding items
    console.log('Adding item:', item);
  };

  const removeItem = async (cart_item_id: number) => {
    setItems(prev => prev.filter(item => item.cart_item_id !== cart_item_id));
    await refreshDiscounts();
  };

  const updateQuantity = async (cart_item_id: number, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.cart_item_id === cart_item_id ? { ...item, quantity } : item
    ));
    await refreshDiscounts();
  };

  const clearCart = async () => {
    setItems([]);
    setAppliedDiscounts([]);
    setAppliedCoupons([]);
    setSelectedItems([]);
  };

  // Selection operations
  const toggleItemSelection = (cart_item_id: number) => {
    setSelectedItems(prev => 
      prev.includes(cart_item_id) 
        ? prev.filter(id => id !== cart_item_id)
        : [...prev, cart_item_id]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(items.map(item => item.cart_item_id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const removeSelectedItems = async () => {
    setItems(prev => prev.filter(item => !selectedItems.includes(item.cart_item_id)));
    setSelectedItems([]);
    await refreshDiscounts();
  };

  // Calculated values
  const totalItems = vendorSummaries.reduce((sum, vendor) => sum + vendor.item_count, 0);
  const totalSubtotal = vendorSummaries.reduce((sum, vendor) => sum + vendor.subtotal, 0);
  const totalDiscountAmount = vendorSummaries.reduce((sum, vendor) => sum + vendor.discount_amount, 0);
  const totalAfterDiscounts = vendorSummaries.reduce((sum, vendor) => sum + vendor.total, 0);

  const value: VendorCartContextType = {
    // Core functionality
    items,
    savedForLaterItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Vendor summaries
    vendorSummaries,
    totalItems,
    totalSubtotal,
    totalDiscountAmount,
    totalAfterDiscounts,
    
    // Discounts and coupons
    appliedDiscounts,
    appliedCoupons,
    refreshDiscounts,
    applyCoupon,
    removeCoupon,
    validateCoupon,
    
    // Loading states
    isLoadingDiscounts,
    isApplyingCoupon,
    
    // Selection
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    removeSelectedItems,
    
    // Cart state
    cartId,
    isLoading,
    error
  };

  return (
    <VendorCartContext.Provider value={value}>
      {children}
    </VendorCartContext.Provider>
  );
};