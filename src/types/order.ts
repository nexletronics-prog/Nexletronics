/*
 * ==========================================================
 * ORDER TYPES
 * ==========================================================
 */


/*
 * ==========================================================
 * ORDER STATUS
 * ==========================================================
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";


/*
 * ==========================================================
 * PAYMENT STATUS
 * ==========================================================
 */

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";


/*
 * ==========================================================
 * ORDER ITEM
 * ==========================================================
 */

export interface OrderItem {
  /*
   * Firestore product document ID.
   */

  productId: string;


  /*
   * Product name stored at the time of purchase.
   */

  name: string;


  /*
   * Optional SKU.
   */

  sku?: string;


  /*
   * Price of one unit at the time of purchase.
   */

  price: number;


  /*
   * Quantity purchased.
   */

  quantity: number;


  /*
   * Optional product image.
   */

  image?: string;


  /*
   * Optional product category.
   */

  category?: string;
}


/*
 * ==========================================================
 * SHIPPING ADDRESS
 * ==========================================================
 */

export interface ShippingAddress {
  name: string;

  phone: string;

  email: string;

  address: string;

  city: string;

  state: string;

  pincode: string;
}


/*
 * ==========================================================
 * ORDER
 * ==========================================================
 */

export interface Order {
  /*
   * Firestore order document ID.
   */

  id: string;


  /*
   * Firebase Authentication UID of the customer.
   */

  userId: string;


  /*
   * Customer email.
   */

  userEmail: string;


  /*
   * Products purchased.
   */

  items: OrderItem[];


  /*
   * Delivery information.
   */

  shippingAddress: ShippingAddress;


  /*
   * Price breakdown.
   */

  subtotal: number;

  shipping: number;

  total: number;


  /*
   * Currency used by the order.
   */

  currency: string;


  /*
   * Current order state.
   */

  status: OrderStatus;


  /*
   * Current payment state.
   */

  paymentStatus: PaymentStatus;


  /*
   * Payment provider/method.
   *
   * Examples:
   * "pending"
   * "razorpay"
   * "cod"
   */

  paymentMethod: string;


  /*
   * Razorpay fields.
   *
   * These remain optional because Razorpay will be added
   * later.
   */

  razorpayOrderId?: string;

  razorpayPaymentId?: string;

  razorpaySignature?: string;


  /*
   * Firestore timestamps.
   *
   * `unknown` keeps this compatible with both Firestore
   * Timestamp values and serverTimestamp results.
   */

  createdAt?: unknown;

  updatedAt?: unknown;
}