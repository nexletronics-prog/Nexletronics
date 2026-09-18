import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import type {
  CustomProject,
  CustomQuotation,
  CustomQuotationItem,
} from "../types/customProject";


/*
 * ==========================================================
 * FIRESTORE COLLECTIONS
 * ==========================================================
 */

const PROJECTS_COLLECTION =
  "customProjects";

const QUOTATIONS_SUBCOLLECTION =
  "quotations";


/*
 * ==========================================================
 * CREATE QUOTATION INPUT
 * ==========================================================
 */

export interface CreateCustomQuotationInput {

  project:
    CustomProject;

  items:
    CustomQuotationItem[];

  discount:
    number;

  taxRate:
    number;

  validityDays:
    number;

  estimatedDelivery:
    string;

  paymentTerms:
    string;

  notes:
    string;

  paymentRequired:
    boolean;

  createdBy:
    string;
}


/*
 * ==========================================================
 * SAFE NUMBER
 * ==========================================================
 */

function safeNumber(
  value:
    unknown,

  fallback:
    number = 0,
): number {

  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  ) {

    return value;
  }


  const parsed =
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : fallback;
}


/*
 * ==========================================================
 * CALCULATE QUOTATION TOTALS
 * ==========================================================
 */

export function calculateQuotationTotals(
  items:
    CustomQuotationItem[],

  discount:
    number,

  taxRate:
    number,
) {

  const subtotal =
    items.reduce(
      (
        total,
        item,
      ) =>
        total +
        safeNumber(
          item.total,
        ),
      0,
    );


  const safeDiscount =
    Math.min(
      subtotal,
      Math.max(
        0,
        safeNumber(
          discount,
        ),
      ),
    );


  const taxableAmount =
    Math.max(
      0,
      subtotal -
        safeDiscount,
    );


  const safeTaxRate =
    Math.max(
      0,
      safeNumber(
        taxRate,
      ),
    );


  const taxAmount =
    taxableAmount *
    (
      safeTaxRate /
      100
    );


  const total =
    taxableAmount +
    taxAmount;


  return {

    subtotal:
      Number(
        subtotal.toFixed(
          2,
        ),
      ),

    discount:
      Number(
        safeDiscount.toFixed(
          2,
        ),
      ),

    taxRate:
      Number(
        safeTaxRate.toFixed(
          2,
        ),
      ),

    taxAmount:
      Number(
        taxAmount.toFixed(
          2,
        ),
      ),

    total:
      Number(
        total.toFixed(
          2,
        ),
      ),

  };
}


/*
 * ==========================================================
 * CREATE QUOTATION NUMBER
 * ==========================================================
 */

function createQuotationNumber(): string {

  const timestamp =
    Date.now()
      .toString()
      .slice(
        -8,
      );


  return `QT-${timestamp}`;
}


/*
 * ==========================================================
 * CREATE QUOTATION
 * ==========================================================
 */

