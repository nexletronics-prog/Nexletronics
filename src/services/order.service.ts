import {
  auth,
} from "../firebase/config";

import {
  supabase,
} from "../lib/supabase";

import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
} from "../types/order";


/*
 * ==========================================================
 * INPUT TYPES
 * ==========================================================
 */

export interface SecureOrderItem {
  productId: string;

  quantity: number;
}


export interface SecureShippingAddress {
  name: string;

  phone: string;

  email: string;

  address: string;

  city: string;

  state: string;

  pincode: string;
}


export interface SecureOrderResponse {
  orderId: string;

  subtotal: number;

  shipping: number;

  total: number;
}


/*
 * ==========================================================
 * DATABASE ROW TYPES
 * ==========================================================
 */

interface OrderRow {
  id: string;

  user_id: string;

  user_email: string;

  customer:
    Record<string, unknown> |
    null;

  shipping_address:
    ShippingAddress |
    Record<string, unknown> |
    null;

  billing_address:
    ShippingAddress |
    Record<string, unknown> |
    null;

  billing_address_same_as_shipping:
    boolean;

  subtotal: number;

  shipping: number;

  tax: number;

  discount: number;

  total: number;

  currency: string;

  status: OrderStatus;

  payment_status: PaymentStatus;

  payment_method: string;

  razorpay_order_id:
    string |
    null;

  razorpay_payment_id:
    string |
    null;

  razorpay_signature:
    string |
    null;

  razorpay_payment_status:
    string |
    null;

  razorpay_amount:
    number |
    null;

  razorpay_currency:
    string |
    null;

  receipt:
    string |
    null;

  created_at: string;

  updated_at: string;
}


interface OrderItemRow {
  order_id: string;

  product_id: string;

  name: string;

  sku: string | null;

  price: number;

  quantity: number;

  line_total: number;

  image: string | null;

  category: string | null;
}


/*
 * ==========================================================
 * COLUMNS
 * ==========================================================
 */

const ORDER_COLUMNS = `
  id,
  user_id,
  user_email,
  customer,
  shipping_address,
  billing_address,
  billing_address_same_as_shipping,
  subtotal,
  shipping,
  tax,
  discount,
  total,
  currency,
  status,
  payment_status,
  payment_method,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  razorpay_payment_status,
  razorpay_amount,
  razorpay_currency,
  receipt,
  created_at,
  updated_at
`;


const ORDER_ITEM_COLUMNS = `
  order_id,
  product_id,
  name,
  sku,
  price,
  quantity,
  line_total,
  image,
  category
`;


/*
 * ==========================================================
 * ERROR
 * ==========================================================
 */

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }


  return fallback;
}


/*
 * ==========================================================
 * ORDER ITEM MAPPER
 * ==========================================================
 */

function mapOrderItem(
  row: OrderItemRow,
): OrderItem {
  return {
    productId:
      row.product_id,

    name:
      row.name,

    sku:
      row.sku ??
      undefined,

    price:
      Number(
        row.price,
      ),

    quantity:
      Number(
        row.quantity,
      ),

    image:
      row.image ??
      undefined,

    category:
      row.category ??
      undefined,
  };
}


/*
 * ==========================================================
 * ORDER MAPPER
 * ==========================================================
 */

