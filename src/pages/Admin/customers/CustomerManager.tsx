import {
  Check,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCustomers,
  type CustomerProfile,
} from "../../../services/customer.service";

import {
  getAllOrders,
} from "../../../services/order.service";

import {
  sendCustomerEmail,
} from "../../../services/contact.service";

import type {
  Order,
} from "../../../types/order";


/*
 * ==========================================================
 * PRICE
 * ==========================================================
 */

function formatPrice(
  amount: number,
): string {

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    },
  ).format(
    amount,
  );
}


/*
 * ==========================================================
 * DATE
 * ==========================================================
 */

function formatDate(
  value: unknown,
): string {

  if (!value) {
    return "—";
  }


  try {

    if (
      typeof value ===
        "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (
        value as {
          toDate?: unknown;
        }
      ).toDate ===
        "function"
    ) {

      return (
        value as {
          toDate: () => Date;
        }
      )
        .toDate()
        .toLocaleDateString(
          "en-IN",
          {
            day:
              "numeric",

            month:
              "short",

            year:
              "numeric",
          },
        );

    }


    const date =
      new Date(
        value as
          | string
          | number
          | Date,
      );


    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {

      return "—";

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day:
          "numeric",

        month:
          "short",

        year:
          "numeric",
      },
    );

  } catch {

    return "—";

  }
}


/*
 * ==========================================================
 * CUSTOMER DETAILS
 * ==========================================================
 */

