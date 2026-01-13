'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WishlistItem {
  product_id: number;
  name: string;
  slug: string;
  image?: string;
  base_price: number;
  category_name?: string;
  added_at: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'added_at'>) => void;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (item: Omit<WishlistItem, 'added_at'>) => void;
  clearWishlist: () => void;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  isInWishlist: () => false,
  toggleWishlist: () => {},
  clearWishlist: () => {},
  itemCount: 0
});

export const useWishlist = () => useContext(WishlistContext);

interface WishlistProviderProps {
  children: ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        setItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('wishlist', JSON.stringify(items));
      } catch (error) {
        console.error('Error saving wishlist:', error);
      }
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<WishlistItem, 'added_at'>) => {
    setItems((prev) => {
      // Don't add if already exists
      if (prev.some((i) => i.product_id === item.product_id)) {
        return prev;
      }
      return [
        ...prev,
        {
          ...item,
          added_at: new Date().toISOString()
        }
      ];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const isInWishlist = (productId: number): boolean => {
    return items.some((item) => item.product_id === productId);
  };

  const toggleWishlist = (item: Omit<WishlistItem, 'added_at'>) => {
    if (isInWishlist(item.product_id)) {
      removeItem(item.product_id);
    } else {
      addItem(item);
    }
  };

  const clearWishlist = () => {
    setItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        itemCount: items.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export default WishlistContext;
