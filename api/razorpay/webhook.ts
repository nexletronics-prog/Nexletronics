import crypto from "node:crypto";

import {
  adminDb,
} from "../_lib/firebase-admin.js";

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

function safeEqual(
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

function getString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value
    : "";
}

function getPaymentOrderId(
  payload: Record<
    string,
    unknown
  >,
): string {
  const payment =
    payload.payment as
      | Record<
          string,
          unknown
        >
      | undefined;

  const paymentEntity =
    payment?.entity as
      | Record<
          string,
          unknown
        >
      | undefined;

  const order =
    payload.order as
      | Record<
          string,
          unknown
        >
      | undefined;

  const orderEntity =
    order?.entity as
      | Record<
          string,
          unknown
        >
      | undefined;

  return (
    getString(
      paymentEntity?.order_id,
    ) ||
    getString(
      orderEntity?.id,
    )
  );
}

function getPaymentId(
  payload: Record<
    string,
    unknown
  >,
): string {
  const payment =
    payload.payment as
      | Record<
          string,
          unknown
        >
      | undefined;

  const paymentEntity =
    payment?.entity as
      | Record<
          string,
          unknown
        >
      | undefined;

  return getString(
    paymentEntity?.id,
  );
}

function getPaymentStatus(
  payload: Record<
    string,
    unknown
  >,
): string {
  const payment =
    payload.payment as
      | Record<
          string,
          unknown
        >
      | undefined;

  const paymentEntity =
    payment?.entity as
      | Record<
          string,
          unknown
        >
      | undefined;

  return getString(
    paymentEntity?.status,
  );
}

export async function POST(
  request: Request,
) {
  try {
    const webhookSecret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "Missing RAZORPAY_WEBHOOK_SECRET",
      );

      return json(
        {
          success: false,
          error:
            "Webhook configuration is missing.",
        },
        500,
      );
    }

    /*
     * Read the raw request body.
     * Signature validation must use
     * the exact raw payload.
     */
    const rawBody =
      await request.text();

    const receivedSignature =
      request.headers.get(
        "x-razorpay-signature",
      ) ?? "";

    if (!receivedSignature) {
      return json(
        {
          success: false,
          error:
            "Missing webhook signature.",
        },
        400,
      );
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret,
        )
        .update(
          rawBody,
        )
        .digest(
          "hex",
        );

    if (
      !safeEqual(
        expectedSignature,
        receivedSignature,
      )
    ) {
      console.error(
        "Invalid Razorpay webhook signature.",
      );

      return json(
        {
          success: false,
          error:
            "Invalid webhook signature.",
        },
        400,
      );
    }

    let body:
      Record<
        string,
        unknown
      >;

    try {
      body =
        JSON.parse(
          rawBody,
        ) as Record<
          string,
          unknown
        >;
    } catch {
      return json(
        {
          success: false,
          error:
            "Invalid webhook JSON.",
        },
        400,
      );
    }

    const event =
      getString(
        body.event,
      );

    const eventId =
      request.headers.get(
        "x-razorpay-event-id",
      ) ?? "";

    /*
     * Deduplicate webhook events.
     */
    if (eventId) {
      const eventRef =
        adminDb
          .collection(
            "razorpayWebhookEvents",
          )
          .doc(
            eventId,
          );

      const existingEvent =
        await eventRef.get();

      if (
        existingEvent.exists
      ) {
        return json({
          success: true,
          duplicate: true,
        });
      }

      await eventRef.set({
        eventId,

        event,

        receivedAt:
          new Date(),
      });
    }

    const payload =
      (
        body.payload as
          | Record<
              string,
              unknown
            >
          | undefined
      ) ?? {};

    const razorpayOrderId =
      getPaymentOrderId(
        payload,
      );

    const razorpayPaymentId =
      getPaymentId(
        payload,
      );

    const paymentStatus =
      getPaymentStatus(
        payload,
      );

    if (
      !razorpayOrderId
    ) {
      console.log(
        "Webhook received without Razorpay order ID:",
        event,
      );

      return json({
        success: true,
        ignored: true,
        event,
      });
    }

    const paymentSessionRef =
      adminDb
        .collection(
          "paymentSessions",
        )
        .doc(
          razorpayOrderId,
        );

    const paymentSession =
      await paymentSessionRef.get();

    if (
      !paymentSession.exists
    ) {
      console.log(
        "No payment session found for webhook:",
        {
          event,
          razorpayOrderId,
        },
      );

      return json({
        success: true,
        ignored: true,
        event,
      });
    }

    const sessionData =
      paymentSession.data() ??
      {};

    if (
      event ===
      "payment.captured"
    ) {
      await paymentSessionRef.update({
        status:
          sessionData.status ===
          "verified"
            ? "verified"
            : "paid",

        paymentWebhookStatus:
          "captured",

        razorpayPaymentId:
          razorpayPaymentId ||
          sessionData
            .razorpayPaymentId ||
          null,

        razorpayPaymentStatus:
          paymentStatus ||
          "captured",

        lastWebhookEvent:
          event,

        lastWebhookEventId:
          eventId ||
          null,

        webhookUpdatedAt:
          new Date(),
      });
    } else if (
      event ===
      "order.paid"
    ) {
      await paymentSessionRef.update({
        status:
          sessionData.status ===
          "verified"
            ? "verified"
            : "paid",

        paymentWebhookStatus:
          "paid",

        razorpayPaymentId:
          razorpayPaymentId ||
          sessionData
            .razorpayPaymentId ||
          null,

        razorpayPaymentStatus:
          paymentStatus ||
          "captured",

        lastWebhookEvent:
          event,

        lastWebhookEventId:
          eventId ||
          null,

        webhookUpdatedAt:
          new Date(),
      });
    } else if (
      event ===
      "payment.failed"
    ) {
      await paymentSessionRef.update({
        status:
          "failed",

        paymentWebhookStatus:
          "failed",

        razorpayPaymentId:
          razorpayPaymentId ||
          sessionData
            .razorpayPaymentId ||
          null,

        razorpayPaymentStatus:
          paymentStatus ||
          "failed",

        lastWebhookEvent:
          event,

        lastWebhookEventId:
          eventId ||
          null,

        webhookUpdatedAt:
          new Date(),
      });
    } else {
      await paymentSessionRef.update({
        lastWebhookEvent:
          event,

        lastWebhookEventId:
          eventId ||
          null,

        webhookUpdatedAt:
          new Date(),
      });
    }

    return json({
      success: true,

      received: true,

      event,

      razorpayOrderId,
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
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