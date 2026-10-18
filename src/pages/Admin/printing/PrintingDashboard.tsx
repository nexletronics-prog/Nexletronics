import {
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  PackageCheck,
  Printer,
  RefreshCw,
  Search,
  X,
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
  getAllPrintingOrders,
  updatePrintingOrderAdmin,
} from "../../../services/printing.service";

import {
  downloadPrintingStlFile,
} from "../../../services/printingDownload.service";

import type {
  PrintingOrder,
  PrintingOrderStatus,
} from "../../../types/printing";


/*
 * ==========================================================
 * STATUS VALUES
 * ==========================================================
 *
 * These are the statuses used by the existing printing flow.
 *
 * The customer-side request starts at:
 *
 *     pending
 *
 * Payment is tracked separately by paymentStatus.
 *
 * ==========================================================
 */

const PRINTING_STATUSES =
  [
    "pending",
    "quoted",
    "paid",
    "printing",
    "completed",
    "cancelled",
  ] as const;


/*
 * ==========================================================
 * STATUS GUARD
 * ==========================================================
 */

function isPrintingOrderStatus(
  value:
    unknown,
): value is PrintingOrderStatus {

  return (
    typeof value ===
      "string" &&
    (
      PRINTING_STATUSES as readonly string[]
    ).includes(
      value,
    )
  );
}


/*
 * ==========================================================
 * NORMALIZE STATUS
 * ==========================================================
 */

function normalizeStatus(
  value:
    unknown,
): PrintingOrderStatus {

  if (
    isPrintingOrderStatus(
      value,
    )
  ) {

    return value;
  }


  return "pending";
}


/*
 * ==========================================================
 * STATUS LABEL
 * ==========================================================
 */

function statusLabel(
  status:
    PrintingOrderStatus,
): string {

  switch (
    status
  ) {

    case "pending":
      return "Pending";

    case "quoted":
      return "Quoted";

    case "paid":
      return "Paid";

    case "printing":
      return "Printing";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return "Pending";
  }
}


/*
 * ==========================================================
 * STATUS CLASS
 * ==========================================================
 */

function statusClass(
  status:
    PrintingOrderStatus,
): string {

  switch (
    status
  ) {

    case "pending":
      return "bg-amber-50 text-amber-700";

    case "quoted":
      return "bg-blue-50 text-blue-700";

    case "paid":
      return "bg-emerald-50 text-emerald-700";

    case "printing":
      return "bg-violet-50 text-violet-700";

    case "completed":
      return "bg-green-50 text-green-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-700";
  }
}


/*
 * ==========================================================
 * PAYMENT LABEL
 * ==========================================================
 */

function paymentLabel(
  value:
    unknown,
): string {

  if (
    value ===
    "paid"
  ) {

    return "Paid";
  }


  if (
    value ===
      "pending" ||
    value ===
      "unpaid"
  ) {

    return "Pending";
  }


  if (
    value ===
    "processing"
  ) {

    return "Processing";
  }


  if (
    value ===
    "failed"
  ) {

    return "Failed";
  }


  if (
    value ===
    "refunded"
  ) {

    return "Refunded";
  }


  return "Not paid";
}


/*
 * ==========================================================
 * DATE
 * ==========================================================
 */

function getTimeValue(
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

      const item =
        value as {
          toMillis?:
            unknown;

          toDate?:
            unknown;

          seconds?:
            unknown;
        };


      if (
        typeof item.toMillis ===
        "function"
      ) {

        return Number(
          (
            item.toMillis as
              () => unknown
          )(),
        );
      }


      if (
        typeof item.toDate ===
        "function"
      ) {

        const date =
          (
            item.toDate as
              () => unknown
          )();


        if (
          date instanceof Date
        ) {

          return date.getTime();
        }
      }


      if (
        item.seconds !==
        undefined
      ) {

        const seconds =
          Number(
            item.seconds,
          );


        if (
          Number.isFinite(
            seconds,
          )
        ) {

          return (
            seconds *
            1000
          );
        }
      }
    }


    if (
      value instanceof Date
    ) {

      return value.getTime();
    }


    const timestamp =
      new Date(
        String(
          value,
        ),
      ).getTime();


    return Number.isFinite(
      timestamp,
    )
      ? timestamp
      : 0;

  } catch {

    return 0;
  }
}


/*
 * ==========================================================
 * DATE FORMAT
 * ==========================================================
 */