function CustomerDetails({
  customer,
  orders,
  onClose,
  onEmail,
}: {
  customer:
    CustomerProfile;

  orders:
    Order[];

  onClose:
    () => void;

  onEmail:
    (
      customer:
        CustomerProfile,
    ) => void;
}) {

  const customerOrders =
    orders.filter(
      (
        order,
      ) =>
        order.userId ===
        customer.uid,
    );


  const totalSpent =
    customerOrders.reduce(
      (
        total,
        order,
      ) =>
        total +
        (
          order.status ===
          "cancelled"
            ? 0
            : order.total
        ),
      0,
    );


  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"

      role="dialog"

      aria-modal="true"

      aria-label="Customer details"
    >

      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Customer
            </p>


            <h2 className="mt-1 text-xl font-black text-neutral-950">

              {
                customer.name
              }

            </h2>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"

            aria-label="Close customer details"
          >

            <X
              size={18}
            />

          </button>

        </div>


        <div className="overflow-y-auto p-6 sm:p-8">

          {/* =================================================
              PROFILE
          ================================================== */}

          <div className="rounded-3xl bg-[#faf9f5] p-6">

            <div className="flex items-center justify-between gap-4">

              <div className="flex min-w-0 items-center gap-4">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#D4AF37]/10 text-xl font-black text-[#D4AF37]">

                  {customer.photoURL ? (

                    <img
                      src={
                        customer.photoURL
                      }

                      alt={
                        customer.name
                      }

                      className="h-full w-full object-cover"
                    />

                  ) : (

                    customer.name
                      .charAt(
                        0,
                      )
                      .toUpperCase()

                  )}

                </div>


                <div className="min-w-0">

                  <h3 className="text-xl font-black text-neutral-950">

                    {
                      customer.name
                    }

                  </h3>


                  <p className="mt-1 truncate text-sm text-neutral-500">

                    {
                      customer.email
                    }

                  </p>

                </div>

              </div>


              {customer.email && (

                <button
                  type="button"

                  onClick={() =>
                    onEmail(
                      customer,
                    )
                  }

                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#b99622]"
                >

                  <Mail
                    size={14}
                  />

                  Email

                </button>

              )}

            </div>


            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl bg-white p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Phone
                </p>


                <p className="mt-2 text-sm font-semibold text-neutral-800">

                  {
                    customer.phone ||
                    "Not provided"
                  }

                </p>

              </div>


              <div className="rounded-2xl bg-white p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Joined
                </p>


                <p className="mt-2 text-sm font-semibold text-neutral-800">

                  {
                    formatDate(
                      customer.createdAt,
                    )
                  }

                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              STATS
          ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-neutral-200 p-5">

              <ShoppingBag
                size={19}
                className="text-[#D4AF37]"
              />


              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
                Orders
              </p>


              <p className="mt-1 text-2xl font-black">

                {
                  customerOrders.length
                }

              </p>

            </div>


            <div className="rounded-2xl border border-neutral-200 p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Completed
              </p>


              <p className="mt-3 text-2xl font-black text-green-700">

                {
                  customerOrders.filter(
                    (
                      order,
                    ) =>
                      order.status ===
                      "delivered",
                  ).length
                }

              </p>

            </div>


            <div className="rounded-2xl border border-neutral-200 p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Total Spent
              </p>


              <p className="mt-3 text-xl font-black text-[#D4AF37]">

                {
                  formatPrice(
                    totalSpent,
                  )
                }

              </p>

            </div>

          </div>


          {/* =================================================
              ORDER HISTORY
          ================================================== */}

          <section className="mt-6 rounded-2xl border border-neutral-200">

            <div className="border-b border-neutral-200 px-5 py-4">

              <h3 className="font-black text-neutral-950">
                Order History
              </h3>

            </div>


            {
              customerOrders.length ===
              0
                ? (

                    <div className="px-5 py-10 text-center">

                      <p className="text-sm text-neutral-500">

                        No orders found for this customer.

                      </p>

                    </div>

                  )
                : (

                    <div className="divide-y divide-neutral-100">

                      {
                        customerOrders
                          .slice(
                            0,
                            10,
                          )
                          .map(
                            (
                              order,
                            ) => (

                              <div
                                key={
                                  order.id
                                }

                                className="flex items-center justify-between gap-4 px-5 py-4"
                              >

                                <div>

                                  <p className="text-sm font-bold text-neutral-900">

                                    #

                                    {
                                      order.id.slice(
                                        0,
                                        10,
                                      )
                                    }

                                  </p>


                                  <p className="mt-1 text-xs text-neutral-400">

                                    {
                                      formatDate(
                                        order.createdAt,
                                      )
                                    }

                                  </p>

                                </div>


                                <div className="text-right">

                                  <p className="text-sm font-black text-neutral-900">

                                    {
                                      formatPrice(
                                        order.total,
                                      )
                                    }

                                  </p>


                                  <span className="text-[10px] font-bold capitalize text-neutral-500">

                                    {
                                      order.status
                                    }

                                  </span>

                                </div>

                              </div>

                            ),
                          )
                      }

                    </div>

                  )
            }

          </section>

        </div>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * EMAIL COMPOSER
 * ==========================================================
 */

function EmailComposer({
  customers,
  onClose,
}: {
  customers:
    CustomerProfile[];

  onClose:
    () => void;
}) {

  const [
    subject,
    setSubject,
  ] =
    useState("");


  const [
    message,
    setMessage,
  ] =
    useState("");


  const [
    sending,
    setSending,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    resultMessage,
    setResultMessage,
  ] =
    useState("");


  const validCustomers =
    useMemo(
      () =>
        customers.filter(
          (
            customer,
          ) =>
            typeof customer.email ===
              "string" &&
            customer.email.trim()
              .length > 0,
        ),

      [
        customers,
      ],
    );


  async function handleSend() {

    const cleanSubject =
      subject.trim();


    const cleanMessage =
      message.trim();


    if (
      validCustomers.length ===
      0
    ) {

      setError(
        "None of the selected customers has an email address.",
      );

      return;
    }


    if (!cleanSubject) {

      setError(
        "Please enter an email subject.",
      );

      return;
    }


    if (!cleanMessage) {

      setError(
        "Please enter an email message.",
      );

      return;
    }


    try {

      setSending(
        true,
      );

      setError(
        "",
      );

      setResultMessage(
        "",
      );


      /*
       * Send separately to each customer.
       *
       * This avoids exposing one customer's email address
       * to another customer.
       */

      const results =
        await Promise.allSettled(

          validCustomers.map(
            (
              customer,
            ) =>
              sendCustomerEmail(
                customer.email,
                customer.name,
                cleanSubject,
                cleanMessage,
              ),
          ),

        );


      const successful =
        results.filter(
          (
            result,
          ) =>
            result.status ===
            "fulfilled",
        ).length;


      const failed =
        results.length -
        successful;


      if (
        failed === 0
      ) {

        setResultMessage(
          `Email sent successfully to ${successful} customer${successful === 1 ? "" : "s"}.`,
        );


        /*
         * Give the success message a moment before closing.
         */

        window.setTimeout(
          () => {
            onClose();
          },
          900,
        );

      } else if (
        successful > 0
      ) {

        setResultMessage(
          `Email sent to ${successful} customer${successful === 1 ? "" : "s"}, but ${failed} failed.`,
        );

      } else {

        setError(
          "The email could not be sent to any selected customer.",
        );

      }

    } catch (
      sendError
    ) {

      console.error(
        "Customer email operation failed:",
        sendError,
      );


      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send customer email.",
      );

    } finally {

      setSending(
        false,
      );

    }
  }


  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"

      role="dialog"

      aria-modal="true"

      aria-label="Send customer email"
    >

      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Customer Communication
            </p>


            <h2 className="mt-1 text-xl font-black text-neutral-950">
              Send Email
            </h2>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            disabled={
              sending
            }

            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"

            aria-label="Close email composer"
          >

            <X
              size={18}
            />

          </button>

        </div>


        {/* =================================================
            CONTENT
        ================================================== */}

        <div className="overflow-y-auto p-6 sm:p-8">

          {/* Recipients */}

          <div className="rounded-2xl bg-[#faf9f5] p-5">

            <div className="flex items-center gap-3">

              <Users
                size={19}
                className="text-[#D4AF37]"
              />


              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Recipients
                </p>


                <p className="mt-1 text-sm font-black text-neutral-950">

                  {
                    validCustomers.length
                  }

                  {" "}

                  customer
                  {
                    validCustomers.length ===
                    1
                      ? ""
                      : "s"
                  }

                </p>

              </div>

            </div>


            <div className="mt-4 max-h-28 overflow-y-auto">

              <div className="flex flex-wrap gap-2">

                {
                  validCustomers.map(
                    (
                      customer,
                    ) => (

                      <span
                        key={
                          customer.uid
                        }

                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700"
                      >

                        {
                          customer.name
                        }

                      </span>

                    ),
                  )
                }

              </div>

            </div>

          </div>


          {/* =================================================
              SUBJECT
          ================================================== */}

          <div className="mt-6">

            <label
              htmlFor="customer-email-subject"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Subject
            </label>


            <input
              id="customer-email-subject"

              type="text"

              value={
                subject
              }

              onChange={(
                event,
              ) =>
                setSubject(
                  event.target.value,
                )
              }

              disabled={
                sending
              }

              placeholder="Enter email subject"

              className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
            />

          </div>


          {/* =================================================
              MESSAGE
          ================================================== */}

          <div className="mt-5">

            <label
              htmlFor="customer-email-message"
              className="mb-2 block text-sm font-bold text-neutral-800"
            >
              Message
            </label>


            <textarea
              id="customer-email-message"

              rows={8}

              value={
                message
              }

              onChange={(
                event,
              ) =>
                setMessage(
                  event.target.value,
                )
              }

              disabled={
                sending
              }

              placeholder="Write your message to the customer..."

              className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm leading-6 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
            />

          </div>


          {/* =================================================
              ERROR
          ================================================== */}

          {error && (

            <div
              role="alert"

              className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >

              {
                error
              }

            </div>

          )}


          {/* =================================================
              SUCCESS
          ================================================== */}

          {resultMessage && (

            <div
              role="status"

              className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
            >

              {
                resultMessage
              }

            </div>

          )}


          {/* =================================================
              ACTIONS
          ================================================== */}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"

              onClick={
                onClose
              }

              disabled={
                sending
              }

              className="rounded-full border border-neutral-200 px-6 py-3.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >

              Cancel

            </button>


            <button
              type="button"

              onClick={() =>
                void handleSend()
              }

              disabled={
                sending ||
                validCustomers.length ===
                  0
              }

              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >

              <Send
                size={16}
              />

              {
                sending
                  ? "Sending..."
                  : "Send Email"
              }

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * CUSTOMER MANAGER
 * ==========================================================
 */

export default function CustomerManager() {

  const [
    customers,
    setCustomers,
  ] =
    useState<
      CustomerProfile[]
    >([]);


  const [
    orders,
    setOrders,
  ] =
    useState<
      Order[]
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    error,
    setError,
  ] =
    useState(
      "",
    );


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  const [
    selectedCustomer,
    setSelectedCustomer,
  ] =
    useState<
      CustomerProfile | null
    >(
      null,
    );


  /*
   * ========================================================
   * EMAIL SELECTION
   * ========================================================
   */

  const [
    selectedCustomerIds,
    setSelectedCustomerIds,
  ] =
    useState<
      Set<string>
    >(
      () =>
        new Set(),
    );


  const [
    emailCustomers,
    setEmailCustomers,
  ] =
    useState<
      CustomerProfile[]
    >([]);


  /*
   * ========================================================
   * LOAD CUSTOMERS + ORDERS
   * ========================================================
   */

  async function loadCustomers() {

    try {

      setLoading(
        true,
      );

      setError(
        "",
      );


      const [
        customerData,
        orderData,
      ] =
        await Promise.all([
          getCustomers(),
          getAllOrders(),
        ]);


      setCustomers(
        customerData,
      );


      setOrders(
        orderData,
      );


      /*
       * Remove selections for customers that no longer exist.
       */

      setSelectedCustomerIds(
        (
          current,
        ) => {

          const validIds =
            new Set(
              customerData.map(
                (
                  customer,
                ) =>
                  customer.uid,
              ),
            );


          return new Set(
            Array.from(
              current,
            ).filter(
              (
                id,
              ) =>
                validIds.has(
                  id,
                ),
            ),
          );

        },
      );

    } catch (
      err
    ) {

      console.error(
        "Unable to load customers:",
        err,
      );


      setError(
        "Unable to load customers. Check your Firestore rules.",
      );

    } finally {

      setLoading(
        false,
      );

    }
  }


  useEffect(
    () => {

      void loadCustomers();

    },
    [],
  );


  /*
   * ========================================================
   * SEARCH
   * ========================================================
   */

  const filteredCustomers =
    useMemo(
      () => {

        const queryText =
          search
            .trim()
            .toLowerCase();


        return customers.filter(
          (
            customer,
          ) =>
            queryText ===
              "" ||

            customer.name
              .toLowerCase()
              .includes(
                queryText,
              ) ||

            customer.email
              .toLowerCase()
              .includes(
                queryText,
              ) ||

            (
              customer.phone ||
              ""
            )
              .toLowerCase()
              .includes(
                queryText,
              ),
        );

      },
      [
        customers,
        search,
      ],
    );


  /*
   * ========================================================
   * CUSTOMER STATISTICS
   * ========================================================
   */

  const totalSpent =
    orders.reduce(
      (
        total,
        order,
      ) =>
        order.status ===
          "cancelled"
          ? total
          : total +
            order.total,

      0,
    );


  const activeCustomers =
    new Set(
      orders
        .filter(
          (
            order,
          ) =>
            order.status !==
              "cancelled",
        )
        .map(
          (
            order,
          ) =>
            order.userId,
        ),
    ).size;


  /*
   * ========================================================
   * SELECTED CUSTOMERS
   * ========================================================
   */

  const selectedCustomers =
    useMemo(
      () => {

        const selected =
          new Set(
            selectedCustomerIds,
          );


        return customers.filter(
          (
            customer,
          ) =>
            selected.has(
              customer.uid,
            ),
        );

      },
      [
        customers,
        selectedCustomerIds,
      ],
    );


  /*
   * ========================================================
   * SELECTED COUNT
   * ========================================================
   */

  const selectedCount =
    selectedCustomerIds.size;


  /*
   * ========================================================
   * ALL FILTERED SELECTED
   * ========================================================
   */

  const allFilteredSelected =
    filteredCustomers.length >
      0 &&
    filteredCustomers.every(
      (
        customer,
      ) =>
        selectedCustomerIds.has(
          customer.uid,
        ),
    );


  /*
   * ========================================================
   * TOGGLE CUSTOMER
   * ========================================================
   */

  function toggleCustomer(
    customerId: string,
  ) {

    setSelectedCustomerIds(
      (
        current,
      ) => {

        const next =
          new Set(
            current,
          );


        if (
          next.has(
            customerId,
          )
        ) {

          next.delete(
            customerId,
          );

        } else {

          next.add(
            customerId,
          );

        }


        return next;

      },
    );

  }


  /*
   * ========================================================
   * SELECT / DESELECT ALL FILTERED
   * ========================================================
   */

  function toggleSelectAll() {

    if (
      filteredCustomers.length ===
      0
    ) {

      return;

    }


    setSelectedCustomerIds(
      (
        current,
      ) => {

        const next =
          new Set(
            current,
          );


        if (
          allFilteredSelected
        ) {

          filteredCustomers.forEach(
            (
              customer,
            ) => {

              next.delete(
                customer.uid,
              );

            },
          );

        } else {

          filteredCustomers.forEach(
            (
              customer,
            ) => {

              next.add(
                customer.uid,
              );

            },
          );

        }


        return next;

      },
    );

  }


  /*
   * ========================================================
   * CLEAR SELECTION
   * ========================================================
   */

  function clearSelection() {

    setSelectedCustomerIds(
      new Set(),
    );

  }


  /*
   * ========================================================
   * OPEN BULK EMAIL
   * ========================================================
   */

  function openBulkEmail() {

    const customersToEmail =
      selectedCustomers.filter(
        (
          customer,
        ) =>
          Boolean(
            customer.email?.trim(),
          ),
      );


    if (
      customersToEmail.length ===
      0
    ) {

      setError(
        "The selected customers do not have usable email addresses.",
      );

      return;

    }


    setError(
      "",
    );


    setEmailCustomers(
      customersToEmail,
    );

  }


  /*
   * ========================================================
   * OPEN INDIVIDUAL EMAIL
   * ========================================================
   */

  function openIndividualEmail(
    customer:
      CustomerProfile,
  ) {

    if (
      !customer.email?.trim()
    ) {

      setError(
        "This customer does not have an email address.",
      );

      return;

    }


    setError(
      "",
    );


    setEmailCustomers([
      customer,
    ]);

  }


  /*
   * ========================================================
   * CLOSE EMAIL
   * ========================================================
   */

  function closeEmailComposer() {

    setEmailCustomers(
      [],
    );

  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (

      <div className="space-y-8">

        <div>

          <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-10 w-72 animate-pulse rounded bg-neutral-200" />

        </div>


        <div className="grid gap-4 sm:grid-cols-3">

          {
            Array.from({
              length: 3,
            }).map(
              (
                _,
                index,
              ) => (

                <div
                  key={
                    index
                  }

                  className="h-28 animate-pulse rounded-3xl bg-neutral-100"
                />

              ),
            )
          }

        </div>


        <div className="h-96 animate-pulse rounded-3xl bg-neutral-100" />

      </div>

    );

  }


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (

    <div className="space-y-8">

      {/* ==================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Customer Management
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Customers
          </h1>


          <p className="mt-2 text-sm text-neutral-500">
            View registered customers and their order history.
          </p>

        </div>


        <button
          type="button"

          onClick={() =>
            void loadCustomers()
          }

          className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
        >

          <RefreshCw
            size={16}
          />

          Refresh

        </button>

      </div>


      {/* ==================================================
          ERROR
      =================================================== */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">

          {
            error
          }

        </div>

      )}


      {/* ==================================================
          STATISTICS
      =================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <UserRound
            size={20}
            className="text-[#D4AF37]"
          />


          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
            Registered
          </p>


          <p className="mt-2 text-3xl font-black">

            {
              customers.length
            }

          </p>


          <p className="mt-1 text-xs text-neutral-500">
            Customer profiles
          </p>

        </div>


        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <ShoppingBag
            size={20}
            className="text-[#D4AF37]"
          />


          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
            Active Customers
          </p>


          <p className="mt-2 text-3xl font-black">

            {
              activeCustomers
            }

          </p>


          <p className="mt-1 text-xs text-neutral-500">
            Customers with orders
          </p>

        </div>


        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Customer Revenue
          </p>


          <p className="mt-3 text-2xl font-black text-[#D4AF37]">

            {
              formatPrice(
                totalSpent,
              )
            }

          </p>


          <p className="mt-1 text-xs text-neutral-500">
            Non-cancelled orders
          </p>

        </div>

      </div>


      {/* ==================================================
          SEARCH
      =================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

        <div className="relative">

          <Search
            size={18}

            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />


          <input
            type="search"

            value={
              search
            }

            onChange={(
              event,
            ) =>
              setSearch(
                event.target.value,
              )
            }

            placeholder="Search customers by name, email or phone..."

            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-5 text-sm outline-none transition focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
          />

        </div>


        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs font-semibold text-neutral-400">

            Showing{" "}

            {
              filteredCustomers.length
            }

            {" "}of{" "}

            {
              customers.length
            }

            {" "}customers

          </p>


          <div className="flex flex-wrap items-center gap-2">

            <button
              type="button"

              onClick={
                toggleSelectAll
              }

              disabled={
                filteredCustomers.length ===
                0
              }

              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-40"
            >

              <Check
                size={14}
              />

              {
                allFilteredSelected
                  ? "Deselect All"
                  : "Select All"
              }

            </button>


            {selectedCount > 0 && (

              <>

                <button
                  type="button"

                  onClick={
                    clearSelection
                  }

                  className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >

                  Clear

                </button>


                <button
                  type="button"

                  onClick={
                    openBulkEmail
                  }

                  className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#b99622]"
                >

                  <Send
                    size={14}
                  />

                  Send Email

                  <span className="rounded-full bg-white/20 px-2 py-0.5">

                    {
                      selectedCount
                    }

                  </span>

                </button>

              </>

            )}

          </div>

        </div>

      </section>


      {/* ==================================================
          SELECTION SUMMARY
      =================================================== */}

      {selectedCount > 0 && (

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <Users
                size={17}
              />

            </div>


            <p className="text-sm font-bold text-neutral-800">

              {
                selectedCount
              }

              {" "}

              customer
              {
                selectedCount ===
                1
                  ? ""
                  : "s"
              }

              {" "}selected

            </p>

          </div>


          <button
            type="button"

            onClick={
              openBulkEmail
            }

            className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-neutral-800"
          >

            <Mail
              size={14}
            />

            Compose Email

          </button>

        </div>

      )}


      {/* ==================================================
          CUSTOMER LIST
      =================================================== */}

      {filteredCustomers.length ===
      0 ? (

        <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-14 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <UserRound
              size={27}
            />

          </div>


          <h2 className="mt-5 text-2xl font-black text-neutral-950">
            No customers found
          </h2>


          <p className="mt-2 text-sm text-neutral-500">
            Try a different search.
          </p>

        </section>

      ) : (

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1120px]">

              <thead className="border-b border-neutral-200 bg-neutral-50">

                <tr>

                  {/* =================================================
                      SELECT
                  ================================================== */}

                  <th className="w-14 px-4 py-4 text-center">

                    <input
                      type="checkbox"

                      checked={
                        allFilteredSelected
                      }

                      onChange={
                        toggleSelectAll
                      }

                      disabled={
                        filteredCustomers.length ===
                        0
                      }

                      aria-label="Select all customers"

                      className="h-4 w-4 rounded border-neutral-300 text-[#D4AF37] accent-[#D4AF37]"
                    />

                  </th>


                  {/* =================================================
                      CUSTOMER
                  ================================================== */}

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Customer
                  </th>


                  {/* =================================================
                      PHONE
                  ================================================== */}

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Phone
                  </th>


                  {/* =================================================
                      ORDERS
                  ================================================== */}

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Orders
                  </th>


                  {/* =================================================
                      SPENT
                  ================================================== */}

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Spent
                  </th>


                  {/* =================================================
                      JOINED
                  ================================================== */}

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Joined
                  </th>


                  {/* =================================================
                      ACTION
                  ================================================== */}

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-neutral-100">

                {
                  filteredCustomers.map(
                    (
                      customer,
                    ) => {

                      const customerOrders =
                        orders.filter(
                          (
                            order,
                          ) =>
                            order.userId ===
                            customer.uid,
                        );


                      const customerSpent =
                        customerOrders.reduce(
                          (
                            total,
                            order,
                          ) =>
                            order.status ===
                            "cancelled"
                              ? total
                              : total +
                                order.total,

                          0,
                        );


                      const isSelected =
                        selectedCustomerIds.has(
                          customer.uid,
                        );


                      return (

                        <tr
                          key={
                            customer.uid
                          }

                          className={[
                            "transition",
                            isSelected
                              ? "bg-[#D4AF37]/5"
                              : "hover:bg-neutral-50",
                          ].join(
                            " ",
                          )}
                        >

                          {/* =================================================
                              CHECKBOX
                          ================================================== */}

                          <td className="px-4 py-5 text-center">

                            <input
                              type="checkbox"

                              checked={
                                isSelected
                              }

                              onChange={() =>
                                toggleCustomer(
                                  customer.uid,
                                )
                              }

                              aria-label={
                                `Select ${customer.name}`
                              }

                              className="h-4 w-4 rounded border-neutral-300 accent-[#D4AF37]"
                            />

                          </td>


                          {/* =================================================
                              CUSTOMER
                          ================================================== */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-4">

                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#D4AF37]/10 font-black text-[#D4AF37]">

                                {customer.photoURL ? (

                                  <img
                                    src={
                                      customer.photoURL
                                    }

                                    alt={
                                      customer.name
                                    }

                                    className="h-full w-full object-cover"
                                  />

                                ) : (

                                  customer.name
                                    .charAt(
                                      0,
                                    )
                                    .toUpperCase()

                                )}

                              </div>


                              <div className="min-w-0">

                                <p className="truncate font-bold text-neutral-950">

                                  {
                                    customer.name
                                  }

                                </p>


                                <p className="mt-1 flex max-w-[280px] items-center gap-1 truncate text-xs text-neutral-400">

                                  <Mail
                                    size={12}
                                  />

                                  {
                                    customer.email ||
                                    "No email"
                                  }

                                </p>

                              </div>

                            </div>

                          </td>


                          {/* =================================================
                              PHONE
                          ================================================== */}

                          <td className="px-6 py-5">

                            <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600">

                              <Phone
                                size={14}
                                className="text-neutral-400"
                              />

                              {
                                customer.phone ||
                                "—"
                              }

                            </span>

                          </td>


                          {/* =================================================
                              ORDERS
                          ================================================== */}

                          <td className="px-6 py-5">

                            <span className="font-black text-neutral-900">

                              {
                                customerOrders.length
                              }

                            </span>

                          </td>


                          {/* =================================================
                              SPENT
                          ================================================== */}

                          <td className="px-6 py-5">

                            <span className="font-black text-neutral-900">

                              {
                                formatPrice(
                                  customerSpent,
                                )
                              }

                            </span>

                          </td>


                          {/* =================================================
                              JOINED
                          ================================================== */}

                          <td className="px-6 py-5">

                            <span className="text-xs text-neutral-500">

                              {
                                formatDate(
                                  customer.createdAt,
                                )
                              }

                            </span>

                          </td>


                          {/* =================================================
                              ACTIONS
                          ================================================== */}

                          <td className="px-6 py-5">

                            <div className="flex items-center justify-end gap-2">

                              {customer.email && (

                                <button
                                  type="button"

                                  onClick={() =>
                                    openIndividualEmail(
                                      customer,
                                    )
                                  }

                                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-600 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"

                                  title={
                                    `Email ${customer.name}`
                                  }
                                >

                                  <Mail
                                    size={13}
                                  />

                                  Email

                                </button>

                              )}


                              <button
                                type="button"

                                onClick={() =>
                                  setSelectedCustomer(
                                    customer,
                                  )
                                }

                                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                              >

                                View

                              </button>

                            </div>

                          </td>

                        </tr>

                      );

                    },
                  )
                }

              </tbody>

            </table>

          </div>

        </section>

      )}


      {/* ==================================================
          CUSTOMER DETAILS MODAL
      =================================================== */}

      {selectedCustomer && (

        <CustomerDetails
          customer={
            selectedCustomer
          }

          orders={
            orders
          }

          onEmail={
            openIndividualEmail
          }

          onClose={() =>
            setSelectedCustomer(
              null,
            )
          }
        />

      )}


      {/* ==================================================
          EMAIL COMPOSER
      =================================================== */}

      {emailCustomers.length >
        0 && (

        <EmailComposer
          customers={
            emailCustomers
          }

          onClose={
            closeEmailComposer
          }
        />

      )}

    </div>
  );
}