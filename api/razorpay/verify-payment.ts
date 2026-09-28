import crypto from "node:crypto";

import {
  adminDb,
} from "../_lib/firebase-admin.mjs";

import {
  requireAuth,
} from "../_lib/require-auth.mjs";


/*
 * ==========================================================
 * TYPES
 * ==========================================================
 */

interface PaymentSessionItem {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
  category?: string;
}


interface PaymentSessionData {
  razorpayOrderId: string;
  receipt?: string;

  userId: string;
  userEmail?: string;

  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  items?: PaymentSessionItem[];

  shippingAddress?:
    | Record<string, unknown>
    | null;

  billingAddress?:
    | Record<string, unknown>
    | null;

  billingAddressSameAsShipping?: boolean;

  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  total: number;

  amountInPaise: number;
  currency: string;
  status: string;

  razorpayPaymentId?: string;
  appOrderId?: string;
}


/*
 * ==========================================================
 * JSON RESPONSE
 * ==========================================================
 */

function json(
  data: unknown,
  status = 200,
) {
  return Response.json(
    data,
    {
      status,

      headers: {
        "Content-Type":
          "application/json",

        "Cache-Control":
          "no-store",
      },
    },
  );
}


/*
 * ==========================================================
 * STRING / NUMBER HELPERS
 * ==========================================================
 */

function asString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value
    : "";
}


function asNumber(
  value: unknown,
): number {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue,
  )
    ? numberValue
    : 0;
}


/*
 * ==========================================================
 * SIGNATURE COMPARISON
 * ==========================================================
 */

function signaturesMatch(
  expected: string,
  received: string,
): boolean {
  const expectedBuffer =
    Buffer.from(
      expected,
      "utf8",
    );

  const receivedBuffer =
    Buffer.from(
      received,
      "utf8",
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer,
  );
}


/*
 * ==========================================================
 * GOOGLE SHEETS BACKUP
 * ==========================================================
 *
 * IMPORTANT:
 *
 * This runs AFTER the Razorpay payment has been
 * verified and AFTER the Firestore order has been created.
 *
 * Failure here must NEVER turn a successful payment
 * into a failed checkout.
 * ==========================================================
 */

async function backupOrderToGoogleSheets(
  order: {
    orderId: string;

    userId: string;

    userEmail: string;

    items: Array<{
      name: string;
      quantity: number;
      price: number;
      sku?: string;
    }>;

    shippingAddress: {
      name: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    };

    subtotal: number;
    shipping: number;
    total: number;
    currency: string;

    paymentStatus: string;
    paymentMethod: string;
    status: string;

    createdAt: string;
  },
): Promise<void> {

  const sheetsUrl =
    process.env
      .GOOGLE_SHEETS_WEB_APP_URL;

  if (!sheetsUrl) {
    console.error(
      "GOOGLE_SHEETS_WEB_APP_URL is missing.",
    );

    return;
  }


  const payload = {
    orderId:
      order.orderId,

    userId:
      order.userId,

    userEmail:
      order.userEmail,

    items:
      order.items.map(
        (
          item,
        ) => ({
          name:
            item.name,

          quantity:
            item.quantity,

          price:
            item.price,

          sku:
            item.sku ??
            "",
        }),
      ),

    shippingAddress:
      order.shippingAddress,

    subtotal:
      order.subtotal,

    shipping:
      order.shipping,

    total:
      order.total,

    currency:
      order.currency,

    paymentStatus:
      order.paymentStatus,

    paymentMethod:
      order.paymentMethod,

    status:
      order.status,

    createdAt:
      order.createdAt,
  };


  try {

    console.log(
      "[Google Sheets] Sending order:",
      order.orderId,
    );


    const response =
      await fetch(
        sheetsUrl,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8",
          },

          body:
            JSON.stringify(
              payload,
            ),
        },
      );


    const responseText =
      await response.text();


    if (
      !response.ok
    ) {

      console.error(
        "[Google Sheets] HTTP error:",
        response.status,
        responseText,
      );

      return;
    }


    console.log(
      "[Google Sheets] Response:",
      responseText,
    );


    console.log(
      "[Google Sheets] Order submitted successfully:",
      order.orderId,
    );

  } catch (
    error
  ) {

    console.error(
      "[Google Sheets] Backup failed:",
      error,
    );

    /*
     * DO NOT THROW.
     *
     * Payment has already been verified.
     */
  }
}


/*
 * ==========================================================
 * VERIFY PAYMENT
 * ==========================================================
 */

