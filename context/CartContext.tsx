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

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (cart_item_id: number) => Promise<void>;
  updateQuantity: (cart_item_id: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  itemCount: 0,
  subtotal: 0,
});

export const useCart = () => useContext(CartContext);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

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

  useEffect(() => {
    // Load cart from API or localStorage on mount
    const loadCart = async () => {
      try {
        // Try to load from API first (for authenticated users)
        const response = await fetch('/api/account/cart');
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
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
        // Try localStorage as final fallback
        try {
          const savedCart = localStorage.getItem('guest_cart');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setItems(parsedCart);
          }
        } catch (localError) {
          console.error('Error loading cart from localStorage:', localError);
        }
      }
    };
    loadCart();
  }, []);

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
        }
      } else {
        // Handle guest cart
        setItems([]);
        localStorage.removeItem('guest_cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
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
        subtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;
