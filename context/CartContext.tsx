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

  useEffect(() => {
    // Load cart from localStorage on mount
    const loadCart = async () => {
      try {
        const response = await fetch('/api/cart/items');
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    loadCart();
  }, []);

  // Add an item to cart
  const addItem = async (newItem: CartItem) => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  // Remove an item from cart
  const removeItem = async (cart_item_id: number) => {
    try {
      const response = await fetch(`/api/cart/items/${cart_item_id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  // Update item quantity
  const updateQuantity = async (cart_item_id: number, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/items/${cart_item_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'DELETE'
      });
      if (response.ok) {
        setItems([]);
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