export async function POST(
  request: Request,
) {

  try {

    /*
     * ======================================================
     * FIREBASE AUTH
     * ======================================================
     */

    const user =
      await requireAuth(
        request,
      );


    /*
     * ======================================================
     * RAZORPAY SERVER CREDENTIALS
     * ======================================================
     */

    const keyId =
      process.env
        .RAZORPAY_KEY_ID;

    const keySecret =
      process.env
        .RAZORPAY_KEY_SECRET;


    if (
      !keyId ||
      !keySecret
    ) {

      return json(
        {
          success:
            false,

          error:
            "Razorpay server configuration is missing.",
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
      await request.json();


    const razorpayOrderId =
      asString(
        body?.razorpay_order_id,
      ).trim();


    const razorpayPaymentId =
      asString(
        body?.razorpay_payment_id,
      ).trim();


    const razorpaySignature =
      asString(
        body?.razorpay_signature,
      ).trim();


    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {

      return json(
        {
          success:
            false,

          error:
            "Missing Razorpay payment fields.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * GET PAYMENT SESSION
     * ======================================================
     */

    const paymentSessionRef =
      adminDb
        .collection(
          "paymentSessions",
        )
        .doc(
          razorpayOrderId,
        );


    const paymentSessionSnapshot =
      await paymentSessionRef.get();


    if (
      !paymentSessionSnapshot.exists
    ) {

      return json(
        {
          success:
            false,

          error:
            "Payment session not found.",
        },
        404,
      );
    }


    const paymentSession =
      paymentSessionSnapshot.data() as
        | PaymentSessionData
        | undefined;


    if (
      !paymentSession
    ) {

      return json(
        {
          success:
            false,

          error:
            "Payment session data is missing.",
        },
        404,
      );
    }


    /*
     * ======================================================
     * OWNERSHIP CHECK
     * ======================================================
     */

    if (
      paymentSession.userId !==
      user.uid
    ) {

      return json(
        {
          success:
            false,

          error:
            "Unauthorized payment session.",
        },
        403,
      );
    }


    /*
     * ======================================================
     * IDEMPOTENCY
     * ======================================================
     *
     * If payment was already verified, don't create
     * another Firestore order or another Sheet row.
     * ======================================================
     */

    if (
      paymentSession.status ===
        "verified" &&
      paymentSession.appOrderId
    ) {

      return json({
        success:
          true,

        verified:
          true,

        orderId:
          paymentSession.appOrderId,

        razorpayOrderId,

        razorpayPaymentId:
          paymentSession
            .razorpayPaymentId ??
          razorpayPaymentId,
      });
    }


    /*
     * ======================================================
     * VERIFY RAZORPAY SIGNATURE
     * ======================================================
     */

    const signaturePayload =
      `${razorpayOrderId}|${razorpayPaymentId}`;


    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          keySecret,
        )
        .update(
          signaturePayload,
        )
        .digest(
          "hex",
        );


    if (
      !signaturesMatch(
        expectedSignature,
        razorpaySignature,
      )
    ) {

      return json(
        {
          success:
            false,

          error:
            "Invalid Razorpay signature.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * QUERY RAZORPAY PAYMENT
     * ======================================================
     */

    const razorpayAuth =
      Buffer.from(
        `${keyId}:${keySecret}`,
      ).toString(
        "base64",
      );


    const paymentResponse =
      await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(
          razorpayPaymentId,
        )}`,
        {
          method:
            "GET",

          headers: {
            Authorization:
              `Basic ${razorpayAuth}`,
          },
        },
      );


    const paymentData =
      await paymentResponse.json();


    if (
      !paymentResponse.ok
    ) {

      console.error(
        "Razorpay payment lookup failed:",
        paymentData,
      );


      return json(
        {
          success:
            false,

          error:
            "Unable to verify payment with Razorpay.",
        },
        502,
      );
    }


    /*
     * ======================================================
     * VERIFY ORDER ID
     * ======================================================
     */

    if (
      paymentData.order_id !==
      razorpayOrderId
    ) {

      return json(
        {
          success:
            false,

          error:
            "Payment does not belong to this Razorpay order.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * VERIFY AMOUNT
     * ======================================================
     */

    const expectedAmount =
      asNumber(
        paymentSession
          .amountInPaise,
      );


    const actualAmount =
      asNumber(
        paymentData.amount,
      );


    if (
      expectedAmount <= 0 ||
      actualAmount !==
        expectedAmount
    ) {

      return json(
        {
          success:
            false,

          error:
            "Payment amount does not match the order.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * VERIFY CURRENCY
     * ======================================================
     */

    const expectedCurrency =
      paymentSession.currency ||
      "INR";


    if (
      paymentData.currency !==
      expectedCurrency
    ) {

      return json(
        {
          success:
            false,

          error:
            "Payment currency does not match the order.",
        },
        400,
      );
    }


    /*
     * ======================================================
     * VERIFY CAPTURE STATUS
     * ======================================================
     */

    if (
      paymentData.status !==
      "captured"
    ) {

      return json(
        {
          success:
            false,

          error:
            `Payment is not captured. Current status: ${
              paymentData.status ??
              "unknown"
            }.`,

          paymentStatus:
            paymentData.status ??
            "unknown",
        },
        409,
      );
    }


    /*
     * ======================================================
     * CREATE FIRESTORE ORDER
     * ======================================================
     */

    const orderRef =
      adminDb
        .collection(
          "orders",
        )
        .doc();


    const sessionItems =
      Array.isArray(
        paymentSession.items,
      )
        ? paymentSession.items
        : [];


    const orderItems =
      sessionItems.map(
        (
          item,
        ) => ({
          productId:
            item.productId,

          name:
            item.name,

          sku:
            item.sku ||
            null,

          price:
            asNumber(
              item.unitPrice,
            ),

          quantity:
            Math.max(
              1,
              Math.floor(
                asNumber(
                  item.quantity,
                ),
              ),
            ),

          lineTotal:
            asNumber(
              item.lineTotal,
            ),

          image:
            item.image ||
            null,

          category:
            item.category ||
            null,
        }),
      );


    const now =
      new Date();


    /*
     * ======================================================
     * FIRESTORE ORDER
     * ======================================================
     */

    await orderRef.set({

      userId:
        user.uid,

      userEmail:
        paymentSession
          .userEmail ??
        user.email ??
        "",

      customer:
        paymentSession.customer ??
        null,

      items:
        orderItems,

      shippingAddress:
        paymentSession
          .shippingAddress ??
        null,

      billingAddress:
        paymentSession
          .billingAddress ??
        null,

      billingAddressSameAsShipping:
        paymentSession
          .billingAddressSameAsShipping ??
        false,

      subtotal:
        asNumber(
          paymentSession.subtotal,
        ),

      shipping:
        asNumber(
          paymentSession.shippingAmount,
        ),

      tax:
        asNumber(
          paymentSession.taxAmount,
        ),

      discount:
        asNumber(
          paymentSession.discountAmount,
        ),

      total:
        asNumber(
          paymentSession.total,
        ),

      currency:
        expectedCurrency,

      status:
        "pending",

      paymentStatus:
        "paid",

      paymentMethod:
        paymentData.method ??
        "razorpay",

      razorpayOrderId,

      razorpayPaymentId,

      razorpayPaymentStatus:
        paymentData.status,

      razorpayAmount:
        actualAmount,

      razorpayCurrency:
        paymentData.currency,

      receipt:
        paymentSession.receipt ??
        null,

      createdAt:
        now,

      updatedAt:
        now,
    });


    /*
     * ======================================================
     * MARK PAYMENT SESSION VERIFIED
     * ======================================================
     */

    await paymentSessionRef.update({

      status:
        "verified",

      razorpayPaymentId,

      razorpaySignature,

      razorpayPaymentStatus:
        paymentData.status,

      paymentMethod:
        paymentData.method ??
        "razorpay",

      appOrderId:
        orderRef.id,

      verifiedAt:
        now,

      updatedAt:
        now,
    });


    /*
     * ======================================================
     * GOOGLE SHEETS
     * ======================================================
     *
     * Now that the payment is verified and the Firestore
     * order exists, send the complete order to Sheets.
     *
     * This is deliberately awaited so the request has a
     * chance to reach Google Apps Script before Vercel
     * finishes the invocation.
     *
     * Failure does NOT fail the payment.
     * ======================================================
     */

    const customer =
      paymentSession.customer ??
      {};


    const storedShippingAddress =
      paymentSession
        .shippingAddress ??
      {};


    const shippingAddress = {

      name:
        asString(
          storedShippingAddress.name,
        ) ||
        asString(
          customer.name,
        ) ||
        "",

      phone:
        asString(
          storedShippingAddress.phone,
        ) ||
        asString(
          customer.phone,
        ) ||
        "",

      email:
        asString(
          storedShippingAddress.email,
        ) ||
        asString(
          customer.email,
        ) ||
        paymentSession
          .userEmail ||
        user.email ||
        "",

      address:
        asString(
          storedShippingAddress.address,
        ),

      city:
        asString(
          storedShippingAddress.city,
        ),

      state:
        asString(
          storedShippingAddress.state,
        ),

      pincode:
        asString(
          storedShippingAddress.pincode,
        ),
    };


    await backupOrderToGoogleSheets({

      orderId:
        orderRef.id,

      userId:
        user.uid,

      userEmail:
        paymentSession
          .userEmail ??
        user.email ??
        "",

      items:
        sessionItems.map(
          (
            item,
          ) => ({
            name:
              item.name,

            quantity:
              Math.max(
                1,
                Math.floor(
                  asNumber(
                    item.quantity,
                  ),
                ),
              ),

            price:
              asNumber(
                item.unitPrice,
              ),

            sku:
              item.sku ??
              "",
          }),
        ),

      shippingAddress,

      subtotal:
        asNumber(
          paymentSession.subtotal,
        ),

      shipping:
        asNumber(
          paymentSession.shippingAmount,
        ),

      total:
        asNumber(
          paymentSession.total,
        ),

      currency:
        expectedCurrency,

      paymentStatus:
        "paid",

      paymentMethod:
        paymentData.method ??
        "razorpay",

      status:
        "pending",

      createdAt:
        now.toISOString(),
    });


    /*
     * ======================================================
     * SUCCESS
     * ======================================================
     */

    return json({

      success:
        true,

      verified:
        true,

      orderId:
        orderRef.id,

      razorpayOrderId,

      razorpayPaymentId,

      paymentStatus:
        paymentData.status,

    });


  } catch (
    error
  ) {

    console.error(
      "verify-payment error:",
      error,
    );


    return json(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      500,
    );
  }
}