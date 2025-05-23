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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<number | null>(null);

  // Fetch cart from API on mount
  useEffect(() => {
    fetch('/api/account/cart')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setCartId(data.cart?.cart_id || null);
      });
  }, []);

  // Add an item to cart
  const addItem = async (newItem: CartItem) => {
    const res = await fetch('/api/account/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: newItem.product_id,
        quantity: newItem.quantity,
        width: newItem.width,
        height: newItem.height,
        color_id: newItem.color_id,
        material_id: newItem.material_id,
        unit_price: newItem.unit_price,
      })
    });
    const data = await res.json();
    setItems(items => [...items, { ...data.item, ...newItem }]);
  };

  // Remove an item from cart
  const removeItem = async (cart_item_id: number) => {
    await fetch('/api/account/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_item_id })
    });
    setItems(items => items.filter(item => item.cart_item_id !== cart_item_id));
  };

  // Update item quantity
  const updateQuantity = async (cart_item_id: number, quantity: number) => {
    const item = items.find(i => i.cart_item_id === cart_item_id);
    if (!item) return;
    if (quantity <= 0) {
      await removeItem(cart_item_id);
      return;
    }
    const res = await fetch('/api/account/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, quantity })
    });
    const data = await res.json();
    setItems(items => items.map(i => i.cart_item_id === cart_item_id ? { ...i, quantity } : i));
  };

  // Clear cart
  const clearCart = async () => {
    // Remove all items one by one (API does not support bulk delete)
    await Promise.all(items.map(item => removeItem(item.cart_item_id)));
    setItems([]);
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