export async function createCustomQuotation(
  input:
    CreateCustomQuotationInput,
): Promise<string> {

  if (
    !input.project.id
  ) {

    throw new Error(
      "Project ID is required.",
    );
  }


  if (
    !input.createdBy
  ) {

    throw new Error(
      "Admin authentication is required.",
    );
  }


  if (
    !Array.isArray(
      input.items,
    ) ||
    input.items.length ===
      0
  ) {

    throw new Error(
      "Add at least one quotation item.",
    );
  }


  const cleanedItems:
    CustomQuotationItem[] =
    input.items.map(
      (
        item,
        index,
      ) => {

        const quantity =
          Math.max(
            0,
            safeNumber(
              item.quantity,
            ),
          );


        const unitPrice =
          Math.max(
            0,
            safeNumber(
              item.unitPrice,
            ),
          );


        return {

          id:
            item.id ||
            `item-${index + 1}`,

          description:
            typeof item.description ===
            "string"
              ? item.description.trim()
              : "",

          quantity,

          unitPrice,

          total:
            Number(
              (
                quantity *
                unitPrice
              ).toFixed(
                2,
              ),
            ),

        };
      },
    );


  for (
    const item
    of cleanedItems
  ) {

    if (
      !item.description
    ) {

      throw new Error(
        "Every quotation item needs a description.",
      );
    }


    if (
      item.quantity <=
      0
    ) {

      throw new Error(
        "Quotation quantity must be greater than zero.",
      );
    }


    if (
      item.unitPrice <
      0
    ) {

      throw new Error(
        "Quotation unit price cannot be negative.",
      );
    }

  }


  const totals =
    calculateQuotationTotals(
      cleanedItems,
      input.discount,
      input.taxRate,
    );


  if (
    totals.total <=
    0
  ) {

    throw new Error(
      "Quotation total must be greater than zero.",
    );
  }


  const validityDays =
    Math.max(
      1,
      Math.floor(
        safeNumber(
          input.validityDays,
          7,
        ),
      ),
    );


  const currency =
    typeof input.project.currency ===
      "string" &&
    input.project.currency.trim()
      ? input.project.currency.trim()
      : "INR";


  const quotationData:
    Omit<
      CustomQuotation,
      "id"
    > = {

    quotationNumber:
      createQuotationNumber(),

    projectId:
      input.project.id,

    customerName:
      input.project.customerName,

    customerEmail:
      input.project.customerEmail,

    projectTitle:
      input.project.title,

    items:
      cleanedItems,

    subtotal:
      totals.subtotal,

    discount:
      totals.discount,

    taxRate:
      totals.taxRate,

    taxAmount:
      totals.taxAmount,

    total:
      totals.total,

    currency,

    validityDays,

    estimatedDelivery:
      input.estimatedDelivery.trim(),

    paymentTerms:
      input.paymentTerms.trim(),

    notes:
      input.notes.trim(),

    status:
      "draft",

    paymentRequired:
      Boolean(
        input.paymentRequired,
      ),

    paymentStatus:
      "not_required",

    createdBy:
      input.createdBy,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),

  };


  const quotationsRef =
    collection(
      db,
      PROJECTS_COLLECTION,
      input.project.id,
      QUOTATIONS_SUBCOLLECTION,
    );


  const quotation =
    await addDoc(
      quotationsRef,
      quotationData,
    );


  return quotation.id;
}


/*
 * ==========================================================
 * GET ONE QUOTATION
 * ==========================================================
 */

export async function getCustomQuotation(
  projectId:
    string,

  quotationId:
    string,
): Promise<
  CustomQuotation | null
> {

  if (
    !projectId ||
    !quotationId
  ) {

    return null;
  }


  const quotationRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
      QUOTATIONS_SUBCOLLECTION,
      quotationId,
    );


  /*
   * We intentionally use a small one-document query here
   * rather than reading the entire quotation collection.
   */

  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          PROJECTS_COLLECTION,
          projectId,
          QUOTATIONS_SUBCOLLECTION,
        ),

        where(
          "__name__",
          "==",
          quotationId,
        ),
      ),
    );


  if (
    snapshot.empty
  ) {

    return null;
  }


  const quotationDoc =
    snapshot.docs[0];


  if (
    !quotationDoc
  ) {

    return null;
  }


  /*
   * Keep quotationRef referenced so the document path remains
   * explicit and easy to verify while debugging.
   */

  void quotationRef;


  return {

    id:
      quotationDoc.id,

    ...(
      quotationDoc.data() as
        Omit<
          CustomQuotation,
          "id"
        >
    ),

  };
}


/*
 * ==========================================================
 * REALTIME SINGLE QUOTATION
 * ==========================================================
 *
 * Customer quotation page uses this listener.
 *
 * Any admin-side quotation update is immediately reflected
 * on the customer page without a browser refresh.
 */

