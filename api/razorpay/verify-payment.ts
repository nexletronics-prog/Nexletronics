import crypto from "node:crypto";

import {
  adminDb,
} from "../_lib/firebase-admin.js";

import {
  requireAuth,
} from "../_lib/require-auth.js";

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
    | Record<
        string,
        unknown
      >
    | null;

  billingAddress?:
    | Record<
        string,
        unknown
      >
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

export async function POST(
  request: Request,
) {
  try {
    const user =
      await requireAuth(
        request,
      );

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
          success: false,
          error:
            "Razorpay server configuration is missing.",
        },
        500,
      );
    }

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
          success: false,
          error:
            "Missing Razorpay payment fields.",
        },
        400,
      );
    }

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
          success: false,
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

    if (!paymentSession) {
      return json(
        {
          success: false,
          error:
            "Payment session data is missing.",
        },
        404,
      );
    }

    if (
      paymentSession.userId !==
      user.uid
    ) {
      return json(
        {
          success: false,
          error:
            "Unauthorized payment session.",
        },
        403,
      );
    }

    if (
      paymentSession.status ===
        "verified" &&
      paymentSession.appOrderId
    ) {
      return json({
        success: true,

        verified: true,

        orderId:
          paymentSession.appOrderId,

        razorpayOrderId,

        razorpayPaymentId:
          paymentSession
            .razorpayPaymentId ??
          razorpayPaymentId,
      });
    }

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
          success: false,
          error:
            "Invalid Razorpay signature.",
        },
        400,
      );
    }

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
          method: "GET",

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
          success: false,
          error:
            "Unable to verify payment with Razorpay.",
        },
        502,
      );
    }

    if (
      paymentData.order_id !==
      razorpayOrderId
    ) {
      return json(
        {
          success: false,
          error:
            "Payment does not belong to this Razorpay order.",
        },
        400,
      );
    }

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
          success: false,
          error:
            "Payment amount does not match the order.",
        },
        400,
      );
    }

    const expectedCurrency =
      paymentSession.currency ||
      "INR";

    if (
      paymentData.currency !==
      expectedCurrency
    ) {
      return json(
        {
          success: false,
          error:
            "Payment currency does not match the order.",
        },
        400,
      );
    }

    if (
      paymentData.status !==
      "captured"
    ) {
      return json(
        {
          success: false,

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
        (item) => ({
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

    return json({
      success: true,

      verified: true,

      orderId:
        orderRef.id,

      razorpayOrderId,

      razorpayPaymentId,

      paymentStatus:
        paymentData.status,
    });
  } catch (error) {
    console.error(
      "verify-payment error:",
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