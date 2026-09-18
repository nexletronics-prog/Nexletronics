import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  MessageCircle,
  Send,
  User,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useAuth,
} from "../../../hooks/useAuth";

import {
  createCustomProjectMessage,
  setCustomProjectPaymentStatus,
  subscribeCustomProject,
  subscribeCustomProjectMessages,
  updateCustomProject,
} from "../../../services/customProject.service";

import type {
  CustomProject,
  CustomProjectMessage,
} from "../../../types/customProject";


/*
 * ==========================================================
 * STATUS LABEL
 * ==========================================================
 */

function getStatusLabel(
  status:
    CustomProject["status"],
): string {

  switch (
    status
  ) {

    case "new":
      return "New";

    case "discussion":
      return "Discussion";

    case "quotation_sent":
      return "Quotation Sent";

    case "quotation_accepted":
      return "Quotation Accepted";

    case "payment_pending":
      return "Payment Pending";

    case "confirmed":
      return "Confirmed";

    case "in_development":
      return "In Development";

    case "review":
      return "Review";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return "New";
  }
}


/*
 * ==========================================================
 * STATUS CLASS
 * ==========================================================
 */

function getStatusClass(
  status:
    CustomProject["status"],
): string {

  switch (
    status
  ) {

    case "completed":
      return "bg-green-50 text-green-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    case "payment_pending":
      return "bg-orange-50 text-orange-700";

    case "confirmed":
    case "quotation_accepted":
      return "bg-emerald-50 text-emerald-700";

    case "quotation_sent":
      return "bg-blue-50 text-blue-700";

    case "in_development":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-neutral-100 text-neutral-700";
  }
}


/*
 * ==========================================================
 * QUOTATION LABEL
 * ==========================================================
 */

function getQuotationLabel(
  status:
    CustomProject["quotationStatus"],
): string {

  switch (
    status
  ) {

    case "sent":
      return "Quotation Sent";

    case "accepted":
      return "Accepted";

    case "rejected":
      return "Rejected";

    case "expired":
      return "Expired";

    case "cancelled":
      return "Cancelled";

    default:
      return "Draft";
  }
}


/*
 * ==========================================================
 * PAYMENT LABEL
 * ==========================================================
 */

function getPaymentLabel(
  status:
    CustomProject["paymentStatus"],
): string {

  switch (
    status
  ) {

    case "pending":
      return "Payment Pending";

    case "processing":
      return "Payment Processing";

    case "paid":
      return "Paid";

    case "failed":
      return "Payment Failed";

    case "refunded":
      return "Refunded";

    default:
      return "Not Required";
  }
}


/*
 * ==========================================================
 * TIMESTAMP
 * ==========================================================
 */