export function subscribeCustomQuotation(
  projectId:
    string,

  quotationId:
    string,

  callback:
    (
      quotation:
        CustomQuotation |
        null,
    ) => void,

  onError?:
    (
      error:
        Error,
    ) => void,
): () => void {

  if (
    !projectId ||
    !quotationId
  ) {

    callback(
      null,
    );


    return () => {};
  }


  const quotationRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
      QUOTATIONS_SUBCOLLECTION,
      quotationId,
    );


  return onSnapshot(

    quotationRef,

    (
      snapshot,
    ) => {

      if (
        !snapshot.exists()
      ) {

        callback(
          null,
        );

        return;
      }


      const data =
        snapshot.data();


      callback(
        {

          id:
            snapshot.id,

          ...(
            data as
              Omit<
                CustomQuotation,
                "id"
              >
          ),

        },
      );

    },

    (
      firebaseError,
    ) => {

      console.error(
        "Custom quotation realtime listener failed:",
        firebaseError,
      );


      if (
        onError
      ) {

        onError(
          new Error(
            String(
              firebaseError,
            ),
          ),
        );
      }

    },
  );
}


/*
 * ==========================================================
 * GET LATEST SENT QUOTATION
 * ==========================================================
 */

export async function getLatestSentQuotation(
  projectId:
    string,
): Promise<
  CustomQuotation | null
> {

  if (
    !projectId
  ) {

    return null;
  }


  const quotationsQuery =
    query(
      collection(
        db,
        PROJECTS_COLLECTION,
        projectId,
        QUOTATIONS_SUBCOLLECTION,
      ),

      where(
        "status",
        "in",
        [
          "sent",
          "accepted",
          "rejected",
        ],
      ),

      orderBy(
        "createdAt",
        "desc",
      ),
    );


  const snapshot =
    await getDocs(
      quotationsQuery,
    );


  if (
    snapshot.empty
  ) {

    return null;
  }


  const quotationDoc =
    snapshot.docs[0];


  if (
    !quotationDoc
  ) {

    return null;
  }


  return {

    id:
      quotationDoc.id,

    ...(
      quotationDoc.data() as
        Omit<
          CustomQuotation,
          "id"
        >
    ),

  };
}


/*
 * ==========================================================
 * REALTIME QUOTATIONS LIST
 * ==========================================================
 */

export function subscribeCustomQuotations(
  projectId:
    string,

  callback:
    (
      quotations:
        CustomQuotation[],
    ) => void,

  onError?:
    (
      error:
        Error,
    ) => void,
): () => void {

  if (
    !projectId
  ) {

    callback(
      [],
    );


    return () => {};
  }


  const quotationsRef =
    collection(
      db,
      PROJECTS_COLLECTION,
      projectId,
      QUOTATIONS_SUBCOLLECTION,
    );


  const quotationsQuery =
    query(
      quotationsRef,
      orderBy(
        "createdAt",
        "desc",
      ),
    );


  return onSnapshot(

    quotationsQuery,

    (
      snapshot,
    ) => {

      const quotations:
        CustomQuotation[] =
        snapshot.docs.map(
          (
            quotationDoc,
          ) => ({

            id:
              quotationDoc.id,

            ...(
              quotationDoc.data() as
                Omit<
                  CustomQuotation,
                  "id"
                >
            ),

          }),
        );


      callback(
        quotations,
      );

    },

    (
      firebaseError,
    ) => {

      console.error(
        "Custom quotations realtime listener failed:",
        firebaseError,
      );


      if (
        onError
      ) {

        onError(
          new Error(
            String(
              firebaseError,
            ),
          ),
        );
      }

    },
  );
}


/*
 * ==========================================================
 * SEND QUOTATION
 * ==========================================================
 */

