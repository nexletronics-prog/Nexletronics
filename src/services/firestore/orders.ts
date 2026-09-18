import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";

import type { CartItem } from "../../types/cart";

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CreateOrderData {
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentStatus:
    | "pending"
    | "paid"
    | "failed";
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function createOrder(
  data: CreateOrderData,
) {
  if (!data.userId) {
    throw new Error(
      "User authentication is required.",
    );
  }

  if (!data.items.length) {
    throw new Error(
      "Cannot create an empty order.",
    );
  }

  const ordersRef = collection(
    db,
    "orders",
  );

  const orderData = {
    userId: data.userId,

    items: data.items.map(
      (item) => ({
        productId:
          item.product.id,

        name:
          item.product.name,

        slug:
          item.product.slug,

        price:
          item.product.price,

        quantity:
          item.quantity,

        category:
          item.product.category,
      }),
    ),

    shippingAddress:
      data.shippingAddress,

    subtotal: data.subtotal,

    shipping: data.shipping,

    total: data.total,

    status: "pending",

    paymentStatus: "pending",

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const document =
    await addDoc(
      ordersRef,
      orderData,
    );

  return document.id;
}

export async function getUserOrders(
  userId: string,
): Promise<Order[]> {
  if (!userId) {
    return [];
  }

  const ordersRef = collection(
    db,
    "orders",
  );

  const ordersQuery = query(
    ordersRef,
    where(
      "userId",
      "==",
      userId,
    ),
    orderBy(
      "createdAt",
      "desc",
    ),
  );

  const snapshot =
    await getDocs(ordersQuery);

  return snapshot.docs.map(
    (document) => ({
      id: document.id,
      ...(document.data() as Omit<
        Order,
        "id"
      >),
    }),
  );
}