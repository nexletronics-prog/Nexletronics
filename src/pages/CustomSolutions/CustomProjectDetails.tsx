import {
  ArrowLeft,
  ArrowRight,
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
  Link,
  useParams,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  createCustomProjectMessage,
  subscribeCustomProject,
  subscribeCustomProjectMessages,
} from "../../services/customProject.service";

import type {
  CustomProject,
  CustomProjectMessage,
} from "../../types/customProject";


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
 * STATUS STYLE
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
      return "Quotation Accepted";

    case "rejected":
      return "Quotation Rejected";

    case "expired":
      return "Quotation Expired";

    case "cancelled":
      return "Quotation Cancelled";

    default:
      return "Quotation Draft";
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
      return "Payment Completed";

    case "failed":
      return "Payment Failed";

    case "refunded":
      return "Payment Refunded";

    default:
      return "Payment Not Required";
  }
}


/*
 * ==========================================================
 * MESSAGE TIME
 * ==========================================================
 */

function formatMessageTime(
  timestamp:
    unknown,
): string {

  if (
    !timestamp
  ) {

    return "";
  }


  try {

    if (
      typeof timestamp ===
        "object" &&
      timestamp !== null &&
      "toDate" in timestamp &&
      typeof (
        timestamp as {
          toDate?:
            unknown;
        }
      ).toDate ===
        "function"
    ) {

      return (
        (
          timestamp as {
            toDate:
              () => Date;
          }
        )
          .toDate()
          .toLocaleString()
      );
    }


    if (
      timestamp instanceof Date
    ) {

      return timestamp.toLocaleString();
    }


    return new Date(
      String(
        timestamp,
      ),
    ).toLocaleString();

  } catch {

    return "";
  }
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
   * MESSAGE INPUT
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
   * REALTIME PROJECT
   * ========================================================
   */

  useEffect(
    () => {

      if (
        !projectId
      ) {

        setLoading(
          false,
        );

        setError(
          "Project was not found.",
        );

        return;
      }


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
              "Customer project listener failed:",
              listenerError,
            );


            setError(
              listenerError.message ||
              "Unable to load project.",
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
   * REALTIME MESSAGES
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
              "Customer project messages listener failed:",
              listenerError,
            );


            setError(
              listenerError.message ||
              "Unable to load project conversation.",
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
   * USER ID
   * ========================================================
   */

  const userId =
    user?.uid ??
    "";


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
          ) => {

            const firstTime =
              getTimestampMillis(
                first.createdAt,
              );


            const secondTime =
              getTimestampMillis(
                second.createdAt,
              );


            return (
              firstTime -
              secondTime
            );

          },
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
        "Please sign in to send a message.",
      );

      return;
    }


    if (
      !project
    ) {

      setError(
        "Project could not be loaded.",
      );

      return;
    }


    if (
      project.userId !==
      userId
    ) {

      setError(
        "You do not have permission to message this project.",
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


      await createCustomProjectMessage(
        {

          projectId,

          senderId:
            userId,

          senderType:
            "customer",

          senderName:
            user.displayName?.trim() ||
            project.customerName ||
            "Customer",

          senderEmail:
            user.email ??
            project.customerEmail,

          message:
            text,

        },
      );


      setMessageText(
        "",
      );

    } catch (
      sendError
    ) {

      console.error(
        "Failed to send customer message:",
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
   * LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:px-10">

          <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />


          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">

            <div className="h-[650px] animate-pulse rounded-3xl bg-white" />

            <div className="h-[400px] animate-pulse rounded-3xl bg-white" />

          </div>

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

      <main className="min-h-screen bg-[#faf9f5]">

        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-16">

          <div className="w-full rounded-3xl border border-neutral-200 bg-white p-10 text-center">

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
                "This project does not exist or is no longer available."
              }

            </p>


            <Link
              to="/dashboard"

              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white"
            >

              <ArrowLeft
                size={16}
              />

              Back to Dashboard

            </Link>

          </div>

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

    <main className="min-h-screen bg-[#faf9f5]">

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">

        {/* BACK */}

        <Link
          to="/dashboard"

          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-[#9b7e1d]"
        >

          <ArrowLeft
            size={16}
          />

          Back to Dashboard

        </Link>


        {/* ==================================================
            PROJECT HEADER
        =================================================== */}

        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div>

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


              <h1 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">

                {
                  project.title
                }

              </h1>


              <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">

                {
                  project.description
                }

              </p>

            </div>


            <span
              className={[
                "inline-flex shrink-0 rounded-full px-4 py-2 text-xs font-black",
                getStatusClass(
                  project.status,
                ),
              ].join(" ")}
            >

              {
                getStatusLabel(
                  project.status,
                )
              }

            </span>

          </div>

        </section>


        {/* ==================================================
            MAIN
        =================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* =================================================
              CHAT
          ================================================== */}

          <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

            <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-5">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

                <MessageCircle
                  size={20}
                />

              </div>


              <div>

                <h2 className="font-black text-neutral-950">
                  Project Conversation
                </h2>


                <p className="text-xs text-neutral-500">
                  Communicate with Nexletronics about your project.
                </p>

              </div>

            </div>


            {/* MESSAGES */}

            <div className="max-h-[620px] min-h-[420px] overflow-y-auto p-6">

              {sortedMessages.length ===
                0 ? (

                <div className="flex min-h-[360px] flex-col items-center justify-center text-center">

                  <MessageCircle
                    size={35}
                    className="text-[#D4AF37]"
                  />


                  <h3 className="mt-4 text-lg font-black text-neutral-950">
                    No messages yet
                  </h3>


                  <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                    Send a message below to start the conversation.
                  </p>

                </div>

              ) : (

                <div className="space-y-5">

                  {
                    sortedMessages.map(
                      (
                        message,
                      ) => {

                        const mine =
                          message.senderType ===
                          "customer";


                        return (

                          <div
                            key={
                              message.id
                            }

                            className={
                              mine
                                ? "flex justify-end"
                                : "flex justify-start"
                            }
                          >

                            <div
                              className={[
                                "max-w-[85%] rounded-2xl px-4 py-3",
                                mine
                                  ? "bg-[#D4AF37] text-white"
                                  : "bg-neutral-100 text-neutral-800",
                              ].join(" ")}
                            >

                              <div className="flex items-center gap-2">

                                {!mine && (

                                  <User
                                    size={13}
                                  />

                                )}


                                <span
                                  className={[
                                    "text-[10px] font-black uppercase tracking-wider",
                                    mine
                                      ? "text-white/70"
                                      : "text-neutral-400",
                                  ].join(" ")}
                                >

                                  {
                                    mine
                                      ? "You"
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
                                    mine
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

              className="border-t border-neutral-100 p-4 sm:p-5"
            >

              {error && (

                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">

                  {
                    error
                  }

                </div>

              )}


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

                  placeholder="Write a message to Nexletronics..."

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

                  className="flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-2xl bg-[#D4AF37] text-white transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:bg-neutral-300"
                >

                  <Send
                    size={18}
                  />

                </button>

              </div>

            </form>

          </section>


          {/* =================================================
              SIDEBAR
          ================================================== */}

          <aside className="space-y-6">

            {/* PROJECT STATUS */}

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

              <h2 className="font-black text-neutral-950">
                Project Status
              </h2>


              <div className="mt-5 rounded-2xl bg-neutral-50 p-4">

                <StatusRow
                  icon={
                    CheckCircle2
                  }
                  label="Current status"
                  value={
                    getStatusLabel(
                      project.status,
                    )
                  }
                />

              </div>


              <div className="mt-4 rounded-2xl bg-neutral-50 p-4">

                <StatusRow
                  icon={
                    FileText
                  }
                  label="Quotation"
                  value={
                    getQuotationLabel(
                      project.quotationStatus,
                    )
                  }
                />

              </div>


              <div className="mt-4 rounded-2xl bg-neutral-50 p-4">

                <StatusRow
                  icon={
                    Clock3
                  }
                  label="Payment"
                  value={
                    getPaymentLabel(
                      project.paymentStatus,
                    )
                  }
                />

              </div>

            </section>


            {/* QUOTATION */}

            {project.activeQuotationId && (

              <section className="rounded-3xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-6">

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                  Quotation
                </p>


                <h2 className="mt-2 text-xl font-black text-neutral-950">
                  Your quotation is ready
                </h2>


                <p className="mt-2 text-sm leading-6 text-neutral-600">

                  Review the quotation and accept it before
                  continuing to payment.

                </p>


                <Link
                  to={`/custom-solutions/projects/${project.id}/quotation/${project.activeQuotationId}`}

                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-white"
                >

                  View Quotation

                  <ArrowRight
                    size={15}
                  />

                </Link>

              </section>

            )}


            {/* PROJECT DETAILS */}

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

              <h2 className="font-black text-neutral-950">
                Project Details
              </h2>


              <div className="mt-5 space-y-4">

                <DetailRow
                  label="Type"
                  value={
                    project.projectType ===
                      "custom-devices"
                      ? "Custom devices"
                      : "Custom Website"
                  }
                />


                {project.timeline && (

                  <DetailRow
                    label="Timeline"
                    value={
                      project.timeline
                    }
                  />

                )}


                {project.budgetLabel && (

                  <DetailRow
                    label="Budget"
                    value={
                      project.budgetLabel
                    }
                  />

                )}


                {typeof project.quotedAmount ===
                  "number" && (

                  <DetailRow
                    label="Quoted Amount"
                    value={`${project.currency} ${project.quotedAmount.toLocaleString("en-IN")}`}
                  />

                )}


                {project.estimatedDeliveryDate && (

                  <DetailRow
                    label="Estimated Delivery"
                    value={
                      project.estimatedDeliveryDate
                    }
                  />

                )}

              </div>

            </section>

          </aside>

        </div>

      </div>

    </main>
  );
}


/*
 * ==========================================================
 * STATUS ROW
 * ==========================================================
 */

function StatusRow({
  icon:
    Icon,

  label,

  value,
}: {
  icon:
    typeof CheckCircle2;

  label:
    string;

  value:
    string;
}) {

  return (

    <div className="flex items-center gap-3">

      <Icon
        size={19}
        className="shrink-0 text-[#D4AF37]"
      />


      <div>

        <p className="text-xs font-bold text-neutral-400">
          {
            label
          }
        </p>


        <p className="mt-1 text-sm font-black text-neutral-900">
          {
            value
          }
        </p>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * DETAIL ROW
 * ==========================================================
 */

function DetailRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {

  return (

    <div className="flex items-start justify-between gap-5 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">

      <span className="text-xs font-bold text-neutral-400">
        {
          label
        }
      </span>


      <span className="text-right text-sm font-bold text-neutral-800">
        {
          value
        }
      </span>

    </div>
  );
}


/*
 * ==========================================================
 * FIRESTORE TIMESTAMP TO MILLISECONDS
 * ==========================================================
 */

function getTimestampMillis(
  timestamp:
    unknown,
): number {

  if (
    !timestamp
  ) {

    return 0;
  }


  try {

    if (
      typeof timestamp ===
        "object" &&
      timestamp !== null &&
      "toMillis" in timestamp &&
      typeof (
        timestamp as {
          toMillis?:
            unknown;
        }
      ).toMillis ===
        "function"
    ) {

      return (
        timestamp as {
          toMillis:
            () => number;
        }
      )
        .toMillis();
    }


    if (
      typeof timestamp ===
        "object" &&
      timestamp !== null &&
      "toDate" in timestamp &&
      typeof (
        timestamp as {
          toDate?:
            unknown;
        }
      ).toDate ===
        "function"
    ) {

      return (
        timestamp as {
          toDate:
            () => Date;
        }
      )
        .toDate()
        .getTime();
    }


    if (
      timestamp instanceof Date
    ) {

      return timestamp.getTime();
    }


    const numeric =
      new Date(
        String(
          timestamp,
        ),
      ).getTime();


    return Number.isFinite(
      numeric,
    )
      ? numeric
      : 0;

  } catch {

    return 0;
  }
}