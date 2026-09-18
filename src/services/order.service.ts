import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/config";

import type {
  Order,
  OrderItem,
  OrderStatus,
} from "../types/order";

import type {
  Product,
} from "../types/product";

import {
  backupOrderToGoogleSheets,
} from "./googleSheets.service";


/*
 * ==========================================================
 * ORDERS COLLECTION
 * ==========================================================
 */

const ordersCollection =
  collection(
    db,
    "orders",
  );


/*
 * ==========================================================
 * ORDER INPUT
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
 * CREATE ORDER
 * ==========================================================
 */

export async function createSecureOrder(
  items: SecureOrderItem[],
  shippingAddress: SecureShippingAddress,
): Promise<SecureOrderResponse> {

  /*
   * ========================================================
   * AUTHENTICATION
   * ========================================================
   */

  const currentUser =
    auth.currentUser;


  if (!currentUser) {
    throw new Error(
      "You must be signed in to place an order.",
    );
  }


  /*
   * ========================================================
   * BASIC VALIDATION
   * ========================================================
   */

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "Your cart is empty.",
    );
  }


  if (!shippingAddress) {
    throw new Error(
      "Delivery address is required.",
    );
  }


  /*
   * ========================================================
   * CLEAN CUSTOMER DETAILS
   * ========================================================
   */

  const cleanedName =
    String(
      shippingAddress.name ?? "",
    ).trim();


  const cleanedPhone =
    String(
      shippingAddress.phone ?? "",
    ).replace(
      /\D/g,
      "",
    );


  const cleanedEmail =
    String(
      shippingAddress.email ||
      currentUser.email ||
      "",
    )
      .trim()
      .toLowerCase();


  const cleanedAddress =
    String(
      shippingAddress.address ?? "",
    ).trim();


  const cleanedCity =
    String(
      shippingAddress.city ?? "",
    ).trim();


  const cleanedState =
    String(
      shippingAddress.state ?? "",
    ).trim();


  const cleanedPincode =
    String(
      shippingAddress.pincode ?? "",
    ).trim();


  if (!cleanedName) {
    throw new Error(
      "Customer name is required.",
    );
  }


  if (!cleanedPhone) {
    throw new Error(
      "Phone number is required.",
    );
  }


  if (!cleanedEmail) {
    throw new Error(
      "Email address is required.",
    );
  }


  if (!cleanedAddress) {
    throw new Error(
      "Delivery address is required.",
    );
  }


  if (!cleanedCity) {
    throw new Error(
      "City is required.",
    );
  }


  if (!cleanedState) {
    throw new Error(
      "State is required.",
    );
  }


  if (!cleanedPincode) {
    throw new Error(
      "Pincode is required.",
    );
  }


  /*
   * ========================================================
   * COMBINE DUPLICATE PRODUCT IDS
   * ========================================================
   */

  const quantities =
    new Map<
      string,
      number
    >();


  for (
    const item of items
  ) {

    if (
      !item ||
      typeof item.productId !==
        "string" ||
      item.productId.trim() === ""
    ) {
      throw new Error(
        "Invalid product in your cart.",
      );
    }


    const quantity =
      Number(
        item.quantity,
      );


    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity <= 0
    ) {
      throw new Error(
        "Invalid product quantity.",
      );
    }


    const productId =
      item.productId.trim();


    quantities.set(
      productId,
      (
        quantities.get(
          productId,
        ) ?? 0
      ) + quantity,
    );
  }


  /*
   * ========================================================
   * BUILD ORDER ITEMS
   * ========================================================
   */

  const orderItems:
    OrderItem[] = [];


  let subtotal =
    0;


  for (
    const [
      productId,
      quantity,
    ] of quantities
  ) {

    /*
     * ------------------------------------------------------
     * READ PRODUCT
     * ------------------------------------------------------
     */

    const productSnapshot =
      await getDoc(
        doc(
          db,
          "products",
          productId,
        ),
      );


    if (
      !productSnapshot.exists()
    ) {
      throw new Error(
        "One of the products in your cart no longer exists.",
      );
    }


    const product =
      productSnapshot.data() as
        Partial<Product>;


    /*
     * ------------------------------------------------------
     * REQUIRED PRODUCT DATA
     * ------------------------------------------------------
     */

    const name =
      typeof product.name ===
        "string" &&
      product.name.trim()
        ? product.name.trim()
        : "Unnamed product";


    const price =
      typeof product.price ===
        "number" &&
      Number.isFinite(
        product.price,
      ) &&
      product.price >= 0
        ? product.price
        : 0;


    const stock =
      typeof product.stock ===
        "number" &&
      Number.isFinite(
        product.stock,
      )
        ? product.stock
        : 0;


    /*
     * ------------------------------------------------------
     * AVAILABILITY
     * ------------------------------------------------------
     */

    const available =
      product.available ??
      product.active ??
      true;


    if (
      available !== true
    ) {
      throw new Error(
        `${name} is currently unavailable.`,
      );
    }


    /*
     * ------------------------------------------------------
     * STOCK CHECK
     * ------------------------------------------------------
     */

    if (
      quantity > stock
    ) {
      throw new Error(
        `${name} has only ${stock} unit${stock === 1 ? "" : "s"} available.`,
      );
    }


    /*
     * ------------------------------------------------------
     * LINE TOTAL
     * ------------------------------------------------------
     */

    const lineTotal =
      price *
      quantity;


    subtotal +=
      lineTotal;


    /*
     * ======================================================
     * IMPORTANT FIRESTORE FIX
     * ======================================================
     *
     * Never put undefined into Firestore.
     *
     * We start with only fields that definitely have values,
     * then add optional fields only when they actually exist.
     */

    const orderItem:
      OrderItem = {
        productId:
          productSnapshot.id,

        name,

        price,

        quantity,
      };


    /*
     * Optional SKU
     */

    if (
      typeof product.sku ===
        "string" &&
      product.sku.trim()
        .length > 0
    ) {
      orderItem.sku =
        product.sku.trim();
    }


    /*
     * Optional image
     */

    const productImage =
      typeof product.image ===
        "string" &&
      product.image.trim()
        .length > 0
        ? product.image.trim()
        : (
            typeof product.imageUrl ===
              "string" &&
            product.imageUrl.trim()
              .length > 0
              ? product.imageUrl.trim()
              : ""
          );


    if (
      productImage
    ) {
      orderItem.image =
        productImage;
    }


    /*
     * Optional category
     */

    if (
      typeof product.category ===
        "string" &&
      product.category.trim()
        .length > 0
    ) {
      orderItem.category =
        product.category.trim();
    }


    orderItems.push(
      orderItem,
    );
  }


  /*
   * ========================================================
   * ROUND MONEY
   * ========================================================
   */

  subtotal =
    roundMoney(
      subtotal,
    );


  /*
   * ========================================================
   * SHIPPING
   * ========================================================
   *
   * ₹1000 and above = FREE
   * Below ₹1000 = ₹60
   */

  const shipping =
    subtotal >= 1000
      ? 0
      : 60;


  /*
   * ========================================================
   * TOTAL
   * ========================================================
   */

  const total =
    roundMoney(
      subtotal +
      shipping,
    );


  /*
   * ========================================================
   * FIRESTORE ORDER
   * ========================================================
   */

  try {

    const orderDocument =
      await addDoc(
        ordersCollection,
        {
          userId:
            currentUser.uid,

          userEmail:
            currentUser.email ||
            cleanedEmail,

          items:
            orderItems,

          shippingAddress: {
            name:
              cleanedName,

            phone:
              cleanedPhone,

            email:
              cleanedEmail,

            address:
              cleanedAddress,

            city:
              cleanedCity,

            state:
              cleanedState,

            pincode:
              cleanedPincode,
          },

          subtotal,

          shipping,

          total,

          currency:
            "INR",

          status:
            "pending",

          paymentStatus:
            "pending",

          paymentMethod:
            "pending",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );


    /*
     * ======================================================
     * RESULT
     * ======================================================
     */

    const result:
      SecureOrderResponse = {
        orderId:
          orderDocument.id,

        subtotal,

        shipping,

        total,
      };


    /*
     * ======================================================
     * GOOGLE SHEETS BACKUP
     * ======================================================
     *
     * Firestore remains the primary order database.
     * Sheets failure must NOT fail the customer order.
     */

    try {

      const fullOrder =
        await getOrderById(
          orderDocument.id,
        );


      if (
        fullOrder
      ) {

        void backupOrderToGoogleSheets(
          {
            orderId:
              fullOrder.id,

            userId:
              fullOrder.userId,

            userEmail:
              fullOrder.userEmail,

            items:
              fullOrder.items,

            shippingAddress:
              fullOrder.shippingAddress,

            subtotal:
              fullOrder.subtotal,

            shipping:
              fullOrder.shipping,

            total:
              fullOrder.total,

            currency:
              fullOrder.currency,

            paymentStatus:
              fullOrder.paymentStatus,

            paymentMethod:
              fullOrder.paymentMethod,

            status:
              fullOrder.status,

            createdAt:
              getOrderTimestamp(
                fullOrder.createdAt,
              ),
          },
        ).catch(
          (
            sheetError,
          ) => {

            console.error(
              "Google Sheets backup failed:",
              sheetError,
            );

          },
        );

      }

    } catch (
      sheetPreparationError
    ) {

      console.error(
        "Unable to prepare Google Sheets backup:",
        sheetPreparationError,
      );

    }


    return result;

  } catch (
    error
  ) {

    console.error(
      "Order creation failed:",
      error,
    );


    throw new Error(
      getErrorMessage(
        error,
        "Unable to place your order. Please try again.",
      ),
    );
  }
}


