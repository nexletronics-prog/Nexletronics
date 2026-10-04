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


const supabaseUrl =
  process.env.VITE_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;


if (
  !supabaseUrl
) {
  throw new Error(
    "Missing VITE_SUPABASE_URL.",
  );
}


if (
  !serviceRoleKey
) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY.",
  );
}


const supabase =
  createClient(
    supabaseUrl,
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


function booleanValue(
  value: unknown,
): boolean {
  return value ===
    true;
}


function timestampToIso(
  value: unknown,
): string | null {
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


  return null;
}


function quotationStatus(
  value: unknown,
): string {
  switch (value) {
    case "sent":
    case "accepted":
    case "rejected":
    case "expired":
    case "cancelled":
      return value;

    default:
      return "draft";
  }
}


function paymentStatus(
  value: unknown,
): string {
  switch (value) {
    case "pending":
    case "processing":
    case "paid":
    case "failed":
    case "refunded":
      return value;

    default:
      return "not_required";
  }
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
     * FIREBASE AUTH
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


    /*
     * ======================================================
     * FIRESTORE PROJECTS
     * ======================================================
     */

    const projectSnapshot =
      await adminDb
        .collection(
          "customProjects",
        )
        .get();


    let migratedQuotations =
      0;

    let migratedItems =
      0;


    /*
     * ======================================================
     * PROJECT LOOP
     * ======================================================
     */

    for (
      const projectDoc of
        projectSnapshot.docs
    ) {
      const projectId =
        projectDoc.id;


      const projectData =
        projectDoc.data();


      /*
       * customProjects/{projectId}/quotations
       */

      const quotationSnapshot =
        await projectDoc.ref
          .collection(
            "quotations",
          )
          .get();


      for (
        const quotationDoc of
          quotationSnapshot.docs
      ) {
        const data =
          quotationDoc.data();


        const quotationId =
          quotationDoc.id;


        /*
         * --------------------------------------------------
         * DATE
         * --------------------------------------------------
         */

        const createdAt =
          timestampToIso(
            data.createdAt,
          ) ??
          new Date().toISOString();


        const updatedAt =
          timestampToIso(
            data.updatedAt,
          ) ??
          createdAt;


        /*
         * --------------------------------------------------
         * VALID UNTIL
         * --------------------------------------------------
         */

        let validUntil =
          timestampToIso(
            data.validUntil,
          );


        if (
          !validUntil
        ) {
          const validityDays =
            Math.max(
              1,
              Math.floor(
                numberValue(
                  data.validityDays ??
                  7,
                ),
              ),
            );


          const expiry =
            new Date(
              createdAt,
            );


          expiry.setDate(
            expiry.getDate() +
              validityDays,
          );


          validUntil =
            expiry.toISOString();
        }


        /*
         * --------------------------------------------------
         * QUOTATION ROW
         * --------------------------------------------------
         */

        const row = {
          id:
            quotationId,

          quotation_number:
            stringValue(
              data.quotationNumber,
            ) ||
            `QT-${quotationId
              .slice(
                0,
                8,
              )
              .toUpperCase()}`,

          project_id:
            projectId,

          customer_name:
            stringValue(
              data.customerName,
            ) ||
            stringValue(
              projectData.customerName,
            ),

          customer_email:
            stringValue(
              data.customerEmail,
            ).toLowerCase() ||
            stringValue(
              projectData.customerEmail,
            ).toLowerCase(),

          project_title:
            stringValue(
              data.projectTitle,
            ) ||
            stringValue(
              projectData.title,
            ),

          subtotal:
            numberValue(
              data.subtotal,
            ),

          discount:
            numberValue(
              data.discount,
            ),

          tax_rate:
            numberValue(
              data.taxRate,
            ),

          tax_amount:
            numberValue(
              data.taxAmount,
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

          validity_days:
            Math.max(
              1,
              Math.floor(
                numberValue(
                  data.validityDays ??
                  7,
                ),
              ),
            ),

          valid_until:
            validUntil,

          estimated_delivery:
            stringValue(
              data.estimatedDelivery,
            ),

          payment_terms:
            stringValue(
              data.paymentTerms,
            ),

          notes:
            stringValue(
              data.notes,
            ),

          status:
            quotationStatus(
              data.status,
            ),

          accepted_at:
            timestampToIso(
              data.acceptedAt,
            ),

          accepted_by:
            stringValue(
              data.acceptedBy,
            ) ||
            null,

          rejection_reason:
            stringValue(
              data.rejectionReason,
            ) ||
            null,

          payment_required:
            booleanValue(
              data.paymentRequired,
            ),

          payment_status:
            paymentStatus(
              data.paymentStatus,
            ),

          paid_at:
            timestampToIso(
              data.paidAt,
            ),

          payment_id:
            stringValue(
              data.paymentId,
            ) ||
            null,

          razorpay_order_id:
            stringValue(
              data.razorpayOrderId,
            ) ||
            null,

          created_by:
            stringValue(
              data.createdBy,
            ),

          created_at:
            createdAt,

          updated_at:
            updatedAt,
        };


        /*
         * --------------------------------------------------
         * UPSERT QUOTATION
         * --------------------------------------------------
         */

        const {
          error:
            quotationError,
        } =
          await supabase
            .from(
              "custom_quotations",
            )
            .upsert(
              row,
              {
                onConflict:
                  "id",
              },
            );


        if (
          quotationError
        ) {
          throw quotationError;
        }


        migratedQuotations++;


        /*
         * --------------------------------------------------
         * REMOVE OLD ITEMS
         * --------------------------------------------------
         */

        await supabase
          .from(
            "custom_quotation_items",
          )
          .delete()
          .eq(
            "quotation_id",
            quotationId,
          );


        /*
         * --------------------------------------------------
         * ITEMS
         * --------------------------------------------------
         */

        const legacyItems =
          Array.isArray(
            data.items,
          )
            ? data.items
            : [];


        const itemRows =
          legacyItems.map(
            (
              item,
              index,
            ) => ({
              id:
                `${quotationId}-${index + 1}`,

              quotation_id:
                quotationId,

              description:
                stringValue(
                  item?.description,
                ),

              quantity:
                Math.max(
                  1,
                  numberValue(
                    item?.quantity,
                  ),
                ),

              unit_price:
                numberValue(
                  item?.unitPrice,
                ),

              total:
                numberValue(
                  item?.total,
                ),

              created_at:
                createdAt,
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
                "custom_quotation_items",
              )
              .insert(
                itemRows,
              );


          if (
            itemsError
          ) {
            throw itemsError;
          }


          migratedItems +=
            itemRows.length;
        }
      }
    }


    /*
     * ======================================================
     * SUCCESS
     * ======================================================
     */

    return res.status(
      200,
    ).json({
      success:
        true,

      quotations:
        migratedQuotations,

      items:
        migratedItems,

      source:
        "Firestore customProjects/{projectId}/quotations",

      destination:
        "Supabase custom_quotations + custom_quotation_items",
    });

  } catch (
    error
  ) {
    console.error(
      "[CUSTOM QUOTATION MIGRATION] Failed:",
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
          : "Custom quotation migration failed.",
    });
  }
}