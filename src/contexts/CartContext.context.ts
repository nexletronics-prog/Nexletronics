import { createContext } from "react";

import type { Product } from "../types/product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextValue {
  items: CartItem[];
  cartItems: CartItem[];

  addToCart: (
    product: Product,
    quantity?: number,
  ) => void;

  removeFromCart: (
    productId: string,
  ) => void;

  updateQuantity: (
    productId: string,
    quantity: number,
  ) => void;

  increaseQuantity: (
    productId: string,
  ) => void;

  decreaseQuantity: (
    productId: string,
  ) => void;

  clearCart: () => void;

  getItemQuantity: (
    productId: string,
  ) => number;

  subtotal: number;
  total: number;
  cartTotal: number;
  itemCount: number;
  cartCount: number;
  isEmpty: boolean;
}

export const CartContext =
  createContext<CartContextValue | undefined>(
    undefined,
  );