function formatDate(
  value:
    unknown,
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
 * SAFE STRING
 * ==========================================================
 */

function stringValue(
  value:
    unknown,
): string {

  return typeof value ===
    "string"
    ? value
    : "";
}


/*
 * ==========================================================
 * SAFE NUMBER
 * ==========================================================
 */

function numberValue(
  value:
    unknown,
): number {

  return typeof value ===
    "number" &&
    Number.isFinite(
      value,
    )
    ? value
    : Number(
        value,
      ) || 0;
}


/*
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default function PrintingDashboard() {

  /*
   * ========================================================
   * DATA
   * ========================================================
   */

  const [
    orders,
    setOrders,
  ] =
    useState<
      PrintingOrder[]
    >([]);


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
   * SEARCH
   * ========================================================
   */

  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  /*
   * ========================================================
   * FILTER
   * ========================================================
   */

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      PrintingOrderStatus |
      "all"
    >(
      "all",
    );


  /*
   * ========================================================
   * SELECTED ORDER
   * ========================================================
   */

  const [
    selectedOrder,
    setSelectedOrder,
  ] =
    useState<
      PrintingOrder |
      null
    >(null);


  /*
   * ========================================================
   * STATUS UPDATE
   * ========================================================
   */

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<
      string |
      null
    >(null);


  /*
   * ========================================================
   * LOAD
   * ========================================================
   */

  async function loadOrders() {

    try {

      setLoading(
        true,
      );


      setError(
        "",
      );


      const data =
        await getAllPrintingOrders();


      setOrders(
        data,
      );

    } catch (
      loadError
    ) {

      console.error(
        "Failed to load 3D printing orders:",
        loadError,
      );


      setOrders(
        [],
      );


      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load 3D printing requests. Check Firestore rules.",
      );

    } finally {

      setLoading(
        false,
      );
    }
  }


  /*
   * ========================================================
   * INITIAL LOAD
   * ========================================================
   */

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (active) {
        return loadOrders();
      }
    });

    return () => {
      active = false;
    };
  }, []);


  /*
   * ========================================================
   * FILTER
   * ========================================================
   */

  const filteredOrders =
    useMemo(
      () => {

        const queryText =
          search
            .trim()
            .toLowerCase();


        return orders.filter(
          (
            order,
          ) => {

            const normalizedStatus =
              normalizeStatus(
                order.status,
              );


            const customerName =
              stringValue(
                order.customerName,
              )
                .toLowerCase();


            const customerEmail =
              stringValue(
                order.customerEmail,
              )
                .toLowerCase();

            const customerPhone =
              stringValue(
                order.customerPhone,
              )
                .toLowerCase();


            const fileName =
              stringValue(
                order.originalFileName,
              )
                .toLowerCase();


            const orderId =
              order.id
                .toLowerCase();


            const matchesSearch =
              queryText ===
                "" ||
              customerName.includes(
                queryText,
              ) ||
              customerEmail.includes(
                queryText,
              ) ||
              customerPhone.includes(
                queryText,
              ) ||
              fileName.includes(
                queryText,
              ) ||
              orderId.includes(
                queryText,
              );


            const matchesStatus =
              statusFilter ===
                "all" ||
              normalizedStatus ===
                statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );
          },
        );
      },
      [
        orders,
        search,
        statusFilter,
      ],
    );


  /*
   * ========================================================
   * COUNTS
   * ========================================================
   */

  const counts =
    useMemo(
      () => {

        let pending =
          0;

        let paid =
          0;

        let printing =
          0;

        let completed =
          0;


        for (
          const order of orders
        ) {

          const status =
            normalizeStatus(
              order.status,
            );


          const payment =
            stringValue(
              order.paymentStatus,
            );


          if (
            status ===
            "pending"
          ) {

            pending +=
              1;
          }


          if (
            payment ===
              "paid" ||
            status ===
              "paid"
          ) {

            paid +=
              1;
          }


          if (
            status ===
            "printing"
          ) {

            printing +=
              1;
          }


          if (
            status ===
            "completed"
          ) {

            completed +=
              1;
          }
        }


        return {
          pending,
          paid,
          printing,
          completed,
        };

      },
      [
        orders,
      ],
    );


  /*
   * ========================================================
   * UPDATE STATUS
   * ========================================================
   */

  async function handleStatusChange(
    order:
      PrintingOrder,

    nextStatus:
      PrintingOrderStatus,
  ) {

    const currentStatus =
      normalizeStatus(
        order.status,
      );


    if (
      currentStatus ===
      nextStatus
    ) {

      return;
    }


    try {

      setUpdatingId(
        order.id,
      );


      setError(
        "",
      );


      await updatePrintingOrderAdmin(
        order.id,

        {
          status:
            nextStatus,
        },
      );


      /*
       * Keep the UI instantly synchronized.
       */

      setOrders(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item.id ===
                order.id
                ? {
                    ...item,
                    status:
                      nextStatus,
                  }
                : item,
          ),
      );


      setSelectedOrder(
        (
          current,
        ) =>
          current &&
          current.id ===
            order.id
            ? {
                ...current,
                status:
                  nextStatus,
              }
            : current,
      );

    } catch (
      updateError
    ) {

      console.error(
        "Failed to update printing order:",
        updateError,
      );


      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update printing request.",
      );

    } finally {

      setUpdatingId(
        null,
      );
    }
  }


  /*
   * ========================================================
   * SAVE QUOTATION
   * ========================================================
   */

  async function handleSaveQuote(
    order: PrintingOrder,
    finalPrice: number,
  ): Promise<void> {
    if (!Number.isFinite(finalPrice) || finalPrice < 0) {
      throw new Error("Enter a valid quotation price.");
    }

    const normalizedPrice = Math.ceil(finalPrice);

    try {
      setUpdatingId(order.id);
      setError("");

      await updatePrintingOrderAdmin(order.id, {
        finalPrice: normalizedPrice,
        status: "quoted",
      });

      const updatedAt = new Date().toISOString();

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                finalPrice: normalizedPrice,
                status: "quoted",
                updatedAt,
              }
            : item,
        ),
      );

      setSelectedOrder((current) =>
        current && current.id === order.id
          ? {
              ...current,
              finalPrice: normalizedPrice,
              status: "quoted",
              updatedAt,
            }
          : current,
      );
    } catch (updateError) {
      console.error("Failed to save printing quotation:", updateError);

      const message =
        updateError instanceof Error
          ? updateError.message
          : "Unable to save the quotation.";

      setError(message);
      throw new Error(message, { cause: updateError });
    } finally {
      setUpdatingId(null);
    }
  }


  async function handleSaveAdminNotes(
    order: PrintingOrder,
    adminNotes: string,
  ): Promise<void> {
    const normalizedNotes = adminNotes.slice(0, 5000);

    try {
      setUpdatingId(order.id);
      setError("");

      await updatePrintingOrderAdmin(order.id, {
        adminNotes: normalizedNotes,
      });

      const updatedAt = new Date().toISOString();

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                adminNotes: normalizedNotes,
                updatedAt,
              }
            : item,
        ),
      );

      setSelectedOrder((current) =>
        current && current.id === order.id
          ? {
              ...current,
              adminNotes: normalizedNotes,
              updatedAt,
            }
          : current,
      );
    } catch (updateError) {
      console.error("Failed to save admin notes:", updateError);

      const message =
        updateError instanceof Error
          ? updateError.message
          : "Unable to save admin notes.";

      setError(message);
      throw new Error(message, { cause: updateError });
    } finally {
      setUpdatingId(null);
    }
  }


  /*
   * ========================================================
   * OPEN FILE
   * ========================================================
   */

  async function openStorageFile(
    order:
      PrintingOrder,
  ) {

    const storagePath =
      stringValue(
        order.storagePath,
      );

    if (!storagePath) {
      setError(
        "No downloadable STL file is attached to this request.",
      );
      return;
    }

    try {
      await downloadPrintingStlFile(
        storagePath,
        stringValue(order.originalFileName) || "model.stl",
      );
    } catch (error) {
      console.error(
        "Failed to download printing STL file:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to download the STL file.",
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

      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />

            <div className="mt-3 h-10 w-64 animate-pulse rounded bg-neutral-200" />

          </div>

        </div>


        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          {
            Array.from({
              length: 4,
            }).map(
              (
                _item,
                index,
              ) => (

                <div
                  key={
                    index
                  }

                  className="h-36 animate-pulse rounded-3xl bg-neutral-100"
                />

              ),
            )
          }

        </div>


        <div className="h-[500px] animate-pulse rounded-3xl bg-neutral-100" />

      </div>
    );
  }


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (

    <div className="space-y-7">

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Manufacturing
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            3D Printing
          </h1>


          <p className="mt-2 text-sm text-neutral-500">
            Review customer STL requests, inspect files, set final pricing and control the production workflow.
          </p>

        </div>


        <div className="flex flex-wrap gap-3">

          <button
            type="button"

            onClick={() =>
              void loadOrders()
            }

            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3.5 text-sm font-bold text-neutral-800 shadow-sm hover:border-[#D4AF37]"
          >

            <RefreshCw
              size={16}
            />

            Refresh

          </button>


          <Link
            to="/admin/printing/settings"

            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 hover:bg-[#b99622]"
          >

            <Printer
              size={16}
            />

            Printing Settings

          </Link>

        </div>

      </div>


      {/* ====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

          <div>

            <p className="font-black">
              Unable to load or update 3D printing data.
            </p>


            <p className="mt-1 leading-6">
              {
                error
              }
            </p>

          </div>


          <button
            type="button"

            onClick={() =>
              setError(
                "",
              )
            }

            className="shrink-0 rounded-lg p-1 text-red-500 hover:bg-red-100"
          >

            <X
              size={18}
            />

          </button>

        </div>

      )}


      {/* ====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Pending"
          value={
            counts.pending
          }
          icon={
            Clock3
          }
        />


        <StatCard
          label="Paid"
          value={
            counts.paid
          }
          icon={
            CheckCircle2
          }
        />


        <StatCard
          label="Printing"
          value={
            counts.printing
          }
          icon={
            Printer
          }
        />


        <StatCard
          label="Completed"
          value={
            counts.completed
          }
          icon={
            PackageCheck
          }
        />

      </div>


      {/* ====================================================
          REQUEST LIST
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">

        {/* SEARCH */}

        <div className="border-b border-neutral-100 p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

            <div className="relative min-w-0 flex-1">

              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />


              <input
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

                placeholder="Search customer, email, STL filename or request ID..."

                className="w-full rounded-2xl border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-[#D4AF37]"
              />

            </div>


            <select
              value={
                statusFilter
              }

              onChange={
                (
                  event,
                ) => {

                  const value =
                    event.target.value;


                  if (
                    value ===
                    "all"
                  ) {

                    setStatusFilter(
                      "all",
                    );

                    return;
                  }


                  if (
                    isPrintingOrderStatus(
                      value,
                    )
                  ) {

                    setStatusFilter(
                      value,
                    );

                  }

                }
              }

              className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-bold text-neutral-800 outline-none focus:border-[#D4AF37]"
            >

              <option value="all">
                All Statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="quoted">
                Quoted
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="printing">
                Printing
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

            </select>

          </div>


          <p className="mt-3 text-xs text-neutral-400">

            {
              filteredOrders.length
            }

            {" "}

            {
              filteredOrders.length ===
              1
                ? "printing request"
                : "printing requests"
            }

          </p>

        </div>


        {/* ==================================================
            EMPTY
        =================================================== */}

        {filteredOrders.length ===
          0 ? (

          <div className="px-6 py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <Printer
                size={29}
              />

            </div>


            <h2 className="mt-5 text-2xl font-black text-neutral-950">
              No printing requests found
            </h2>


            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">

              {
                orders.length ===
                0
                  ? "No 3D printing requests are currently available."
                  : "Try changing the search or status filter."
              }

            </p>

          </div>

        ) : (

          <div className="divide-y divide-neutral-100">

            {
              filteredOrders.map(
                (
                  order,
                ) => (

                  <PrintingOrderRow
                    key={
                      order.id
                    }

                    order={
                      order
                    }

                    updating={
                      updatingId ===
                      order.id
                    }

                    onOpen={() =>
                      setSelectedOrder(
                        order,
                      )
                    }

                    onStatusChange={
                      handleStatusChange
                    }
                  />

                ),
              )
            }

          </div>

        )}

      </section>


      {/* ====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedOrder && (

        <PrintingOrderModal
          key={selectedOrder.id}
          order={
            selectedOrder
          }

          updating={
            updatingId ===
            selectedOrder.id
          }

          onClose={() =>
            setSelectedOrder(
              null,
            )
          }

          onStatusChange={
            handleStatusChange
          }

          onSaveQuote={
            handleSaveQuote
          }

          onSaveAdminNotes={
            handleSaveAdminNotes
          }

          onDownload={
            openStorageFile
          }

        />

      )}

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
    typeof Clock3;
}) {

  return (

    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-xs font-black uppercase tracking-wider text-neutral-400">

            {
              label
            }

          </p>


          <p className="mt-3 text-4xl font-black text-neutral-950">

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


/*
 * ==========================================================
 * ORDER ROW
 * ==========================================================
 */

function PrintingOrderRow({
  order,
  updating,
  onOpen,
  onStatusChange,
}: {
  order:
    PrintingOrder;

  updating:
    boolean;

  onOpen:
    () => void;

  onStatusChange:
    (
      order:
        PrintingOrder,

      status:
        PrintingOrderStatus,
    ) => Promise<void>;
}) {

  const status =
    normalizeStatus(
      order.status,
    );


  const payment =
    paymentLabel(
      order.paymentStatus,
    );


  const fileName =
    stringValue(
      order.originalFileName,
    ) ||
    "STL file";


  return (

    <div className="px-5 py-5 sm:px-6">

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr_220px] xl:items-center">

        {/* ==================================================
            CUSTOMER
        =================================================== */}

        <div className="min-w-0">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">

              <FileText
                size={19}
              />

            </div>


            <div className="min-w-0">

              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">

                {
                  order.id
                }

              </p>


              <h3 className="mt-1 truncate text-base font-black text-neutral-950">

                {
                  stringValue(
                    order.customerName,
                  ) ||
                  "Customer"
                }

              </h3>


              <p className="mt-1 truncate text-xs text-neutral-500">

                {
                  stringValue(
                    order.customerEmail,
                  )
                }

              </p>


              <p className="mt-2 truncate text-xs font-bold text-[#9b7e1d]">

                {
                  fileName
                }

              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            PRINT INFORMATION
        =================================================== */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">

          <InfoItem
            label="Material"
            value={
              stringValue(
                order.material,
              ) ||
              "—"
            }
          />


          <InfoItem
            label="Finish"
            value={
              stringValue(
                order.finish,
              ) ||
              "—"
            }
          />


          <InfoItem
            label="Quantity"
            value={
              String(
                numberValue(
                  order.quantity,
                ),
              )
            }
          />


          <InfoItem
            label="Estimate"
            value={
              order.estimatedPrice !==
                undefined
                ? `₹${numberValue(
                    order.estimatedPrice,
                  ).toLocaleString("en-IN")}`
                : "—"
            }
          />

        </div>


        {/* ==================================================
            CONTROLS
        =================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 xl:justify-end">

          <div className="flex flex-col items-start gap-1 xl:items-end">

            <span
              className={[
                "rounded-full px-3 py-1.5 text-[10px] font-black",
                statusClass(
                  status,
                ),
              ].join(" ")}
            >

              {
                statusLabel(
                  status,
                )
              }

            </span>


            <span className="text-[10px] font-bold text-neutral-400">

              Payment:

              {" "}

              {
                payment
              }

            </span>

          </div>


          <div className="flex items-center gap-2">

            <select
              value={
                status
              }

              disabled={
                updating
              }

              onChange={
                (
                  event,
                ) => {

                  const next =
                    event.target.value;


                  if (
                    !isPrintingOrderStatus(
                      next,
                    )
                  ) {

                    return;
                  }


                  void onStatusChange(
                    order,
                    next,
                  );

                }
              }

              className="max-w-[130px] rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:border-[#D4AF37]"
            >

              <option value="pending">
                Pending
              </option>

              <option value="quoted">
                Quoted
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="printing">
                Printing
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

            </select>


            <button
              type="button"

              onClick={
                onOpen
              }

              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              aria-label="View printing request"
            >

              <Eye
                size={17}
              />

            </button>

          </div>

        </div>

      </div>


      {/* DATE */}

      <div className="mt-4 border-t border-neutral-100 pt-3 text-[10px] text-neutral-400">

        Submitted

        {" "}

        {
          formatDate(
            order.createdAt,
          )
        }

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * INFO ITEM
 * ==========================================================
 */

function InfoItem({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {

  return (

    <div>

      <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">

        {
          label
        }

      </p>


      <p className="mt-1 truncate text-xs font-bold text-neutral-800">

        {
          value
        }

      </p>

    </div>
  );
}


/*
 * ==========================================================
 * DETAILS MODAL
 * ==========================================================
 */

function PrintingOrderModal({
  order,
  updating,
  onClose,
  onStatusChange,
  onSaveQuote,
  onSaveAdminNotes,
  onDownload,
}: {
  order:
    PrintingOrder;

  updating:
    boolean;

  onClose:
    () => void;

  onStatusChange:
    (
      order:
        PrintingOrder,

      status:
        PrintingOrderStatus,
    ) => Promise<void>;

  onSaveQuote:
    (
      order: PrintingOrder,
      finalPrice: number,
    ) => Promise<void>;

  onSaveAdminNotes:
    (
      order: PrintingOrder,
      adminNotes: string,
    ) => Promise<void>;

  onDownload:
    (
      order:
        PrintingOrder,
    ) => void;
}) {

  const status =
    normalizeStatus(
      order.status,
    );

  const [quotePrice, setQuotePrice] = useState(
    order.finalPrice == null ? "" : String(order.finalPrice),
  );
  const [quoteError, setQuoteError] = useState("");
  const [quoteSuccess, setQuoteSuccess] = useState("");
  const [adminNotesDraft, setAdminNotesDraft] = useState(
    order.adminNotes ?? "",
  );
  const [notesError, setNotesError] = useState("");
  const [notesSuccess, setNotesSuccess] = useState("");

  async function saveAdminNotes(): Promise<void> {
    if (updating) return;

    try {
      setNotesError("");
      setNotesSuccess("");
      await onSaveAdminNotes(order, adminNotesDraft.slice(0, 5000));
      setNotesSuccess("Admin notes saved successfully.");
    } catch (saveError) {
      setNotesError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save admin notes.",
      );
    }
  }

  async function saveQuote() {
    const price = Number(quotePrice);

    if (
      !quotePrice.trim() ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setQuoteError("Enter a valid quotation price.");
      setQuoteSuccess("");
      return;
    }

    try {
      setQuoteError("");
      setQuoteSuccess("");
      await onSaveQuote(order, price);
      setQuoteSuccess(
        "Quotation saved successfully. Payment remains unpaid until verified.",
      );
    } catch (saveError) {
      setQuoteError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the quotation.",
      );
    }
  }

  const dimensions =
    (
      order as
        PrintingOrder & {
          dimensions?: {
            width?:
              number;

            depth?:
              number;

            height?:
              number;
          };
        }
    ).dimensions;


  const estimate =
    (
      order as
        PrintingOrder & {
          estimate?:
            Record<
              string,
              unknown
            >;
        }
    ).estimate;


  return (

    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/50 p-4">

      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5 sm:px-7">

          <div>

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              Printing Request
            </p>


            <h2 className="mt-2 text-2xl font-black text-neutral-950">

              {
                stringValue(
                  order.originalFileName,
                ) ||
                "STL Request"
              }

            </h2>


            <p className="mt-1 text-xs text-neutral-400">

              {
                order.id
              }

            </p>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
          >

            <X
              size={19}
            />

          </button>

        </div>


        {/* ==================================================
            BODY
        =================================================== */}

        <div className="max-h-[calc(92vh-90px)] overflow-y-auto p-6 sm:p-7">

          <div className="grid gap-6 lg:grid-cols-2">

            {/* CUSTOMER */}

            <DetailSection
              title="Customer"
            >

              <DetailRow
                label="Name"
                value={
                  stringValue(
                    order.customerName,
                  ) ||
                  "—"
                }
              />


              <DetailRow
                label="Email"
                value={
                  stringValue(
                    order.customerEmail,
                  ) ||
                  "—"
                }
              />

              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-3 last:border-0">
                <span className="text-xs font-semibold text-neutral-500">Phone</span>
                {order.customerPhone?.trim() ? (
                  <a
                    href={`tel:${order.customerPhone.replace(/[^+\d]/g, "")}`}
                    className="max-w-[65%] break-words text-right text-sm font-semibold text-[#9b7e1d] underline-offset-4 hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                ) : (
                  <span className="text-right text-sm text-neutral-400">Not provided</span>
                )}
              </div>


              <DetailRow
                label="User ID"
                value={
                  stringValue(
                    order.userId,
                  ) ||
                  "—"
                }
              />

            </DetailSection>


            {/* FILE */}

            <DetailSection
              title="STL File"
            >

              <DetailRow
                label="Filename"
                value={
                  stringValue(
                    order.originalFileName,
                  ) ||
                  "—"
                }
              />


              <DetailRow
                label="Storage path"
                value={
                  stringValue(
                    order.storagePath,
                  ) ||
                  "—"
                }
              />


              <button
                type="button"

                onClick={() =>
                  onDownload(
                    order,
                  )
                }

                className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-3 text-xs font-black text-neutral-800 hover:border-[#D4AF37]"
              >

                <Download
                  size={15}
                />

                Download STL File

              </button>

            </DetailSection>


            {/* PRINT */}

            <DetailSection
              title="Print Details"
            >

              <DetailRow
                label="Material"
                value={
                  stringValue(
                    order.material,
                  ) ||
                  "—"
                }
              />


              <DetailRow
                label="Finish"
                value={
                  stringValue(
                    order.finish,
                  ) ||
                  "—"
                }
              />


              <DetailRow
                label="Quantity"
                value={
                  String(
                    numberValue(
                      order.quantity,
                    ),
                  )
                }
              />


              <DetailRow
                label="Estimated weight"
                value={
                  order.estimatedWeightGrams !==
                    undefined
                    ? `${numberValue(
                        order.estimatedWeightGrams,
                      )} g`
                    : "—"
                }
              />


              <DetailRow
                label="Estimated print time"
                value={
                  order.estimatedPrintTimeMinutes !==
                    undefined
                    ? `${numberValue(
                        order.estimatedPrintTimeMinutes,
                      )} min`
                    : "—"
                }
              />

            </DetailSection>


            {/* DIMENSIONS */}

            <DetailSection
              title="Dimensions"
            >

              <DetailRow
                label="Width"
                value={
                  dimensions?.width !==
                    undefined
                    ? `${numberValue(
                        dimensions.width,
                      )} mm`
                    : "—"
                }
              />


              <DetailRow
                label="Depth"
                value={
                  dimensions?.depth !==
                    undefined
                    ? `${numberValue(
                        dimensions.depth,
                      )} mm`
                    : "—"
                }
              />


              <DetailRow
                label="Height"
                value={
                  dimensions?.height !==
                    undefined
                    ? `${numberValue(
                        dimensions.height,
                      )} mm`
                    : "—"
                }
              />


              <DetailRow
                label="Volume"
                value={
                  order.volumeCm3 !==
                    undefined
                    ? `${numberValue(
                        order.volumeCm3,
                      )} cm³`
                    : "—"
                }
              />

            </DetailSection>


            {/* PRICING */}

            <DetailSection
              title="Pricing"
            >

              <DetailRow
                label="Estimated price"
                value={
                  order.estimatedPrice !==
                    undefined
                    ? `₹${numberValue(
                        order.estimatedPrice,
                      ).toLocaleString("en-IN")}`
                    : "—"
                }
              />

              <DetailRow
                label="Final quotation"
                value={
                  order.finalPrice !== undefined &&
                  order.finalPrice !== null
                    ? `₹${numberValue(
                        order.finalPrice,
                      ).toLocaleString("en-IN")}`
                    : "Not quoted yet"
                }
              />

              <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
                <label
                  htmlFor={`printing-final-price-${order.id}`}
                  className="block text-xs font-bold text-neutral-600"
                >
                  Final quotation price (₹)
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id={`printing-final-price-${order.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={quotePrice}
                    disabled={updating}
                    onChange={(event) => {
                      setQuotePrice(event.target.value);
                      setQuoteError("");
                      setQuoteSuccess("");
                    }}
                    placeholder="Enter final price"
                    className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-800 outline-none focus:border-[#D4AF37]"
                  />

                  <button
                    type="button"
                    disabled={updating || !quotePrice.trim()}
                    onClick={() => void saveQuote()}
                    className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-neutral-950 transition hover:bg-[#c6a12f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating
                      ? "Saving..."
                      : status === "quoted"
                        ? "Update Quote"
                        : "Save Quote"}
                  </button>
                </div>

                {quoteError && (
                  <p role="alert" className="text-sm text-red-600">
                    {quoteError}
                  </p>
                )}

                {quoteSuccess && (
                  <p role="status" className="text-sm text-green-700">
                    {quoteSuccess}
                  </p>
                )}

                <p className="text-xs leading-5 text-neutral-500">
                  Saving the quotation changes the order status to Quoted.
                  It does not mark the payment as paid.
                </p>
              </div>

              <DetailRow
                label="Payment"
                value={
                  paymentLabel(
                    order.paymentStatus,
                  )
                }
              />


              <DetailRow
                label="Created"
                value={
                  formatDate(
                    order.createdAt,
                  )
                }
              />

            </DetailSection>


            {/* ESTIMATE */}

            {estimate && (

              <DetailSection
                title="Calculation"
              >

                {
                  Object.entries(
                    estimate,
                  )
                    .filter(
                      (
                        [, value],
                      ) =>
                        typeof value ===
                          "string" ||
                        typeof value ===
                          "number",
                    )
                    .slice(
                      0,
                      12,
                    )
                    .map(
                      (
                        [
                          key,
                          value,
                        ],
                      ) => (

                        <DetailRow
                          key={
                            key
                          }

                          label={
                            key
                              .replace(
                                /([A-Z])/g,
                                " $1",
                              )
                              .replace(
                                /^./,
                                (
                                  character,
                                ) =>
                                  character.toUpperCase(),
                              )
                          }

                          value={
                            String(
                              value,
                            )
                          }
                        />

                      ),
                    )
                }

              </DetailSection>

            )}

          </div>


          {/* =================================================
              NOTES
          ================================================== */}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">

            <NoteBox
              title="Customer Notes"
              value={
                stringValue(
                  order.customerNotes,
                )
              }
            />


            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <label
                htmlFor="printing-admin-notes"
                className="block text-xs font-black uppercase tracking-[0.14em] text-neutral-700"
              >
                Admin Notes
              </label>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Internal production notes and instructions for this request.
              </p>

              <textarea
                id="printing-admin-notes"
                value={adminNotesDraft}
                onChange={(event) => setAdminNotesDraft(event.target.value)}
                maxLength={5000}
                rows={5}
                disabled={updating}
                placeholder="Enter internal notes for this printing order..."
                className="mt-3 w-full resize-y rounded-xl border border-neutral-200 px-3 py-3 text-sm leading-6 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:opacity-60"
              />

              <p className="mt-1 text-right text-xs text-neutral-400">
                {adminNotesDraft.length}/5000 characters
              </p>

              {notesError && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {notesError}
                </p>
              )}

              {notesSuccess && (
                <p role="status" className="mt-3 text-sm text-green-700">
                  {notesSuccess}
                </p>
              )}

              <button
                type="button"
                onClick={() => void saveAdminNotes()}
                disabled={updating}
                className="mt-4 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? "Saving..." : "Save Admin Notes"}
              </button>
            </div>

          </div>


          {/* =================================================
              STATUS CONTROLS
          ================================================== */}

          <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
                  Production Workflow
                </p>


                <p className="mt-1 text-sm font-black text-neutral-950">

                  Current status:

                  {" "}

                  {
                    statusLabel(
                      status,
                    )
                  }

                </p>

              </div>


              <select
                value={
                  status
                }

                disabled={
                  updating
                }

                onChange={
                  (
                    event,
                  ) => {

                    const next =
                      event.target.value;


                    if (
                      !isPrintingOrderStatus(
                        next,
                      )
                    ) {

                      return;
                    }


                    void onStatusChange(
                      order,
                      next,
                    );

                  }
                }

                className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#D4AF37]"
              >

                <option value="pending">
                  Pending
                </option>

                <option value="quoted">
                  Quoted
                </option>

                <option value="paid">
                  Paid
                </option>

                <option value="printing">
                  Printing
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

              </select>

            </div>


            <div className="mt-5 grid gap-2 sm:grid-cols-3">

              <WorkflowButton
                label="Start Printing"
                active={
                  status ===
                  "printing"
                }

                disabled={
                  updating
                }

                onClick={() =>
                  void onStatusChange(
                    order,
                    "printing",
                  )
                }
              />


              <WorkflowButton
                label="Mark Completed"
                active={
                  status ===
                  "completed"
                }

                disabled={
                  updating
                }

                onClick={() =>
                  void onStatusChange(
                    order,
                    "completed",
                  )
                }
              />


              <WorkflowButton
                label="Cancel Request"
                active={
                  status ===
                  "cancelled"
                }

                disabled={
                  updating
                }

                onClick={() =>
                  void onStatusChange(
                    order,
                    "cancelled",
                  )
                }
              />

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * DETAIL SECTION
 * ==========================================================
 */

function DetailSection({
  title,
  children,
}: {
  title:
    string;

  children:
    React.ReactNode;
}) {

  return (

    <section className="rounded-3xl border border-neutral-200 bg-white p-5">

      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">
        {
          title
        }
      </p>


      <div className="mt-4 space-y-3">

        {
          children
        }

      </div>

    </section>
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

    <div className="flex items-start justify-between gap-5 border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">

      <span className="text-xs font-bold text-neutral-400">
        {
          label
        }
      </span>


      <span className="max-w-[65%] break-words text-right text-xs font-bold text-neutral-800">

        {
          value
        }

      </span>

    </div>
  );
}


/*
 * ==========================================================
 * NOTE BOX
 * ==========================================================
 */

function NoteBox({
  title,
  value,
}: {
  title:
    string;

  value:
    string;
}) {

  return (

    <section className="rounded-3xl border border-neutral-200 bg-white p-5">

      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">

        {
          title
        }

      </p>


      <p className="mt-3 min-h-[70px] whitespace-pre-wrap text-sm leading-6 text-neutral-600">

        {
          value ||
          "No notes."
        }

      </p>

    </section>
  );
}


/*
 * ==========================================================
 * WORKFLOW BUTTON
 * ==========================================================
 */

function WorkflowButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label:
    string;

  active:
    boolean;

  disabled:
    boolean;

  onClick:
    () => void;
}) {

  return (

    <button
      type="button"

      disabled={
        disabled ||
        active
      }

      onClick={
        onClick
      }

      className={[
        "rounded-xl border px-4 py-3 text-xs font-black transition",

        active
          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#9b7e1d]"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-[#D4AF37] hover:text-[#9b7e1d]",

        disabled
          ? "cursor-not-allowed opacity-50"
          : "",
      ].join(" ")}
    >

      {
        label
      }

    </button>
  );
}