/*
 * ==========================================================
 * GET SINGLE ORDER
 * ==========================================================
 */

export async function getOrderById(
  orderId: string,
): Promise<Order | null> {

  if (!orderId) {
    return null;
  }


  const snapshot =
    await getDoc(
      doc(
        db,
        "orders",
        orderId,
      ),
    );


  if (
    !snapshot.exists()
  ) {
    return null;
  }


  return {
    id:
      snapshot.id,

    ...(
      snapshot.data() as
        Omit<
          Order,
          "id"
        >
    ),
  };
}


/*
 * ==========================================================
 * GET CUSTOMER ORDERS
 * ==========================================================
 */

export async function getUserOrders(
  userId: string,
): Promise<Order[]> {

  if (!userId) {
    return [];
  }


  const ordersQuery =
    query(
      ordersCollection,

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
    await getDocs(
      ordersQuery,
    );


  return snapshot.docs.map(
    (
      document,
    ) => ({
      id:
        document.id,

      ...(
        document.data() as
          Omit<
            Order,
            "id"
          >
      ),
    }),
  );
}


/*
 * ==========================================================
 * GET ALL ORDERS
 * ==========================================================
 */

export async function getAllOrders(): Promise<
  Order[]
> {

  const ordersQuery =
    query(
      ordersCollection,

      orderBy(
        "createdAt",
        "desc",
      ),
    );


  const snapshot =
    await getDocs(
      ordersQuery,
    );


  return snapshot.docs.map(
    (
      document,
    ) => ({
      id:
        document.id,

      ...(
        document.data() as
          Omit<
            Order,
            "id"
          >
      ),
    }),
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

  if (!orderId) {
    throw new Error(
      "Order ID is required.",
    );
  }


  await updateDoc(
    doc(
      db,
      "orders",
      orderId,
    ),
    {
      status,

      updatedAt:
        serverTimestamp(),
    },
  );
}


/*
 * ==========================================================
 * ROUND MONEY
 * ==========================================================
 */

function roundMoney(
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
 * FIRESTORE TIMESTAMP → STRING
 * ==========================================================
 */

function getOrderTimestamp(
  value: unknown,
): string {

  if (
    typeof value ===
      "object" &&
    value !== null &&
    "toDate" in value
  ) {

    const timestamp =
      value as {
        toDate?: unknown;
      };


    if (
      typeof timestamp.toDate ===
      "function"
    ) {

      try {

        const date =
          timestamp.toDate();


        if (
          date instanceof Date &&
          !Number.isNaN(
            date.getTime(),
          )
        ) {
          return date.toISOString();
        }

      } catch {
        // Fall through.
      }
    }
  }


  if (
    value instanceof Date
  ) {

    if (
      !Number.isNaN(
        value.getTime(),
      )
    ) {
      return value.toISOString();
    }
  }


  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {

    const date =
      new Date(
        value,
      );


    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      return date.toISOString();
    }
  }


  return new Date().toISOString();
}


/*
 * ==========================================================
 * ERROR MESSAGE
 * ==========================================================
 */

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {

  if (
    error instanceof Error
  ) {
    return error.message;
  }


  if (
    typeof error ===
    "string"
  ) {
    return error;
  }


  if (
    error &&
    typeof error ===
      "object" &&
    "message" in error
  ) {

    const message =
      (
        error as {
          message?: unknown;
        }
      ).message;


    if (
      typeof message ===
      "string"
    ) {
      return message;
    }
  }


  return fallback;
}