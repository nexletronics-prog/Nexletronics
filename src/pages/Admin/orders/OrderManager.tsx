import {
  ChevronDown,
  Eye,
  Package,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  updateOrderStatus,
} from "../../../services/order.service";

import {
  subscribeToCollection,
  type RealtimeDocument,
} from "../../../services/realtime.service";

import type {
  Order,
  OrderStatus,
} from "../../../types/order";


/*
 * ==========================================================
 * STATUS OPTIONS
 * ==========================================================
 */

const statusOptions: Array<{
  value: OrderStatus;
  label: string;
}> = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "shipped",
    label: "Shipped",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];


/*
 * ==========================================================
 * STATUS COLORS
 * ==========================================================
 */

function getStatusClasses(
  status: OrderStatus,
): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700";

    case "confirmed":
      return "bg-blue-50 text-blue-700";

    case "processing":
      return "bg-purple-50 text-purple-700";

    case "shipped":
      return "bg-indigo-50 text-indigo-700";

    case "delivered":
      return "bg-green-50 text-green-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}


/*
 * ==========================================================
 * STATUS LABEL
 * ==========================================================
 */

function formatStatus(
  status: OrderStatus,
): string {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}


/*
 * ==========================================================
 * PRICE FORMAT
 * ==========================================================
 */

function formatPrice(
  amount: number,
  currency = "INR",
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(
    amount,
  );
}


/*
 * ==========================================================
 * DATE FORMAT
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
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (
        value as {
          toDate?: unknown;
        }
      ).toDate === "function"
    ) {

      const date =
        (
          value as {
            toDate: () => Date;
          }
        ).toDate();


      return date.toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
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
        dateStyle: "medium",
        timeStyle: "short",
      },
    );

  } catch {
    return "—";
  }
}


/*
 * ==========================================================
 * ORDER NORMALIZER
 * ==========================================================
 */

