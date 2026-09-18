import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  MessageCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  acceptCustomQuotation,
  rejectCustomQuotation,
  subscribeCustomQuotation,
} from "../../services/customQuotation.service";

import type {
  CustomQuotation,
} from "../../types/customProject";


/*
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

function safeString(
  value: unknown,
  fallback = "",
): string {

  return typeof value === "string"
    ? value
    : fallback;
}


function safeNumber(
  value: unknown,
): number {

  if (
    typeof value === "number" &&
    Number.isFinite(value)
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
    : 0;
}


/*
 * ==========================================================
 * FIRESTORE DATE
 * ==========================================================
 */

function getTimeValue(
  value: unknown,
): number {

  if (
    value &&
    typeof value === "object"
  ) {

    const possible =
      value as {
        toMillis?: unknown;
        toDate?: unknown;
        seconds?: unknown;
      };


    if (
      typeof possible.toMillis ===
      "function"
    ) {

      const result =
        (
          possible.toMillis as
            () => unknown
        )();


      const timestamp =
        Number(
          result,
        );


      return Number.isFinite(
        timestamp,
      )
        ? timestamp
        : 0;
    }


    if (
      typeof possible.toDate ===
      "function"
    ) {

      const date =
        (
          possible.toDate as
            () => unknown
        )();


      if (
        date instanceof Date
      ) {

        return date.getTime();
      }
    }


    if (
      possible.seconds !==
      undefined
    ) {

      const seconds =
        Number(
          possible.seconds,
        );


      if (
        Number.isFinite(
          seconds,
        )
      ) {

        return seconds * 1000;
      }
    }
  }


  if (
    value instanceof Date
  ) {

    return value.getTime();
  }


  if (
    typeof value ===
    "string"
  ) {

    const timestamp =
      Date.parse(
        value,
      );


    return Number.isNaN(
      timestamp,
    )
      ? 0
      : timestamp;
  }


  if (
    typeof value ===
    "number"
  ) {

    return value;
  }


  return 0;
}


function formatDate(
  value: unknown,
): string {

  const timestamp =
    getTimeValue(
      value,
    );


  if (
    timestamp <=
    0
  ) {

    return "—";
  }


  return new Date(
    timestamp,
  ).toLocaleString(
    "en-IN",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    },
  );
}


/*
 * ==========================================================
 * STATUS LABEL
 * ==========================================================
 */

function quotationStatusLabel(
  status:
    CustomQuotation["status"],
): string {

  const labels:
    Record<
      CustomQuotation["status"],
      string
    > = {

    draft:
      "Draft",

    sent:
      "Pending Your Response",

    accepted:
      "Accepted",

    rejected:
      "Rejected",

    expired:
      "Expired",

    cancelled:
      "Cancelled",

  };


  return (
    labels[status] ??
    "Quotation"
  );
}


/*
 * ==========================================================
 * STATUS CLASS
 * ==========================================================
 */

