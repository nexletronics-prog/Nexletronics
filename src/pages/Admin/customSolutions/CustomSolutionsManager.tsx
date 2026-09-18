import {
  ArrowRight,
  Clock3,
  FileText,
  MessageCircle,
  RefreshCw,
  Search,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import {
  db,
} from "../../../firebase/config";

import type {
  CustomProject,
} from "../../../types/customProject";


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
        seconds?: unknown;
      };


    if (
      typeof possible.toMillis ===
      "function"
    ) {

      return Number(
        (
          possible.toMillis as
            () => number
        )(),
      );
    }


    if (
      possible.seconds !==
      undefined
    ) {

      const seconds =
        Number(
          possible.seconds,
        );


      return Number.isFinite(
        seconds,
      )
        ? seconds * 1000
        : 0;
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
}


function formatDate(
  value: unknown,
): string {

  const timestamp =
    getTimeValue(
      value,
    );


  if (
    timestamp <= 0
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
 * NORMALIZE PROJECT
 * ==========================================================
 */

function normalizeProject(
  id: string,
  data: Record<string, unknown>,
): CustomProject {

  return {

    id,

    projectNumber:
      safeString(
        data.projectNumber,
        `CS-${id
          .slice(
            0,
            6,
          )
          .toUpperCase()}`,
      ),

    userId:
      safeString(
        data.userId,
      ),

    customerName:
      safeString(
        data.customerName,
        "Customer",
      ),

    customerEmail:
      safeString(
        data.customerEmail,
      ),

    customerPhone:
      safeString(
        data.customerPhone,
      ),

    projectType:
      safeString(
        data.projectType,
        "website",
      ) as CustomProject["projectType"],

    title:
      safeString(
        data.title,
        "Untitled project",
      ),

    description:
      safeString(
        data.description,
      ),

    requirements:
      safeString(
        data.requirements,
      ),

    budget:
      typeof data.budget ===
      "number"
        ? data.budget
        : undefined,

    budgetLabel:
      safeString(
        data.budgetLabel,
      ) || undefined,

    timeline:
      safeString(
        data.timeline,
      ) || undefined,

    status:
      safeString(
        data.status,
        "new",
      ) as CustomProject["status"],

    quotationStatus:
      safeString(
        data.quotationStatus,
        "draft",
      ) as CustomProject["quotationStatus"],

    paymentStatus:
      safeString(
        data.paymentStatus,
        "not_required",
      ) as CustomProject["paymentStatus"],

    quotedAmount:
      typeof data.quotedAmount ===
      "number"
        ? data.quotedAmount
        : undefined,

    paidAmount:
      typeof data.paidAmount ===
      "number"
        ? data.paidAmount
        : undefined,

    currency:
      safeString(
        data.currency,
        "INR",
      ),

    activeQuotationId:
      safeString(
        data.activeQuotationId,
      ) || undefined,

    lastMessage:
      safeString(
        data.lastMessage,
      ) || undefined,

    lastMessageBy:
      data.lastMessageBy ===
          "admin" ||
      data.lastMessageBy ===
          "customer"
        ? data.lastMessageBy
        : undefined,

    lastMessageAt:
      data.lastMessageAt,

    fileCount:
      typeof data.fileCount ===
      "number"
        ? data.fileCount
        : 0,

    estimatedDeliveryDate:
      safeString(
        data.estimatedDeliveryDate,
      ) || undefined,

    completedAt:
      data.completedAt,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,

  };
}


/*
 * ==========================================================
 * PROJECT TYPE LABEL
 * ==========================================================
 */

function projectTypeLabel(
  type:
    CustomProject["projectType"],
): string {

  if (
    type ===
    "custom-devices"
  ) {

    return "Custom devices";
  }


  return "Custom Website";
}


/*
 * ==========================================================
 * STATUS LABEL
 * ==========================================================
 */

function statusLabel(
  status:
    CustomProject["status"],
): string {

  const labels:
    Record<
      CustomProject["status"],
      string
    > = {

    new:
      "New",

    discussion:
      "Discussion",

    quotation_sent:
      "Quotation Sent",

    quotation_accepted:
      "Quote Accepted",

    payment_pending:
      "Payment Pending",

    confirmed:
      "Confirmed",

    in_development:
      "In Development",

    review:
      "Review",

    completed:
      "Completed",

    cancelled:
      "Cancelled",

  };


  return (
    labels[status] ??
    "New"
  );
}


/*
 * ==========================================================
 * STATUS CLASS
 * ==========================================================
 */

function statusClass(
  status:
    CustomProject["status"],
): string {

  switch (
    status
  ) {

    case "new":
      return "bg-amber-50 text-amber-700";

    case "discussion":
      return "bg-blue-50 text-blue-700";

    case "quotation_sent":
      return "bg-violet-50 text-violet-700";

    case "quotation_accepted":
      return "bg-indigo-50 text-indigo-700";

    case "payment_pending":
      return "bg-orange-50 text-orange-700";

    case "confirmed":
      return "bg-cyan-50 text-cyan-700";

    case "in_development":
      return "bg-purple-50 text-purple-700";

    case "review":
      return "bg-pink-50 text-pink-700";

    case "completed":
      return "bg-green-50 text-green-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}


/*
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default function CustomSolutionsManager() {

  const [
    projects,
    setProjects,
  ] =
    useState<
      CustomProject[]
    >([]);


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      CustomProject["status"] |
      "all"
    >("all");


  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      CustomProject["projectType"] |
      "all"
    >("all");


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


  /*
   * ========================================================
   * REALTIME
   * ========================================================
   */

  useEffect(
    () => {

      const projectsRef =
        collection(
          db,
          "customProjects",
        );


      const projectsQuery =
        query(
          projectsRef,
          orderBy(
            "createdAt",
            "desc",
          ),
        );


      const unsubscribe =
        onSnapshot(

          projectsQuery,

          (
            snapshot,
          ) => {

            const nextProjects =
              snapshot.docs
                .map(
                  (
                    document,
                  ) =>
                    normalizeProject(
                      document.id,
                      document.data(),
                    ),
                )
                .sort(
                  (
                    first,
                    second,
                  ) =>
                    getTimeValue(
                      second.createdAt,
                    ) -
                    getTimeValue(
                      first.createdAt,
                    ),
                );


            setProjects(
              nextProjects,
            );


            setLoading(
              false,
            );


            setError(
              "",
            );

          },

          (
            listenerError,
          ) => {

            console.error(
              "Custom project listener failed:",
              listenerError,
            );


            setError(
              listenerError instanceof Error
                ? listenerError.message
                : "Unable to load custom projects.",
            );


            setLoading(
              false,
            );

          },
        );


      return () =>
        unsubscribe();

    },
    [],
  );


  /*
   * ========================================================
   * FILTER
   * ========================================================
   */

  const filteredProjects =
    useMemo(
      () => {

        const searchValue =
          search
            .trim()
            .toLowerCase();


        return projects.filter(
          (
            project,
          ) => {

            const matchesSearch =
              !searchValue ||
              safeString(
                project.projectNumber,
              )
                .toLowerCase()
                .includes(
                  searchValue,
                ) ||
              safeString(
                project.title,
              )
                .toLowerCase()
                .includes(
                  searchValue,
                ) ||
              safeString(
                project.customerName,
              )
                .toLowerCase()
                .includes(
                  searchValue,
                ) ||
              safeString(
                project.customerEmail,
              )
                .toLowerCase()
                .includes(
                  searchValue,
                );


            const matchesStatus =
              statusFilter ===
                "all" ||
              project.status ===
                statusFilter;


            const matchesType =
              typeFilter ===
                "all" ||
              project.projectType ===
                typeFilter;


            return (
              matchesSearch &&
              matchesStatus &&
              matchesType
            );
          },
        );

      },
      [
        projects,
        search,
        statusFilter,
        typeFilter,
      ],
    );


  /*
   * ========================================================
   * COUNTS
   * ========================================================
   */

  const newCount =
    projects.filter(
      (
        project,
      ) =>
        project.status ===
        "new",
    ).length;


  const discussionCount =
    projects.filter(
      (
        project,
      ) =>
        project.status ===
        "discussion",
    ).length;


  const quotationCount =
    projects.filter(
      (
        project,
      ) =>
        project.quotationStatus ===
          "sent" ||
        project.quotationStatus ===
          "accepted",
    ).length;


  const paidCount =
    projects.filter(
      (
        project,
      ) =>
        project.paymentStatus ===
        "paid",
    ).length;


  return (

    <div className="space-y-7">

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Custom Solutions
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Project Manager
          </h1>


          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Manage custom websites and custom devices in real time.
          </p>

        </div>

      </div>


      {/* ====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

          {
            error
          }

        </div>

      )}


      {/* ====================================================
          STATS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <StatCard
          label="Total Projects"
          value={
            projects.length
          }
          icon={
            Wrench
          }
        />


        <StatCard
          label="New Requests"
          value={
            newCount
          }
          icon={
            FileText
          }
        />


        <StatCard
          label="Discussions"
          value={
            discussionCount
          }
          icon={
            MessageCircle
          }
        />


        <StatCard
          label="Quotations"
          value={
            quotationCount
          }
          icon={
            FileText
          }
        />


        <StatCard
          label="Paid Projects"
          value={
            paidCount
          }
          icon={
            Clock3
          }
        />

      </div>


      {/* ====================================================
          FILTERS
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">

          <div className="relative min-w-0 flex-1">

            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />


            <input
              type="search"

              value={
                search
              }

              onChange={
                (
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
              }

              placeholder="Search project, customer or email..."

              className="w-full rounded-2xl border border-neutral-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          <select
            value={
              statusFilter
            }

            onChange={
              (
                event,
              ) =>
                setStatusFilter(
                  event.target.value as
                    CustomProject["status"] |
                    "all",
                )
            }

            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4AF37]"
          >

            <option value="all">
              All Statuses
            </option>

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
              Quote Accepted
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


          <select
            value={
              typeFilter
            }

            onChange={
              (
                event,
              ) =>
                setTypeFilter(
                  event.target.value as
                    CustomProject["projectType"] |
                    "all",
                )
            }

            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4AF37]"
          >

            <option value="all">
              All Types
            </option>

            <option value="website">
              Custom Website
            </option>

            <option value="custom-devices">
              Custom devices
            </option>

          </select>


          <button
            type="button"

            onClick={() => {

              setSearch("");

              setStatusFilter(
                "all",
              );

              setTypeFilter(
                "all",
              );

            }}

            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-600 hover:border-[#D4AF37]"
          >

            <RefreshCw
              size={15}
            />

            Reset

          </button>

        </div>

      </section>


      {/* ====================================================
          PROJECTS
      ===================================================== */}

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

        <div className="border-b border-neutral-200 px-6 py-5">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-black text-neutral-950">
                Customer Projects
              </h2>


              <p className="mt-1 text-xs text-neutral-400">

                {
                  filteredProjects.length
                }

                {" "}

                {
                  filteredProjects.length ===
                  1
                    ? "project"
                    : "projects"
                }

              </p>

            </div>


            <div className="flex items-center gap-2 text-xs font-bold text-green-600">

              <span className="h-2 w-2 rounded-full bg-green-500" />

              Live

            </div>

          </div>

        </div>


        {loading ? (

          <div className="divide-y divide-neutral-100">

            {
              Array.from({
                length: 5,
              }).map(
                (
                  _item,
                  index,
                ) => (

                  <div
                    key={
                      index
                    }
                    className="p-6"
                  >

                    <div className="h-5 w-64 animate-pulse rounded bg-neutral-100" />

                    <div className="mt-3 h-4 w-80 animate-pulse rounded bg-neutral-100" />

                    <div className="mt-4 h-10 w-full animate-pulse rounded bg-neutral-100" />

                  </div>

                ),
              )
            }

          </div>

        ) : filteredProjects.length ===
          0 ? (

          <div className="p-14 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <Wrench
                size={24}
              />

            </div>


            <h3 className="mt-5 text-lg font-black text-neutral-900">
              No custom projects found
            </h3>


            <p className="mt-2 text-sm text-neutral-500">
              New website and custom-device requests will appear here automatically.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-neutral-100">

            {
              filteredProjects.map(
                (
                  project,
                ) => (

                  <Link
                    key={
                      project.id
                    }

                    to={
                      `/admin/custom-solutions/projects/${project.id}`
                    }

                    className="block p-6 transition hover:bg-neutral-50"
                  >

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#9b7e1d]">

                            {
                              projectTypeLabel(
                                project.projectType,
                              )
                            }

                          </span>


                          <span className="text-[11px] font-bold text-neutral-400">

                            {
                              safeString(
                                project.projectNumber,
                              )
                            }

                          </span>


                          <span
                            className={[
                              "rounded-full px-3 py-1.5 text-[10px] font-black",
                              statusClass(
                                project.status,
                              ),
                            ].join(
                              " ",
                            )}
                          >

                            {
                              statusLabel(
                                project.status,
                              )
                            }

                          </span>

                        </div>


                        <h3 className="mt-3 truncate text-lg font-black text-neutral-950">

                          {
                            safeString(
                              project.title,
                              "Untitled project",
                            )
                          }

                        </h3>


                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">

                          <span className="inline-flex items-center gap-1.5">

                            <UserRound
                              size={13}
                            />

                            {
                              safeString(
                                project.customerName,
                              )
                            }

                          </span>


                          <span className="break-all">

                            {
                              safeString(
                                project.customerEmail,
                              )
                            }

                          </span>


                          <span>

                            {
                              formatDate(
                                project.createdAt,
                              )
                            }

                          </span>

                        </div>


                        {project.lastMessage && (

                          <div className="mt-4 max-w-3xl rounded-2xl bg-neutral-50 px-4 py-3">

                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">

                              <MessageCircle
                                size={12}
                              />

                              Last message

                              {project.lastMessageBy && (

                                <span className="font-bold text-[#9b7e1d]">

                                  •

                                  {" "}

                                  {
                                    project.lastMessageBy ===
                                    "admin"
                                      ? "Admin"
                                      : "Customer"
                                  }

                                </span>

                              )}

                            </div>


                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-600">

                              {
                                safeString(
                                  project.lastMessage,
                                )
                              }

                            </p>

                          </div>

                        )}

                      </div>


                      <div className="flex shrink-0 items-center justify-between gap-6 xl:justify-end">

                        <div className="text-right">

                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                            Quotation
                          </p>


                          <p className="mt-1 font-black text-neutral-900">

                            {
                              project.quotationStatus ===
                                "sent" ||
                              project.quotationStatus ===
                                "accepted"

                                ? `${safeString(
                                    project.currency,
                                    "INR",
                                  )} ${Number(
                                    project.quotedAmount ??
                                      0,
                                  ).toLocaleString(
                                    "en-IN",
                                  )}`

                                : "Not prepared"
                            }

                          </p>


                          <p className="mt-1 text-[10px] text-neutral-400">

                            {
                              project.paymentStatus ===
                              "paid"
                                ? "Paid"
                                : project.paymentStatus ===
                                    "pending"
                                  ? "Payment pending"
                                  : "Not paid"
                            }

                          </p>

                        </div>


                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">

                          <ArrowRight
                            size={17}
                          />

                        </div>

                      </div>

                    </div>

                  </Link>

                ),
              )
            }

          </div>

        )}

      </section>

    </div>
  );
}


/*
 * ==========================================================
 * STAT CARD
 * ==========================================================
 */

function StatCard({
  label,
  value,
  icon:
    Icon,
}: {
  label:
    string;

  value:
    number;

  icon:
    typeof Wrench;
}) {

  return (

    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {
              label
            }
          </p>


          <p className="mt-3 text-3xl font-black text-neutral-950">
            {
              value
            }
          </p>

        </div>


        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

          <Icon
            size={20}
          />

        </div>

      </div>

    </div>
  );
}