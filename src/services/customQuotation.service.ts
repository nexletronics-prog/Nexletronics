import {
  supabase,
} from "../lib/supabase";

import {
  auth,
} from "../firebase/config";

import type {
  CustomProject,
  CustomQuotation,
  CustomQuotationItem,
} from "../types/customProject";


/*
 * ==========================================================
 * TABLES
 * ==========================================================
 */

const QUOTATIONS_TABLE =
  "custom_quotations";

const ITEMS_TABLE =
  "custom_quotation_items";

const PROJECTS_TABLE =
  "custom_projects";


/*
 * ==========================================================
 * INPUT
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
 * DATABASE ROW
 * ==========================================================
 */

interface QuotationRow {
  id: string;

  quotation_number: string;

  project_id: string;

  customer_name: string;

  customer_email: string;

  project_title: string;

  subtotal: number | string;

  discount: number | string;

  tax_rate: number | string;

  tax_amount: number | string;

  total: number | string;

  currency: string;

  validity_days: number;

  valid_until: string | null;

  estimated_delivery: string;

  payment_terms: string;

  notes: string;

  status: string;

  accepted_at: string | null;

  accepted_by: string | null;

  rejection_reason: string | null;

  payment_required: boolean;

  payment_status: string;

  paid_at: string | null;

  payment_id: string | null;

  razorpay_order_id: string | null;

  created_by: string;

  created_at: string;

  updated_at: string;
}


interface QuotationItemRow {
  id: string;

  quotation_id: string;

  description: string;

  quantity: number | string;

  unit_price: number | string;

  total: number | string;

  created_at: string;
}


/*
 * ==========================================================
 * COLUMNS
 * ==========================================================
 */

const QUOTATION_COLUMNS = `
  id,
  quotation_number,
  project_id,
  customer_name,
  customer_email,
  project_title,
  subtotal,
  discount,
  tax_rate,
  tax_amount,
  total,
  currency,
  validity_days,
  valid_until,
  estimated_delivery,
  payment_terms,
  notes,
  status,
  accepted_at,
  accepted_by,
  rejection_reason,
  payment_required,
  payment_status,
  paid_at,
  payment_id,
  razorpay_order_id,
  created_by,
  created_at,
  updated_at
`;


const ITEM_COLUMNS = `
  id,
  quotation_id,
  description,
  quantity,
  unit_price,
  total,
  created_at
`;


/*
 * ==========================================================
 * SAFE NUMBER
 * ==========================================================
 */

function safeNumber(
  value: unknown,
  fallback = 0,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }


  const parsed =
    Number(value);


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : fallback;
}


/*
 * ==========================================================
 * STRING
 * ==========================================================
 */

function cleanString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


/*
 * ==========================================================
 * STATUS NORMALIZERS
 * ==========================================================
 */