function mapOrder(
  row: OrderRow,
  itemRows: OrderItemRow[],
): Order {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    userEmail:
      row.user_email,

    customer:
      row.customer ??
      undefined,

    items:
      itemRows.map(
        mapOrderItem,
      ),

    shippingAddress:
      normalizeAddress(
        row.shipping_address,
      ),

    billingAddress:
      row.billing_address
        ? normalizeAddress(
            row.billing_address,
          )
        : null,

    billingAddressSameAsShipping:
      Boolean(
        row.billing_address_same_as_shipping,
      ),

    subtotal:
      Number(
        row.subtotal,
      ),

    shipping:
      Number(
        row.shipping,
      ),

    tax:
      Number(
        row.tax,
      ),

    discount:
      Number(
        row.discount,
      ),

    total:
      Number(
        row.total,
      ),

    currency:
      row.currency ||
      "INR",

    status:
      row.status,

    paymentStatus:
      row.payment_status,

    paymentMethod:
      row.payment_method,

    razorpayOrderId:
      row.razorpay_order_id ??
      undefined,

    razorpayPaymentId:
      row.razorpay_payment_id ??
      undefined,

    razorpaySignature:
      row.razorpay_signature ??
      undefined,

    razorpayPaymentStatus:
      row.razorpay_payment_status ??
      undefined,

    razorpayAmount:
      row.razorpay_amount ??
      undefined,

    razorpayCurrency:
      row.razorpay_currency ??
      undefined,

    receipt:
      row.receipt ??
      undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ==========================================================
 * ADDRESS NORMALIZER
 * ==========================================================
 */

function normalizeAddress(
  value:
    | ShippingAddress
    | Record<string, unknown>
    | null,
): ShippingAddress {
  const data =
    value ?? {};


  const record =
    data as Record<
      string,
      unknown
    >;


  return {
    name:
      String(
        record.name ??
        "",
      ),

    phone:
      String(
        record.phone ??
        "",
      ),

    email:
      String(
        record.email ??
        "",
      ),

    address:
      String(
        record.address ??
        "",
      ),

    city:
      String(
        record.city ??
        "",
      ),

    state:
      String(
        record.state ??
        "",
      ),

    pincode:
      String(
        record.pincode ??
        "",
      ),

    country:
      typeof record.country ===
      "string"
        ? record.country
        : undefined,

    companyName:
      typeof record.companyName ===
      "string"
        ? record.companyName
        : undefined,

    gstin:
      typeof record.gstin ===
      "string"
        ? record.gstin
        : undefined,
  };
}


/*
 * ==========================================================
 * GET ORDER ITEMS
 * ==========================================================
 */

async function getOrderItems(
  orderIds: string[],
): Promise<
  Map<
    string,
    OrderItemRow[]
  >
> {
  const result =
    new Map<
      string,
      OrderItemRow[]
    >();


  if (
    orderIds.length ===
    0
  ) {
    return result;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "order_items",
      )
      .select(
        ORDER_ITEM_COLUMNS,
      )
      .in(
        "order_id",
        orderIds,
      );


  if (
    error
  ) {
    throw error;
  }


  for (
    const row of
      (
        data ??
        []
      ) as OrderItemRow[]
  ) {

    const existing =
      result.get(
        row.order_id,
      ) ??
      [];


    existing.push(
      row,
    );


    result.set(
      row.order_id,
      existing,
    );
  }


  return result;
}


/*
 * ==========================================================
 * GET SINGLE ORDER
 * ==========================================================
 */

export async function getOrderById(
  orderId: string,
): Promise<Order | null> {
  if (
    !orderId.trim()
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "orders",
      )
      .select(
        ORDER_COLUMNS,
      )
      .eq(
        "id",
        orderId,
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  if (
    !data
  ) {
    return null;
  }


  const itemMap =
    await getOrderItems(
      [orderId],
    );


  return mapOrder(
    data as OrderRow,
    itemMap.get(
      orderId,
    ) ??
      [],
  );
}


/*
 * ==========================================================
 * GET CURRENT USER ORDERS
 * ==========================================================
 */

export async function getUserOrders(
  userId: string,
): Promise<Order[]> {
  if (
    !userId.trim()
  ) {
    return [];
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "orders",
      )
      .select(
        ORDER_COLUMNS,
      )
      .eq(
        "user_id",
        userId,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  if (
    error
  ) {
    throw error;
  }


  const rows =
    (data ??
      []) as OrderRow[];


  const itemMap =
    await getOrderItems(
      rows.map(
        (
          row,
        ) =>
          row.id,
      ),
    );


  return rows.map(
    (
      row,
    ) =>
      mapOrder(
        row,
        itemMap.get(
          row.id,
        ) ??
          [],
      ),
  );
}


/*
 * ==========================================================
 * GET ALL ORDERS
 * ==========================================================
 *
 * Admin RLS allows all orders.
 */

export async function getAllOrders():
  Promise<Order[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "orders",
      )
      .select(
        ORDER_COLUMNS,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  if (
    error
  ) {
    throw error;
  }


  const rows =
    (data ??
      []) as OrderRow[];


  const itemMap =
    await getOrderItems(
      rows.map(
        (
          row,
        ) =>
          row.id,
      ),
    );


  return rows.map(
    (
      row,
    ) =>
      mapOrder(
        row,
        itemMap.get(
          row.id,
        ) ??
          [],
      ),
  );
}


/*
 * ==========================================================
 * UPDATE ORDER STATUS
 * ==========================================================
 */

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  if (
    !orderId.trim()
  ) {
    throw new Error(
      "Order ID is required.",
    );
  }


  const {
    error,
  } =
    await supabase
      .from(
        "orders",
      )
      .update({
        status,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        orderId,
      );


  if (
    error
  ) {
    throw error;
  }
}


/*
 * ==========================================================
 * REALTIME ORDERS
 * ==========================================================
 */

export function subscribeToOrders(
  onChange: (
    orders: Order[],
  ) => void,

  onError?: (
    error: Error,
  ) => void,
): () => void {
  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  async function load() {
    try {
      const data =
        await getAllOrders();


      if (
        !stopped
      ) {
        onChange(
          data,
        );
      }
    } catch (
      error
    ) {
      const normalized =
        error instanceof Error
          ? error
          : new Error(
              "Unable to load orders.",
            );


      onError?.(
        normalized,
      );
    }
  }


  void load();


  channel =
    supabase
      .channel(
        `nexletronics-orders-${Date.now()}`,
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            "orders",
        },
        () => {
          void load();
        },
      )
      .subscribe(
        (
          status,
        ) => {
          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            onError?.(
              new Error(
                "Unable to connect to the realtime orders database.",
              ),
            );
          }
        },
      );


  return () => {
    stopped =
      true;


    if (
      channel
    ) {
      void supabase.removeChannel(
        channel,
      );
    }
  };
}


/*
 * ==========================================================
 * SECURE ORDER API WRAPPER
 * ==========================================================
 *
 * This preserves the existing createSecureOrder export,
 * but the actual order/payment session is now created by
 * the secure Vercel API.
 */

export async function createSecureOrder(
  items: SecureOrderItem[],
  shippingAddress: SecureShippingAddress,
): Promise<SecureOrderResponse> {
  const user =
    auth.currentUser;


  if (
    !user
  ) {
    throw new Error(
      "You must be signed in to place an order.",
    );
  }


  if (
    !Array.isArray(
      items,
    ) ||
    items.length ===
      0
  ) {
    throw new Error(
      "Your cart is empty.",
    );
  }


  const idToken =
    await user.getIdToken(
      true,
    );


  const response =
    await fetch(
      "/api/razorpay/create-order",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${idToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            items,

            customer: {
              name:
                shippingAddress.name,

              email:
                shippingAddress.email,

              phone:
                shippingAddress.phone,
            },

            shippingAddress,

            billingAddress:
              shippingAddress,

            billingAddressSameAsShipping:
              true,
          }),
      },
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    data?.success !==
      true
  ) {
    throw new Error(
      data?.error ??
        "Unable to create secure payment order.",
    );
  }


  return {
    orderId:
      data.orderId,

    subtotal:
      Number(
        data.totals?.subtotal ??
        0,
      ),

    shipping:
      Number(
        data.totals?.shipping ??
        0,
      ),

    total:
      Number(
        data.totals?.total ??
        0,
      ),
  };
}


/*
 * ==========================================================
 * ROUND MONEY
 * ==========================================================
 */

export function roundMoney(
  value: number,
): number {
  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) *
      100,
    ) / 100
  );
}


/*
 * ==========================================================
 * ERROR MESSAGE
 * ==========================================================
 */

export function orderErrorMessage(
  error: unknown,
): string {
  return getErrorMessage(
    error,
    "Unable to process the order.",
  );
}