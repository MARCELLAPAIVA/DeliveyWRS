"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CartItem, Product } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found) return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => setItems((prev) => prev.filter((item) => item.product.id !== productId));

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)));
  };

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear: () => setItems([]), subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro do CartProvider");
  return ctx;
};