function normalizeQuotationStatus(
  value: unknown,
): CustomQuotation["status"] {
  switch (value) {
    case "draft":
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


function normalizePaymentStatus(
  value: unknown,
): CustomQuotation["paymentStatus"] {
  switch (value) {
    case "not_required":
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


/*
 * ==========================================================
 * TIME
 * ==========================================================
 */

function toIsoDate(
  value: unknown,
): string | null {
  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }


  if (
    typeof value ===
    "string"
  ) {
    const parsed =
      new Date(
        value,
      );


    if (
      !Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return parsed.toISOString();
    }
  }


  return null;
}


/*
 * ==========================================================
 * QUOTATION NUMBER
 * ==========================================================
 */

function createQuotationNumber():
  string {
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
 * CALCULATE TOTALS
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
 * MAP ITEMS
 * ==========================================================
 */

function mapQuotationItems(
  rows:
    QuotationItemRow[],
): CustomQuotationItem[] {
  return rows.map(
    (
      row,
    ) => ({
      id:
        row.id,

      description:
        row.description,

      quantity:
        safeNumber(
          row.quantity,
        ),

      unitPrice:
        safeNumber(
          row.unit_price,
        ),

      total:
        safeNumber(
          row.total,
        ),
    }),
  );
}


/*
 * ==========================================================
 * MAP QUOTATION
 * ==========================================================
 */

function mapQuotation(
  row:
    QuotationRow,

  items:
    QuotationItemRow[],
): CustomQuotation {
  return {
    id:
      row.id,

    quotationNumber:
      row.quotation_number,

    projectId:
      row.project_id,

    customerName:
      row.customer_name,

    customerEmail:
      row.customer_email,

    projectTitle:
      row.project_title,

    items:
      mapQuotationItems(
        items,
      ),

    subtotal:
      safeNumber(
        row.subtotal,
      ),

    discount:
      safeNumber(
        row.discount,
      ),

    taxRate:
      safeNumber(
        row.tax_rate,
      ),

    taxAmount:
      safeNumber(
        row.tax_amount,
      ),

    total:
      safeNumber(
        row.total,
      ),

    currency:
      row.currency ||
      "INR",

    validityDays:
      Math.max(
        1,
        Math.floor(
          safeNumber(
            row.validity_days,
            7,
          ),
        ),
      ),

    validUntil:
      toIsoDate(
        row.valid_until,
      ) ??
      undefined,

    estimatedDelivery:
      row.estimated_delivery,

    paymentTerms:
      row.payment_terms ||
      undefined,

    notes:
      row.notes ||
      undefined,

    status:
      normalizeQuotationStatus(
        row.status,
      ),

    acceptedAt:
      toIsoDate(
        row.accepted_at,
      ) ??
      undefined,

    acceptedBy:
      row.accepted_by ||
      undefined,

    rejectionReason:
      row.rejection_reason ||
      undefined,

    paymentRequired:
      Boolean(
        row.payment_required,
      ),

    paymentStatus:
      normalizePaymentStatus(
        row.payment_status,
      ),

    paidAt:
      toIsoDate(
        row.paid_at,
      ) ??
      undefined,

    paymentId:
      row.payment_id ||
      undefined,

    razorpayOrderId:
      row.razorpay_order_id ||
      undefined,

    createdBy:
      row.created_by,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


/*
 * ==========================================================
 * GET ITEMS
 * ==========================================================
 */

async function getQuotationItems(
  quotationId:
    string,
): Promise<
  QuotationItemRow[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        ITEMS_TABLE,
      )
      .select(
        ITEM_COLUMNS,
      )
      .eq(
        "quotation_id",
        quotationId,
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        },
      );


  if (
    error
  ) {
    throw error;
  }


  return (
    data ??
    []
  ) as QuotationItemRow[];
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
  const user =
    auth.currentUser;


  if (
    !user
  ) {
    throw new Error(
      "Admin authentication is required.",
    );
  }


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
    input.createdBy !==
    user.uid
  ) {
    throw new Error(
      "Quotation creator does not match the signed-in account.",
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


  const cleanedItems =
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
            cleanString(
              item.id,
            ) ||
            `item-${index + 1}`,

          description:
            cleanString(
              item.description,
            ),

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
    const item of
      cleanedItems
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
    cleanString(
      input.project.currency,
    ) ||
    "INR";


  const quotationId =
    crypto.randomUUID();


  const quotationNumber =
    createQuotationNumber();


  const validUntil =
    new Date();


  validUntil.setDate(
    validUntil.getDate() +
      validityDays,
  );


  const {
    error:
      quotationError,
  } =
    await supabase
      .from(
        QUOTATIONS_TABLE,
      )
      .insert({
        id:
          quotationId,

        quotation_number:
          quotationNumber,

        project_id:
          input.project.id,

        customer_name:
          input.project.customerName,

        customer_email:
          input.project.customerEmail,

        project_title:
          input.project.title,

        subtotal:
          totals.subtotal,

        discount:
          totals.discount,

        tax_rate:
          totals.taxRate,

        tax_amount:
          totals.taxAmount,

        total:
          totals.total,

        currency,

        validity_days:
          validityDays,

        valid_until:
          validUntil.toISOString(),

        estimated_delivery:
          cleanString(
            input.estimatedDelivery,
          ),

        payment_terms:
          cleanString(
            input.paymentTerms,
          ),

        notes:
          cleanString(
            input.notes,
          ),

        status:
          "draft",

        payment_required:
          Boolean(
            input.paymentRequired,
          ),

        payment_status:
          input.paymentRequired
            ? "pending"
            : "not_required",

        created_by:
          input.createdBy,

        created_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      });


  if (
    quotationError
  ) {
    throw quotationError;
  }


  /*
   * Insert quotation items.
   */

  const itemRows =
    cleanedItems.map(
      (
        item,
        index,
      ) => ({
        id:
          `${quotationId}-${index + 1}`,

        quotation_id:
          quotationId,

        description:
          item.description,

        quantity:
          item.quantity,

        unit_price:
          item.unitPrice,

        total:
          item.total,

        created_at:
          new Date().toISOString(),
      }),
    );


  const {
    error:
      itemsError,
  } =
    await supabase
      .from(
        ITEMS_TABLE,
      )
      .insert(
        itemRows,
      );


  if (
    itemsError
  ) {
    await supabase
      .from(
        QUOTATIONS_TABLE,
      )
      .delete()
      .eq(
        "id",
        quotationId,
      );


    throw itemsError;
  }


  return quotationId;
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
  CustomQuotation |
  null
> {
  if (
    !projectId ||
    !quotationId
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        QUOTATIONS_TABLE,
      )
      .select(
        QUOTATION_COLUMNS,
      )
      .eq(
        "id",
        quotationId,
      )
      .eq(
        "project_id",
        projectId,
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  if (
    !data
  ) {
    return null;
  }


  const items =
    await getQuotationItems(
      quotationId,
    );


  return mapQuotation(
    data as QuotationRow,
    items,
  );
}


/*
 * ==========================================================
 * REALTIME SINGLE QUOTATION
 * ==========================================================
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


    return () => {
      // No subscription.
    };
  }


  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  async function loadQuotation() {
    try {
      const quotation =
        await getCustomQuotation(
          projectId,
          quotationId,
        );


      if (
        !stopped
      ) {
        callback(
          quotation,
        );
      }
    } catch (
      error
    ) {
      if (
        !stopped
      ) {
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load quotation.",
              );


        onError?.(
          normalized,
        );
      }
    }
  }


  void loadQuotation();


  channel =
    supabase
      .channel(
        `custom-quotation-${quotationId}-${Date.now()}`,
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            QUOTATIONS_TABLE,

          filter:
            `id=eq.${quotationId}`,
        },
        () => {
          void loadQuotation();
        },
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            ITEMS_TABLE,

          filter:
            `quotation_id=eq.${quotationId}`,
        },
        () => {
          void loadQuotation();
        },
      )
      .subscribe(
        (
          status,
        ) => {
          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            onError?.(
              new Error(
                "Unable to connect to the quotation database.",
              ),
            );
          }
        },
      );


  return () => {
    stopped =
      true;


    if (
      channel
    ) {
      void supabase.removeChannel(
        channel,
      );
    }
  };
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
  CustomQuotation |
  null
> {
  if (
    !projectId
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        QUOTATIONS_TABLE,
      )
      .select(
        QUOTATION_COLUMNS,
      )
      .eq(
        "project_id",
        projectId,
      )
      .in(
        "status",
        [
          "sent",
          "accepted",
          "rejected",
        ],
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(
        1,
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  if (
    !data
  ) {
    return null;
  }


  const quotation =
    data as QuotationRow;


  const items =
    await getQuotationItems(
      quotation.id,
    );


  return mapQuotation(
    quotation,
    items,
  );
}


/*
 * ==========================================================
 * REALTIME QUOTATION LIST
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


    return () => {
      // No subscription.
    };
  }


  let stopped =
    false;


  let channel:
    ReturnType<
      typeof supabase.channel
    > | null =
    null;


  async function loadQuotations() {
    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            QUOTATIONS_TABLE,
          )
          .select(
            QUOTATION_COLUMNS,
          )
          .eq(
            "project_id",
            projectId,
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          );


      if (
        error
      ) {
        throw error;
      }


      const rows =
        (
          data ??
          []
        ) as QuotationRow[];


      const quotations:
        CustomQuotation[] =
        [];


      for (
        const row of
          rows
      ) {
        const items =
          await getQuotationItems(
            row.id,
          );


        quotations.push(
          mapQuotation(
            row,
            items,
          ),
        );
      }


      if (
        !stopped
      ) {
        callback(
          quotations,
        );
      }
    } catch (
      error
    ) {
      if (
        !stopped
      ) {
        const normalized =
          error instanceof Error
            ? error
            : new Error(
                "Unable to load quotations.",
              );


        onError?.(
          normalized,
        );
      }
    }
  }


  void loadQuotations();


  channel =
    supabase
      .channel(
        `custom-quotations-${projectId}-${Date.now()}`,
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            QUOTATIONS_TABLE,

          filter:
            `project_id=eq.${projectId}`,
        },
        () => {
          void loadQuotations();
        },
      )
      .subscribe(
        (
          status,
        ) => {
          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            onError?.(
              new Error(
                "Unable to connect to the quotation database.",
              ),
            );
          }
        },
      );


  return () => {
    stopped =
      true;


    if (
      channel
    ) {
      void supabase.removeChannel(
        channel,
      );
    }
  };
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


  const quotation =
    await getCustomQuotation(
      projectId,
      quotationId,
    );


  if (
    !quotation
  ) {
    throw new Error(
      "Quotation could not be found.",
    );
  }


  const now =
    new Date().toISOString();


  const {
    error:
      quotationError,
  } =
    await supabase
      .from(
        QUOTATIONS_TABLE,
      )
      .update({
        status:
          "sent",

        updated_at:
          now,
      })
      .eq(
        "id",
        quotationId,
      )
      .eq(
        "project_id",
        projectId,
      );


  if (
    quotationError
  ) {
    throw quotationError;
  }


  /*
   * Keep parent project state in sync.
   */

  const {
    error:
      projectError,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .update({
        quotation_status:
          "sent",

        active_quotation_id:
          quotationId,

        quoted_amount:
          quotation.total,

        status:
          "quotation_sent",

        payment_status:
          "not_required",

        updated_at:
          now,
      })
      .eq(
        "id",
        projectId,
      );


  if (
    projectError
  ) {
    throw projectError;
  }
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
  const user =
    auth.currentUser;


  if (
    !user
  ) {
    throw new Error(
      "You must be signed in.",
    );
  }


  if (
    user.uid !==
    userId
  ) {
    throw new Error(
      "User authentication mismatch.",
    );
  }


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


  /*
   * Check that the signed-in user owns the project.
   */

  const {
    data:
      project,
    error:
      projectReadError,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .select(
        "id, user_id",
      )
      .eq(
        "id",
        projectId,
      )
      .maybeSingle();


  if (
    projectReadError
  ) {
    throw projectReadError;
  }


  if (
    !project ||
    project.user_id !==
      user.uid
  ) {
    throw new Error(
      "You are not authorized to accept this quotation.",
    );
  }


  const now =
    new Date().toISOString();


  const nextProjectStatus =
    quotation.paymentRequired
      ? "payment_pending"
      : "confirmed";


  const nextPaymentStatus =
    quotation.paymentRequired
      ? "pending"
      : "not_required";


  const {
    error:
      quotationError,
  } =
    await supabase
      .from(
        QUOTATIONS_TABLE,
      )
      .update({
        status:
          "accepted",

        accepted_by:
          user.uid,

        accepted_at:
          now,

        updated_at:
          now,
      })
      .eq(
        "id",
        quotationId,
      )
      .eq(
        "project_id",
        projectId,
      );


  if (
    quotationError
  ) {
    throw quotationError;
  }


  const {
    error:
      parentProjectError,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .update({
        quotation_status:
          "accepted",

        active_quotation_id:
          quotationId,

        quoted_amount:
          quotation.total,

        status:
          nextProjectStatus,

        payment_status:
          nextPaymentStatus,

        updated_at:
          now,
      })
      .eq(
        "id",
        projectId,
      )
      .eq(
        "user_id",
        user.uid,
      );


  if (
    parentProjectError
  ) {
    throw parentProjectError;
  }
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
  const user =
    auth.currentUser;


  if (
    !user
  ) {
    throw new Error(
      "You must be signed in.",
    );
  }


  const cleanReason =
    cleanString(
      reason,
    );


  if (
    !cleanReason
  ) {
    throw new Error(
      "A rejection reason is required.",
    );
  }


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


  const {
    data:
      project,
    error:
      projectError,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .select(
        "id, user_id",
      )
      .eq(
        "id",
        projectId,
      )
      .maybeSingle();


  if (
    projectError
  ) {
    throw projectError;
  }


  if (
    !project ||
    project.user_id !==
      user.uid
  ) {
    throw new Error(
      "You are not authorized to reject this quotation.",
    );
  }


  const now =
    new Date().toISOString();


  const {
    error:
      quotationUpdateError,
  } =
    await supabase
      .from(
        QUOTATIONS_TABLE,
      )
      .update({
        status:
          "rejected",

        rejection_reason:
          cleanReason,

        updated_at:
          now,
      })
      .eq(
        "id",
        quotationId,
      )
      .eq(
        "project_id",
        projectId,
      );


  if (
    quotationUpdateError
  ) {
    throw quotationUpdateError;
  }


  const {
    error:
      parentProjectError,
  } =
    await supabase
      .from(
        PROJECTS_TABLE,
      )
      .update({
        quotation_status:
          "rejected",

        status:
          "discussion",

        payment_status:
          "not_required",

        active_quotation_id:
          quotationId,

        updated_at:
          now,
      })
      .eq(
        "id",
        projectId,
      )
      .eq(
        "user_id",
        user.uid,
      );


  if (
    parentProjectError
  ) {
    throw parentProjectError;
  }
}