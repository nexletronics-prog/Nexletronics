import type { Product } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}