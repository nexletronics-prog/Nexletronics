import {
  Check,
  Mail,
  MessageSquare,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteContactMessage,
  saveContactReply,
  subscribeContactMessages,
  updateContactStatus,
  type ContactMessage,
  type ContactStatus,
} from "../../../services/contact.service";


/*
 * ==========================================================
 * DATE
 * ==========================================================
 */

function formatDate(
  value: unknown,
): string {

  if (
    !value
  ) {
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
          toDate:
            () => Date;
        }
      )
        .toDate()
        .toLocaleString(
          "en-IN",
          {
            day:
              "numeric",

            month:
              "short",

            year:
              "numeric",

            hour:
              "2-digit",

            minute:
              "2-digit",
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


    return date.toLocaleString(
      "en-IN",
      {
        day:
          "numeric",

        month:
          "short",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",
      },
    );

  } catch {

    return "—";
  }
}


/*
 * ==========================================================
 * STATUS STYLE
 * ==========================================================
 */

function statusClasses(
  status:
    ContactStatus,
): string {

  switch (
    status
  ) {

    case "new":
      return "bg-amber-50 text-amber-700";

    case "read":
      return "bg-blue-50 text-blue-700";

    case "replied":
      return "bg-green-50 text-green-700";

    case "archived":
      return "bg-neutral-100 text-neutral-500";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}


/*
 * ==========================================================
 * MESSAGE MODAL
 * ==========================================================
 */

function MessageModal({
  message,
  onClose,
  onStatusChange,
  onMessageUpdated,
}: {
  message:
    ContactMessage;

  onClose:
    () => void;

  onStatusChange:
    (
      status:
        ContactStatus,
    ) => Promise<void>;

  onMessageUpdated:
    (
      message:
        ContactMessage,
    ) => void;
}) {

  const [
    reply,
    setReply,
  ] =
    useState(
      message.adminReply ??
        "",
    );


  const [
    sending,
    setSending,
  ] =
    useState(
      false,
    );


  const [
    statusUpdating,
    setStatusUpdating,
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
   * STATUS
   * ========================================================
   */

  async function handleStatus(
    status:
      ContactStatus,
  ) {

    try {

      setStatusUpdating(
        true,
      );

      setError(
        "",
      );


      await onStatusChange(
        status,
      );

    } catch (
      statusError
    ) {

      console.error(
        "Status update failed:",
        statusError,
      );


      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update status.",
      );

    } finally {

      setStatusUpdating(
        false,
      );
    }
  }


  /*
   * ========================================================
   * SEND REPLY
   * ========================================================
   *
   * IMPORTANT:
   *
   * There is NO mailto here.
   *
   * EmailJS sends the actual message.
   */

  async function handleSendReply() {

    const cleanReply =
      reply.trim();


    if (
      !cleanReply
    ) {

      setError(
        "Please enter a reply.",
      );


      setSuccess(
        "",
      );


      return;
    }


    if (
      !message.email.trim()
    ) {

      setError(
        "This enquiry does not contain a customer email address.",
      );


      setSuccess(
        "",
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


      /*
       * This calls EmailJS.
       */

      await saveContactReply(
        message.id,
        cleanReply,
      );


      /*
       * Update the local interface.
       */

      const updatedMessage:
        ContactMessage = {

        ...message,

        adminReply:
          cleanReply,

        status:
          "replied",

        repliedAt:
          new Date(),

        updatedAt:
          new Date(),

      };


      onMessageUpdated(
        updatedMessage,
      );


      setSuccess(
        "Reply sent successfully to the customer.",
      );

    } catch (
      sendError
    ) {

      console.error(
        "Reply sending failed:",
        sendError,
      );


      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send reply.",
      );

    } finally {

      setSending(
        false,
      );
    }
  }


  /*
   * ========================================================
   * MODAL
   * ========================================================
   */

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">

      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">

          <div>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Customer Communication
            </p>


            <h2 className="mt-1 text-xl font-black text-neutral-950">
              {
                message.name
              }
            </h2>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close enquiry"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >

            <X
              size={
                18
              }
            />

          </button>

        </div>


        {/* BODY */}

        <div className="space-y-6 overflow-y-auto p-6 sm:p-8">

          {/* CUSTOMER INFO */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="rounded-2xl bg-neutral-50 p-4">

              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Customer Email
              </p>


              <p className="mt-2 break-all text-sm font-bold text-neutral-800">
                {
                  message.email
                }
              </p>

            </div>


            <div className="rounded-2xl bg-neutral-50 p-4">

              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Phone
              </p>


              <p className="mt-2 text-sm font-bold text-neutral-800">
                {
                  message.phone ||
                  "Not provided"
                }
              </p>

            </div>

          </div>


          {/* CUSTOMER MESSAGE */}

          <div className="rounded-2xl border border-neutral-200 p-5">

            <div className="flex items-center justify-between gap-3">

              <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
                Customer Message
              </p>


              <span
                className={[
                  "rounded-full px-3 py-1 text-[10px] font-bold capitalize",

                  statusClasses(
                    message.status,
                  ),

                ].join(
                  " ",
                )}
              >

                {
                  message.status
                }

              </span>

            </div>


            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
              {
                message.message
              }
            </p>


            <p className="mt-4 text-xs text-neutral-400">
              Received{" "}
              {
                formatDate(
                  message.createdAt,
                )
              }
            </p>

          </div>


          {/* REPLY COMPOSER */}

          <div className="rounded-3xl border border-[#D4AF37]/20 bg-[#faf9f5] p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                  Reply to Customer
                </p>


                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Your reply will be sent directly to:
                </p>


                <p className="mt-1 break-all text-sm font-bold text-neutral-800">
                  {
                    message.email
                  }
                </p>

              </div>


              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

                <Send
                  size={
                    18
                  }
                />

              </div>

            </div>


            <textarea
              value={
                reply
              }
              onChange={(
                event,
              ) => {

                setReply(
                  event.target.value,
                );


                setError(
                  "",
                );


                setSuccess(
                  "",
                );

              }}
              disabled={
                sending
              }
              rows={
                8
              }
              placeholder="Write your response to the customer..."
              className="mt-5 w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm leading-7 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:cursor-not-allowed disabled:opacity-60"
            />


            <div className="mt-4 flex items-center justify-between gap-4">

              <p className="text-xs text-neutral-400">
                {
                  reply.length
                }{" "}
                characters
              </p>


              <button
                type="button"
                onClick={() =>
                  void handleSendReply()
                }
                disabled={
                  sending
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <Send
                  size={
                    16
                  }
                />

                {
                  sending
                    ? "Sending..."
                    : "Send Reply"
                }

              </button>

            </div>


            {error && (

              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {
                  error
                }
              </div>

            )}


            {success && (

              <div
                role="status"
                className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
              >

                <Check
                  size={
                    17
                  }
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {
                    success
                  }
                </span>

              </div>

            )}

          </div>


          {/* PREVIOUS REPLY */}

          {message.adminReply?.trim() && (

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

              <div className="flex items-center gap-2">

                <Check
                  size={
                    17
                  }
                  className="text-green-600"
                />

                <p className="text-xs font-black uppercase tracking-wider text-green-700">
                  Saved Reply
                </p>

              </div>


              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-green-900">
                {
                  message.adminReply
                }
              </p>

            </div>

          )}


          {/* STATUS */}

          <div>

            <p className="mb-3 text-xs font-black uppercase tracking-wider text-neutral-400">
              Update Status
            </p>


            <div className="flex flex-wrap gap-2">

              {(
                [
                  "read",
                  "replied",
                  "archived",
                ] as ContactStatus[]
              ).map(
                (
                  status,
                ) => (

                  <button
                    key={
                      status
                    }
                    type="button"
                    disabled={
                      statusUpdating ||
                      sending
                    }
                    onClick={() =>
                      void handleStatus(
                        status,
                      )
                    }
                    className={[
                      "rounded-full border px-4 py-2 text-xs font-bold capitalize transition",

                      message.status ===
                        status
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#9b7e1d]"
                        : "border-neutral-200 text-neutral-600 hover:border-[#D4AF37] hover:text-[#D4AF37]",

                    ].join(
                      " ",
                    )}
                  >

                    Mark{" "}

                    {
                      status
                    }

                  </button>

                ),
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * MAIN ENQUIRY MANAGER
 * ==========================================================
 */

export default function ContactManager() {

  const [
    messages,
    setMessages,
  ] =
    useState<
      ContactMessage[]
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
    selectedMessage,
    setSelectedMessage,
  ] =
    useState<
      ContactMessage |
      null
    >(
      null,
    );


  /*
   * ========================================================
   * REALTIME LISTENER
   * ========================================================
   */

  useEffect(() => {

    setLoading(
      true,
    );


    setError(
      "",
    );


    const unsubscribe =
      subscribeContactMessages(

        (
          nextMessages,
        ) => {

          setMessages(
            nextMessages,
          );


          setLoading(
            false,
          );


          /*
           * Keep modal synchronized.
           */

          setSelectedMessage(
            (
              current,
            ) => {

              if (
                !current
              ) {

                return null;
              }


              return (
                nextMessages.find(
                  (
                    item,
                  ) =>
                    item.id ===
                    current.id,
                ) ??
                null
              );

            },
          );

        },

        (
          listenerError,
        ) => {

          console.error(
            "Realtime enquiry listener failed:",
            listenerError,
          );


          setError(
            listenerError instanceof Error
              ? listenerError.message
              : "Unable to connect to the enquiries database.",
          );


          setLoading(
            false,
          );

        },
      );


    return () => {

      unsubscribe();

    };

  }, []);


  /*
   * ========================================================
   * SEARCH
   * ========================================================
   */

  const filteredMessages =
    useMemo(
      () => {

        const queryText =
          search
            .trim()
            .toLowerCase();


        if (
          !queryText
        ) {

          return messages;
        }


        return messages.filter(
          (
            message,
          ) =>
            message.name
              .toLowerCase()
              .includes(
                queryText,
              ) ||

            message.email
              .toLowerCase()
              .includes(
                queryText,
              ) ||

            message.message
              .toLowerCase()
              .includes(
                queryText,
              ),
        );

      },
      [
        messages,
        search,
      ],
    );


  /*
   * ========================================================
   * COUNTS
   * ========================================================
   */

  const total =
    messages.length;


  const newCount =
    messages.filter(
      (
        message,
      ) =>
        message.status ===
        "new",
    ).length;


  const repliedCount =
    messages.filter(
      (
        message,
      ) =>
        message.status ===
        "replied",
    ).length;


  const archivedCount =
    messages.filter(
      (
        message,
      ) =>
        message.status ===
        "archived",
    ).length;


  /*
   * ========================================================
   * STATUS CHANGE
   * ========================================================
   */

  async function handleStatusChange(
    id: string,
    status: ContactStatus,
  ) {

    await updateContactStatus(
      id,
      status,
    );


    setMessages(
      (
        current,
      ) =>
        current.map(
          (
            message,
          ) =>
            message.id ===
            id
              ? {
                  ...message,
                  status,
                }
              : message,
        ),
    );


    setSelectedMessage(
      (
        current,
      ) =>
        current &&
        current.id ===
        id
          ? {
              ...current,
              status,
            }
          : current,
    );

  }


  /*
   * ========================================================
   * DELETE
   * ========================================================
   */

  async function handleDelete(
    message:
      ContactMessage,
  ) {

    const confirmed =
      window.confirm(
        `Delete the enquiry from ${message.name}?`,
      );


    if (
      !confirmed
    ) {

      return;
    }


    try {

      setError(
        "",
      );


      await deleteContactMessage(
        message.id,
      );


      setMessages(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              message.id,
          ),
      );


      setSelectedMessage(
        null,
      );

    } catch (
      deleteError
    ) {

      console.error(
        "Failed to delete enquiry:",
        deleteError,
      );


      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete enquiry.",
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
      <div className="space-y-8">

        <div>

          <div className="h-3 w-40 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-10 w-64 animate-pulse rounded bg-neutral-200" />

        </div>


        <div className="grid gap-4 sm:grid-cols-4">

          {Array.from({
            length:
              4,
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
          )}

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

      {/* HEADER */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Customer Communication
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Enquiries
          </h1>


          <p className="mt-2 text-sm text-neutral-500">
            Read customer messages, reply directly and track communication.
          </p>

        </div>


        <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-5 py-3 text-sm font-bold text-green-700">

          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

          Live

        </div>

      </div>


      {/* ERROR */}

      {error && (

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >

          {
            error
          }

        </div>

      )}


      {/* STATS */}

      <div className="grid gap-4 sm:grid-cols-4">

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

          <MessageSquare
            size={
              20
            }
            className="text-[#D4AF37]"
          />

          <p className="mt-4 text-xs font-black uppercase tracking-wider text-neutral-400">
            Total
          </p>

          <p className="mt-2 text-3xl font-black">
            {
              total
            }
          </p>

        </div>


        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

          <Mail
            size={
              20
            }
            className="text-amber-600"
          />

          <p className="mt-4 text-xs font-black uppercase tracking-wider text-neutral-400">
            New
          </p>

          <p className="mt-2 text-3xl font-black text-amber-600">
            {
              newCount
            }
          </p>

        </div>


        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

          <Check
            size={
              20
            }
            className="text-green-600"
          />

          <p className="mt-4 text-xs font-black uppercase tracking-wider text-neutral-400">
            Replied
          </p>

          <p className="mt-2 text-3xl font-black text-green-600">
            {
              repliedCount
            }
          </p>

        </div>


        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

          <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
            Archived
          </p>

          <p className="mt-5 text-3xl font-black text-neutral-500">
            {
              archivedCount
            }
          </p>

        </div>

      </div>


      {/* SEARCH */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

        <div className="relative">

          <Search
            size={
              18
            }
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
            placeholder="Search name, email or message..."
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-5 text-sm outline-none transition focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
          />

        </div>


        <p className="mt-4 text-xs font-semibold text-neutral-400">

          Showing{" "}

          {
            filteredMessages.length
          }

          {" "}of{" "}

          {
            messages.length
          }

          {" "}enquiries

        </p>

      </section>


      {/* EMPTY */}

      {filteredMessages.length ===
      0 ? (

        <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-14 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <MessageSquare
              size={
                28
              }
            />

          </div>


          <h2 className="mt-5 text-2xl font-black text-neutral-950">
            No enquiries found
          </h2>


          <p className="mt-2 text-sm text-neutral-500">
            Customer messages will appear here in real time.
          </p>

        </section>

      ) : (

        /* LIST */

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="divide-y divide-neutral-100">

            {filteredMessages.map(
              (
                message,
              ) => (

                <div
                  key={
                    message.id
                  }
                  className="flex flex-col gap-4 p-6 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
                >

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMessage(
                        message,
                      )
                    }
                    className="min-w-0 flex-1 text-left"
                  >

                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

                        <Mail
                          size={
                            18
                          }
                        />

                      </div>


                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-black text-neutral-950">
                            {
                              message.name
                            }
                          </p>


                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-[9px] font-bold capitalize",
                              statusClasses(
                                message.status,
                              ),
                            ].join(
                              " ",
                            )}
                          >
                            {
                              message.status
                            }
                          </span>

                        </div>


                        <p className="mt-1 text-xs text-neutral-400">
                          {
                            message.email
                          }
                        </p>


                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">
                          {
                            message.message
                          }
                        </p>


                        <p className="mt-2 text-[10px] text-neutral-400">
                          {
                            formatDate(
                              message.createdAt,
                            )
                          }
                        </p>

                      </div>

                    </div>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete(
                        message,
                      )
                    }
                    title="Delete enquiry"
                    className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-neutral-200 text-red-500 transition hover:border-red-200 hover:bg-red-50 sm:self-auto"
                  >

                    <Trash2
                      size={
                        15
                      }
                    />

                  </button>

                </div>

              ),
            )}

          </div>

        </section>

      )}


      {/* MODAL */}

      {selectedMessage && (

        <MessageModal
          message={
            selectedMessage
          }

          onClose={() =>
            setSelectedMessage(
              null,
            )
          }

          onStatusChange={(
            status,
          ) =>
            handleStatusChange(
              selectedMessage.id,
              status,
            )
          }

          onMessageUpdated={(
            updatedMessage,
          ) => {

            setMessages(
              (
                current,
              ) =>
                current.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    updatedMessage.id
                      ? updatedMessage
                      : item,
                ),
            );


            setSelectedMessage(
              updatedMessage,
            );

          }}
        />

      )}

    </div>
  );
}