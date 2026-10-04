import {
  createClient,
} from "@supabase/supabase-js";

import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import {
  adminAuth,
  adminDb,
} from "../_lib/firebase-admin.mjs";


function stringValue(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function numberValue(
  value: unknown,
): number {
  const result =
    Number(
      value,
    );


  return Number.isFinite(
    result,
  )
    ? result
    : 0;
}


function timestampToIso(
  value: unknown,
): string {
  if (
    value &&
    typeof value ===
      "object" &&
    "toDate" in value
  ) {
    const timestamp =
      value as {
        toDate?: () => Date;
      };


    if (
      typeof timestamp.toDate ===
      "function"
    ) {
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
    }
  }


  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }


  if (
    typeof value ===
    "string"
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


function getSupabaseAdmin() {
  const url =
    process.env.VITE_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


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


export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (
    req.method !==
    "POST"
  ) {
    return res.status(
      405,
    ).json({
      success:
        false,

      error:
        "Method not allowed.",
    });
  }


  try {
    /*
     * ======================================================
     * AUTH
     * ======================================================
     */

    const authorization =
      req.headers.authorization;


    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer ",
      )
    ) {
      return res.status(
        401,
      ).json({
        success:
          false,

        error:
          "Firebase authentication required.",
      });
    }


    const idToken =
      authorization
        .slice(7)
        .trim();


    const decodedToken =
      await adminAuth.verifyIdToken(
        idToken,
      );


    if (
      decodedToken.is_admin !==
      true
    ) {
      return res.status(
        403,
      ).json({
        success:
          false,

        error:
          "Admin permissions required.",
      });
    }


    const supabase =
      getSupabaseAdmin();


    /*
     * ======================================================
     * READ FIRESTORE ORDERS
     * ======================================================
     */

    const snapshot =
      await adminDb
        .collection(
          "orders",
        )
        .get();


    if (
      snapshot.empty
    ) {
      return res.status(
        200,
      ).json({
        success:
          true,

        migrated:
          0,

        orderItems:
          0,

        message:
          "No Firestore orders found.",
      });
    }


    let migrated =
      0;


    let itemCount =
      0;


    /*
     * ======================================================
     * ORDER-BY-ORDER MIGRATION
     * ======================================================
     */

    for (
      const document of
        snapshot.docs
    ) {
      const data =
        document.data();


      const shippingAddress =
        data.shippingAddress ??
        null;


      const billingAddress =
        data.billingAddress ??
        null;


      const legacyItems =
        Array.isArray(
          data.items,
        )
          ? data.items
          : [];


      const orderRow = {
        id:
          document.id,

        user_id:
          stringValue(
            data.userId,
          ) ||
          `legacy-${document.id}`,

        user_email:
          stringValue(
            data.userEmail,
          ),

        customer:
          data.customer ??
          {},

        shipping_address:
          shippingAddress,

        billing_address:
          billingAddress,

        billing_address_same_as_shipping:
          data.billingAddressSameAsShipping ===
          true,

        subtotal:
          numberValue(
            data.subtotal,
          ),

        shipping:
          numberValue(
            data.shipping,
          ),

        tax:
          numberValue(
            data.tax,
          ),

        discount:
          numberValue(
            data.discount,
          ),

        total:
          numberValue(
            data.total,
          ),

        currency:
          stringValue(
            data.currency,
          ) ||
          "INR",

        status:
          data.status ??
          "pending",

        payment_status:
          data.paymentStatus ??
          "pending",

        payment_method:
          stringValue(
            data.paymentMethod,
          ) ||
          "pending",

        razorpay_order_id:
          stringValue(
            data.razorpayOrderId,
          ) ||
          null,

        razorpay_payment_id:
          stringValue(
            data.razorpayPaymentId,
          ) ||
          null,

        razorpay_signature:
          stringValue(
            data.razorpaySignature,
          ) ||
          null,

        razorpay_payment_status:
          stringValue(
            data.razorpayPaymentStatus,
          ) ||
          null,

        razorpay_amount:
          data.razorpayAmount !==
          undefined
            ? numberValue(
                data.razorpayAmount,
              )
            : null,

        razorpay_currency:
          stringValue(
            data.razorpayCurrency,
          ) ||
          null,

        receipt:
          stringValue(
            data.receipt,
          ) ||
          null,

        created_at:
          timestampToIso(
            data.createdAt,
          ),

        updated_at:
          timestampToIso(
            data.updatedAt ??
            data.createdAt,
          ),
      };


      const {
        error:
          orderError,
      } =
        await supabase
          .from(
            "orders",
          )
          .upsert(
            orderRow,
            {
              onConflict:
                "id",
            },
          );


      if (
        orderError
      ) {
        throw orderError;
      }


      /*
       * ----------------------------------------------------
       * ORDER ITEMS
       * ----------------------------------------------------
       *
       * Delete old migrated items first so repeated
       * migrations do not duplicate line items.
       */

      await supabase
        .from(
          "order_items",
        )
        .delete()
        .eq(
          "order_id",
          document.id,
        );


      const itemRows =
        legacyItems.map(
          (
            item,
          ) => ({
            order_id:
              document.id,

            product_id:
              stringValue(
                item?.productId,
              ) ||
              `legacy-product-${itemCount + 1}`,

            name:
              stringValue(
                item?.name,
              ) ||
              "Unnamed product",

            sku:
              stringValue(
                item?.sku,
              ) ||
              null,

            price:
              numberValue(
                item?.price,
              ),

            quantity:
              Math.max(
                1,
                Math.floor(
                  numberValue(
                    item?.quantity,
                  ),
                ),
              ),

            line_total:
              numberValue(
                item?.lineTotal ??
                (
                  numberValue(
                    item?.price,
                  ) *
                  numberValue(
                    item?.quantity,
                  )
                ),
              ),

            image:
              stringValue(
                item?.image,
              ) ||
              null,

            category:
              stringValue(
                item?.category,
              ) ||
              null,
          }),
        );


      if (
        itemRows.length >
        0
      ) {
        const {
          error:
            itemsError,
        } =
          await supabase
            .from(
              "order_items",
            )
            .insert(
              itemRows,
            );


        if (
          itemsError
        ) {
          throw itemsError;
        }


        itemCount +=
          itemRows.length;
      }


      migrated++;
    }


    return res.status(
      200,
    ).json({
      success:
        true,

      migrated,

      orderItems:
        itemCount,

      source:
        "Firestore orders",

      destination:
        "Supabase orders + order_items",
    });

  } catch (
    error
  ) {
    console.error(
      "[ORDER MIGRATION] Failed:",
      error,
    );


    return res.status(
      500,
    ).json({
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Order migration failed.",
    });
  }
}