function quotationStatusClass(
  status:
    CustomQuotation["status"],
): string {

  switch (
    status
  ) {

    case "accepted":
      return "bg-green-50 text-green-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    case "expired":
      return "bg-orange-50 text-orange-700";

    case "cancelled":
      return "bg-neutral-100 text-neutral-600";

    case "sent":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}


/*
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default function CustomQuotationView() {

  const {
    projectId,
    quotationId,
  } =
    useParams<{
      projectId:
        string;

      quotationId:
        string;
    }>();


  const navigate =
    useNavigate();


  const {
    user,
    loading:
      authLoading,
  } =
    useAuth();


  const [
    quotation,
    setQuotation,
  ] =
    useState<
      CustomQuotation | null
    >(null);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(
      false,
    );


  const [
    error,
    setError,
  ] =
    useState(
      "",
    );


  const [
    rejectionReason,
    setRejectionReason,
  ] =
    useState(
      "",
    );


  const [
    showReject,
    setShowReject,
  ] =
    useState(
      false,
    );


  /*
   * ========================================================
   * REALTIME QUOTATION
   * ========================================================
   */

  useEffect(
    () => {

      if (
        !projectId ||
        !quotationId
      ) {

        setQuotation(
          null,
        );


        setError(
          "Quotation information is missing.",
        );


        setLoading(
          false,
        );


        return;
      }


      setLoading(
        true,
      );


      setError(
        "",
      );


      const unsubscribe =
        subscribeCustomQuotation(

          projectId,

          quotationId,

          (
            nextQuotation,
          ) => {

            setQuotation(
              nextQuotation,
            );


            setLoading(
              false,
            );


            if (
              !nextQuotation
            ) {

              setError(
                "Quotation not found.",
              );

            } else {

              setError(
                "",
              );
            }

          },

          (
            listenerError,
          ) => {

            console.error(
              "Customer quotation realtime listener failed:",
              listenerError,
            );


            setError(
              listenerError instanceof Error
                ? listenerError.message
                : "Unable to load quotation.",
            );


            setLoading(
              false,
            );
          },
        );


      return () => {

        unsubscribe();

      };

    },
    [
      projectId,
      quotationId,
    ],
  );


  /*
   * ========================================================
   * TOTALS
   * ========================================================
   */

  const subtotal =
    useMemo(
      () =>
        safeNumber(
          quotation?.subtotal,
        ),
      [
        quotation,
      ],
    );


  const discount =
    useMemo(
      () =>
        safeNumber(
          quotation?.discount,
        ),
      [
        quotation,
      ],
    );


  const taxRate =
    useMemo(
      () =>
        safeNumber(
          quotation?.taxRate,
        ),
      [
        quotation,
      ],
    );


  const taxAmount =
    useMemo(
      () =>
        safeNumber(
          quotation?.taxAmount,
        ),
      [
        quotation,
      ],
    );


  const total =
    useMemo(
      () =>
        safeNumber(
          quotation?.total,
        ),
      [
        quotation,
      ],
    );


  /*
   * ========================================================
   * ACCEPT QUOTATION
   * ========================================================
   */

  async function handleAccept() {

    if (
      !projectId ||
      !quotationId ||
      !quotation
    ) {

      return;
    }


    if (
      !user
    ) {

      navigate(
        "/login",
        {
          state: {
            from:
              `/custom-solutions/projects/${projectId}/quotation/${quotationId}`,
          },
        },
      );


      return;
    }


    if (
      quotation.status !==
      "sent"
    ) {

      return;
    }


    const confirmed =
      window.confirm(
        "Are you sure you want to accept this quotation?",
      );


    if (
      !confirmed
    ) {

      return;
    }


    try {

      setActionLoading(
        true,
      );


      setError(
        "",
      );


      /*
       * First update Firestore.
       *
       * The backend/service verifies that the quotation
       * is currently in "sent" state.
       */

      await acceptCustomQuotation(
        projectId,
        quotationId,
        user.uid,
      );


      /*
       * Move the customer to payment only when the
       * quotation requires payment.
       *
       * Do NOT use the browser total for payment creation.
       * The future payment backend will load the quotation
       * directly from Firestore.
       */

      if (
        quotation.paymentRequired
      ) {

        navigate(
          `/custom-solutions/projects/${projectId}/payment/${quotationId}`,
        );


        return;
      }


      /*
       * No payment is required.
       *
       * Stay on this page. The realtime listener will update
       * the quotation status to "accepted".
       */

    } catch (
      acceptError
    ) {

      console.error(
        "Quotation acceptance failed:",
        acceptError,
      );


      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Unable to accept quotation.",
      );

    } finally {

      setActionLoading(
        false,
      );
    }
  }


  /*
   * ========================================================
   * REJECT QUOTATION
   * ========================================================
   */

  async function handleReject() {

    if (
      !projectId ||
      !quotationId ||
      !quotation
    ) {

      return;
    }


    if (
      !user
    ) {

      navigate(
        "/login",
        {
          state: {
            from:
              `/custom-solutions/projects/${projectId}/quotation/${quotationId}`,
          },
        },
      );


      return;
    }


    if (
      quotation.status !==
      "sent"
    ) {

      return;
    }


    const reason =
      rejectionReason.trim();


    if (
      !reason
    ) {

      setError(
        "Please provide a reason for rejecting the quotation.",
      );


      return;
    }


    try {

      setActionLoading(
        true,
      );


      setError(
        "",
      );


      await rejectCustomQuotation(
        projectId,
        quotationId,
        reason,
      );


      setShowReject(
        false,
      );


      setRejectionReason(
        "",
      );

    } catch (
      rejectError
    ) {

      console.error(
        "Quotation rejection failed:",
        rejectError,
      );


      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Unable to reject quotation.",
      );

    } finally {

      setActionLoading(
        false,
      );
    }
  }


  /*
   * ========================================================
   * AUTH LOADING
   * ========================================================
   */

  if (
    authLoading
  ) {

    return (
      <LoadingState />
    );
  }


  /*
   * ========================================================
   * LOGIN REQUIRED
   * ========================================================
   */

  if (
    !user
  ) {

    return (

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-20">

          <div className="w-full rounded-[2rem] border border-neutral-200 bg-white p-10 text-center shadow-sm">

            <ShieldCheck
              size={44}
              className="mx-auto text-[#D4AF37]"
            />


            <h1 className="mt-5 text-3xl font-black text-neutral-950">
              Sign in to view your quotation
            </h1>


            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              Your custom-project quotations are available
              only to the account they belong to.
            </p>


            <button
              type="button"

              onClick={() =>
                navigate(
                  "/login",
                  {
                    state: {
                      from:
                        projectId &&
                        quotationId
                          ? `/custom-solutions/projects/${projectId}/quotation/${quotationId}`
                          : "/custom-solutions",
                    },
                  },
                )
              }

              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white transition hover:bg-[#b99622]"
            >

              Login to Continue

              <ArrowRight
                size={16}
              />

            </button>

          </div>

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * PAGE LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (
      <LoadingState />
    );
  }


  /*
   * ========================================================
   * NOT FOUND
   * ========================================================
   */

  if (
    !quotation
  ) {

    return (

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-20">

          <div className="w-full rounded-[2rem] border border-neutral-200 bg-white p-10 text-center shadow-sm">

            <FileText
              size={44}
              className="mx-auto text-[#D4AF37]"
            />


            <h1 className="mt-5 text-3xl font-black text-neutral-950">
              Quotation not found
            </h1>


            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-500">

              {
                error ||
                "This quotation is no longer available."
              }

            </p>


            <Link
              to={
                projectId
                  ? `/custom-solutions/projects/${projectId}`
                  : "/custom-solutions"
              }

              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white hover:bg-[#b99622]"
            >

              <ArrowLeft
                size={16}
              />

              Back to Project

            </Link>

          </div>

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * VALUES
   * ========================================================
   */

  const quotationNumber =
    safeString(
      quotation.quotationNumber,
      "Quotation",
    );


  const customerName =
    safeString(
      quotation.customerName,
      "Customer",
    );


  const customerEmail =
    safeString(
      quotation.customerEmail,
    );


  const projectTitle =
    safeString(
      quotation.projectTitle,
      "Custom Project",
    );


  const currency =
    safeString(
      quotation.currency,
      "INR",
    );


  const delivery =
    safeString(
      quotation.estimatedDelivery,
      "To be discussed",
    );


  const paymentTerms =
    safeString(
      quotation.paymentTerms,
      "To be discussed",
    );


  const notes =
    safeString(
      quotation.notes,
    );


  /*
   * ========================================================
   * MAIN
   * ========================================================
   */

  return (

    <main className="min-h-screen bg-[#faf9f5]">

      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 lg:px-10 lg:py-14">

        {/* ==================================================
            BACK
        =================================================== */}

        <Link
          to={
            projectId
              ? `/custom-solutions/projects/${projectId}`
              : "/custom-solutions"
          }

          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-[#D4AF37]"
        >

          <ArrowLeft
            size={16}
          />

          Back to Project

        </Link>


        {/* ==================================================
            HEADER
        =================================================== */}

        <header className="mt-7 overflow-hidden rounded-3xl bg-neutral-950 shadow-sm">

          <div className="p-7 sm:p-9">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                  Nexletronics
                </p>


                <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                  Project Quotation
                </h1>


                <p className="mt-2 text-sm text-neutral-400">

                  {
                    quotationNumber
                  }

                </p>

              </div>


              <span
                className={[
                  "inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-xs font-black",
                  quotationStatusClass(
                    quotation.status,
                  ),
                ].join(
                  " ",
                )}
              >

                {quotation.status ===
                "accepted" ? (

                  <CheckCircle2
                    size={14}
                  />

                ) : quotation.status ===
                  "rejected" ? (

                  <XCircle
                    size={14}
                  />

                ) : (

                  <Clock3
                    size={14}
                  />

                )}


                {
                  quotationStatusLabel(
                    quotation.status,
                  )
                }

              </span>

            </div>

          </div>

        </header>


        {/* ==================================================
            ERROR
        =================================================== */}

        {error && (

          <div
            role="alert"

            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700"
          >

            {
              error
            }

          </div>

        )}


        {/* ==================================================
            CUSTOMER / PROJECT
        =================================================== */}

        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="grid gap-6 sm:grid-cols-2">

            <div>

              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Prepared For
              </p>


              <p className="mt-2 text-lg font-black text-neutral-950">

                {
                  customerName
                }

              </p>


              <p className="mt-1 break-all text-sm text-neutral-500">

                {
                  customerEmail
                }

              </p>

            </div>


            <div className="sm:text-right">

              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Project
              </p>


              <p className="mt-2 text-lg font-black text-neutral-950">

                {
                  projectTitle
                }

              </p>


              <p className="mt-1 text-sm text-neutral-500">

                Issued{" "}

                {
                  formatDate(
                    quotation.createdAt,
                  )
                }

              </p>

            </div>

          </div>

        </section>


        {/* ==================================================
            ITEMS
        =================================================== */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="border-b border-neutral-100 px-6 py-5 sm:px-8">

            <h2 className="font-black text-neutral-950">
              Quotation Details
            </h2>


            <p className="mt-1 text-xs text-neutral-400">
              Services and items included in your quotation.
            </p>

          </div>


          <div className="divide-y divide-neutral-100">

            {
              quotation.items.map(
                (
                  item,
                  index,
                ) => {

                  const quantity =
                    safeNumber(
                      item.quantity,
                    );


                  const unitPrice =
                    safeNumber(
                      item.unitPrice,
                    );


                  const itemTotal =
                    safeNumber(
                      item.total,
                    );


                  return (

                    <div
                      key={
                        item.id ||
                        `quotation-item-${index}`
                      }

                      className="px-6 py-5 sm:px-8"
                    >

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <p className="break-words text-sm font-black text-neutral-900">

                            {
                              safeString(
                                item.description,
                                "Quotation Item",
                              )
                            }

                          </p>


                          <p className="mt-1 text-xs text-neutral-400">

                            {
                              quantity
                            }

                            {" × "}

                            {
                              currency
                            }

                            {" "}

                            {
                              unitPrice.toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits:
                                    2,
                                },
                              )
                            }

                          </p>

                        </div>


                        <p className="text-base font-black text-neutral-950">

                          {
                            currency
                          }

                          {" "}

                          {
                            itemTotal.toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits:
                                  2,
                              },
                            )
                          }

                        </p>

                      </div>

                    </div>

                  );
                },
              )
            }

          </div>

        </section>


        {/* ==================================================
            TERMS + TOTAL
        =================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              Project Terms
            </p>


            <div className="mt-6 space-y-6">

              <div className="flex items-start gap-3">

                <Clock3
                  size={19}
                  className="mt-0.5 shrink-0 text-[#D4AF37]"
                />


                <div>

                  <p className="text-sm font-black text-neutral-900">
                    Estimated Delivery
                  </p>


                  <p className="mt-1 text-sm leading-6 text-neutral-500">

                    {
                      delivery
                    }

                  </p>

                </div>

              </div>


              <div className="flex items-start gap-3">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#D4AF37]"
                />


                <div>

                  <p className="text-sm font-black text-neutral-900">
                    Payment Terms
                  </p>


                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-500">

                    {
                      paymentTerms
                    }

                  </p>

                </div>

              </div>


              <div>

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Validity
                </p>


                <p className="mt-1 text-sm font-bold text-neutral-800">

                  {
                    safeNumber(
                      quotation.validityDays,
                    )
                  }

                  {" "}

                  {
                    safeNumber(
                      quotation.validityDays,
                    ) ===
                    1
                      ? "day"
                      : "days"
                  }

                </p>

              </div>


              {notes && (

                <div>

                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Notes
                  </p>


                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-500">

                    {
                      notes
                    }

                  </p>

                </div>

              )}

            </div>

          </section>


          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              Amount
            </p>


            <div className="mt-6 space-y-3">

              <SummaryRow
                label="Subtotal"
                value={`${currency} ${subtotal.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits:
                      2,
                  },
                )}`}
              />


              <SummaryRow
                label="Discount"
                value={`− ${currency} ${discount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits:
                      2,
                  },
                )}`}
              />


              <SummaryRow
                label={`Tax (${taxRate}%)`}
                value={`${currency} ${taxAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits:
                      2,
                  },
                )}`}
              />


              <div className="border-t border-neutral-200 pt-5">

                <div className="flex items-end justify-between gap-4">

                  <p className="font-black text-neutral-950">
                    Total
                  </p>


                  <p className="text-3xl font-black text-[#9b7e1d]">

                    {
                      currency
                    }

                    {" "}

                    {
                      total.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits:
                            2,
                        },
                      )
                    }

                  </p>

                </div>

              </div>

            </div>

          </section>

        </div>


        {/* ==================================================
            ACCEPT / REJECT
        =================================================== */}

        {quotation.status ===
          "sent" && (

          <section className="mt-6 rounded-3xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-6 shadow-sm sm:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-xl font-black text-neutral-950">
                  Review your quotation
                </h2>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                  Accept the quotation to proceed to payment,
                  or reject it and tell us what needs to change.
                </p>

              </div>


              <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"

                  onClick={() =>
                    setShowReject(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }

                  disabled={
                    actionLoading
                  }

                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-6 py-3.5 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
                >

                  <XCircle
                    size={16}
                  />

                  Reject

                </button>


                <button
                  type="button"

                  onClick={() =>
                    void handleAccept()
                  }

                  disabled={
                    actionLoading
                  }

                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-white hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {actionLoading ? (

                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                  ) : (

                    quotation.paymentRequired ? (

                      <CreditCard
                        size={16}
                      />

                    ) : (

                      <CheckCircle2
                        size={16}
                      />

                    )

                  )}


                  {
                    quotation.paymentRequired
                      ? "Accept & Continue to Payment"
                      : "Accept Quotation"
                  }

                </button>

              </div>

            </div>


            {/* ===============================================
                REJECTION
            ================================================ */}

            {showReject && (

              <div className="mt-6 border-t border-[#D4AF37]/20 pt-6">

                <label
                  htmlFor="quotation-rejection-reason"

                  className="mb-2 block text-sm font-black text-neutral-900"
                >

                  Reason for rejection

                </label>


                <textarea
                  id="quotation-rejection-reason"

                  rows={4}

                  value={
                    rejectionReason
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      setRejectionReason(
                        event.target.value,
                      )
                  }

                  placeholder="Tell us what should be changed..."

                  className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm leading-6 outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                />


                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"

                    onClick={() =>
                      setShowReject(
                        false,
                      )
                    }

                    disabled={
                      actionLoading
                    }

                    className="rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
                  >

                    Cancel

                  </button>


                  <button
                    type="button"

                    onClick={() =>
                      void handleReject()
                    }

                    disabled={
                      actionLoading ||
                      !rejectionReason.trim()
                    }

                    className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {actionLoading ? (

                      <Loader2
                        size={15}
                        className="animate-spin"
                      />

                    ) : (

                      <XCircle
                        size={15}
                      />

                    )}

                    Confirm Rejection

                  </button>

                </div>

              </div>

            )}

          </section>

        )}


        {/* ==================================================
            ACCEPTED
        =================================================== */}

        {quotation.status ===
          "accepted" && (

          <section className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <CheckCircle2
                  size={26}
                  className="mt-0.5 shrink-0 text-green-600"
                />


                <div>

                  <h2 className="text-xl font-black text-green-900">
                    Quotation accepted
                  </h2>


                  <p className="mt-2 text-sm leading-6 text-green-800">

                    {
                      quotation.paymentRequired
                        ? "Your quotation has been accepted. Continue to payment to confirm the project."
                        : "Your quotation has been accepted. Nexletronics can now continue with the project."
                    }

                  </p>

                </div>

              </div>


              {quotation.paymentRequired &&
                quotation.paymentStatus !==
                  "paid" && (

                <Link
                  to={
                    `/custom-solutions/projects/${projectId}/payment/${quotationId}`
                  }

                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white hover:bg-[#b99622]"
                >

                  <CreditCard
                    size={16}
                  />

                  Continue to Payment

                </Link>

              )}

            </div>

          </section>

        )}


        {/* ==================================================
            REJECTED
        =================================================== */}

        {quotation.status ===
          "rejected" && (

          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">

            <div className="flex items-start gap-4">

              <XCircle
                size={26}
                className="mt-0.5 shrink-0 text-red-600"
              />


              <div>

                <h2 className="text-xl font-black text-red-900">
                  Quotation rejected
                </h2>


                {quotation.rejectionReason && (

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-800">

                    {
                      safeString(
                        quotation.rejectionReason,
                      )
                    }

                  </p>

                )}


                <Link
                  to={
                    projectId
                      ? `/custom-solutions/projects/${projectId}`
                      : "/custom-solutions"
                  }

                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-neutral-800"
                >

                  <MessageCircle
                    size={15}
                  />

                  Return to Conversation

                </Link>

              </div>

            </div>

          </section>

        )}


        {/* ==================================================
            FOOTER
        =================================================== */}

        <p className="mt-8 text-center text-xs leading-5 text-neutral-400">

          Questions about this quotation?

          {" "}

          <Link
            to={
              projectId
                ? `/custom-solutions/projects/${projectId}`
                : "/custom-solutions"
            }

            className="font-bold text-[#9b7e1d]"
          >

            Return to your project conversation.

          </Link>

        </p>

      </div>

    </main>
  );
}


/*
 * ==========================================================
 * SUMMARY ROW
 * ==========================================================
 */

function SummaryRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {

  return (

    <div className="flex items-center justify-between gap-4 text-sm">

      <p className="text-neutral-500">

        {
          label
        }

      </p>


      <p className="font-bold text-neutral-800">

        {
          value
        }

      </p>

    </div>
  );
}


/*
 * ==========================================================
 * LOADING
 * ==========================================================
 */

function LoadingState() {

  return (

    <main className="min-h-screen bg-[#faf9f5]">

      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8">

        <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />


        <div className="mt-7 h-56 animate-pulse rounded-3xl bg-neutral-100" />


        <div className="mt-6 h-40 animate-pulse rounded-3xl bg-neutral-100" />


        <div className="mt-6 h-80 animate-pulse rounded-3xl bg-neutral-100" />


        <div className="mt-6 h-56 animate-pulse rounded-3xl bg-neutral-100" />

      </div>

    </main>
  );
}