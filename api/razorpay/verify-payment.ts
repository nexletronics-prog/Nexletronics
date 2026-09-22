import crypto from "node:crypto";

import {
  adminDb,
} from "../_lib/firebase-admin";

import {
  requireAuth,
} from "../_lib/require-auth";


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
     * RAZORPAY CONFIG
     * ======================================================
     */

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

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


    /*
     * ======================================================
     * REQUEST
     * ======================================================
     */

    const body =
      await request.json();

    const razorpayOrderId =
      String(
        body.razorpay_order_id ??
        "",
      ).trim();

    const razorpayPaymentId =
      String(
        body.razorpay_payment_id ??
        "",
      ).trim();

    const razorpaySignature =
      String(
        body.razorpay_signature ??
        "",
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


    /*
     * ======================================================
     * LOAD OUR TRUSTED PAYMENT SESSION
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
          success: false,
          error:
            "Payment session not found.",
        },
        404,
      );
    }


    const paymentSession =
      paymentSessionSnapshot.data();


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


    /*
     * ======================================================
     * USER OWNERSHIP CHECK
     * ======================================================
     */

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


    /*
     * ======================================================
     * IDEMPOTENCY
     * ======================================================
     *
     * If this payment was already verified, don't create
     * another Firestore order.
     */

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
          paymentSession.razorpayPaymentId ??
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
        .digest("hex");


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


    /*
     * ======================================================
     * FETCH PAYMENT FROM RAZORPAY
     * ======================================================
     *
     * Signature verification alone isn't enough for our
     * order record. We also confirm:
     *
     * - correct order
     * - correct amount
     * - correct currency
     * - captured payment
     *
     * This is done server-side.
     */

    const paymentResponse =
      await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(
          razorpayPaymentId,
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Basic ${Buffer.from(
                `${keyId}:${keySecret}`,
              ).toString("base64")}`,
          },
        },
      );


    const paymentData =
      await paymentResponse.json();


    if (
      !paymentResponse.ok
    ) {
      console.error(
        "Unable to fetch Razorpay payment:",
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
          success: false,
          error:
            "Payment does not belong to this order.",
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
      Number(
        paymentSession.amountInPaise,
      );

    const actualAmount =
      Number(
        paymentData.amount,
      );


    if (
      !Number.isInteger(
        expectedAmount,
      ) ||
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


    /*
     * ======================================================
     * VERIFY CURRENCY
     * ======================================================
     */

    if (
      paymentData.currency !==
      paymentSession.currency
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
          success: false,
          error:
            `Payment is not captured. Current status: ${paymentData.status ?? "unknown"}.`,
          paymentStatus:
            paymentData.status ??
            "unknown",
        },
        409,
      );
    }


    /*
     * ======================================================
     * CREATE APPLICATION ORDER
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
          item: Record<
            string,
            unknown
          >,
        ) => ({
          productId:
            String(
              item.productId ??
              "",
            ),

          name:
            String(
              item.name ??
              "Product",
            ),

          sku:
            String(
              item.sku ??
              "",
            ) ||
            undefined,

          price:
            Number(
              item.unitPrice ??
              0,
            ),

          quantity:
            Number(
              item.quantity ??
              0,
            ),

          lineTotal:
            Number(
              item.lineTotal ??
              0,
            ),

          image:
            String(
              item.image ??
              "",
            ) ||
            undefined,

          category:
            String(
              item.category ??
              "",
            ) ||
            undefined,
        }),
      );


    const now =
      new Date();


    /*
     * `pending` here means the business order is awaiting
     * fulfillment/processing. Payment itself is already paid.
     */

    await orderRef.set({
      userId:
        user.uid,

      userEmail:
        paymentSession.userEmail ??
        user.email ??
        "",

      customer:
        paymentSession.customer ??
        null,

      items:
        orderItems,

      shippingAddress:
        paymentSession.shippingAddress ??
        null,

      billingAddress:
        paymentSession.billingAddress ??
        null,

      billingAddressSameAsShipping:
        paymentSession
          .billingAddressSameAsShipping ??
        false,

      subtotal:
        Number(
          paymentSession.subtotal ??
          0,
        ),

      shipping:
        Number(
          paymentSession.shippingAmount ??
          0,
        ),

      tax:
        Number(
          paymentSession.taxAmount ??
          0,
        ),

      discount:
        Number(
          paymentSession.discountAmount ??
          0,
        ),

      total:
        Number(
          paymentSession.total ??
          0,
        ),

      currency:
        paymentSession.currency ??
        "INR",

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
     * UPDATE PAYMENT SESSION
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
     * SUCCESS
     * ======================================================
     */

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