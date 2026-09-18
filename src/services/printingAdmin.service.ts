import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  PrintingFinish,
  PrintingMaterial,
  PrintingOrder,
  PrintingOrderStatus,
} from "../types/printing";


const ORDERS_COLLECTION =
  "threeDPrintOrders";


/*
 * ==========================================================
 * LOAD ALL PRINTING REQUESTS
 * ==========================================================
 */

export async function getPrintingOrders(): Promise<PrintingOrder[]> {

  const ordersQuery =
    query(
      collection(
        db,
        ORDERS_COLLECTION,
      ),
      orderBy(
        "createdAt",
        "desc",
      ),
    );


  const snapshot =
    await getDocs(
      ordersQuery,
    );


  return snapshot.docs.map(
    (
      document,
    ) => {

      const data =
        document.data();


      return {
        id:
          document.id,

        userId:
          typeof data.userId ===
            "string"
            ? data.userId
            : "",

        customerName:
          typeof data.customerName ===
            "string"
            ? data.customerName
            : "Customer",

        customerEmail:
          typeof data.customerEmail ===
            "string"
            ? data.customerEmail
            : "",

        originalFileName:
          typeof data.originalFileName ===
            "string"
            ? data.originalFileName
            : "model.stl",

        storagePath:
          typeof data.storagePath ===
            "string"
            ? data.storagePath
            : "",

        material:
          data.material ===
              "PETG" ||
            data.material ===
              "TPU"
            ? data.material
            : "PLA",

        finish:
          data.finish ===
            "premium"
            ? "premium"
            : "rough",

        quantity:
          typeof data.quantity ===
            "number"
            ? data.quantity
            : 1,

        dimensions: {
          width:
            Number(
              data.dimensions?.width ??
                0,
            ),

          depth:
            Number(
              data.dimensions?.depth ??
                0,
            ),

          height:
            Number(
              data.dimensions?.height ??
                0,
            ),
        },

        volumeCm3:
          typeof data.volumeCm3 ===
            "number"
            ? data.volumeCm3
            : undefined,

        estimatedWeightGrams:
          typeof data.estimatedWeightGrams ===
            "number"
            ? data.estimatedWeightGrams
            : undefined,

        estimatedPrintTimeMinutes:
          typeof data.estimatedPrintTimeMinutes ===
            "number"
            ? data.estimatedPrintTimeMinutes
            : undefined,

        estimate:
          data.estimate,

        estimatedPrice:
          typeof data.estimatedPrice ===
            "number"
            ? data.estimatedPrice
            : 0,

        finalPrice:
          typeof data.finalPrice ===
            "number"
            ? data.finalPrice
            : undefined,

        status:
          isPrintingOrderStatus(
            data.status,
          )
            ? data.status
            : "pending",

        paymentStatus:
          isPaymentStatus(
            data.paymentStatus,
          )
            ? data.paymentStatus
            : "unpaid",

        adminNotes:
          typeof data.adminNotes ===
            "string"
            ? data.adminNotes
            : "",

        customerNotes:
          typeof data.customerNotes ===
            "string"
            ? data.customerNotes
            : "",

        createdAt:
          data.createdAt,

        updatedAt:
          data.updatedAt,
      };
    },
  );
}


/*
 * ==========================================================
 * UPDATE ADMIN QUOTE
 * ==========================================================
 */

export async function updatePrintingQuote(
  orderId: string,
  values: {
    material: PrintingMaterial;
    finish: PrintingFinish;
    finalPrice: number;
    adminNotes: string;
  },
): Promise<void> {

  if (
    !orderId.trim()
  ) {

    throw new Error(
      "Printing order ID is required.",
    );
  }


  if (
    !Number.isFinite(
      values.finalPrice,
    ) ||
    values.finalPrice <
      0
  ) {

    throw new Error(
      "Enter a valid final price.",
    );
  }


  await updateDoc(
    doc(
      db,
      ORDERS_COLLECTION,
      orderId,
    ),
    {
      material:
        values.material,

      finish:
        values.finish,

      finalPrice:
        Math.ceil(
          values.finalPrice,
        ),

      adminNotes:
        values.adminNotes.trim(),

      status:
        "quoted",

      paymentStatus:
        "unpaid",

      updatedAt:
        serverTimestamp(),
    },
  );
}


/*
 * ==========================================================
 * UPDATE STATUS
 * ==========================================================
 */

export async function updatePrintingStatus(
  orderId: string,
  status: PrintingOrderStatus,
): Promise<void> {

  if (
    !orderId.trim()
  ) {

    throw new Error(
      "Printing order ID is required.",
    );
  }


  await updateDoc(
    doc(
      db,
      ORDERS_COLLECTION,
      orderId,
    ),
    {
      status,

      updatedAt:
        serverTimestamp(),
    },
  );
}


/*
 * ==========================================================
 * TYPE GUARDS
 * ==========================================================
 */

function isPrintingOrderStatus(
  value: unknown,
): value is PrintingOrderStatus {

  return [
    "pending",
    "reviewing",
    "quoted",
    "payment_pending",
    "paid",
    "approved",
    "printing",
    "quality_check",
    "ready",
    "completed",
    "rejected",
    "cancelled",
  ].includes(
    String(
      value,
    ),
  );
}


function isPaymentStatus(
  value: unknown,
): value is PrintingOrder["paymentStatus"] {

  return [
    "unpaid",
    "pending",
    "paid",
    "failed",
    "refunded",
  ].includes(
    String(
      value,
    ),
  );
}