import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  FileText,
  Plus,
  Send,
  Trash2,
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
} from "../../../hooks/useAuth";

import {
  createCustomQuotation,
  sendCustomQuotation,
} from "../../../services/customQuotation.service";

import {
  subscribeCustomProject,
} from "../../../services/customProject.service";

import type {
  CustomProject,
  CustomQuotationItem,
} from "../../../types/customProject";


/*
 * ==========================================================
 * LINE ITEM
 * ==========================================================
 */

interface DraftItem {

  id:
    string;

  description:
    string;

  quantity:
    number;

  unitPrice:
    number;
}


/*
 * ==========================================================
 * DEFAULT ITEM
 * ==========================================================
 */

function createItem(): DraftItem {

  return {

    id:
      `item-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

    description:
      "",

    quantity:
      1,

    unitPrice:
      0,
  };
}


/*
 * ==========================================================
 * SAFE STRING
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


/*
 * ==========================================================
 * NUMBER
 * ==========================================================
 */

function safeNumber(
  value: string | number,
): number {

  const parsed =
    typeof value === "number"
      ? value
      : Number(value);


  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


/*
 * ==========================================================
 * ADMIN QUOTATION
 * ==========================================================
 */

export default function CustomQuotation() {

  const {
    projectId,
  } =
    useParams<{
      projectId:
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
    project,
    setProject,
  ] =
    useState<
      CustomProject | null
    >(null);


  const [
    loadingProject,
    setLoadingProject,
  ] =
    useState(
      true,
    );


  const [
    items,
    setItems,
  ] =
    useState<DraftItem[]>([
      createItem(),
    ]);


  const [
    discount,
    setDiscount,
  ] =
    useState(
      "0",
    );


  const [
    taxRate,
    setTaxRate,
  ] =
    useState(
      "18",
    );


  const [
    validityDays,
    setValidityDays,
  ] =
    useState(
      "7",
    );


  const [
    estimatedDelivery,
    setEstimatedDelivery,
  ] =
    useState(
      "7-14 working days",
    );


  const [
    paymentTerms,
    setPaymentTerms,
  ] =
    useState(
      "100% payment before development begins.",
    );


  const [
    notes,
    setNotes,
  ] =
    useState(
      "",
    );


  const [
    paymentRequired,
    setPaymentRequired,
  ] =
    useState(
      true,
    );


  const [
    submitting,
    setSubmitting,
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
    success,
    setSuccess,
  ] =
    useState(
      "",
    );


  /*
   * ========================================================
   * PROJECT REALTIME
   * ========================================================
   */

  useEffect(
    () => {

      if (
        !projectId
      ) {

        setLoadingProject(
          false,
        );

        setError(
          "Project ID is missing.",
        );

        return;
      }


      setLoadingProject(
        true,
      );


      const unsubscribe =
        subscribeCustomProject(

          projectId,

          (
            nextProject,
          ) => {

            setProject(
              nextProject,
            );


            setLoadingProject(
              false,
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Quotation project listener failed:",
              listenerError,
            );


            setError(
              listenerError instanceof Error
                ? listenerError.message
                : "Unable to load the project.",
            );


            setLoadingProject(
              false,
            );

          },
        );


      return () =>
        unsubscribe();

    },
    [
      projectId,
    ],
  );


  /*
   * ========================================================
   * CALCULATIONS
   * ========================================================
   */

  const calculatedItems =
    useMemo(
      (): CustomQuotationItem[] =>
        items.map(
          (
            item,
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
                item.id,

              description:
                item.description,

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
        ),

      [
        items,
      ],
    );


  const subtotal =
    useMemo(
      () =>
        calculatedItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.total,
          0,
        ),

      [
        calculatedItems,
      ],
    );


  const discountAmount =
    useMemo(
      () => {

        const value =
          safeNumber(
            discount,
          );


        return Math.min(
          Math.max(
            0,
            value,
          ),
          subtotal,
        );

      },
      [
        discount,
        subtotal,
      ],
    );


  const taxableAmount =
    Math.max(
      0,
      subtotal -
        discountAmount,
    );


  const taxAmount =
    taxableAmount *
    (
      Math.max(
        0,
        safeNumber(
          taxRate,
        ),
      ) /
      100
    );


  const total =
    taxableAmount +
    taxAmount;


  /*
   * ========================================================
   * UPDATE ITEM
   * ========================================================
   */

  function updateItem(
    id: string,
    field:
      keyof DraftItem,
    value:
      string | number,
  ) {

    setItems(
      (
        current,
      ) =>
        current.map(
          (
            item,
          ) =>
            item.id ===
            id
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item,
        ),
    );
  }


  /*
   * ========================================================
   * ADD ITEM
   * ========================================================
   */

  function addItem() {

    setItems(
      (
        current,
      ) => [
        ...current,
        createItem(),
      ],
    );
  }


  /*
   * ========================================================
   * REMOVE ITEM
   * ========================================================
   */

  function removeItem(
    id: string,
  ) {

    setItems(
      (
        current,
      ) => {

        if (
          current.length ===
          1
        ) {

          return [
            createItem(),
          ];
        }


        return current.filter(
          (
            item,
          ) =>
            item.id !==
            id,
        );
      },
    );
  }


  /*
   * ========================================================
   * SUBMIT QUOTATION
   * ========================================================
   */

  async function handleSubmit() {

    setError(
      "",
    );

    setSuccess(
      "",
    );


    if (
      !project
    ) {

      setError(
        "Project could not be loaded.",
      );

      return;
    }


    if (
      !user
    ) {

      setError(
        "Admin authentication is required.",
      );

      return;
    }


    const validItems =
      calculatedItems.filter(
        (
          item,
        ) =>
          item.description.trim() &&
          item.quantity > 0 &&
          item.unitPrice >= 0,
      );


    if (
      validItems.length ===
      0
    ) {

      setError(
        "Add at least one valid quotation item.",
      );

      return;
    }


    if (
      total <=
      0
    ) {

      setError(
        "Quotation total must be greater than zero.",
      );

      return;
    }


    try {

      setSubmitting(
        true,
      );


      const quotationId =
        await createCustomQuotation(
          {

            project,

            items:
              validItems,

            discount:
              discountAmount,

            taxRate:
              safeNumber(
                taxRate,
              ),

            validityDays:
              Math.max(
                1,
                Math.floor(
                  safeNumber(
                    validityDays,
                  ),
                ),
              ),

            estimatedDelivery:
              estimatedDelivery.trim(),

            paymentTerms:
              paymentTerms.trim(),

            notes:
              notes.trim(),

            paymentRequired,

            createdBy:
              user.uid,

          },
        );


      await sendCustomQuotation(
        project.id,
        quotationId,
      );


      setSuccess(
        "Quotation created and sent successfully.",
      );


      window.setTimeout(
        () => {

          navigate(
            `/admin/custom-solutions/projects/${project.id}`,
          );

        },
        700,
      );

    } catch (
      quotationError
    ) {

      console.error(
        "Quotation creation failed:",
        quotationError,
      );


      setError(
        quotationError instanceof Error
          ? quotationError.message
          : "Unable to create quotation.",
      );

    } finally {

      setSubmitting(
        false,
      );
    }
  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    authLoading ||
    loadingProject
  ) {

    return (
      <LoadingState />
    );
  }


  /*
   * ========================================================
   * PROJECT NOT FOUND
   * ========================================================
   */

  if (
    !project
  ) {

    return (

      <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-sm">

        <FileText
          size={40}
          className="mx-auto text-[#D4AF37]"
        />


        <h1 className="mt-5 text-2xl font-black text-neutral-950">
          Project not found
        </h1>


        <Link
          to="/admin/custom-solutions"

          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-white"
        >

          <ArrowLeft
            size={15}
          />

          Back to Projects

        </Link>

      </div>
    );
  }


  /*
   * ========================================================
   * SAFE PROJECT VALUES
   * ========================================================
   */

  const customerName =
    safeString(
      project.customerName,
      "Customer",
    );


  const customerEmail =
    safeString(
      project.customerEmail,
      "",
    );


  const projectTitle =
    safeString(
      project.title,
      "Custom Project",
    );


  const projectCurrency =
    safeString(
      project.currency,
      "INR",
    );


  /*
   * ========================================================
   * MAIN
   * ========================================================
   */

  return (

    <div className="mx-auto max-w-7xl space-y-6">

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

        <div>

          <Link
            to={
              `/admin/custom-solutions/projects/${project.id}`
            }

            className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-[#D4AF37]"
          >

            <ArrowLeft
              size={15}
            />

            Back to Project

          </Link>


          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Quotation
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Create Quotation
          </h1>


          <p className="mt-2 text-sm text-neutral-500">

            {
              projectTitle
            }

          </p>

        </div>


        <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4">

          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            Customer
          </p>


          <p className="mt-1 font-black text-neutral-900">

            {
              customerName
            }

          </p>


          <p className="mt-1 break-all text-xs text-neutral-400">

            {
              customerEmail
            }

          </p>

        </div>

      </div>


      {/* ====================================================
          SUCCESS / ERROR
      ===================================================== */}

      {error && (

        <div
          role="alert"

          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        >

          {
            error
          }

        </div>

      )}


      {success && (

        <div
          role="status"

          className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700"
        >

          <CheckCircle2
            size={18}
          />

          {
            success
          }

        </div>

      )}


      {/* ====================================================
          MAIN GRID
      ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">

        {/* ==================================================
            EDITOR
        =================================================== */}

        <div className="space-y-6">

          {/* =================================================
              LINE ITEMS
          ================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                  01
                </p>


                <h2 className="mt-2 text-xl font-black text-neutral-950">
                  Quotation items
                </h2>


                <p className="mt-1 text-sm text-neutral-500">
                  Add the services, development work or products included in this quotation.
                </p>

              </div>


              <button
                type="button"

                onClick={
                  addItem
                }

                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-white hover:bg-[#b99622]"
              >

                <Plus
                  size={15}
                />

                Add Item

              </button>

            </div>


            <div className="mt-7 space-y-4">

              {
                items.map(
                  (
                    item,
                    index,
                  ) => (

                    <div
                      key={
                        item.id
                      }

                      className="rounded-2xl border border-neutral-200 p-4"
                    >

                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_100px_140px_auto] md:items-end">

                        <div>

                          <label
                            htmlFor={
                              `item-description-${item.id}`
                            }

                            className="mb-2 block text-xs font-bold text-neutral-600"
                          >

                            Description

                          </label>


                          <input
                            id={
                              `item-description-${item.id}`
                            }

                            type="text"

                            value={
                              item.description
                            }

                            onChange={
                              (
                                event,
                              ) =>
                                updateItem(
                                  item.id,
                                  "description",
                                  event.target.value,
                                )
                            }

                            placeholder={
                              index === 0
                                ? "Website development"
                                : "Additional development / service"
                            }

                            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                          />

                        </div>


                        <div>

                          <label
                            htmlFor={
                              `item-quantity-${item.id}`
                            }

                            className="mb-2 block text-xs font-bold text-neutral-600"
                          >

                            Qty

                          </label>


                          <input
                            id={
                              `item-quantity-${item.id}`
                            }

                            type="number"

                            min="1"

                            step="1"

                            value={
                              item.quantity
                            }

                            onChange={
                              (
                                event,
                              ) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  Math.max(
                                    0,
                                    safeNumber(
                                      event.target.value,
                                    ),
                                  ),
                                )
                            }

                            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                          />

                        </div>


                        <div>

                          <label
                            htmlFor={
                              `item-price-${item.id}`
                            }

                            className="mb-2 block text-xs font-bold text-neutral-600"
                          >

                            Unit Price

                          </label>


                          <div className="relative">

                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">

                              {
                                projectCurrency
                              }

                            </span>


                            <input
                              id={
                                `item-price-${item.id}`
                              }

                              type="number"

                              min="0"

                              step="0.01"

                              value={
                                item.unitPrice
                              }

                              onChange={
                                (
                                  event,
                                ) =>
                                  updateItem(
                                    item.id,
                                    "unitPrice",
                                    Math.max(
                                      0,
                                      safeNumber(
                                        event.target.value,
                                      ),
                                    ),
                                  )
                              }

                              className="w-full rounded-xl border border-neutral-200 py-3 pl-12 pr-4 text-sm outline-none focus:border-[#D4AF37]"
                            />

                          </div>

                        </div>


                        <button
                          type="button"

                          onClick={() =>
                            removeItem(
                              item.id,
                            )
                          }

                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"

                          aria-label={`Remove quotation item ${index + 1}`}
                        >

                          <Trash2
                            size={17}
                          />

                        </button>

                      </div>


                      <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3">

                        <p className="text-sm font-black text-neutral-900">

                          Item Total:

                          {" "}

                          {
                            projectCurrency
                          }

                          {" "}

                          {
                            (
                              item.quantity *
                              item.unitPrice
                            ).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                              },
                            )
                          }

                        </p>

                      </div>

                    </div>

                  ),
                )
              }

            </div>

          </section>


          {/* =================================================
              PRICING
          ================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              02
            </p>


            <h2 className="mt-2 text-xl font-black text-neutral-950">
              Pricing
            </h2>


            <div className="mt-7 grid gap-5 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="quotation-discount"

                  className="mb-2 block text-sm font-bold text-neutral-800"
                >

                  Discount

                </label>


                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">

                    {
                      projectCurrency
                    }

                  </span>


                  <input
                    id="quotation-discount"

                    type="number"

                    min="0"

                    step="0.01"

                    value={
                      discount
                    }

                    onChange={
                      (
                        event,
                      ) =>
                        setDiscount(
                          event.target.value,
                        )
                    }

                    className="w-full rounded-2xl border border-neutral-200 py-4 pl-12 pr-4 text-sm outline-none focus:border-[#D4AF37]"
                  />

                </div>

              </div>


              <div>

                <label
                  htmlFor="quotation-tax"

                  className="mb-2 block text-sm font-bold text-neutral-800"
                >

                  GST / Tax Rate

                </label>


                <div className="relative">

                  <input
                    id="quotation-tax"

                    type="number"

                    min="0"

                    step="0.01"

                    value={
                      taxRate
                    }

                    onChange={
                      (
                        event,
                      ) =>
                        setTaxRate(
                          event.target.value,
                        )
                    }

                    className="w-full rounded-2xl border border-neutral-200 px-5 py-4 pr-12 text-sm outline-none focus:border-[#D4AF37]"
                  />


                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    %
                  </span>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              TERMS
          ================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              03
            </p>


            <h2 className="mt-2 text-xl font-black text-neutral-950">
              Terms & delivery
            </h2>


            <div className="mt-7 space-y-5">

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="quotation-validity"

                    className="mb-2 block text-sm font-bold text-neutral-800"
                  >

                    Validity

                  </label>


                  <div className="relative">

                    <input
                      id="quotation-validity"

                      type="number"

                      min="1"

                      step="1"

                      value={
                        validityDays
                      }

                      onChange={
                        (
                          event,
                        ) =>
                          setValidityDays(
                            event.target.value,
                          )
                      }

                      className="w-full rounded-2xl border border-neutral-200 px-5 py-4 pr-20 text-sm outline-none focus:border-[#D4AF37]"
                    />


                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      days
                    </span>

                  </div>

                </div>


                <div>

                  <label
                    htmlFor="quotation-delivery"

                    className="mb-2 block text-sm font-bold text-neutral-800"
                  >

                    Estimated Delivery

                  </label>


                  <input
                    id="quotation-delivery"

                    type="text"

                    value={
                      estimatedDelivery
                    }

                    onChange={
                      (
                        event,
                      ) =>
                        setEstimatedDelivery(
                          event.target.value,
                        )
                    }

                    placeholder="e.g. 15 working days"

                    className="w-full rounded-2xl border border-neutral-200 px-5 py-4 text-sm outline-none focus:border-[#D4AF37]"
                  />

                </div>

              </div>


              <div>

                <label
                  htmlFor="quotation-payment-terms"

                  className="mb-2 block text-sm font-bold text-neutral-800"
                >

                  Payment Terms

                </label>


                <textarea
                  id="quotation-payment-terms"

                  rows={4}

                  value={
                    paymentTerms
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      setPaymentTerms(
                        event.target.value,
                      )
                  }

                  className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-4 text-sm leading-6 outline-none focus:border-[#D4AF37]"
                />

              </div>


              <div>

                <label
                  htmlFor="quotation-notes"

                  className="mb-2 block text-sm font-bold text-neutral-800"
                >

                  Notes

                </label>


                <textarea
                  id="quotation-notes"

                  rows={4}

                  value={
                    notes
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      setNotes(
                        event.target.value,
                      )
                  }

                  placeholder="Additional notes, exclusions or project-specific information..."

                  className="w-full resize-none rounded-2xl border border-neutral-200 px-5 py-4 text-sm leading-6 outline-none focus:border-[#D4AF37]"
                />

              </div>


              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4">

                <input
                  type="checkbox"

                  checked={
                    paymentRequired
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      setPaymentRequired(
                        event.target.checked,
                      )
                  }

                  className="mt-1 h-4 w-4 accent-[#D4AF37]"
                />


                <span>

                  <span className="block text-sm font-black text-neutral-900">
                    Require payment after acceptance
                  </span>


                  <span className="mt-1 block text-xs leading-5 text-neutral-500">
                    Customer will see the payment step after accepting this quotation.
                  </span>

                </span>

              </label>

            </div>

          </section>


          {/* =================================================
              SEND
          ================================================== */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="max-w-xl text-xs leading-5 text-neutral-400">
              Sending this quotation will make it visible to the customer.
            </p>


            <button
              type="button"

              onClick={() =>
                void handleSubmit()
              }

              disabled={
                submitting ||
                total <= 0
              }

              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-8 py-4 text-sm font-black text-white hover:bg-[#b99622] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >

              <Send
                size={16}
              />

              {
                submitting
                  ? "Sending..."
                  : "Create & Send Quotation"
              }

            </button>

          </div>

        </div>


        {/* ==================================================
            LIVE PREVIEW
        =================================================== */}

        <aside className="h-fit xl:sticky xl:top-6">

          <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

            <div className="border-b border-neutral-100 bg-neutral-950 px-6 py-5">

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                Preview
              </p>


              <h2 className="mt-1 text-xl font-black text-white">
                Quotation
              </h2>

            </div>


            <div className="p-6">

              {/* Customer */}

              <div className="border-b border-neutral-100 pb-5">

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Prepared for
                </p>


                <p className="mt-2 font-black text-neutral-950">

                  {
                    customerName
                  }

                </p>


                <p className="mt-1 break-all text-xs text-neutral-400">

                  {
                    customerEmail
                  }

                </p>

              </div>


              {/* Project */}

              <div className="border-b border-neutral-100 py-5">

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Project
                </p>


                <p className="mt-2 font-black text-neutral-950">

                  {
                    projectTitle
                  }

                </p>

              </div>


              {/* Items */}

              <div className="border-b border-neutral-100 py-5">

                <div className="space-y-4">

                  {
                    calculatedItems.map(
                      (
                        item,
                      ) => (

                        <div
                          key={
                            item.id
                          }

                          className="flex items-start justify-between gap-4"
                        >

                          <div className="min-w-0">

                            <p className="break-words text-sm font-bold text-neutral-800">

                              {
                                item.description ||
                                "Untitled item"
                              }

                            </p>


                            <p className="mt-1 text-xs text-neutral-400">

                              {
                                item.quantity
                              }

                              {" × "}

                              {
                                projectCurrency
                              }

                              {" "}

                              {
                                item.unitPrice.toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                  },
                                )
                              }

                            </p>

                          </div>


                          <p className="shrink-0 text-sm font-black text-neutral-900">

                            {
                              projectCurrency
                            }

                            {" "}

                            {
                              item.total.toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                },
                              )
                            }

                          </p>

                        </div>

                      ),
                    )
                  }

                </div>

              </div>


              {/* Totals */}

              <div className="space-y-3 py-5">

                <SummaryRow
                  label="Subtotal"
                  value={`${projectCurrency} ${subtotal.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    },
                  )}`}
                />


                <SummaryRow
                  label="Discount"
                  value={`− ${projectCurrency} ${discountAmount.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    },
                  )}`}
                />


                <SummaryRow
                  label={`Tax (${safeNumber(taxRate)}%)`}
                  value={`${projectCurrency} ${taxAmount.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    },
                  )}`}
                />


                <div className="flex items-end justify-between border-t border-neutral-200 pt-4">

                  <p className="font-black text-neutral-950">
                    Total
                  </p>


                  <p className="text-2xl font-black text-[#9b7e1d]">

                    {
                      projectCurrency
                    }

                    {" "}

                    {
                      total.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                        },
                      )
                    }

                  </p>

                </div>

              </div>


              {/* Delivery */}

              <div className="rounded-2xl bg-neutral-50 p-4">

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Estimated Delivery
                </p>


                <p className="mt-1 text-sm font-bold text-neutral-800">

                  {
                    estimatedDelivery ||
                    "To be discussed"
                  }

                </p>

              </div>


              {/* Payment */}

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">

                <Calculator
                  size={18}
                  className="mt-0.5 shrink-0 text-[#D4AF37]"
                />


                <div>

                  <p className="text-xs font-black text-neutral-900">

                    {
                      paymentRequired
                        ? "Payment required after acceptance"
                        : "Payment not required"
                    }

                  </p>


                  <p className="mt-1 text-[10px] leading-5 text-neutral-500">

                    Valid for{" "}
                    {
                      Math.max(
                        1,
                        Math.floor(
                          safeNumber(
                            validityDays,
                          ),
                        ),
                      )
                    }{" "}
                    days.

                  </p>

                </div>

              </div>


              {/* Note */}

              {notes.trim() && (

                <div className="mt-5">

                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Notes
                  </p>


                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-neutral-500">

                    {
                      notes
                    }

                  </p>

                </div>

              )}

            </div>

          </section>

        </aside>

      </div>

    </div>
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

    <div className="space-y-6">

      <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />


      <div className="h-10 w-80 animate-pulse rounded bg-neutral-200" />


      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">

        <div className="space-y-6">

          <div className="h-72 animate-pulse rounded-3xl bg-neutral-100" />

          <div className="h-48 animate-pulse rounded-3xl bg-neutral-100" />

          <div className="h-64 animate-pulse rounded-3xl bg-neutral-100" />

        </div>


        <div className="h-[650px] animate-pulse rounded-3xl bg-neutral-100" />

      </div>

    </div>
  );
}