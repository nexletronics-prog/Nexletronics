import crypto from "node:crypto";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  requireAuth,
} from "../_lib/require-auth.mjs";


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
  razorpay_order_id: string;

  receipt?: string;

  user_id: string;

  user_email?: string;

  customer?: {
    name?: string;

    email?: string;

    phone?: string;
  };

  items?: PaymentSessionItem[];

  shipping_address?:
    Record<string, unknown> |
    null;

  billing_address?:
    Record<string, unknown> |
    null;

  billing_address_same_as_shipping?:
    boolean;

  subtotal: number;

  shipping_amount: number;

  tax_amount: number;

  discount_amount: number;

  total: number;

  amount_in_paise: number;

  currency: string;

  status: string;

  payment_type?: "product" | "printing";

  printing_order_id?: string | null;

  razorpay_payment_id?: string;

  razorpay_signature?: string;

  payment_webhook_status?: string;

  app_order_id?: string;
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
 * HELPERS
 * ==========================================================
 */

function asString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value
    : "";
}


function asNumber(
  value: unknown,
): number {
  const numberValue =
    Number(
      value,
    );

  return Number.isFinite(
    numberValue,
  )
    ? numberValue
    : 0;
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


/*
 * ==========================================================
 * SUPABASE ADMIN CLIENT
 * ==========================================================
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
 * Persist evidence of a Razorpay-captured payment even when the
 * corresponding application order cannot yet be completed. This leaves
 * app_order_id unset and the session unverified, so a retry can safely
 * finish order creation and operators can identify payments needing review.
 */
async function recordCapturedPaymentForRecovery(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  paymentData: { status?: string; method?: string },
): Promise<void> {
  const { error } = await supabase
    .from("payment_sessions")
    .update({
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      razorpay_payment_status: paymentData.status ?? "captured",
      payment_method: paymentData.method ?? "razorpay",
      payment_webhook_status: "reconciliation_required",
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", razorpayOrderId);

  if (error) {
    console.error(
      "[verify-payment] Failed to persist captured payment for recovery:",
      error,
    );
  }
}


/*
 * ==========================================================
 * GOOGLE SHEETS
 * ==========================================================
 *
 * Google Sheets is secondary reporting only.
 *
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

  if (
    !sheetsUrl
  ) {
    console.error(
      "GOOGLE_SHEETS_WEB_APP_URL is missing.",
    );

    return;
  }

  try {
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
          JSON.stringify({
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
          }),
      },
    );
  } catch (
    error
  ) {
    console.error(
      "[Google Sheets] Backup failed:",
      error,
    );
  }
}


/*
 * ==========================================================
 * PAYMENT VERIFICATION
 * ==========================================================
 */

export async function POST(
  request: Request,
) {
  try {

    /*
     * ------------------------------------------------------
     * FIREBASE AUTHENTICATION
     * ------------------------------------------------------
     */

    const user =
      await requireAuth(
        request,
      );


    /*
     * ------------------------------------------------------
     * RAZORPAY CONFIGURATION
     * ------------------------------------------------------
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
     * ------------------------------------------------------
     * SUPABASE SERVICE ROLE
     * ------------------------------------------------------
     */

    const supabase =
      getSupabaseAdmin();


    /*
     * ------------------------------------------------------
     * REQUEST BODY
     * ------------------------------------------------------
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

    const {
      data:
        sessionRow,

      error:
        sessionError,
    } =
      await supabase
        .from(
          "payment_sessions",
        )
        .select(
          "*",
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


    if (
      !sessionRow
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
      sessionRow as PaymentSessionData;


    /*
     * ======================================================
     * PAYMENT SESSION OWNERSHIP
     * ======================================================
     */

    if (
      paymentSession.user_id !==
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
     * If the order was already successfully created, return
     * it without touching stock again.
     */

    if (
      paymentSession.status ===
        "verified" &&
      paymentSession.app_order_id
    ) {
      return json({
        success:
          true,

        verified:
          true,

        orderId:
          paymentSession.app_order_id,

        razorpayOrderId,

        razorpayPaymentId:
          paymentSession
            .razorpay_payment_id ??
          razorpayPaymentId,
      });
    }


    /*
     * ======================================================
     * RAZORPAY SIGNATURE
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
     * FETCH PAYMENT FROM RAZORPAY
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
     * VERIFY PAYMENT BELONGS TO ORDER
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
        paymentSession.amount_in_paise,
      );


    const actualAmount =
      asNumber(
        paymentData.amount,
      );


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
     * VERIFY CAPTURED
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
        },
        409,
      );
    }


    /*
     * ======================================================
     * PRINTING QUOTATION PAYMENT
     * ======================================================
     *
     * Printing quote payments must never enter product-order
     * creation or call reserve_payment_stock(). The quote and
     * amount are reloaded from Supabase on every verification.
     */
    if (paymentSession.payment_type === "printing") {
      const printingOrderId = asString(
        paymentSession.printing_order_id,
      ).trim();

      if (!printingOrderId) {
        await recordCapturedPaymentForRecovery(
          supabase, razorpayOrderId, razorpayPaymentId,
          razorpaySignature, paymentData,
        );
        return json({
          success: false, verified: true, paymentCaptured: true,
          reconciliationRequired: true,
          error: "Captured printing payment has no linked printing order. Support reconciliation is required.",
        }, 409);
      }

      const {
        data: printingOrder,
        error: printingOrderError,
      } = await supabase
        .from("printing_orders")
        .select("id, user_id, status, payment_status, final_price, paid_razorpay_order_id")
        .eq("id", printingOrderId)
        .maybeSingle();

      if (printingOrderError) {
        throw printingOrderError;
      }

      if (!printingOrder || printingOrder.user_id !== user.uid) {
        await recordCapturedPaymentForRecovery(
          supabase, razorpayOrderId, razorpayPaymentId,
          razorpaySignature, paymentData,
        );
        return json({
          success: false, verified: true, paymentCaptured: true,
          reconciliationRequired: true,
          error: "Captured payment could not be matched to the customer's printing order. Support reconciliation is required.",
        }, 409);
      }

      const quotedAmountInPaise = Math.round(
        asNumber(printingOrder.final_price) * 100,
      );

      if (
        !Number.isSafeInteger(quotedAmountInPaise) ||
        quotedAmountInPaise <= 0 ||
        quotedAmountInPaise !== expectedAmount
      ) {
        await recordCapturedPaymentForRecovery(
          supabase, razorpayOrderId, razorpayPaymentId,
          razorpaySignature, paymentData,
        );
        return json({
          success: false, verified: true, paymentCaptured: true,
          reconciliationRequired: true,
          error: "The captured payment does not match the current printing quotation. The payment was recorded for manual reconciliation.",
        }, 409);
      }

      const alreadyPaid =
        printingOrder.payment_status === "paid" ||
        ["paid", "completed"].includes(String(printingOrder.status)) ||
        Boolean(printingOrder.paid_razorpay_order_id);

      if (alreadyPaid) {
        if (
          printingOrder.payment_status === "paid" &&
          printingOrder.paid_razorpay_order_id === razorpayOrderId
        ) {
          const now = new Date().toISOString();
          const { error: repairPrintingSessionError } = await supabase
            .from("payment_sessions")
            .update({
              status: "verified",
              razorpay_payment_id: razorpayPaymentId,
              razorpay_signature: razorpaySignature,
              razorpay_payment_status: paymentData.status,
              payment_method: paymentData.method ?? "razorpay",
              payment_webhook_status: "paid",
              verified_at: now,
              updated_at: now,
            })
            .eq("razorpay_order_id", razorpayOrderId)
            .eq("user_id", user.uid);

          if (repairPrintingSessionError) {
            console.error(
              "[verify-payment] Could not repair already-paid printing session:",
              repairPrintingSessionError,
            );
          }

          return json({
            success: true, verified: true, paymentType: "printing",
            printingOrderId, orderId: printingOrderId,
            razorpayOrderId, razorpayPaymentId, paymentStatus: "paid",
          });
        }

        await recordCapturedPaymentForRecovery(
          supabase, razorpayOrderId, razorpayPaymentId,
          razorpaySignature, paymentData,
        );
        return json({
          success: false, verified: true, paymentCaptured: true,
          reconciliationRequired: true,
          error: "This printing quotation has already been paid by another payment session. The captured payment needs manual reconciliation.",
        }, 409);
      }

      if (
        !["quoted", "payment_pending"].includes(String(printingOrder.status)) ||
        !["unpaid", "pending", "failed"].includes(String(printingOrder.payment_status))
      ) {
        await recordCapturedPaymentForRecovery(
          supabase, razorpayOrderId, razorpayPaymentId,
          razorpaySignature, paymentData,
        );
        return json({
          success: false, verified: true, paymentCaptured: true,
          reconciliationRequired: true,
          error: "The printing order is no longer in a payable state. The captured payment requires manual reconciliation.",
        }, 409);
      }

      // Persist the captured payment evidence before changing the quote.
      const { error: capturedEvidenceError } = await supabase
        .from("payment_sessions")
        .update({
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          razorpay_payment_status: paymentData.status,
          payment_method: paymentData.method ?? "razorpay",
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", razorpayOrderId)
        .eq("user_id", user.uid);

      if (capturedEvidenceError) {
        throw capturedEvidenceError;
      }

      const now = new Date().toISOString();
      const {
        data: paidPrintingOrder,
        error: markPrintingPaidError,
      } = await supabase
        .from("printing_orders")
        .update({
          payment_status: "paid",
          status: "paid",
          paid_razorpay_order_id: razorpayOrderId,
          updated_at: now,
        })
        .eq("id", printingOrderId)
        .eq("user_id", user.uid)
        .in("status", ["quoted", "payment_pending"])
        .in("payment_status", ["unpaid", "pending", "failed"])
        .is("paid_razorpay_order_id", null)
        .select("id")
        .maybeSingle();

      if (markPrintingPaidError) {
        throw markPrintingPaidError;
      }

      if (!paidPrintingOrder) {
        const { data: latestPrintingOrder, error: latestPrintingOrderError } = await supabase
          .from("printing_orders")
          .select("payment_status, status, paid_razorpay_order_id")
          .eq("id", printingOrderId)
          .maybeSingle();

        if (latestPrintingOrderError) {
          throw latestPrintingOrderError;
        }

        if (
          latestPrintingOrder?.payment_status !== "paid" ||
          latestPrintingOrder?.paid_razorpay_order_id !== razorpayOrderId
        ) {
          await recordCapturedPaymentForRecovery(
            supabase, razorpayOrderId, razorpayPaymentId,
            razorpaySignature, paymentData,
          );
          return json({
            success: false, verified: true, paymentCaptured: true,
            reconciliationRequired: true,
            error: "The printing quotation was changed or paid concurrently. The captured payment requires manual reconciliation.",
          }, 409);
        }
      }

      const { error: finalPrintingSessionError } = await supabase
        .from("payment_sessions")
        .update({
          status: "verified",
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          razorpay_payment_status: paymentData.status,
          payment_method: paymentData.method ?? "razorpay",
          payment_webhook_status: "paid",
          verified_at: now,
          updated_at: now,
        })
        .eq("razorpay_order_id", razorpayOrderId)
        .eq("user_id", user.uid);

      if (finalPrintingSessionError) {
        console.error(
          "[verify-payment] Printing order was paid, but session finalization failed:",
          finalPrintingSessionError,
        );
      }

      return json({
        success: true, verified: true, paymentType: "printing",
        printingOrderId, orderId: printingOrderId,
        razorpayOrderId, razorpayPaymentId, paymentStatus: "paid",
      });
    }


    /*
     * ======================================================
     * CHECK EXISTING ORDER
     * ======================================================
     *
     * This is checked before stock modification so a repeated
     * verification request never reserves/decrements stock
     * again when the order already exists.
     */

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
          "id",
        )
        .eq(
          "razorpay_order_id",
          razorpayOrderId,
        )
        .maybeSingle();


    if (
      existingOrderError
    ) {
      throw existingOrderError;
    }


    if (
      existingOrder
    ) {
      const expectedItemsCount = Array.isArray(paymentSession.items)
        ? paymentSession.items.length
        : 0;

      const {
        count: existingItemsCount,
        error: existingItemsError,
      } = await supabase
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("order_id", existingOrder.id);

      if (existingItemsError) {
        throw existingItemsError;
      }

      if (
        expectedItemsCount === 0 ||
        existingItemsCount !== expectedItemsCount
      ) {
        await recordCapturedPaymentForRecovery(
          supabase,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          paymentData,
        );

        return json(
          {
            success: false,
            verified: true,
            paymentCaptured: true,
            orderCreated: false,
            reconciliationRequired: true,
            error:
              "Payment was captured, but the order is incomplete. Please retry shortly or contact Nexletronics support.",
          },
          503,
        );
      }

      const now = new Date().toISOString();
      const { error: repairSessionError } = await supabase
        .from("payment_sessions")
        .update({
          status: "verified",
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          razorpay_payment_status: paymentData.status,
          payment_method: paymentData.method ?? "razorpay",
          app_order_id: existingOrder.id,
          verified_at: now,
          updated_at: now,
        })
        .eq("razorpay_order_id", razorpayOrderId);

      if (repairSessionError) {
        console.error(
          "[verify-payment] Could not repair payment session:",
          repairSessionError,
        );
      }

      return json({
        success: true,
        verified: true,
        orderId: existingOrder.id,
        razorpayOrderId,
        razorpayPaymentId,
      });
    }


    /*
     * ======================================================
     * ATOMIC STOCK RESERVATION
     * ======================================================
     *
     * The PostgreSQL function:
     *
     *   reserve_payment_stock()
     *
     * locks the payment session and product rows and performs
     * the stock decrement atomically.
     *
     * Repeated verification of the same Razorpay order is
     * idempotent because the payment session stores
     * stock_adjusted_at.
     */

    const {
      data:
        stockReservation,

      error:
        stockReservationError,
    } =
      await supabase.rpc(
        "reserve_payment_stock",
        {
          p_razorpay_order_id:
            razorpayOrderId,
        },
      );


    if (
      stockReservationError
    ) {
      console.error(
        "[verify-payment] Atomic stock reservation failed:",
        stockReservationError,
      );

      // Payment is captured, so retain the payment evidence for reconciliation.
      // No stock marker was committed when the reservation RPC failed.
      await recordCapturedPaymentForRecovery(
        supabase,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentData,
      );

      return json(
        {
          success: false,
          verified: true,
          paymentCaptured: true,
          stockReserved: false,
          reconciliationRequired: true,
          error:
            "Payment was captured, but stock could not be reserved. Please contact Nexletronics support for reconciliation or refund.",
        },
        409,
      );
    }


    console.log(
      "[verify-payment] Atomic stock reservation:",
      stockReservation,
    );


    /*
     * ======================================================
     * BUILD ORDER DATA
     * ======================================================
     */

    const sessionItems =
      Array.isArray(
        paymentSession.items,
      )
        ? paymentSession.items
        : [];


    const orderId =
      crypto.randomUUID();


    const now =
      new Date().toISOString();


    const orderItems =
      sessionItems.map(
        (
          item,
        ) => ({
          order_id:
            orderId,

          product_id:
            item.productId,

          name:
            asString(
              item.name,
            ) ||
            "Unnamed product",

          sku:
            asString(
              item.sku,
            ) ||
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

          line_total:
            asNumber(
              item.lineTotal,
            ),

          image:
            asString(
              item.image,
            ) ||
            null,

          category:
            asString(
              item.category,
            ) ||
            null,
        }),
      );


    /*
     * ======================================================
     * CREATE ORDER
     * ======================================================
     */

    const {
      error:
        orderError,
    } =
      await supabase
        .from(
          "orders",
        )
        .insert({
          id:
            orderId,

          user_id:
            user.uid,

          user_email:
            paymentSession.user_email ??
            user.email ??
            "",

          customer:
            paymentSession.customer ??
            {},

          shipping_address:
            paymentSession.shipping_address ??
            null,

          billing_address:
            paymentSession.billing_address ??
            null,

          billing_address_same_as_shipping:
            paymentSession
              .billing_address_same_as_shipping ??
            false,

          subtotal:
            asNumber(
              paymentSession.subtotal,
            ),

          shipping:
            asNumber(
              paymentSession.shipping_amount,
            ),

          tax:
            asNumber(
              paymentSession.tax_amount,
            ),

          discount:
            asNumber(
              paymentSession.discount_amount,
            ),

          total:
            asNumber(
              paymentSession.total,
            ),

          currency:
            expectedCurrency,

          status:
            "pending",

          payment_status:
            "paid",

          payment_method:
            paymentData.method ??
            "razorpay",

          razorpay_order_id:
            razorpayOrderId,

          razorpay_payment_id:
            razorpayPaymentId,

          razorpay_signature:
            razorpaySignature,

          razorpay_payment_status:
            paymentData.status,

          razorpay_amount:
            actualAmount,

          razorpay_currency:
            paymentData.currency,

          receipt:
            paymentSession.receipt ??
            null,

          created_at:
            now,

          updated_at:
            now,
        });


    if (
      orderError
    ) {

      /*
       * Another request may have won the race and created
       * the order.
       */

      const {
        data:
          concurrentOrder,
      } =
        await supabase
          .from(
            "orders",
          )
          .select(
            "id",
          )
          .eq(
            "razorpay_order_id",
            razorpayOrderId,
          )
          .maybeSingle();


      if (
        concurrentOrder
      ) {
        const expectedItemsCount = Array.isArray(paymentSession.items)
          ? paymentSession.items.length
          : 0;
        const {
          count: concurrentItemsCount,
          error: concurrentItemsError,
        } = await supabase
          .from("order_items")
          .select("id", { count: "exact", head: true })
          .eq("order_id", concurrentOrder.id);

        if (concurrentItemsError) {
          throw concurrentItemsError;
        }

        if (
          expectedItemsCount === 0 ||
          concurrentItemsCount !== expectedItemsCount
        ) {
          await recordCapturedPaymentForRecovery(
            supabase,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            paymentData,
          );

          return json(
            {
              success: false,
              verified: true,
              paymentCaptured: true,
              orderCreated: false,
              reconciliationRequired: true,
              error:
                "Payment was captured, but the concurrent order is incomplete. Please retry shortly or contact Nexletronics support.",
            },
            503,
          );
        }

        const { error: concurrentSessionError } = await supabase
          .from("payment_sessions")
          .update({
            status: "verified",
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            razorpay_payment_status: paymentData.status,
            payment_method: paymentData.method ?? "razorpay",
            app_order_id: concurrentOrder.id,
            verified_at: now,
            updated_at: now,
          })
          .eq("razorpay_order_id", razorpayOrderId);

        if (concurrentSessionError) {
          console.error(
            "[verify-payment] Failed to repair concurrent payment session:",
            concurrentSessionError,
          );
        }

        return json({
          success: true,
          verified: true,
          orderId: concurrentOrder.id,
          razorpayOrderId,
          razorpayPaymentId,
        });
      }


      /*
       * Payment has already been captured. Do not release the stock
       * reservation here: making those units available again could permit
       * an oversell while the captured payment is being retried/reconciled.
       * The failed insert leaves app_order_id unset, so a retry can attempt
       * the order creation again without decrementing stock a second time.
       */
      await recordCapturedPaymentForRecovery(
        supabase,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentData,
      );

      return json(
        {
          success: false,
          verified: true,
          paymentCaptured: true,
          orderCreated: false,
          stockReserved: true,
          reconciliationRequired: true,
          error:
            "Payment was captured, but order creation did not finish. Please retry shortly; if the problem continues, contact Nexletronics support.",
        },
        503,
      );
    }


    /*
     * ======================================================
     * CREATE ORDER ITEMS
     * ======================================================
     */

    const {
      error:
        itemError,
    } =
      await supabase
        .from(
          "order_items",
        )
        .insert(
          orderItems,
        );


    if (
      itemError
    ) {

      /*
       * Remove incomplete order.
       */

      const {
        error:
          deleteOrderError,
      } =
        await supabase
          .from(
            "orders",
          )
          .delete()
          .eq(
            "id",
            orderId,
          );


      if (
        deleteOrderError
      ) {
        console.error(
          "[verify-payment] Failed to delete incomplete order:",
          deleteOrderError,
        );
      }


      /*
       * Payment has already been captured. Keep the stock reservation
       * until the order can be reconstructed or support reconciles/refunds
       * the payment. Releasing stock here could oversell already-paid items.
       */
      await recordCapturedPaymentForRecovery(
        supabase,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentData,
      );

      return json(
        {
          success: false,
          verified: true,
          paymentCaptured: true,
          orderCreated: false,
          stockReserved: true,
          reconciliationRequired: true,
          error:
            "Payment was captured, but the order items could not be saved. Please retry shortly; if the problem continues, contact Nexletronics support.",
        },
        503,
      );
    }


    /*
     * ======================================================
     * MARK PAYMENT SESSION VERIFIED
     * ======================================================
     */

    const {
      error:
        sessionUpdateError,
    } =
      await supabase
        .from(
          "payment_sessions",
        )
        .update({
          status:
            "verified",

          razorpay_payment_id:
            razorpayPaymentId,

          razorpay_signature:
            razorpaySignature,

          razorpay_payment_status:
            paymentData.status,

          payment_method:
            paymentData.method ??
            "razorpay",

          app_order_id:
            orderId,

          verified_at:
            now,

          updated_at:
            now,
        })
        .eq(
          "razorpay_order_id",
          razorpayOrderId,
        );


    if (
      sessionUpdateError
    ) {
      console.error(
        "[verify-payment] Payment session update failed:",
        sessionUpdateError,
      );
    }


    /*
     * ======================================================
     * GOOGLE SHEETS
     * ======================================================
     *
     * Secondary reporting only.
     *
     */

    const customer =
      (
        paymentSession.customer ??
        {}
      ) as Record<
        string,
        unknown
      >;


    const shipping =
      (
        paymentSession.shipping_address ??
        {}
      ) as Record<
        string,
        unknown
      >;


    await backupOrderToGoogleSheets({
      orderId,

      userId:
        user.uid,

      userEmail:
        paymentSession.user_email ??
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

      shippingAddress: {
        name:
          asString(
            shipping.name,
          ) ||
          asString(
            customer.name,
          ) ||
          "",

        phone:
          asString(
            shipping.phone,
          ) ||
          asString(
            customer.phone,
          ) ||
          "",

        email:
          asString(
            shipping.email,
          ) ||
          asString(
            customer.email,
          ) ||
          paymentSession
            .user_email ||
          user.email ||
          "",

        address:
          asString(
            shipping.address,
          ),

        city:
          asString(
            shipping.city,
          ),

        state:
          asString(
            shipping.state,
          ),

        pincode:
          asString(
            shipping.pincode,
          ),
      },

      subtotal:
        asNumber(
          paymentSession.subtotal,
        ),

      shipping:
        asNumber(
          paymentSession.shipping_amount,
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
        now,
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

      orderId,

      razorpayOrderId,

      razorpayPaymentId,

      paymentStatus:
        paymentData.status,
    });

  } catch (
    error
  ) {

    console.error(
      "[verify-payment] ERROR:",
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
