import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  getFirestore,
} from "firebase-admin/firestore";

interface CartItemInput {
  productId: string;
  quantity: number;
}

interface AddressInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  companyName?: string;
  gstin?: string;
}

interface CreateOrderBody {
  items: CartItemInput[];

  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  shippingAddress?: AddressInput;

  billingAddress?: AddressInput;

  billingAddressSameAsShipping?: boolean;
}

function json(
  data: unknown,
  status = 200,
) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store",
    },
  });
}

function cleanString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeQuantity(
  value: unknown,
): number {
  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return 0;
  }

  return quantity;
}

function normalizeAddress(
  address:
    | AddressInput
    | undefined,
) {
  if (!address) {
    return null;
  }

  return {
    name: cleanString(address.name),
    email: cleanString(address.email),
    phone: cleanString(address.phone),
    address: cleanString(address.address),
    city: cleanString(address.city),
    state: cleanString(address.state),
    pincode: cleanString(address.pincode),
    country:
      cleanString(address.country) ||
      "India",
    companyName: cleanString(
      address.companyName,
    ),
    gstin: cleanString(
      address.gstin,
    ),
  };
}

function getFirebaseAdmin() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID",
    );
  }

  if (!clientEmail) {
    throw new Error(
      "Missing FIREBASE_CLIENT_EMAIL",
    );
  }

  if (!privateKey) {
    throw new Error(
      "Missing FIREBASE_PRIVATE_KEY",
    );
  }

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey:
              privateKey.replace(
                /\\n/g,
                "\n",
              ),
          }),

          databaseURL:
            "https://nexletronics-81270-default-rtdb.asia-southeast1.firebasedatabase.app",
        });

  return {
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

async function requireAuthenticatedUser(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (!authorization) {
    throw new Error(
      "Missing Authorization header",
    );
  }

  if (
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    throw new Error(
      "Invalid Authorization header",
    );
  }

  const idToken =
    authorization
      .slice("Bearer ".length)
      .trim();

  if (!idToken) {
    throw new Error(
      "Missing Firebase ID token",
    );
  }

  const {
    auth,
  } = getFirebaseAdmin();

  return auth.verifyIdToken(
    idToken,
  );
}

export async function POST(
  request: Request,
) {
  try {
    const user =
      await requireAuthenticatedUser(
        request,
      );

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId) {
      return json(
        {
          success: false,
          error:
            "RAZORPAY_KEY_ID is missing.",
        },
        500,
      );
    }

    if (!keySecret) {
      return json(
        {
          success: false,
          error:
            "RAZORPAY_KEY_SECRET is missing.",
        },
        500,
      );
    }

    const body =
      (await request.json()) as
        CreateOrderBody;

    if (
      !body ||
      !Array.isArray(
        body.items,
      ) ||
      body.items.length === 0
    ) {
      return json(
        {
          success: false,
          error:
            "Cart is empty.",
        },
        400,
      );
    }

    const requestedItems =
      body.items
        .map((item) => ({
          productId:
            cleanString(
              item?.productId,
            ),

          quantity:
            normalizeQuantity(
              item?.quantity,
            ),
        }))
        .filter(
          (item) =>
            item.productId &&
            item.quantity > 0,
        );

    if (
      requestedItems.length === 0
    ) {
      return json(
        {
          success: false,
          error:
            "No valid cart items were provided.",
        },
        400,
      );
    }

    if (
      requestedItems.length > 50
    ) {
      return json(
        {
          success: false,
          error:
            "Too many cart items.",
        },
        400,
      );
    }

    const {
      db,
    } = getFirebaseAdmin();

    const uniqueProductIds =
      Array.from(
        new Set(
          requestedItems.map(
            (item) =>
              item.productId,
          ),
        ),
      );

    const productSnapshots =
      await Promise.all(
        uniqueProductIds.map(
          (productId) =>
            db
              .collection(
                "products",
              )
              .doc(
                productId,
              )
              .get(),
        ),
      );

    const productMap =
      new Map<
        string,
        Record<
          string,
          unknown
        >
      >();

    for (
      const snapshot
      of productSnapshots
    ) {
      if (
        snapshot.exists
      ) {
        productMap.set(
          snapshot.id,
          (
            snapshot.data() ??
            {}
          ) as Record<
            string,
            unknown
          >,
        );
      }
    }

    let subtotal = 0;

    const validatedItems:
      Array<{
        productId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        sku: string;
      }> = [];

    for (
      const item
      of requestedItems
    ) {
      const product =
        productMap.get(
          item.productId,
        );

      if (!product) {
        return json(
          {
            success: false,
            error:
              `Product ${item.productId} was not found.`,
          },
          400,
        );
      }

      const available =
        product.available ??
        product.active ??
        false;

      if (!available) {
        return json(
          {
            success: false,
            error:
              `${
                product.name ??
                "A product"
              } is currently unavailable.`,
          },
          400,
        );
      }

      const unitPrice =
        Number(
          product.price,
        );

      if (
        !Number.isFinite(
          unitPrice,
        ) ||
        unitPrice < 0
      ) {
        return json(
          {
            success: false,
            error:
              `Invalid price configured for ${
                product.name ??
                item.productId
              }.`,
          },
          500,
        );
      }

      const stock =
        Number(
          product.stock,
        );

      if (
        !Number.isFinite(
          stock,
        ) ||
        stock < 0
      ) {
        return json(
          {
            success: false,
            error:
              `Invalid stock configured for ${
                product.name ??
                item.productId
              }.`,
          },
          500,
        );
      }

      if (
        item.quantity >
        stock
      ) {
        return json(
          {
            success: false,

            error:
              `${
                product.name ??
                "Product"
              } does not have enough stock.`,

            availableStock:
              stock,

            requestedQuantity:
              item.quantity,
          },
          400,
        );
      }

      const lineTotal =
        unitPrice *
        item.quantity;

      subtotal +=
        lineTotal;

      validatedItems.push({
        productId:
          item.productId,

        name:
          cleanString(
            product.name,
          ) ||
          "Unnamed product",

        quantity:
          item.quantity,

        unitPrice,

        lineTotal,

        sku:
          cleanString(
            product.sku,
          ),
      });
    }

    /*
     * These remain zero until your
     * actual shipping/tax rules are added.
     */
    const shippingAmount = 0;
    const taxAmount = 0;
    const discountAmount = 0;

    const total =
      Math.max(
        0,
        subtotal +
          shippingAmount +
          taxAmount -
          discountAmount,
      );

    const amountInPaise =
      Math.round(
        total * 100,
      );

    if (
      !Number.isInteger(
        amountInPaise,
      ) ||
      amountInPaise <= 0
    ) {
      return json(
        {
          success: false,
          error:
            "Calculated order amount is invalid.",
        },
        400,
      );
    }

    const shippingAddress =
      normalizeAddress(
        body.shippingAddress,
      );

    let billingAddress =
      normalizeAddress(
        body.billingAddress,
      );

    const sameAsShipping =
      body.billingAddressSameAsShipping ===
      true;

    if (
      sameAsShipping &&
      shippingAddress
    ) {
      billingAddress =
        shippingAddress;
    }

    const customerName =
      cleanString(
        body.customer?.name,
      ) ||
      cleanString(
        user.name,
      ) ||
      "";

    const customerEmail =
      cleanString(
        body.customer?.email,
      ) ||
      cleanString(
        user.email,
      ) ||
      "";

    const customerPhone =
      cleanString(
        body.customer?.phone,
      );

    const receipt =
      `NX-${Date.now()}-${user.uid.slice(
        0,
        8,
      )}`;

    const authHeader =
      Buffer.from(
        `${keyId}:${keySecret}`,
      ).toString(
        "base64",
      );

    const razorpayResponse =
      await fetch(
        "https://api.razorpay.com/v1/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Basic ${authHeader}`,
          },

          body: JSON.stringify({
            amount:
              amountInPaise,

            currency:
              "INR",

            receipt,

            payment_capture:
              1,

            notes: {
              firebaseUid:
                user.uid,

              email:
                customerEmail,

              items:
                String(
                  validatedItems.length,
                ),
            },
          }),
        },
      );

    const razorpayData =
      await razorpayResponse.json();

    if (
      !razorpayResponse.ok
    ) {
      console.error(
        "Razorpay order creation failed:",
        razorpayData,
      );

      return json(
        {
          success: false,
          error:
            "Unable to create Razorpay order.",
        },
        502,
      );
    }

    if (
      !razorpayData?.id
    ) {
      return json(
        {
          success: false,
          error:
            "Razorpay did not return an order ID.",
        },
        502,
      );
    }

    await db
      .collection(
        "paymentSessions",
      )
      .doc(
        razorpayData.id,
      )
      .set({
        razorpayOrderId:
          razorpayData.id,

        receipt,

        userId:
          user.uid,

        userEmail:
          customerEmail,

        customer: {
          name:
            customerName,

          email:
            customerEmail,

          phone:
            customerPhone,
        },

        items:
          validatedItems,

        shippingAddress,

        billingAddress,

        billingAddressSameAsShipping:
          sameAsShipping,

        subtotal,

        shippingAmount,

        taxAmount,

        discountAmount,

        total,

        amountInPaise,

        currency:
          "INR",

        status:
          "created",

        createdAt:
          new Date(),
      });

    return json({
      success: true,

      orderId:
        razorpayData.id,

      keyId,

      amount:
        amountInPaise,

      currency:
        "INR",

      totals: {
        subtotal,

        shipping:
          shippingAmount,

        tax:
          taxAmount,

        discount:
          discountAmount,

        total,
      },

      items:
        validatedItems,
    });
  } catch (error) {
    console.error(
      "create-order error:",
      error,
    );

    return json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      500,
    );
  }
}