function getTimestampMillis(
  value:
    unknown,
): number {

  if (
    !value
  ) {

    return 0;
  }


  try {

    if (
      typeof value ===
        "object" &&
      value !== null
    ) {

      const possible =
        value as {
          toMillis?:
            unknown;

          toDate?:
            unknown;

          seconds?:
            unknown;
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

      const parsed =
        Date.parse(
          value,
        );


      return Number.isNaN(
        parsed,
      )
        ? 0
        : parsed;
    }


    if (
      typeof value ===
      "number"
    ) {

      return value;
    }


    return 0;

  } catch {

    return 0;
  }
}


/*
 * ==========================================================
 * MESSAGE DATE
 * ==========================================================
 */

function formatMessageTime(
  value:
    unknown,
): string {

  const timestamp =
    getTimestampMillis(
      value,
    );


  if (
    timestamp <= 0
  ) {

    return "";
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
 * PAGE
 * ==========================================================
 */

export default function CustomProjectDetails() {

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
  } =
    useAuth();


  /*
   * ========================================================
   * PROJECT
   * ========================================================
   */

  const [
    project,
    setProject,
  ] =
    useState<
      CustomProject |
      null
    >(null);


  /*
   * ========================================================
   * MESSAGES
   * ========================================================
   */

  const [
    messages,
    setMessages,
  ] =
    useState<
      CustomProjectMessage[]
    >([]);


  /*
   * ========================================================
   * MESSAGE
   * ========================================================
   */

  const [
    messageText,
    setMessageText,
  ] =
    useState(
      "",
    );


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  /*
   * ========================================================
   * SENDING
   * ========================================================
   */

  const [
    sending,
    setSending,
  ] =
    useState(
      false,
    );


  /*
   * ========================================================
   * STATUS UPDATING
   * ========================================================
   */

  const [
    updatingStatus,
    setUpdatingStatus,
  ] =
    useState(
      false,
    );


  /*
   * ========================================================
   * PAYMENT CONFIRMATION
   * ========================================================
   */

  const [
    confirmingPayment,
    setConfirmingPayment,
  ] =
    useState(
      false,
    );


  /*
   * ========================================================
   * ERROR
   * ========================================================
   */

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );


  /*
   * ========================================================
   * SUCCESS
   * ========================================================
   */

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

        setProject(
          null,
        );

        setError(
          "Project ID is missing.",
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
        subscribeCustomProject(

          projectId,

          (
            nextProject,
          ) => {

            setProject(
              nextProject,
            );

            setLoading(
              false,
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Admin project listener failed:",
              listenerError,
            );


            setError(
              listenerError instanceof Error
                ? listenerError.message
                : "Unable to load project.",
            );


            setLoading(
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
   * MESSAGE REALTIME
   * ========================================================
   */

  useEffect(
    () => {

      if (
        !projectId
      ) {

        setMessages(
          [],
        );

        return;
      }


      const unsubscribe =
        subscribeCustomProjectMessages(

          projectId,

          (
            nextMessages,
          ) => {

            setMessages(
              nextMessages,
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Admin project message listener failed:",
              listenerError,
            );


            setError(
              listenerError instanceof Error
                ? listenerError.message
                : "Unable to load project conversation.",
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
   * SORT MESSAGES
   * ========================================================
   */

  const sortedMessages =
    useMemo(
      () =>
        [...messages].sort(
          (
            first,
            second,
          ) =>
            getTimestampMillis(
              first.createdAt,
            ) -
            getTimestampMillis(
              second.createdAt,
            ),
        ),
      [
        messages,
      ],
    );


  /*
   * ========================================================
   * SEND MESSAGE
   * ========================================================
   */

  async function handleSendMessage(
    event:
      FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();


    const text =
      messageText.trim();


    if (
      !text
    ) {

      return;
    }


    if (
      !projectId
    ) {

      setError(
        "Project ID is missing.",
      );

      return;
    }


    if (
      !user
    ) {

      setError(
        "Admin account is not available.",
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


      setSuccess(
        "",
      );


      await createCustomProjectMessage(
        {

          projectId,

          senderId:
            user.uid,

          senderType:
            "admin",

          senderName:
            user.displayName?.trim() ||
            "Nexletronics",

          senderEmail:
            user.email ??
            undefined,

          message:
            text,

        },
      );


      /*
       * Move a brand-new project into discussion
       * after the admin starts communicating.
       */

      if (
        project?.status ===
        "new"
      ) {

        await updateCustomProject(
          projectId,

          {
            status:
              "discussion",
          },
        );

      }


      setMessageText(
        "",
      );


      setSuccess(
        "Message sent.",
      );

    } catch (
      sendError
    ) {

      console.error(
        "Admin message send failed:",
        sendError,
      );


      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send message.",
      );

    } finally {

      setSending(
        false,
      );
    }
  }


  /*
   * ========================================================
   * STATUS CHANGE
   * ========================================================
   */

  async function handleStatusChange(
    status:
      CustomProject["status"],
  ) {

    if (
      !projectId ||
      !project ||
      project.status ===
        status
    ) {

      return;
    }


    try {

      setUpdatingStatus(
        true,
      );


      setError(
        "",
      );


      setSuccess(
        "",
      );


      await updateCustomProject(
        projectId,

        {
          status,
        },
      );


      setSuccess(
        `Project status changed to ${getStatusLabel(status)}.`,
      );

    } catch (
      statusError
    ) {

      console.error(
        "Project status update failed:",
        statusError,
      );


      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update project status.",
      );

    } finally {

      setUpdatingStatus(
        false,
      );
    }
  }


  /*
   * ========================================================
   * CONFIRM PAYMENT
   * ========================================================
   */

  async function handleConfirmPayment() {

    if (
      !projectId ||
      !project
    ) {

      return;
    }


    if (
      project.paymentStatus ===
      "paid"
    ) {

      return;
    }


    const confirmed =
      window.confirm(
        "Confirm that the customer's payment has been received and verified?",
      );


    if (
      !confirmed
    ) {

      return;
    }


    try {

      setConfirmingPayment(
        true,
      );


      setError(
        "",
      );


      setSuccess(
        "",
      );


      /*
       * First mark payment as paid.
       */

      await setCustomProjectPaymentStatus(
        projectId,
        "paid",
      );


      /*
       * Then confirm the project.
       */

      await updateCustomProject(
        projectId,

        {
          status:
            "confirmed",
        },
      );


      /*
       * Send an audit/message notification
       * into the project conversation.
       */

      if (
        user
      ) {

        try {

          await createCustomProjectMessage(
            {

              projectId,

              senderId:
                user.uid,

              senderType:
                "admin",

              senderName:
                user.displayName?.trim() ||
                "Nexletronics",

              senderEmail:
                user.email ??
                undefined,

              message:
                "Payment has been received and verified. Your project is now confirmed.",

            },
          );

        } catch (
          messageError
        ) {

          console.warn(
            "Payment confirmation message could not be added:",
            messageError,
          );

        }

      }


      setSuccess(
        "Payment marked as received. Project is now confirmed.",
      );

    } catch (
      paymentError
    ) {

      console.error(
        "Payment confirmation failed:",
        paymentError,
      );


      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to confirm payment.",
      );

    } finally {

      setConfirmingPayment(
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
    loading
  ) {

    return (

      <main className="space-y-6">

        <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />


        <div className="grid gap-6 xl:grid-cols-[1fr_350px]">

          <div className="h-[700px] animate-pulse rounded-3xl bg-white" />

          <div className="h-[500px] animate-pulse rounded-3xl bg-white" />

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * NOT FOUND
   * ========================================================
   */

  if (
    !project
  ) {

    return (

      <main>

        <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center">

          <FileText
            size={42}
            className="mx-auto text-[#D4AF37]"
          />


          <h1 className="mt-5 text-3xl font-black text-neutral-950">
            Project not found
          </h1>


          <p className="mt-3 text-sm leading-6 text-neutral-500">

            {
              error ||
              "The requested custom project could not be found."
            }

          </p>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/admin/custom-solutions",
              )
            }

            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white"
          >

            <ArrowLeft
              size={16}
            />

            Back to Custom Solutions

          </button>

        </div>

      </main>
    );
  }


  /*
   * ========================================================
   * MAIN
   * ========================================================
   */

  return (

    <main className="space-y-6">

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>

          <button
            type="button"

            onClick={() =>
              navigate(
                "/admin/custom-solutions",
              )
            }

            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-[#9b7e1d]"
          >

            <ArrowLeft
              size={16}
            />

            Back to Custom Solutions

          </button>


          <div className="flex flex-wrap items-center gap-2">

            <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#9b7e1d]">

              {
                project.projectType ===
                  "custom-devices"
                  ? "Custom devices"
                  : "Custom Website"
              }

            </span>


            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-500">

              {
                project.projectNumber
              }

            </span>

          </div>


          <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">

            {
              project.title
            }

          </h1>


          <p className="mt-2 text-sm text-neutral-500">

            {
              project.customerName
            }

            {" · "}

            {
              project.customerEmail
            }

          </p>

        </div>


        {/* STATUS */}

        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3">

          <span className="hidden text-xs font-bold text-neutral-400 sm:block">
            Status
          </span>


          <select
            value={
              project.status
            }

            disabled={
              updatingStatus
            }

            onChange={
              (
                event,
              ) =>
                void handleStatusChange(
                  event.target.value as
                    CustomProject["status"],
                )
            }

            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 outline-none focus:border-[#D4AF37]"
          >

            <option value="new">
              New
            </option>

            <option value="discussion">
              Discussion
            </option>

            <option value="quotation_sent">
              Quotation Sent
            </option>

            <option value="quotation_accepted">
              Quotation Accepted
            </option>

            <option value="payment_pending">
              Payment Pending
            </option>

            <option value="confirmed">
              Confirmed
            </option>

            <option value="in_development">
              In Development
            </option>

            <option value="review">
              Review
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>

          </select>

        </div>

      </div>


      {/* ====================================================
          ALERTS
      ===================================================== */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">

          {
            error
          }

        </div>

      )}


      {success && (

        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm leading-6 text-green-700">

          {
            success
          }

        </div>

      )}


      {/* ====================================================
          GRID
      ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">

        {/* ==================================================
            CONVERSATION
        =================================================== */}

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

                <MessageCircle
                  size={20}
                />

              </div>


              <div>

                <h2 className="font-black text-neutral-950">
                  Customer Conversation
                </h2>


                <p className="text-xs text-neutral-500">
                  Realtime communication with the customer.
                </p>

              </div>

            </div>


            <span className="rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black text-green-700">
              Live
            </span>

          </div>


          {/* MESSAGES */}

          <div className="max-h-[650px] min-h-[450px] overflow-y-auto p-6">

            {sortedMessages.length ===
              0 ? (

              <div className="flex min-h-[390px] flex-col items-center justify-center text-center">

                <MessageCircle
                  size={36}
                  className="text-[#D4AF37]"
                />


                <h3 className="mt-4 text-lg font-black text-neutral-950">
                  No conversation yet
                </h3>


                <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                  Send the customer a message to start the project discussion.
                </p>

              </div>

            ) : (

              <div className="space-y-5">

                {
                  sortedMessages.map(
                    (
                      message,
                    ) => {

                      const adminMessage =
                        message.senderType ===
                        "admin";


                      return (

                        <div
                          key={
                            message.id
                          }

                          className={
                            adminMessage
                              ? "flex justify-end"
                              : "flex justify-start"
                          }
                        >

                          <div
                            className={[
                              "max-w-[85%] rounded-2xl px-4 py-3",
                              adminMessage
                                ? "bg-[#D4AF37] text-white"
                                : "bg-neutral-100 text-neutral-800",
                            ].join(" ")}
                          >

                            <div className="flex items-center gap-2">

                              {adminMessage ? (

                                <CheckCircle2
                                  size={13}
                                />

                              ) : (

                                <User
                                  size={13}
                                />

                              )}


                              <span
                                className={[
                                  "text-[10px] font-black uppercase tracking-wider",
                                  adminMessage
                                    ? "text-white/70"
                                    : "text-neutral-400",
                                ].join(" ")}
                              >

                                {
                                  adminMessage
                                    ? "You · Nexletronics"
                                    : message.senderName
                                }

                              </span>

                            </div>


                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">

                              {
                                message.message
                              }

                            </p>


                            {formatMessageTime(
                              message.createdAt,
                            ) && (

                              <p
                                className={[
                                  "mt-2 text-[10px]",
                                  adminMessage
                                    ? "text-white/60"
                                    : "text-neutral-400",
                                ].join(" ")}
                              >

                                {
                                  formatMessageTime(
                                    message.createdAt,
                                  )
                                }

                              </p>

                            )}

                          </div>

                        </div>

                      );
                    },
                  )
                }

              </div>

            )}

          </div>


          {/* COMPOSER */}

          <form
            onSubmit={
              handleSendMessage
            }

            className="border-t border-neutral-100 p-5"
          >

            <div className="flex gap-3">

              <textarea
                value={
                  messageText
                }

                onChange={
                  (
                    event,
                  ) =>
                    setMessageText(
                      event.target.value,
                    )
                }

                placeholder="Reply to customer..."

                rows={
                  3
                }

                disabled={
                  sending
                }

                className="min-w-0 flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-sm leading-6 outline-none focus:border-[#D4AF37]"
              />


              <button
                type="submit"

                disabled={
                  sending ||
                  !messageText.trim()
                }

                className="flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-2xl bg-[#D4AF37] text-white hover:bg-[#b99622] disabled:cursor-not-allowed disabled:bg-neutral-300"
              >

                <Send
                  size={18}
                />

              </button>

            </div>

          </form>

        </section>


        {/* ==================================================
            SIDEBAR
        =================================================== */}

        <aside className="space-y-6">

          {/* CUSTOMER */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            <h2 className="font-black text-neutral-950">
              Customer
            </h2>


            <div className="mt-5 flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

                <User
                  size={21}
                />

              </div>


              <div className="min-w-0">

                <p className="truncate font-black text-neutral-950">

                  {
                    project.customerName
                  }

                </p>


                <p className="truncate text-xs text-neutral-500">

                  {
                    project.customerEmail
                  }

                </p>

              </div>

            </div>


            {project.customerPhone && (

              <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-700">

                {
                  project.customerPhone
                }

              </p>

            )}

          </section>


          {/* PROJECT OVERVIEW */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            <h2 className="font-black text-neutral-950">
              Project Overview
            </h2>


            <div className="mt-5 space-y-4">

              <OverviewRow
                icon={
                  CheckCircle2
                }

                label="Status"

                value={
                  getStatusLabel(
                    project.status,
                  )
                }

                valueClass={
                  getStatusClass(
                    project.status,
                  )
                }
              />


              <OverviewRow
                icon={
                  FileText
                }

                label="Quotation"

                value={
                  getQuotationLabel(
                    project.quotationStatus,
                  )
                }

                valueClass="bg-neutral-100 text-neutral-700"
              />


              <OverviewRow
                icon={
                  Clock3
                }

                label="Payment"

                value={
                  getPaymentLabel(
                    project.paymentStatus,
                  )
                }

                valueClass={
                  project.paymentStatus ===
                  "paid"
                    ? "bg-green-50 text-green-700"
                    : project.paymentStatus ===
                        "pending"
                      ? "bg-orange-50 text-orange-700"
                      : "bg-neutral-100 text-neutral-700"
                }
              />

            </div>

          </section>


          {/* ==================================================
              PAYMENT CONFIRMATION
          =================================================== */}

          {project.paymentStatus ===
            "pending" && (

            <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6">

              <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-700">
                Payment Pending
              </p>


              <h2 className="mt-2 text-xl font-black text-orange-950">
                Confirm customer payment
              </h2>


              <p className="mt-2 text-sm leading-6 text-orange-800">
                Confirm this only after you have received and
                verified the customer's payment.
              </p>


              {typeof project.quotedAmount ===
                "number" && (

                <div className="mt-4 rounded-2xl bg-white/70 p-4">

                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                    Expected Amount
                  </p>


                  <p className="mt-1 text-xl font-black text-orange-950">

                    {
                      project.currency
                    }

                    {" "}

                    {
                      project.quotedAmount.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits:
                            2,

                          maximumFractionDigits:
                            2,
                        },
                      )
                    }

                  </p>

                </div>

              )}


              <button
                type="button"

                onClick={() =>
                  void handleConfirmPayment()
                }

                disabled={
                  confirmingPayment
                }

                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3.5 text-sm font-black text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <CheckCircle2
                  size={16}
                />

                {
                  confirmingPayment
                    ? "Confirming..."
                    : "Mark Payment Received"
                }

              </button>

            </section>

          )}


          {/* ==================================================
              PAID
          =================================================== */}

          {project.paymentStatus ===
            "paid" && (

            <section className="rounded-3xl border border-green-200 bg-green-50 p-6">

              <div className="flex items-start gap-3">

                <CheckCircle2
                  size={22}
                  className="mt-0.5 text-green-600"
                />


                <div>

                  <p className="text-xs font-black uppercase tracking-wider text-green-700">
                    Payment Verified
                  </p>


                  <h2 className="mt-1 text-lg font-black text-green-950">
                    Payment received
                  </h2>


                  <p className="mt-2 text-sm leading-6 text-green-800">
                    The payment has been marked as received and
                    the project is ready to proceed.
                  </p>

                </div>

              </div>

            </section>

          )}


          {/* ==================================================
              REQUIREMENTS
          =================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            <h2 className="font-black text-neutral-950">
              Requirements
            </h2>


            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-600">

              {
                project.description
              }

            </p>


            {project.requirements && (

              <div className="mt-5 border-t border-neutral-100 pt-5">

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Additional Requirements
                </p>


                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-600">

                  {
                    project.requirements
                  }

                </p>

              </div>

            )}


            {project.budgetLabel && (

              <div className="mt-5 border-t border-neutral-100 pt-5">

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Customer Budget
                </p>


                <p className="mt-2 text-sm font-black text-neutral-800">

                  {
                    project.budgetLabel
                  }

                </p>

              </div>

            )}


            {project.timeline && (

              <div className="mt-5 border-t border-neutral-100 pt-5">

                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Requested Timeline
                </p>


                <p className="mt-2 text-sm font-black text-neutral-800">

                  {
                    project.timeline
                  }

                </p>

              </div>

            )}

          </section>


          {/* ==================================================
              QUOTATION
          =================================================== */}

          <section className="rounded-3xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-6">

            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
              Quotation
            </p>


            <h2 className="mt-2 text-xl font-black text-neutral-950">

              {
                project.activeQuotationId
                  ? "Quotation available"
                  : "Prepare quotation"
              }

            </h2>


            <p className="mt-2 text-sm leading-6 text-neutral-600">

              {
                project.activeQuotationId
                  ? "Open the quotation to review or manage the current customer quote."
                  : "Create a quotation after discussing and finalizing the project requirements."
              }

            </p>


            <button
              type="button"

              onClick={() => {

                if (
                  project.activeQuotationId
                ) {

                  navigate(
                    `/admin/custom-solutions/projects/${project.id}/quotation`,
                  );

                  return;
                }


                navigate(
                  `/admin/custom-solutions/projects/${project.id}/quotation`,
                );

              }}

              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-black text-white hover:bg-[#b99622]"
            >

              <FileText
                size={16}
              />

              {
                project.activeQuotationId
                  ? "Open Quotation"
                  : "Create Quotation"
              }

            </button>

          </section>

        </aside>

      </div>

    </main>
  );
}


/*
 * ==========================================================
 * OVERVIEW ROW
 * ==========================================================
 */

function OverviewRow({
  icon:
    Icon,

  label,

  value,

  valueClass,
}: {
  icon:
    typeof CheckCircle2;

  label:
    string;

  value:
    string;

  valueClass:
    string;
}) {

  return (

    <div className="flex items-center gap-3">

      <Icon
        size={18}
        className="shrink-0 text-[#D4AF37]"
      />


      <div className="min-w-0 flex-1">

        <p className="text-xs font-bold text-neutral-400">

          {
            label
          }

        </p>


        <span
          className={[
            "mt-1 inline-flex rounded-full px-3 py-1 text-[10px] font-black",
            valueClass,
          ].join(" ")}
        >

          {
            value
          }

        </span>

      </div>

    </div>
  );
}