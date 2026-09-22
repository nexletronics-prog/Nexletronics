import {
  adminDb,
} from "../_lib/firebase-admin";

import {
  requireAuth,
} from "../_lib/require-auth";

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
  return Response.json(
    data,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
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
  address: AddressInput | undefined,
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
    companyName:
      cleanString(address.companyName),
    gstin:
      cleanString(address.gstin),
  };
}

export async function POST(
  request: Request,
) {
  try {
    /*
     * ======================================================
     * AUTHENTICATION
     * ======================================================
     */

    const user =
      await requireAuth(request);


    /*
     * ======================================================
     * ENVIRONMENT
     * ======================================================
     */

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId) {
      return json(
        {
          error:
            "RAZORPAY_KEY_ID is missing.",
        },
        500,
      );
    }

    if (!keySecret) {
      return json(
        {
          error:
            "RAZORPAY_KEY_SECRET is missing.",
        },
        500,
      );
    }


    /*
     * ======================================================
     * REQUEST BODY
     * ======================================================
     */

    const body =
      (await request.json()) as CreateOrderBody;

    if (
      !body ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return json(
        {
          error:
            "Cart is empty.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * NORMALIZE CART
     * ======================================================
     */

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
          error:
            "No valid cart items were provided.",
        },
        400,
      );
    }


    /*
     * Prevent absurdly large requests.
     */
    if (
      requestedItems.length > 50
    ) {
      return json(
        {
          error:
            "Too many cart items.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * LOAD TRUSTED PRODUCT DATA
     * ======================================================
     *
     * Prices come from Firestore.
     * The browser cannot override them.
     */

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
            adminDb
              .collection(
                "products",
              )
              .doc(productId)
              .get(),
        ),
      );


    const productMap =
      new Map<
        string,
        FirebaseFirestore.DocumentData
      >();


    for (
      const snapshot of productSnapshots
    ) {
      if (
        snapshot.exists
      ) {
        productMap.set(
          snapshot.id,
          snapshot.data() ?? {},
        );
      }
    }


    /*
     * ======================================================
     * CALCULATE TRUSTED TOTAL
     * ======================================================
     */

    let subtotal = 0;

    const validatedItems: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      sku: string;
    }> = [];


    for (
      const item of requestedItems
    ) {
      const product =
        productMap.get(
          item.productId,
        );

      if (!product) {
        return json(
          {
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
            error:
              `${product.name ?? "A product"} is currently unavailable.`,
          },
          400,
        );
      }


      const unitPrice =
        Number(
          product.price,
        );

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return json(
          {
            error:
              `Invalid price configured for ${product.name ?? item.productId}.`,
          },
          500,
        );
      }


      const stock =
        Number(
          product.stock,
        );

      if (
        !Number.isFinite(stock) ||
        stock < 0
      ) {
        return json(
          {
            error:
              `Invalid stock configured for ${product.name ?? item.productId}.`,
          },
          500,
        );
      }


      if (
        item.quantity > stock
      ) {
        return json(
          {
            error:
              `${product.name ?? "Product"} does not have enough stock.`,
            availableStock: stock,
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
     * ======================================================
     * CHECKOUT TOTALS
     * ======================================================
     *
     * We are not inventing a GST rate here.
     * Shipping/tax/discount remain zero until the
     * site's actual business rules are configured.
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
          error:
            "Calculated order amount is invalid.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * CUSTOMER / BILLING DATA
     * ======================================================
     */

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


    /*
     * ======================================================
     * RAZORPAY ORDER
     * ======================================================
     */

    const receipt =
      `NX-${Date.now()}-${user.uid.slice(0, 8)}`;


    const authHeader =
      Buffer.from(
        `${keyId}:${keySecret}`,
      ).toString("base64");


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

          body:
            JSON.stringify({
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
          error:
            "Unable to create Razorpay order.",
        },
        502,
      );
    }


    /*
     * ======================================================
     * STORE TRUSTED PAYMENT SESSION
     * ======================================================
     */

    await adminDb
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


    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     *
     * Only the PUBLIC Key ID goes to the browser.
     */

    return json({
      success:
        true,

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
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      500,
    );
  }
}