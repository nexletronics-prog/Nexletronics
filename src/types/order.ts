export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";


export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";


export interface OrderItem {
  productId: string;

  name: string;

  sku?: string;

  price: number;

  quantity: number;

  image?: string;

  category?: string;
}


export interface ShippingAddress {
  name: string;

  phone: string;

  email: string;

  address: string;

  city: string;

  state: string;

  pincode: string;

  country?: string;

  companyName?: string;

  gstin?: string;
}


export interface Order {
  id: string;

  userId: string;

  userEmail: string;

  customer?: {
    name?: string;

    email?: string;

    phone?: string;
  };


  items: OrderItem[];


  shippingAddress: ShippingAddress;


  billingAddress?: ShippingAddress | null;


  billingAddressSameAsShipping?: boolean;


  subtotal: number;

  shipping: number;

  tax?: number;

  discount?: number;

  total: number;


  currency: string;


  status: OrderStatus;


  paymentStatus: PaymentStatus;


  paymentMethod: string;


  razorpayOrderId?: string;

  razorpayPaymentId?: string;

  razorpaySignature?: string;

  razorpayPaymentStatus?: string;

  razorpayAmount?: number;

  razorpayCurrency?: string;

  receipt?: string;


  createdAt?: unknown;

  updatedAt?: unknown;
}