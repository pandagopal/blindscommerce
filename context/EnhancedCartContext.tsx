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

export interface SavedCart {
  saved_cart_id: number;
  cart_name: string;
  description?: string;
  project_type: 'residential' | 'commercial' | 'renovation' | 'new_construction' | 'other';
  is_template: boolean;
  is_favorite: boolean;
  total_items: number;
  estimated_total: number;
  created_at: string;
  updated_at: string;
}

export interface CartRecommendation {
  product_id: number;
  name: string;
  price: number;
  image?: string;
  association_type: 'frequently_together' | 'substitute' | 'complement' | 'upgrade';
  confidence: number;
}

export interface PriceAlert {
  alert_id: number;
  product_id: number;
  target_price?: number;
  alert_type: 'price_drop' | 'back_in_stock' | 'price_change';
  is_active: boolean;
}

export interface ShippingAddress {
  address_id: number;
  recipient_name: string;
  company_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  delivery_instructions?: string;
  is_residential: boolean;
  is_default: boolean;
}

interface EnhancedCartContextType {
  // Core cart functionality
  items: CartItem[];
  savedForLaterItems: CartItem[];
  addItem: (item: Omit<CartItem, 'cart_item_id' | 'cart_id'>) => Promise<void>;
  removeItem: (cart_item_id: number) => Promise<void>;
  updateQuantity: (cart_item_id: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  
  // Save for Later functionality
  saveForLater: (cart_item_id: number) => Promise<void>;
  moveToCart: (cart_item_id: number) => Promise<void>;
  removeSavedItem: (cart_item_id: number) => Promise<void>;
  
  // Bulk operations
  selectedItems: number[];
  toggleItemSelection: (cart_item_id: number) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
  removeSelectedItems: () => Promise<void>;
  saveSelectedForLater: () => Promise<void>;
  
  // Cart management
  savedCarts: SavedCart[];
  createSavedCart: (name: string, description?: string, project_type?: string) => Promise<void>;
  loadSavedCart: (saved_cart_id: number) => Promise<void>;
  deleteSavedCart: (saved_cart_id: number) => Promise<void>;
  
  // Recommendations
  recommendations: CartRecommendation[];
  refreshRecommendations: () => Promise<void>;
  addRecommendation: (product_id: number) => Promise<void>;
  
  // Price alerts
  priceAlerts: PriceAlert[];
  createPriceAlert: (product_id: number, target_price?: number, alert_type?: string) => Promise<void>;
  removePriceAlert: (alert_id: number) => Promise<void>;
  
  // Shipping addresses
  shippingAddresses: ShippingAddress[];
  assignShippingAddress: (cart_item_id: number, address_id: number) => Promise<void>;
  addShippingAddress: (address: Omit<ShippingAddress, 'address_id'>) => Promise<void>;
  
  // Cart sharing
  shareCart: (share_type: 'view' | 'edit', expires_hours?: number) => Promise<{ share_url: string }>;
  
  // Gift options
  markAsGift: (cart_item_id: number, gift_message?: string) => Promise<void>;
  removeGiftMarking: (cart_item_id: number) => Promise<void>;
  
  // Installation services
  addInstallation: (cart_item_id: number) => Promise<void>;
  removeInstallation: (cart_item_id: number) => Promise<void>;
  
  // Sample requests
  requestSample: (cart_item_id: number) => Promise<void>;
  cancelSample: (cart_item_id: number) => Promise<void>;
  
  // Cart notes
  addItemNote: (cart_item_id: number, note: string) => Promise<void>;
  removeItemNote: (cart_item_id: number) => Promise<void>;
  
  // Scheduled delivery
  scheduleDelivery: (cart_item_id: number, delivery_date: string) => Promise<void>;
  removeScheduledDelivery: (cart_item_id: number) => Promise<void>;
  
  // Loading states
  loading: boolean;
  bulkLoading: boolean;
  sharingLoading: boolean;
}

const EnhancedCartContext = createContext<EnhancedCartContextType>({
  items: [],
  savedForLaterItems: [],
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  itemCount: 0,
  subtotal: 0,
  
  saveForLater: async () => {},
  moveToCart: async () => {},
  removeSavedItem: async () => {},
  
  selectedItems: [],
  toggleItemSelection: () => {},
  selectAllItems: () => {},
  clearSelection: () => {},
  removeSelectedItems: async () => {},
  saveSelectedForLater: async () => {},
  
  savedCarts: [],
  createSavedCart: async () => {},
  loadSavedCart: async () => {},
  deleteSavedCart: async () => {},
  
  recommendations: [],
  refreshRecommendations: async () => {},
  addRecommendation: async () => {},
  
  priceAlerts: [],
  createPriceAlert: async () => {},
  removePriceAlert: async () => {},
  
  shippingAddresses: [],
  assignShippingAddress: async () => {},
  addShippingAddress: async () => {},
  
  shareCart: async () => ({ share_url: '' }),
  
  markAsGift: async () => {},
  removeGiftMarking: async () => {},
  
  addInstallation: async () => {},
  removeInstallation: async () => {},
  
  requestSample: async () => {},
  cancelSample: async () => {},
  
  addItemNote: async () => {},
  removeItemNote: async () => {},
  
  scheduleDelivery: async () => {},
  removeScheduledDelivery: async () => {},
  
  loading: false,
  bulkLoading: false,
  sharingLoading: false,
});

export const useEnhancedCart = () => useContext(EnhancedCartContext);

interface EnhancedCartProviderProps {
  children: ReactNode;
}

export function EnhancedCartProvider({ children }: EnhancedCartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([]);
  const [recommendations, setRecommendations] = useState<CartRecommendation[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);

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
      return response.ok;
    } catch {
      return false;
    }
  };

  // Track cart analytics
  const trackCartAction = async (action: string, productId?: number, metadata?: any) => {
    try {
      if (await isAuthenticated()) {
        await fetch('/api/cart/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: action,
            product_id: productId,
            metadata,
            page_url: window.location.href,
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  useEffect(() => {
    loadCart();
    loadSavedCarts();
    loadShippingAddresses();
  }, []);

  // Load cart from API or localStorage
  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart/enhanced');
      if (response.ok) {
        const data = await response.json();
        const activeItems = data.items.filter((item: CartItem) => !item.saved_for_later);
        const savedItems = data.items.filter((item: CartItem) => item.saved_for_later);
        
        setItems(activeItems);
        setSavedForLaterItems(savedItems);
        setRecommendations(data.recommendations || []);
        setPriceAlerts(data.price_alerts || []);
      } else {
        // Fallback to localStorage for guest users
        const savedCart = localStorage.getItem('guest_cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load saved carts
  const loadSavedCarts = async () => {
    try {
      if (await isAuthenticated()) {
        const response = await fetch('/api/cart/saved');
        if (response.ok) {
          const data = await response.json();
          setSavedCarts(data.saved_carts || []);
        }
      }
    } catch (error) {
      console.error('Error loading saved carts:', error);
    }
  };

  // Load shipping addresses
  const loadShippingAddresses = async () => {
    try {
      if (await isAuthenticated()) {
        const response = await fetch('/api/account/addresses');
        if (response.ok) {
          const data = await response.json();
          setShippingAddresses(data.addresses || []);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  // Add an item to cart
  const addItem = async (newItem: Omit<CartItem, 'cart_item_id' | 'cart_id'>) => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch('/api/cart/enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (response.ok) {
          const data = await response.json();
          const activeItems = data.items.filter((item: CartItem) => !item.saved_for_later);
          setItems(activeItems);
          await trackCartAction('item_added', newItem.product_id);
        }
      } else {
        // Handle guest cart
        const existingItemIndex = items.findIndex(
          item => item.product_id === newItem.product_id && 
                  item.width === newItem.width && 
                  item.height === newItem.height &&
                  item.color_id === newItem.color_id &&
                  !item.saved_for_later
        );

        let updatedItems;
        if (existingItemIndex > -1) {
          updatedItems = items.map((item, index) => 
            index === existingItemIndex 
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          );
        } else {
          const guestItem = {
            ...newItem,
            cart_item_id: Date.now(),
            cart_id: 0,
            saved_for_later: false,
            is_gift: false,
            installation_requested: false,
            sample_requested: false
          } as CartItem;
          updatedItems = [...items, guestItem];
        }
        
        setItems(updatedItems);
        saveGuestCart(updatedItems);
      }
      
      await refreshRecommendations();
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  // Remove an item from cart
  const removeItem = async (cart_item_id: number) => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          const data = await response.json();
          const activeItems = data.items.filter((item: CartItem) => !item.saved_for_later);
          setItems(activeItems);
          await trackCartAction('item_removed', undefined, { cart_item_id });
        }
      } else {
        const updatedItems = items.filter(item => item.cart_item_id !== cart_item_id);
        setItems(updatedItems);
        saveGuestCart(updatedItems);
      }
      
      await refreshRecommendations();
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
        const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity })
        });
        if (response.ok) {
          const data = await response.json();
          const activeItems = data.items.filter((item: CartItem) => !item.saved_for_later);
          setItems(activeItems);
          await trackCartAction('quantity_changed', undefined, { cart_item_id, new_quantity: quantity });
        }
      } else {
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

  // Save item for later
  const saveForLater = async (cart_item_id: number) => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/save-for-later`, {
          method: 'POST'
        });
        if (response.ok) {
          const data = await response.json();
          const activeItems = data.items.filter((item: CartItem) => !item.saved_for_later);
          const savedItems = data.items.filter((item: CartItem) => item.saved_for_later);
          setItems(activeItems);
          setSavedForLaterItems(savedItems);
          await trackCartAction('saved_for_later', undefined, { cart_item_id });
        }
      } else {
        const updatedItems = items.map(item => 
          item.cart_item_id === cart_item_id 
            ? { ...item, saved_for_later: true }
            : item
        );
        const activeItems = updatedItems.filter(item => !item.saved_for_later);
        const savedItems = updatedItems.filter(item => item.saved_for_later);
        setItems(activeItems);
        setSavedForLaterItems(savedItems);
        saveGuestCart(updatedItems);
      }
    } catch (error) {
      console.error('Error saving item for later:', error);
    }
  };

  // Move item back to cart
  const moveToCart = async (cart_item_id: number) => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/move-to-cart`, {
          method: 'POST'
        });
        if (response.ok) {
          const data = await response.json();
          const activeItems = data.items.filter((item: CartItem) => !item.saved_for_later);
          const savedItems = data.items.filter((item: CartItem) => item.saved_for_later);
          setItems(activeItems);
          setSavedForLaterItems(savedItems);
          await trackCartAction('moved_to_cart', undefined, { cart_item_id });
        }
      } else {
        const allItems = [...items, ...savedForLaterItems];
        const updatedItems = allItems.map(item => 
          item.cart_item_id === cart_item_id 
            ? { ...item, saved_for_later: false }
            : item
        );
        const activeItems = updatedItems.filter(item => !item.saved_for_later);
        const savedItems = updatedItems.filter(item => item.saved_for_later);
        setItems(activeItems);
        setSavedForLaterItems(savedItems);
        saveGuestCart(updatedItems);
      }
      
      await refreshRecommendations();
    } catch (error) {
      console.error('Error moving item to cart:', error);
    }
  };

  // Remove saved item
  const removeSavedItem = async (cart_item_id: number) => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          const data = await response.json();
          const savedItems = data.items.filter((item: CartItem) => item.saved_for_later);
          setSavedForLaterItems(savedItems);
        }
      } else {
        const updatedSavedItems = savedForLaterItems.filter(item => item.cart_item_id !== cart_item_id);
        setSavedForLaterItems(updatedSavedItems);
        const allItems = [...items, ...updatedSavedItems];
        saveGuestCart(allItems);
      }
    } catch (error) {
      console.error('Error removing saved item:', error);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const response = await fetch('/api/cart/enhanced', {
          method: 'DELETE'
        });
        if (response.ok) {
          setItems([]);
          setSavedForLaterItems([]);
          setSelectedItems([]);
        }
      } else {
        setItems([]);
        setSavedForLaterItems([]);
        setSelectedItems([]);
        localStorage.removeItem('guest_cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Bulk operations
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
    setBulkLoading(true);
    try {
      for (const cart_item_id of selectedItems) {
        await removeItem(cart_item_id);
      }
      setSelectedItems([]);
    } catch (error) {
      console.error('Error removing selected items:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  const saveSelectedForLater = async () => {
    setBulkLoading(true);
    try {
      for (const cart_item_id of selectedItems) {
        await saveForLater(cart_item_id);
      }
      setSelectedItems([]);
    } catch (error) {
      console.error('Error saving selected items:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  // Create saved cart
  const createSavedCart = async (name: string, description?: string, project_type: string = 'residential') => {
    try {
      const response = await fetch('/api/cart/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_name: name,
          description,
          project_type,
          items: selectedItems.length > 0 
            ? items.filter(item => selectedItems.includes(item.cart_item_id))
            : items
        })
      });
      if (response.ok) {
        await loadSavedCarts();
      }
    } catch (error) {
      console.error('Error creating saved cart:', error);
    }
  };

  // Load saved cart
  const loadSavedCart = async (saved_cart_id: number) => {
    try {
      const response = await fetch(`/api/cart/saved/${saved_cart_id}/load`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error loading saved cart:', error);
    }
  };

  // Delete saved cart
  const deleteSavedCart = async (saved_cart_id: number) => {
    try {
      const response = await fetch(`/api/cart/saved/${saved_cart_id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedCarts(prev => prev.filter(cart => cart.saved_cart_id !== saved_cart_id));
      }
    } catch (error) {
      console.error('Error deleting saved cart:', error);
    }
  };

  // Refresh recommendations
  const refreshRecommendations = async () => {
    try {
      if (items.length > 0) {
        const productIds = items.map(item => item.product_id);
        const response = await fetch('/api/cart/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_ids: productIds })
        });
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations || []);
        }
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    }
  };

  // Add recommendation to cart
  const addRecommendation = async (product_id: number) => {
    try {
      const response = await fetch(`/api/products/${product_id}/quick-add`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        await addItem(data.item);
      }
    } catch (error) {
      console.error('Error adding recommendation:', error);
    }
  };

  // Create price alert
  const createPriceAlert = async (product_id: number, target_price?: number, alert_type: string = 'price_drop') => {
    try {
      const response = await fetch('/api/cart/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, target_price, alert_type })
      });
      if (response.ok) {
        const data = await response.json();
        setPriceAlerts(prev => [...prev, data.alert]);
      }
    } catch (error) {
      console.error('Error creating price alert:', error);
    }
  };

  // Remove price alert
  const removePriceAlert = async (alert_id: number) => {
    try {
      const response = await fetch(`/api/cart/price-alerts/${alert_id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setPriceAlerts(prev => prev.filter(alert => alert.alert_id !== alert_id));
      }
    } catch (error) {
      console.error('Error removing price alert:', error);
    }
  };

  // Assign shipping address
  const assignShippingAddress = async (cart_item_id: number, address_id: number) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address_id })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error assigning shipping address:', error);
    }
  };

  // Add shipping address
  const addShippingAddress = async (address: Omit<ShippingAddress, 'address_id'>) => {
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address)
      });
      if (response.ok) {
        await loadShippingAddresses();
      }
    } catch (error) {
      console.error('Error adding shipping address:', error);
    }
  };

  // Share cart
  const shareCart = async (share_type: 'view' | 'edit' = 'view', expires_hours: number = 24) => {
    setSharingLoading(true);
    try {
      const response = await fetch('/api/cart/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_type, expires_hours })
      });
      if (response.ok) {
        const data = await response.json();
        await trackCartAction('shared');
        return { share_url: data.share_url };
      }
      throw new Error('Failed to share cart');
    } catch (error) {
      console.error('Error sharing cart:', error);
      throw error;
    } finally {
      setSharingLoading(false);
    }
  };

  // Gift options
  const markAsGift = async (cart_item_id: number, gift_message?: string) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_gift: true, gift_message })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error marking as gift:', error);
    }
  };

  const removeGiftMarking = async (cart_item_id: number) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_gift: false, gift_message: null })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error removing gift marking:', error);
    }
  };

  // Installation services
  const addInstallation = async (cart_item_id: number) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/installation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installation_requested: true })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error adding installation:', error);
    }
  };

  const removeInstallation = async (cart_item_id: number) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/installation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installation_requested: false })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error removing installation:', error);
    }
  };

  // Sample requests
  const requestSample = async (cart_item_id: number) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample_requested: true })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error requesting sample:', error);
    }
  };

  const cancelSample = async (cart_item_id: number) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample_requested: false })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error canceling sample:', error);
    }
  };

  // Cart notes
  const addItemNote = async (cart_item_id: number, note: string) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error adding item note:', error);
    }
  };

  const removeItemNote = async (cart_item_id: number) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/notes`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error removing item note:', error);
    }
  };

  // Scheduled delivery
  const scheduleDelivery = async (cart_item_id: number, delivery_date: string) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_delivery_date: delivery_date })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error scheduling delivery:', error);
    }
  };

  const removeScheduledDelivery = async (cart_item_id: number) => {
    try {
      const response = await fetch(`/api/cart/enhanced/items/${cart_item_id}/delivery`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error('Error removing scheduled delivery:', error);
    }
  };

  // Calculate totals
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (item.unit_price * item.quantity), 0);

  return (
    <EnhancedCartContext.Provider
      value={{
        items,
        savedForLaterItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        
        saveForLater,
        moveToCart,
        removeSavedItem,
        
        selectedItems,
        toggleItemSelection,
        selectAllItems,
        clearSelection,
        removeSelectedItems,
        saveSelectedForLater,
        
        savedCarts,
        createSavedCart,
        loadSavedCart,
        deleteSavedCart,
        
        recommendations,
        refreshRecommendations,
        addRecommendation,
        
        priceAlerts,
        createPriceAlert,
        removePriceAlert,
        
        shippingAddresses,
        assignShippingAddress,
        addShippingAddress,
        
        shareCart,
        
        markAsGift,
        removeGiftMarking,
        
        addInstallation,
        removeInstallation,
        
        requestSample,
        cancelSample,
        
        addItemNote,
        removeItemNote,
        
        scheduleDelivery,
        removeScheduledDelivery,
        
        loading,
        bulkLoading,
        sharingLoading,
      }}
    >
      {children}
    </EnhancedCartContext.Provider>
  );
}

export default EnhancedCartContext;