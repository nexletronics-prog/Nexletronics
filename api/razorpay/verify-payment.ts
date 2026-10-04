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

  razorpay_payment_id?: string;

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
      const now =
        new Date().toISOString();


      const {
        error:
          repairSessionError,
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
              existingOrder.id,

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
        repairSessionError
      ) {
        console.error(
          "[verify-payment] Could not repair payment session:",
          repairSessionError,
        );
      }


      return json({
        success:
          true,

        verified:
          true,

        orderId:
          existingOrder.id,

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


      /*
       * The payment is already captured.
       *
       * We intentionally do not create a PAID order when the
       * requested stock cannot be reserved.
       *
       * This response must be reconciled/refunded through the
       * payment operations flow.
       */

      return json(
        {
          success:
            false,

          verified:
            true,

          paymentCaptured:
            true,

          stockReserved:
            false,

          error:
            "Payment was captured, but the requested stock is no longer available. Please contact Nexletronics support for refund/reconciliation.",
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
              concurrentOrder.id,

            verified_at:
              now,

            updated_at:
              now,
          })
          .eq(
            "razorpay_order_id",
            razorpayOrderId,
          );


        return json({
          success:
            true,

          verified:
            true,

          orderId:
            concurrentOrder.id,

          razorpayOrderId,

          razorpayPaymentId,
        });
      }


      /*
       * Order creation genuinely failed.
       *
       * Restore the stock reservation.
       */

      const {
        error:
          releaseError,
      } =
        await supabase.rpc(
          "release_payment_stock",
          {
            p_razorpay_order_id:
              razorpayOrderId,
          },
        );


      if (
        releaseError
      ) {
        console.error(
          "[verify-payment] Failed to release stock after order insert failure:",
          releaseError,
        );
      }


      throw orderError;
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
       * Restore reserved stock.
       */

      const {
        error:
          releaseError,
      } =
        await supabase.rpc(
          "release_payment_stock",
          {
            p_razorpay_order_id:
              razorpayOrderId,
          },
        );


      if (
        releaseError
      ) {
        console.error(
          "[verify-payment] Failed to release stock after order-item failure:",
          releaseError,
        );
      }


      throw itemError;
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