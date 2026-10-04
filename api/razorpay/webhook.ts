import crypto from "node:crypto";

import {
  createClient,
} from "@supabase/supabase-js";


/*
 * ==========================================================
 * TYPES
 * ==========================================================
 */

interface PaymentSessionRow {
  status:
    | string
    | null;

  razorpay_payment_id:
    | string
    | null;

  app_order_id:
    | string
    | null;

  amount_in_paise:
    | number
    | null;

  currency:
    | string
    | null;

  user_id:
    | string
    | null;
}


/*
 * ==========================================================
 * RESPONSE
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

function getString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value
    : "";
}


function getNumber(
  value: unknown,
): number {
  const number =
    Number(
      value,
    );

  return Number.isFinite(
    number,
  )
    ? number
    : 0;
}


/*
 * ==========================================================
 * CONSTANT-TIME SIGNATURE CHECK
 * ==========================================================
 */

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


/*
 * ==========================================================
 * SUPABASE SERVICE ROLE CLIENT
 * ==========================================================
 *
 * This file is server-only.
 *
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */

function getSupabaseAdmin() {
  const url =
    process.env
      .VITE_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;


  if (!url) {
    throw new Error(
      "Missing VITE_SUPABASE_URL.",
    );
  }


  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY.",
    );
  }


  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    },
  );
}


/*
 * ==========================================================
 * RAZORPAY CONFIG
 * ==========================================================
 */

function getRazorpayConfig() {
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
    throw new Error(
      "Razorpay server configuration is missing.",
    );
  }

  return {
    keyId,
    keySecret,
  };
}


/*
 * ==========================================================
 * RAZORPAY API AUTHORIZATION
 * ==========================================================
 */

function getRazorpayAuthorization(
  keyId: string,
  keySecret: string,
): string {
  return (
    "Basic " +
    Buffer.from(
      `${keyId}:${keySecret}`,
    ).toString(
      "base64",
    )
  );
}


/*
 * ==========================================================
 * EXTRACT PAYMENT ENTITY
 * ==========================================================
 */

function getPaymentEntity(
  payload: Record<
    string,
    unknown
  >,
): Record<
  string,
  unknown
> | null {
  const payment =
    payload.payment as
      | Record<
          string,
          unknown
        >
      | undefined;


  const entity =
    payment?.entity as
      | Record<
          string,
          unknown
        >
      | undefined;


  return entity ??
    null;
}


/*
 * ==========================================================
 * EXTRACT ORDER ENTITY
 * ==========================================================
 */

function getOrderEntity(
  payload: Record<
    string,
    unknown
  >,
): Record<
  string,
  unknown
> | null {
  const order =
    payload.order as
      | Record<
          string,
          unknown
        >
      | undefined;


  const entity =
    order?.entity as
      | Record<
          string,
          unknown
        >
      | undefined;


  return entity ??
    null;
}


/*
 * ==========================================================
 * PAYMENT ORDER ID
 * ==========================================================
 */

function getPaymentOrderId(
  payload: Record<
    string,
    unknown
  >,
): string {
  const payment =
    getPaymentEntity(
      payload,
    );

  const order =
    getOrderEntity(
      payload,
    );


  return (
    getString(
      payment?.order_id,
    ) ||
    getString(
      order?.id,
    )
  );
}


/*
 * ==========================================================
 * PAYMENT ID
 * ==========================================================
 */

function getPaymentId(
  payload: Record<
    string,
    unknown
  >,
): string {
  const payment =
    getPaymentEntity(
      payload,
    );


  return getString(
    payment?.id,
  );
}


/*
 * ==========================================================
 * PAYMENT STATUS
 * ==========================================================
 */

function getPaymentStatus(
  payload: Record<
    string,
    unknown
  >,
): string {
  const payment =
    getPaymentEntity(
      payload,
    );


  return getString(
    payment?.status,
  );
}


/*
 * ==========================================================
 * PAYMENT AMOUNT
 * ==========================================================
 */

function getPaymentAmount(
  payload: Record<
    string,
    unknown
  >,
): number {
  const payment =
    getPaymentEntity(
      payload,
    );


  return getNumber(
    payment?.amount,
  );
}


/*
 * ==========================================================
 * PAYMENT CURRENCY
 * ==========================================================
 */

function getPaymentCurrency(
  payload: Record<
    string,
    unknown
  >,
): string {
  const payment =
    getPaymentEntity(
      payload,
    );


  return getString(
    payment?.currency,
  );
}