export async function sendCustomQuotation(
  projectId:
    string,

  quotationId:
    string,
): Promise<void> {

  if (
    !projectId ||
    !quotationId
  ) {

    throw new Error(
      "Project and quotation are required.",
    );
  }


  const quotationRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
      QUOTATIONS_SUBCOLLECTION,
      quotationId,
    );


  await updateDoc(
    quotationRef,
    {

      status:
        "sent",

      updatedAt:
        serverTimestamp(),

    },
  );


  /*
   * Load the actual quotation from Firestore after the update.
   * The project amount is therefore based on the stored quote.
   */

  const quotation =
    await getCustomQuotation(
      projectId,
      quotationId,
    );


  if (
    !quotation
  ) {

    throw new Error(
      "Quotation could not be found after sending.",
    );
  }


  const projectRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
    );


  await updateDoc(
    projectRef,
    {

      quotationStatus:
        "sent",

      activeQuotationId:
        quotationId,

      quotedAmount:
        quotation.total,

      status:
        "quotation_sent",

      paymentStatus:
        "not_required",

      updatedAt:
        serverTimestamp(),

    },
  );
}


/*
 * ==========================================================
 * ACCEPT QUOTATION
 * ==========================================================
 */

export async function acceptCustomQuotation(
  projectId:
    string,

  quotationId:
    string,

  userId:
    string,
): Promise<void> {

  if (
    !projectId ||
    !quotationId ||
    !userId
  ) {

    throw new Error(
      "Project, quotation and user are required.",
    );
  }


  const quotationRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
      QUOTATIONS_SUBCOLLECTION,
      quotationId,
    );


  /*
   * Load first so we know the exact current quotation.
   */

  const quotation =
    await getCustomQuotation(
      projectId,
      quotationId,
    );


  if (
    !quotation
  ) {

    throw new Error(
      "Quotation not found.",
    );
  }


  if (
    quotation.status !==
    "sent"
  ) {

    throw new Error(
      "Only a sent quotation can be accepted.",
    );
  }


  await updateDoc(
    quotationRef,
    {

      status:
        "accepted",

      acceptedBy:
        userId,

      acceptedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

    },
  );


  const projectRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
    );


  await updateDoc(
    projectRef,
    {

      quotationStatus:
        "accepted",

      activeQuotationId:
        quotationId,

      quotedAmount:
        quotation.total,

      status:
        quotation.paymentRequired
          ? "payment_pending"
          : "confirmed",

      paymentStatus:
        quotation.paymentRequired
          ? "pending"
          : "not_required",

      updatedAt:
        serverTimestamp(),

    },
  );
}


/*
 * ==========================================================
 * REJECT QUOTATION
 * ==========================================================
 */

export async function rejectCustomQuotation(
  projectId:
    string,

  quotationId:
    string,

  reason:
    string,
): Promise<void> {

  if (
    !projectId ||
    !quotationId
  ) {

    throw new Error(
      "Project and quotation are required.",
    );
  }


  const cleanReason =
    reason.trim();


  if (
    !cleanReason
  ) {

    throw new Error(
      "A rejection reason is required.",
    );
  }


  const quotationRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
      QUOTATIONS_SUBCOLLECTION,
      quotationId,
    );


  const quotation =
    await getCustomQuotation(
      projectId,
      quotationId,
    );


  if (
    !quotation
  ) {

    throw new Error(
      "Quotation not found.",
    );
  }


  if (
    quotation.status !==
    "sent"
  ) {

    throw new Error(
      "Only a sent quotation can be rejected.",
    );
  }


  await updateDoc(
    quotationRef,
    {

      status:
        "rejected",

      rejectionReason:
        cleanReason,

      updatedAt:
        serverTimestamp(),

    },
  );


  const projectRef =
    doc(
      db,
      PROJECTS_COLLECTION,
      projectId,
    );


  await updateDoc(
    projectRef,
    {

      quotationStatus:
        "rejected",

      status:
        "discussion",

      paymentStatus:
        "not_required",

      activeQuotationId:
        quotationId,

      updatedAt:
        serverTimestamp(),

    },
  );
}