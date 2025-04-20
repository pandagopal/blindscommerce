'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  width: number;
  height: number;
  colorId?: number; // make optional with undefined
  colorName?: string;
  materialId?: number; // make optional with undefined
  materialName?: string;
  mountType?: number;
  mountTypeName?: string;
  controlType?: string;
  headrailId?: number;
  headrailName?: string;
  bottomRailId?: number;
  bottomRailName?: string;
  image: string;
  totalPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  subtotal: 0,
});

// Hook to use the cart context
export const useCart = () => useContext(CartContext);

// Provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load cart from local storage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
        setInitialized(true);
      } catch (error) {
        console.error('Error loading cart from local storage:', error);
        setInitialized(true);
      }
    }
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, initialized]);

  // Add an item to cart
  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      // Check if item already exists in cart with same configuration
      const existingItemIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.width === newItem.width &&
          item.height === newItem.height &&
          item.colorId === newItem.colorId &&
          item.materialId === newItem.materialId &&
          item.mountType === newItem.mountType &&
          item.controlType === newItem.controlType &&
          item.headrailId === newItem.headrailId &&
          item.bottomRailId === newItem.bottomRailId
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        updatedItems[existingItemIndex].totalPrice =
          updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prev, newItem];
      }
    });
  };

  // Remove an item from cart
  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update item quantity
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity, totalPrice: item.price * quantity }
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  // Calculate total number of items
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Calculate subtotal
  const subtotal = items.reduce((total, item) => total + item.totalPrice, 0);

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