/*
 * ==========================================================
 * RAZORPAY PAYMENT LOOKUP
 * ==========================================================
 *
 * Webhook signatures establish authenticity of the webhook.
 *
 * We additionally verify the payment directly with Razorpay
 * before changing the application payment state.
 */

async function fetchRazorpayPayment(
  paymentId: string,
  keyId: string,
  keySecret: string,
): Promise<
  Record<
    string,
    unknown
  >
> {
  const response =
    await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(
        paymentId,
      )}`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            getRazorpayAuthorization(
              keyId,
              keySecret,
            ),
        },
      },
    );


  const body =
    await response.json();


  if (
    !response.ok
  ) {
    console.error(
      "[Razorpay webhook] Payment lookup failed:",
      body,
    );

    throw new Error(
      "Unable to verify payment with Razorpay.",
    );
  }


  return body as Record<
    string,
    unknown
  >;
}


/*
 * ==========================================================
 * ORDER IS ALREADY FINAL
 * ==========================================================
 *
 * Paid/verified orders must not be downgraded by an out-of-
 * order webhook event.
 */

function isPaymentFinal(
  status:
    | string
    | null,
): boolean {
  return (
    status ===
      "verified" ||
    status ===
      "paid"
  );
}


/*
 * ==========================================================
 * WEBHOOK
 * ==========================================================
 */

export async function POST(
  request: Request,
) {
  try {

    /*
     * ------------------------------------------------------
     * WEBHOOK SECRET
     * ------------------------------------------------------
     */

    const webhookSecret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;


    if (
      !webhookSecret
    ) {
      return json(
        {
          success:
            false,

          error:
            "Webhook configuration is missing.",
        },
        500,
      );
    }


    /*
     * ------------------------------------------------------
     * RAW BODY
     * ------------------------------------------------------
     *
     * Razorpay signature verification must use the raw request
     * body exactly as received.
     */

    const rawBody =
      await request.text();


    const receivedSignature =
      request.headers.get(
        "x-razorpay-signature",
      ) ??
      "";


    if (
      !receivedSignature
    ) {
      return json(
        {
          success:
            false,

          error:
            "Missing webhook signature.",
        },
        400,
      );
    }


    /*
     * ------------------------------------------------------
     * VERIFY WEBHOOK SIGNATURE
     * ------------------------------------------------------
     */

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
      return json(
        {
          success:
            false,

          error:
            "Invalid webhook signature.",
        },
        400,
      );
    }


    /*
     * ------------------------------------------------------
     * PARSE JSON
     * ------------------------------------------------------
     */

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
          success:
            false,

          error:
            "Invalid webhook JSON.",
        },
        400,
      );
    }


    /*
     * ------------------------------------------------------
     * SUPABASE
     * ------------------------------------------------------
     */

    const supabase =
      getSupabaseAdmin();


    const {
      keyId,
      keySecret,
    } =
      getRazorpayConfig();


    /*
     * ------------------------------------------------------
     * EVENT
     * ------------------------------------------------------
     */

    const event =
      getString(
        body.event,
      );


    if (
      !event
    ) {
      return json(
        {
          success:
            false,

          error:
            "Webhook event is missing.",
        },
        400,
      );
    }


    const eventId =
      request.headers.get(
        "x-razorpay-event-id",
      ) ??
      "";


    /*
     * ------------------------------------------------------
     * PAYLOAD
     * ------------------------------------------------------
     */

    const payload =
      (
        body.payload as
          | Record<
              string,
              unknown
            >
          | undefined
      ) ??
      {};


    const razorpayOrderId =
      getPaymentOrderId(
        payload,
      );


    const webhookPaymentId =
      getPaymentId(
        payload,
      );


    const webhookPaymentStatus =
      getPaymentStatus(
        payload,
      );


    const webhookAmount =
      getPaymentAmount(
        payload,
      );


    const webhookCurrency =
      getPaymentCurrency(
        payload,
      );


    /*
     * ------------------------------------------------------
     * EVENTS WITHOUT AN ORDER
     * ------------------------------------------------------
     */

    if (
      !razorpayOrderId
    ) {

      /*
       * Still acknowledge legitimate signed webhooks so
       * Razorpay does not repeatedly retry an event that is not
       * relevant to this application.
       */

      return json({
        success:
          true,

        ignored:
          true,

        event,
      });
    }


    /*
     * ------------------------------------------------------
     * WEBHOOK DUPLICATE CHECK
     * ------------------------------------------------------
     *
     * We check first, but insert only AFTER successful state
     * processing. This prevents a transient application error
     * from permanently consuming a webhook event.
     */

    if (
      eventId
    ) {
      const {
        data:
          existingEvent,

        error:
          existingEventError,
      } =
        await supabase
          .from(
            "razorpay_webhook_events",
          )
          .select(
            "event_id",
          )
          .eq(
            "event_id",
            eventId,
          )
          .maybeSingle();


      if (
        existingEventError
      ) {
        throw existingEventError;
      }


      if (
        existingEvent
      ) {
        return json({
          success:
            true,

          duplicate:
            true,
        });
      }
    }


    /*
     * ------------------------------------------------------
     * PAYMENT SESSION
     * ------------------------------------------------------
     */

    const {
      data:
        session,
      error:
        sessionError,
    } =
      await supabase
        .from(
          "payment_sessions",
        )
        .select(
          "status, razorpay_payment_id, app_order_id, amount_in_paise, currency, user_id",
        )
        .eq(
          "razorpay_order_id",
          razorpayOrderId,
        )
        .maybeSingle();


    if (
      sessionError
    ) {
      throw sessionError;
    }


    /*
     * Unknown Razorpay orders do not belong to this
     * application.
     */

    if (
      !session
    ) {
      return json({
        success:
          true,

        ignored:
          true,

        event,

        razorpayOrderId,
      });
    }


    const paymentSession =
      session as PaymentSessionRow;


    /*
     * ------------------------------------------------------
     * DIRECT RAZORPAY VERIFICATION
     * ------------------------------------------------------
     */

    let razorpayPayment:
      Record<
        string,
        unknown
      > | null =
      null;


    const paymentId =
      webhookPaymentId ||
      paymentSession
        .razorpay_payment_id ||
      "";


    if (
      paymentId
    ) {
      razorpayPayment =
        await fetchRazorpayPayment(
          paymentId,
          keyId,
          keySecret,
        );
    }


    /*
     * ------------------------------------------------------
     * PAYMENT / ORDER MATCH
     * ------------------------------------------------------
     */

    const verifiedOrderId =
      razorpayPayment
        ? getString(
            razorpayPayment.order_id,
          )
        : razorpayOrderId;


    if (
      verifiedOrderId !==
      razorpayOrderId
    ) {
      return json(
        {
          success:
            false,

          error:
            "Razorpay payment does not belong to the expected order.",
        },
        400,
      );
    }


    /*
     * ------------------------------------------------------
     * AMOUNT CHECK
     * ------------------------------------------------------
     */

    const expectedAmount =
      getNumber(
        paymentSession.amount_in_paise,
      );


    const actualAmount =
      razorpayPayment
        ? getNumber(
            razorpayPayment.amount,
          )
        : webhookAmount;


    if (
      expectedAmount <=
        0 ||
      actualAmount !==
        expectedAmount
    ) {
      return json(
        {
          success:
            false,

          error:
            "Razorpay payment amount does not match the payment session.",
        },
        400,
      );
    }


    /*
     * ------------------------------------------------------
     * CURRENCY CHECK
     * ------------------------------------------------------
     */

    const expectedCurrency =
      getString(
        paymentSession.currency,
      ) ||
      "INR";


    const actualCurrency =
      razorpayPayment
        ? getString(
            razorpayPayment.currency,
          )
        : webhookCurrency;


    if (
      actualCurrency !==
      expectedCurrency
    ) {
      return json(
        {
          success:
            false,

          error:
            "Razorpay payment currency does not match the payment session.",
        },
        400,
      );
    }


    /*
     * ------------------------------------------------------
     * CURRENT RAZORPAY STATUS
     * ------------------------------------------------------
     */

    const currentPaymentStatus =
      razorpayPayment
        ? getString(
            razorpayPayment.status,
          )
        : webhookPaymentStatus;


    /*
     * ------------------------------------------------------
     * BASE UPDATE
     * ------------------------------------------------------
     */

    const now =
      new Date().toISOString();


    const updates:
      Record<
        string,
        unknown
      > = {

      razorpay_payment_id:
        paymentId ||
        paymentSession
          .razorpay_payment_id ||
        null,

      razorpay_payment_status:
        currentPaymentStatus ||
        null,

      last_webhook_event:
        event,

      last_webhook_event_id:
        eventId ||
        null,

      webhook_updated_at:
        now,

      updated_at:
        now,
    };


    /*
     * ------------------------------------------------------
     * PAYMENT CAPTURED / ORDER PAID
     * ------------------------------------------------------
     */

    const isPaidEvent =
      event ===
        "payment.captured" ||
      event ===
        "order.paid";


    if (
      isPaidEvent &&
      currentPaymentStatus ===
        "captured"
    ) {

      /*
       * Do not turn a failed session into verified through
       * frontend state. The actual Razorpay API status has to
       * be captured.
       */

      if (
        !isPaymentFinal(
          paymentSession.status,
        )
      ) {
        updates.status =
          "paid";
      }


      updates.payment_webhook_status =
        "paid";
    }


    /*
     * ------------------------------------------------------
     * PAYMENT FAILED
     * ------------------------------------------------------
     */

    else if (
      event ===
      "payment.failed"
    ) {

      /*
       * Never downgrade a payment that has already reached
       * paid/verified state.
       */

      if (
        !isPaymentFinal(
          paymentSession.status,
        )
      ) {
        updates.status =
          "failed";
      }


      updates.payment_webhook_status =
        "failed";
    }


    /*
     * ------------------------------------------------------
     * OTHER EVENTS
     * ------------------------------------------------------
     */

    else {
      updates.payment_webhook_status =
        currentPaymentStatus ||
        webhookPaymentStatus ||
        null;
    }


    /*
     * ------------------------------------------------------
     * SAVE PAYMENT SESSION
     * ------------------------------------------------------
     */

    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          "payment_sessions",
        )
        .update(
          updates,
        )
        .eq(
          "razorpay_order_id",
          razorpayOrderId,
        );


    if (
      updateError
    ) {
      throw updateError;
    }


    /*
     * ------------------------------------------------------
     * ORDER PAYMENT STATE
     * ------------------------------------------------------
     */

    if (
      paymentSession.app_order_id
    ) {

      const {
        data:
          existingOrder,
        error:
          existingOrderError,
      } =
        await supabase
          .from(
            "orders",
          )
          .select(
            "payment_status",
          )
          .eq(
            "id",
            paymentSession.app_order_id,
          )
          .maybeSingle();


      if (
        existingOrderError
      ) {
        throw existingOrderError;
      }


      const existingPaymentStatus =
        getString(
          existingOrder?.payment_status,
        );


      const orderUpdates:
        Record<
          string,
          unknown
        > = {
          updated_at:
            now,
        };


      /*
       * ----------------------------------------------------
       * PAID
       * ----------------------------------------------------
       */

      if (
        isPaidEvent &&
        currentPaymentStatus ===
          "captured"
      ) {

        orderUpdates.payment_status =
          "paid";

        orderUpdates.payment_method =
          "razorpay";


        if (
          paymentId
        ) {
          orderUpdates.razorpay_payment_id =
            paymentId;
        }


        if (
          currentPaymentStatus
        ) {
          orderUpdates.razorpay_payment_status =
            currentPaymentStatus;
        }

      }


      /*
       * ----------------------------------------------------
       * FAILED
       * ----------------------------------------------------
       *
       * Don't downgrade an already-paid order.
       */

      else if (
        event ===
          "payment.failed" &&
        existingPaymentStatus !==
          "paid"
      ) {

        orderUpdates.payment_status =
          "failed";
      }


      const {
        error:
          orderUpdateError,
      } =
        await supabase
          .from(
            "orders",
          )
          .update(
            orderUpdates,
          )
          .eq(
            "id",
            paymentSession.app_order_id,
          );


      if (
        orderUpdateError
      ) {
        throw orderUpdateError;
      }
    }


    /*
     * ------------------------------------------------------
     * RECORD WEBHOOK EVENT
     * ------------------------------------------------------
     *
     * Record only after successful state processing.
     */

    if (
      eventId
    ) {
      const {
        error:
          eventInsertError,
      } =
        await supabase
          .from(
            "razorpay_webhook_events",
          )
          .insert({
            event_id:
              eventId,

            event,

            received_at:
              now,
          });


      if (
        eventInsertError
      ) {

        /*
         * Another concurrent webhook request may have
         * successfully inserted the same event. The payment
         * state is already safely updated, so don't fail the
         * webhook response because of that duplicate insert.
         */

        console.warn(
          "[Razorpay webhook] Event log insert was not accepted:",
          eventInsertError,
        );
      }
    }


    /*
     * ------------------------------------------------------
     * SUCCESS
     * ------------------------------------------------------
     */

    return json({
      success:
        true,

      received:
        true,

      event,

      razorpayOrderId,

      razorpayPaymentId:
        paymentId ||
        null,
    });

  } catch (
    error
  ) {

    console.error(
      "[Razorpay webhook] ERROR:",
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