function normalizeOrder(
  id: string,
  data: Partial<Order>,
): Order {

  return {
    id,

    userId:
      data.userId ??
      "",

    userEmail:
      data.userEmail ??
      "",

    status:
      data.status ??
      "pending",

    currency:
      data.currency ??
      "INR",

    items:
      Array.isArray(
        data.items,
      )
        ? data.items
        : [],

    subtotal:
      typeof data.subtotal ===
      "number"
        ? data.subtotal
        : 0,

    shipping:
      typeof data.shipping ===
      "number"
        ? data.shipping
        : 0,

    total:
      typeof data.total ===
      "number"
        ? data.total
        : 0,

    shippingAddress:
      data.shippingAddress ?? {
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      },

    paymentStatus:
      data.paymentStatus ??
      "pending",

    paymentMethod:
      data.paymentMethod ??
      "",

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}


/*
 * ==========================================================
 * TIMESTAMP SORT
 * ==========================================================
 */

function getTimeValue(
  value: unknown,
): number {

  if (
    value &&
    typeof value ===
      "object"
  ) {

    if (
      "toMillis" in value &&
      typeof (
        value as {
          toMillis?: unknown;
        }
      ).toMillis ===
        "function"
    ) {

      return Number(
        (
          value as {
            toMillis: () => number;
          }
        ).toMillis(),
      );
    }


    if (
      "seconds" in value
    ) {

      return (
        Number(
          (
            value as {
              seconds?: unknown;
            }
          ).seconds ?? 0,
        ) * 1000
      );
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


/*
 * ==========================================================
 * ORDER DETAILS MODAL
 * ==========================================================
 */

interface OrderDetailsModalProps {
  order: Order;

  onClose: () => void;

  onStatusChange: (
    status: OrderStatus,
  ) => void;

  updating: boolean;
}


function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
  updating,
}: OrderDetailsModalProps) {

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Order details"
    >

      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-5">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Order Details
            </p>

            <h2 className="mt-1 text-xl font-black text-neutral-950">
              #
              {order.id.slice(
                0,
                10,
              )}
            </h2>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Close order details"
          >
            <X
              size={18}
            />
          </button>

        </div>


        {/* CONTENT */}

        <div className="overflow-y-auto p-6 sm:p-8">

          {/* STATUS */}

          <div className="rounded-2xl bg-neutral-50 p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Order Status
                </p>


                <span
                  className={[
                    "mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-bold",
                    getStatusClasses(
                      order.status,
                    ),
                  ].join(" ")}
                >
                  {formatStatus(
                    order.status,
                  )}
                </span>

              </div>


              <div>

                <label
                  htmlFor="order-status"
                  className="mb-2 block text-xs font-bold text-neutral-500"
                >
                  Change status
                </label>


                <div className="relative">

                  <select
                    id="order-status"
                    value={
                      order.status
                    }
                    disabled={
                      updating
                    }
                    onChange={(
                      event,
                    ) =>
                      onStatusChange(
                        event.target
                          .value as OrderStatus,
                      )
                    }
                    className="appearance-none rounded-xl border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold outline-none focus:border-[#D4AF37] disabled:opacity-50"
                  >

                    {statusOptions.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}

                  </select>


                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={15}
                  />

                </div>

              </div>

            </div>

          </div>


          {/* CUSTOMER + DELIVERY */}

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <section className="rounded-2xl border border-neutral-200 p-5">

              <h3 className="font-black text-neutral-950">
                Customer
              </h3>


              <div className="mt-4 space-y-2 text-sm">

                <p>
                  <span className="text-neutral-400">
                    Name:
                  </span>{" "}

                  <span className="font-semibold">
                    {
                      order.shippingAddress
                        .name
                    }
                  </span>
                </p>


                <p>
                  <span className="text-neutral-400">
                    Email:
                  </span>{" "}

                  <span className="break-all font-semibold">
                    {
                      order.userEmail
                    }
                  </span>
                </p>


                <p>
                  <span className="text-neutral-400">
                    Phone:
                  </span>{" "}

                  <span className="font-semibold">
                    {
                      order.shippingAddress
                        .phone
                    }
                  </span>
                </p>

              </div>

            </section>


            <section className="rounded-2xl border border-neutral-200 p-5">

              <h3 className="font-black text-neutral-950">
                Delivery Address
              </h3>


              <p className="mt-4 text-sm leading-6 text-neutral-600">

                {
                  order.shippingAddress
                    .name
                }

                <br />

                {
                  order.shippingAddress
                    .address
                }

                <br />

                {
                  order.shippingAddress
                    .city
                }
                ,{" "}
                {
                  order.shippingAddress
                    .state
                }

                <br />

                PIN:{" "}
                {
                  order.shippingAddress
                    .pincode
                }

              </p>

            </section>

          </div>


          {/* ORDER ITEMS */}

          <section className="mt-6 rounded-2xl border border-neutral-200">

            <div className="border-b border-neutral-200 px-5 py-4">

              <h3 className="font-black text-neutral-950">
                Order Items
              </h3>

            </div>


            <div className="divide-y divide-neutral-100">

              {order.items.map(
                (
                  item,
                  index,
                ) => (

                  <div
                    key={`${item.productId}-${index}`}
                    className="flex gap-4 px-5 py-4"
                  >

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#faf8f0]">

                      {item.image ? (

                        <img
                          src={
                            item.image
                          }
                          alt={
                            item.name
                          }
                          className="h-full w-full object-contain p-2"
                        />

                      ) : (

                        <Package
                          className="text-[#D4AF37]"
                          size={20}
                        />

                      )}

                    </div>


                    <div className="min-w-0 flex-1">

                      <p className="font-bold text-neutral-900">
                        {
                          item.name
                        }
                      </p>


                      {item.sku && (
                        <p className="mt-1 text-xs text-neutral-400">
                          SKU:{" "}
                          {
                            item.sku
                          }
                        </p>
                      )}


                      <p className="mt-1 text-xs text-neutral-500">
                        Quantity:{" "}
                        {
                          item.quantity
                        }
                      </p>

                    </div>


                    <p className="shrink-0 font-bold text-neutral-900">
                      {formatPrice(
                        item.price *
                          item.quantity,
                        order.currency,
                      )}
                    </p>

                  </div>

                ),
              )}

            </div>

          </section>


          {/* TOTALS */}

          <section className="mt-6 rounded-2xl bg-neutral-950 p-6 text-white">

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">

                <span className="text-neutral-400">
                  Subtotal
                </span>

                <span className="font-semibold">
                  {formatPrice(
                    order.subtotal,
                    order.currency,
                  )}
                </span>

              </div>


              <div className="flex justify-between">

                <span className="text-neutral-400">
                  Shipping
                </span>

                <span className="font-semibold">
                  {order.shipping ===
                  0
                    ? "FREE"
                    : formatPrice(
                        order.shipping,
                        order.currency,
                      )}
                </span>

              </div>


              <div className="mt-4 flex justify-between border-t border-white/10 pt-4">

                <span className="font-black">
                  Total
                </span>

                <span className="text-xl font-black text-[#D4AF37]">
                  {formatPrice(
                    order.total,
                    order.currency,
                  )}
                </span>

              </div>

            </div>

          </section>


          {/* METADATA */}

          <div className="mt-6 grid gap-4 text-xs text-neutral-500 sm:grid-cols-3">

            <div>
              <span className="font-bold">
                Payment:
              </span>{" "}
              {
                order.paymentStatus
              }
            </div>


            <div>
              <span className="font-bold">
                Method:
              </span>{" "}
              {
                order.paymentMethod
              }
            </div>


            <div>
              <span className="font-bold">
                Created:
              </span>{" "}
              {formatDate(
                order.createdAt,
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
 * ORDER MANAGER
 * ==========================================================
 */

export default function OrderManager() {

  const [
    orders,
    setOrders,
  ] = useState<Order[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<OrderStatus | "all">(
      "all",
    );


  const [
    selectedOrder,
    setSelectedOrder,
  ] =
    useState<Order | null>(
      null,
    );


  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<string | null>(
      null,
    );


  /*
   * ========================================================
   * REALTIME ORDERS
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
      subscribeToCollection<Partial<Order>>(
        "orders",

        (
          items: RealtimeDocument<
            Partial<Order>
          >[],
        ) => {

          const nextOrders =
            items.map(
              (
                item,
              ) =>
                normalizeOrder(
                  item.id,
                  item.data,
                ),
            );


          nextOrders.sort(
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


          setOrders(
            nextOrders,
          );


          /*
           * Keep an opened details modal synchronized.
           */

          setSelectedOrder(
            (
              current,
            ) => {

              if (!current) {
                return current;
              }


              return (
                nextOrders.find(
                  (
                    order,
                  ) =>
                    order.id ===
                    current.id,
                ) ??
                null
              );
            },
          );


          setLoading(
            false,
          );

          setError(
            "",
          );
        },

        {
          onError: (
            listenerError,
          ) => {

            console.error(
              "Realtime orders listener failed:",
              listenerError,
            );


            setError(
              "Unable to connect to the realtime orders database.",
            );


            setLoading(
              false,
            );
          },
        },
      );


    return () => {
      unsubscribe();
    };

  }, []);


  /*
   * ========================================================
   * FILTER ORDERS
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

            const customerName =
              order.shippingAddress
                .name
                .toLowerCase();


            const customerEmail =
              order.userEmail
                .toLowerCase();


            const matchesSearch =
              queryText === "" ||
              order.id
                .toLowerCase()
                .includes(
                  queryText,
                ) ||
              customerEmail.includes(
                queryText,
              ) ||
              customerName.includes(
                queryText,
              );


            const matchesStatus =
              statusFilter ===
                "all" ||
              order.status ===
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
   * STATUS COUNTS
   * ========================================================
   */

  const statusCounts =
    useMemo(
      () => {

        const counts:
          Record<
            OrderStatus,
            number
          > = {
          pending: 0,
          confirmed: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        };


        for (
          const order of orders
        ) {
          counts[
            order.status
          ] += 1;
        }


        return counts;
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
    orderId: string,
    status: OrderStatus,
  ) {

    try {

      setUpdatingId(
        orderId,
      );


      setError(
        "",
      );


      /*
       * Firestore remains the single source of truth.
       *
       * onSnapshot() updates this page and every other
       * connected admin page.
       */

      await updateOrderStatus(
        orderId,
        status,
      );

    } catch (statusError) {

      console.error(
        "Failed to update order:",
        statusError,
      );


      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update order status.",
      );

    } finally {

      setUpdatingId(
        null,
      );
    }
  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading) {

    return (
      <div className="space-y-8">

        <div>
          <div className="h-3 w-28 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-10 w-64 animate-pulse rounded bg-neutral-200" />
        </div>


        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">

          {Array.from(
            {
              length: 6,
            },
          ).map(
            (
              _,
              index,
            ) => (
              <div
                key={
                  index
                }
                className="h-24 animate-pulse rounded-2xl bg-neutral-100"
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

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Sales Management
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Orders
          </h1>


          <p className="mt-2 text-sm text-neutral-500">
            Manage customer orders and update their status.
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
          {error}
        </div>
      )}


      {/* STATUS FILTERS */}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">

        {statusOptions.map(
          (
            option,
          ) => {

            const isActive =
              statusFilter ===
              option.value;


            return (
              <button
                key={
                  option.value
                }
                type="button"
                onClick={() =>
                  setStatusFilter(
                    isActive
                      ? "all"
                      : option.value,
                  )
                }
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  isActive
                    ? "border-[#D4AF37] bg-[#fffdf7]"
                    : "border-neutral-200 bg-white hover:border-[#D4AF37]/50",
                ].join(" ")}
              >

                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  {
                    option.label
                  }
                </p>


                <p className="mt-2 text-2xl font-black text-neutral-950">
                  {
                    statusCounts[
                      option.value
                    ]
                  }
                </p>

              </button>
            );
          },
        )}

      </div>


      {/* FILTER BAR */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">

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
              placeholder="Search order ID, email or customer..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-5 text-sm outline-none transition focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          <div className="self-center text-sm font-semibold text-neutral-500 lg:text-right">

            Showing{" "}
            {
              filteredOrders.length
            }{" "}
            of{" "}
            {
              orders.length
            }{" "}
            orders

          </div>

        </div>

      </section>


      {/* ORDER TABLE */}

      {filteredOrders.length === 0 ? (

        <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-14 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <Package
              size={28}
            />

          </div>


          <h2 className="mt-5 text-2xl font-black text-neutral-950">
            No orders found
          </h2>


          <p className="mt-2 text-sm text-neutral-500">
            Orders matching your current filter will appear here.
          </p>

        </section>

      ) : (

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="border-b border-neutral-200 bg-neutral-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Order
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Customer
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Items
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Total
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Status
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Date
                  </th>


                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-neutral-100">

                {filteredOrders.map(
                  (
                    order,
                  ) => (

                    <tr
                      key={
                        order.id
                      }
                      className="transition hover:bg-neutral-50"
                    >

                      <td className="px-6 py-5">

                        <p className="font-black text-neutral-950">
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
                            order.paymentStatus
                          }
                        </p>

                      </td>


                      <td className="px-6 py-5">

                        <p className="max-w-[220px] truncate text-sm font-bold text-neutral-900">
                          {
                            order.shippingAddress
                              .name
                          }
                        </p>


                        <p className="mt-1 max-w-[220px] truncate text-xs text-neutral-400">
                          {
                            order.userEmail
                          }
                        </p>

                      </td>


                      <td className="px-6 py-5">

                        <span className="font-semibold text-neutral-700">
                          {
                            order.items.length
                          }
                        </span>


                        <span className="text-xs text-neutral-400">
                          {" "}
                          products
                        </span>

                      </td>


                      <td className="px-6 py-5">

                        <p className="font-black text-neutral-950">
                          {formatPrice(
                            order.total,
                            order.currency,
                          )}
                        </p>

                      </td>


                      <td className="px-6 py-5">

                        <div className="relative inline-flex">

                          <select
                            value={
                              order.status
                            }
                            disabled={
                              updatingId ===
                              order.id
                            }
                            onChange={(
                              event,
                            ) =>
                              void handleStatusChange(
                                order.id,
                                event.target
                                  .value as OrderStatus,
                              )
                            }
                            className={[
                              "appearance-none rounded-full py-2 pl-3 pr-8 text-xs font-bold outline-none",
                              getStatusClasses(
                                order.status,
                              ),
                              updatingId ===
                              order.id
                                ? "opacity-50"
                                : "",
                            ].join(" ")}
                          >

                            {statusOptions.map(
                              (
                                option,
                              ) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              ),
                            )}

                          </select>


                          <ChevronDown
                            size={13}
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                          />

                        </div>

                      </td>


                      <td className="px-6 py-5">

                        <span className="text-xs text-neutral-500">
                          {formatDate(
                            order.createdAt,
                          )}
                        </span>

                      </td>


                      <td className="px-6 py-5 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order,
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                          title="View order"
                        >

                          <Eye
                            size={16}
                          />

                        </button>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        </section>

      )}


      {/* DETAILS MODAL */}

      {selectedOrder && (
        <OrderDetailsModal
          order={
            selectedOrder
          }
          onClose={() =>
            setSelectedOrder(
              null,
            )
          }
          updating={
            updatingId ===
            selectedOrder.id
          }
          onStatusChange={(
            status,
          ) =>
            void handleStatusChange(
              selectedOrder.id,
              status,
            )
          }
        />
      )}

    </div>
  );
}