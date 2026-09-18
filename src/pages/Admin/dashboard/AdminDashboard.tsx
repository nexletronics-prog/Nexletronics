import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Globe,
  Mail,
  PackageCheck,
  Printer,
  RefreshCw,
  Send,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
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
  subscribeToCollection,
} from "../../../services/realtime.service";

import type {
  Product,
} from "../../../types/product";

import type {
  Order,
} from "../../../types/order";


/*
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

function formatPrice(
  value: number,
): string {

  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0,
    },
  ).format(
    Number.isFinite(
      value,
    )
      ? value
      : 0,
  );
}


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
          ).seconds ??
            0,
        ) *
        1000
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


function formatDate(
  value: unknown,
): string {

  const time =
    getTimeValue(
      value,
    );


  if (
    !time
  ) {

    return "—";
  }


  return new Date(
    time,
  ).toLocaleDateString(
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


/*
 * ==========================================================
 * PRODUCT NORMALIZER
 * ==========================================================
 */

function normalizeProduct(
  id: string,
  data: Partial<Product>,
): Product {

  const images =
    Array.isArray(
      data.images,
    )
      ? data.images.filter(
          (
            item,
          ): item is string =>
            typeof item ===
              "string" &&
            item.trim().length >
              0,
        )
      : [];


  const image =
    typeof data.image ===
      "string"
      ? data.image
      : undefined;


  const imageUrl =
    typeof data.imageUrl ===
      "string"
      ? data.imageUrl
      : image;


  const primaryImage =
    imageUrl ||
    image ||
    images[0];


  return {

    id,

    name:
      data.name ??
      "Unnamed product",

    description:
      data.description ??
      "",

    category:
      data.category ??
      "Electronics",

    price:
      typeof data.price ===
        "number"
        ? data.price
        : 0,

    currency:
      data.currency ??
      "INR",

    stock:
      typeof data.stock ===
        "number"
        ? data.stock
        : 0,

    available:
      data.available ??
      data.active ??
      true,

    active:
      data.active,

    featured:
      data.featured,

    bestSeller:
      data.bestSeller,

    trending:
      data.trending,

    image:
      primaryImage,

    imageUrl:
      primaryImage,

    images:
      primaryImage
        ? [
            primaryImage,
          ]
        : [],

    slug:
      data.slug,

    sku:
      data.sku,

    shortDescription:
      data.shortDescription,

    compareAtPrice:
      data.compareAtPrice,

    specifications:
      data.specifications,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,

  };
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
    ...(data as Order),

    id,

    userId:
      data.userId ??
      "",

    userEmail:
      data.userEmail ??
      "",

    items:
      Array.isArray(
        data.items,
      )
        ? data.items
        : [],

    shippingAddress:
      data.shippingAddress ??
      {
        name:
          "",

        phone:
          "",

        email:
          "",

        address:
          "",

        city:
          "",

        state:
          "",

        pincode:
          "",
      },

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

    currency:
      data.currency ??
      "INR",

    status:
      data.status ??
      "pending",

    paymentStatus:
      data.paymentStatus ??
      "pending",

    paymentMethod:
      data.paymentMethod ??
      "pending",

  };
}


/*
 * ==========================================================
 * SIMPLE FIREBASE RECORD
 * ==========================================================
 */

interface SimpleRecord {
  id: string;

  data: Record<
    string,
    unknown
  >;
}


/*
 * ==========================================================
 * ADMIN DASHBOARD
 * ==========================================================
 */

export default function AdminDashboard() {

  /*
   * ========================================================
   * PRODUCT STATE
   * ========================================================
   */

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      [],
    );


  /*
   * ========================================================
   * ORDER STATE
   * ========================================================
   */

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>(
      [],
    );


  /*
   * ========================================================
   * CUSTOMER STATE
   * ========================================================
   */

  const [
    customers,
    setCustomers,
  ] =
    useState<
      SimpleRecord[]
    >([]);


  /*
   * ========================================================
   * ENQUIRY STATE
   * ========================================================
   */

  const [
    enquiries,
    setEnquiries,
  ] =
    useState<
      SimpleRecord[]
    >([]);


  /*
   * ========================================================
   * 3D PRINTING STATE
   * ========================================================
   */

  const [
    printingOrders,
    setPrintingOrders,
  ] =
    useState<
      SimpleRecord[]
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
    useState<boolean>(
      true,
    );


  /*
   * ========================================================
   * REFRESHING
   * ========================================================
   */

  const [
    refreshing,
    setRefreshing,
  ] =
    useState<boolean>(
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
    useState<string>(
      "",
    );


  /*
   * ========================================================
   * REALTIME PRODUCTS
   * ========================================================
   */

  useEffect(
    () => {

      const unsubscribe =
        subscribeToCollection<
          Partial<Product>
        >(
          "products",

          (
            items,
          ) => {

            const nextProducts =
              items.map(
                (
                  item,
                ) =>
                  normalizeProduct(
                    item.id,
                    item.data,
                  ),
              );


            nextProducts.sort(
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


            setProducts(
              nextProducts,
            );


            setLoading(
              false,
            );


            setRefreshing(
              false,
            );

          },

          {
            onError: (
              listenerError,
            ) => {

              console.error(
                "Realtime products failed:",
                listenerError,
              );


              setError(
                listenerError instanceof Error
                  ? listenerError.message
                  : "Unable to load products.",
              );


              setLoading(
                false,
              );


              setRefreshing(
                false,
              );

            },
          },
        );


      return () => {

        unsubscribe();

      };

    },
    [],
  );


  /*
   * ========================================================
   * REALTIME ORDERS
   * ========================================================
   */

  useEffect(
    () => {

      const unsubscribe =
        subscribeToCollection<
          Partial<Order>
        >(
          "orders",

          (
            items,
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

          },

          {
            onError: (
              listenerError,
            ) => {

              console.error(
                "Realtime orders failed:",
                listenerError,
              );

            },
          },
        );


      return () => {

        unsubscribe();

      };

    },
    [],
  );


  /*
   * ========================================================
   * REALTIME CUSTOMERS
   * ========================================================
   */

  useEffect(
    () => {

      const unsubscribe =
        subscribeToCollection<
          Record<
            string,
            unknown
          >
        >(
          "users",

          (
            items,
          ) => {

            setCustomers(
              items,
            );

          },

          {
            onError: (
              listenerError,
            ) => {

              console.error(
                "Realtime customers failed:",
                listenerError,
              );

            },
          },
        );


      return () => {

        unsubscribe();

      };

    },
    [],
  );


  /*
   * ========================================================
   * REALTIME ENQUIRIES
   * ========================================================
   */

  useEffect(
    () => {

      const unsubscribe =
        subscribeToCollection<
          Record<
            string,
            unknown
          >
        >(
          "contacts",

          (
            items,
          ) => {

            setEnquiries(
              items,
            );

          },

          {
            onError: (
              listenerError,
            ) => {

              console.error(
                "Realtime enquiries failed:",
                listenerError,
              );

            },
          },
        );


      return () => {

        unsubscribe();

      };

    },
    [],
  );


  /*
   * ========================================================
   * REALTIME 3D PRINTING
   * ========================================================
   */

  useEffect(
    () => {

      const unsubscribe =
        subscribeToCollection<
          Record<
            string,
            unknown
          >
        >(
          "threeDPrintOrders",

          (
            items,
          ) => {

            setPrintingOrders(
              items,
            );

          },

          {
            onError: (
              listenerError,
            ) => {

              console.error(
                "Realtime 3D printing failed:",
                listenerError,
              );

            },
          },
        );


      return () => {

        unsubscribe();

      };

    },
    [],
  );


  /*
   * ========================================================
   * MANUAL REFRESH FEEDBACK
   * ========================================================
   */

  function handleRefresh() {

    setRefreshing(
      true,
    );


    window.setTimeout(
      () => {

        setRefreshing(
          false,
        );

      },
      500,
    );

  }


  /*
   * ========================================================
   * PRODUCT STATS
   * ========================================================
   */

  const activeProducts =
    useMemo(
      () =>
        products.filter(
          (
            product,
          ) =>
            product.available !==
            false,
        ).length,

      [
        products,
      ],
    );


  const featuredProducts =
    useMemo(
      () =>
        products.filter(
          (
            product,
          ) =>
            Boolean(
              product.featured,
            ),
        ).length,

      [
        products,
      ],
    );


  const catalogueValue =
    useMemo(
      () =>
        products.reduce(
          (
            total,
            product,
          ) =>
            total +
            (
              Number(
                product.price,
              ) || 0
            ),

          0,
        ),

      [
        products,
      ],
    );


  const latestProducts =
    useMemo(
      () =>
        products.slice(
          0,
          6,
        ),

      [
        products,
      ],
    );


  /*
   * ========================================================
   * ORDER STATS
   * ========================================================
   */

  const nonCancelledOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order,
          ) =>
            order.status !==
            "cancelled",
        ),

      [
        orders,
      ],
    );


  const totalRevenue =
    useMemo(
      () =>
        nonCancelledOrders.reduce(
          (
            total,
            order,
          ) =>
            total +
            (
              Number(
                order.total,
              ) || 0
            ),

          0,
        ),

      [
        nonCancelledOrders,
      ],
    );


  const pendingOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order,
          ) =>
            order.status ===
            "pending",
        ).length,

      [
        orders,
      ],
    );


  const processingOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order,
          ) =>
            order.status ===
              "processing" ||
            order.status ===
              "confirmed",
        ).length,

      [
        orders,
      ],
    );


  const shippedOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order,
          ) =>
            order.status ===
            "shipped",
        ).length,

      [
        orders,
      ],
    );


  const deliveredOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order,
          ) =>
            order.status ===
            "delivered",
        ).length,

      [
        orders,
      ],
    );


  const recentOrders =
    useMemo(
      () =>
        [
          ...orders,
        ]
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
          )
          .slice(
            0,
            6,
          ),

      [
        orders,
      ],
    );


  /*
   * ========================================================
   * ENQUIRY STATS
   * ========================================================
   */

  const newEnquiries =
    useMemo(
      () =>
        enquiries.filter(
          (
            enquiry,
          ) =>
            enquiry.data.status ===
              "new" ||
            !enquiry.data.status,
        ).length,

      [
        enquiries,
      ],
    );


  /*
   * ========================================================
   * PRINTING STATS
   * ========================================================
   */

  const newPrintingRequests =
    useMemo(
      () =>
        printingOrders.filter(
          (
            item,
          ) => {

            const status =
              String(
                item.data.status ??
                "pending",
              )
                .toLowerCase();


            return (
              status ===
                "pending" ||
              status ===
                "new"
            );

          },
        ).length,

      [
        printingOrders,
      ],
    );


  const activePrintingOrders =
    useMemo(
      () =>
        printingOrders.filter(
          (
            item,
          ) => {

            const status =
              String(
                item.data.status ??
                "",
              )
                .toLowerCase();


            return (
              status ===
                "quoted" ||
              status ===
                "confirmed" ||
              status ===
                "printing" ||
              status ===
                "processing"
            );

          },
        ).length,

      [
        printingOrders,
      ],
    );


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

          <div className="h-3 w-28 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-10 w-64 animate-pulse rounded bg-neutral-200" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-neutral-100" />

        </div>


        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

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

                  className="h-32 animate-pulse rounded-3xl bg-neutral-100"
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
   * DASHBOARD
   * ========================================================
   */

  return (

    <div className="space-y-8">

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Nexletronics Admin
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Dashboard
          </h1>


          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Live overview of your store, customers, orders,
            enquiries and 3D-printing requests.
          </p>

        </div>


        <div className="flex flex-wrap items-center gap-3">

          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-green-700">

            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

            Live

          </div>


          <button
            type="button"

            onClick={
              handleRefresh
            }

            disabled={
              refreshing
            }

            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-50"
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {
              refreshing
                ? "Syncing..."
                : "Refresh"
            }

          </button>

        </div>

      </div>


      {/* ====================================================
          ERROR
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


      {/* ====================================================
          TOP BUSINESS STATS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* REVENUE */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Revenue
              </p>


              <p className="mt-3 text-3xl font-black text-neutral-950">

                {
                  formatPrice(
                    totalRevenue,
                  )
                }

              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Non-cancelled orders
              </p>

            </div>


            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">

              <TrendingUp
                size={20}
              />

            </div>

          </div>

        </div>


        {/* ORDERS */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Orders
              </p>


              <p className="mt-3 text-3xl font-black text-neutral-950">

                {
                  orders.length
                }

              </p>


              <p className="mt-1 text-xs text-neutral-500">
                All order records
              </p>

            </div>


            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

              <ShoppingBag
                size={20}
              />

            </div>

          </div>

        </div>


        {/* CUSTOMERS */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Customers
              </p>


              <p className="mt-3 text-3xl font-black text-neutral-950">

                {
                  customers.length
                }

              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Registered accounts
              </p>

            </div>


            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">

              <Users
                size={20}
              />

            </div>

          </div>

        </div>


        {/* PRODUCTS */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Products
              </p>


              <p className="mt-3 text-3xl font-black text-neutral-950">

                {
                  products.length
                }

              </p>


              <p className="mt-1 text-xs text-neutral-500">
                Total catalogue
              </p>

            </div>


            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

              <Boxes
                size={20}
              />

            </div>

          </div>

        </div>

      </div>


      {/* ====================================================
          ATTENTION CARDS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Link
          to="/admin/orders"
          className="group rounded-3xl border border-amber-200 bg-amber-50/60 p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
        >

          <div className="flex items-center justify-between">

            <Clock3
              size={20}
              className="text-amber-600"
            />


            <ArrowRight
              size={17}
              className="text-amber-600 transition group-hover:translate-x-1"
            />

          </div>


          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-amber-700">
            Pending Orders
          </p>


          <p className="mt-1 text-2xl font-black text-neutral-950">

            {
              pendingOrders
            }

          </p>

        </Link>


        <Link
          to="/admin/orders"
          className="group rounded-3xl border border-blue-200 bg-blue-50/60 p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
        >

          <div className="flex items-center justify-between">

            <PackageCheck
              size={20}
              className="text-blue-600"
            />


            <ArrowRight
              size={17}
              className="text-blue-600 transition group-hover:translate-x-1"
            />

          </div>


          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-blue-700">
            Processing
          </p>


          <p className="mt-1 text-2xl font-black text-neutral-950">

            {
              processingOrders
            }

          </p>

        </Link>


        <Link
          to="/admin/contacts"
          className="group rounded-3xl border border-red-200 bg-red-50/60 p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
        >

          <div className="flex items-center justify-between">

            <Mail
              size={20}
              className="text-red-600"
            />


            <ArrowRight
              size={17}
              className="text-red-600 transition group-hover:translate-x-1"
            />

          </div>


          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-red-700">
            New Enquiries
          </p>


          <p className="mt-1 text-2xl font-black text-neutral-950">

            {
              newEnquiries
            }

          </p>

        </Link>


        <Link
          to="/admin/printing"
          className="group rounded-3xl border border-purple-200 bg-purple-50/60 p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
        >

          <div className="flex items-center justify-between">

            <Printer
              size={20}
              className="text-purple-600"
            />


            <ArrowRight
              size={17}
              className="text-purple-600 transition group-hover:translate-x-1"
            />

          </div>


          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-purple-700">
            3D Printing
          </p>


          <p className="mt-1 text-2xl font-black text-neutral-950">

            {
              newPrintingRequests
            }

          </p>


          <p className="mt-1 text-[11px] text-neutral-500">
            New requests
          </p>

        </Link>

      </div>


      {/* ====================================================
          ORDER STATUS
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
              Operations
            </p>


            <h2 className="mt-1 text-xl font-black text-neutral-950">
              Order Status
            </h2>

          </div>


          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 transition hover:text-[#D4AF37]"
          >

            View all orders

            <ArrowRight
              size={14}
            />

          </Link>

        </div>


        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-amber-50 p-5">

            <Clock3
              size={19}
              className="text-amber-600"
            />


            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-amber-700">
              Pending
            </p>


            <p className="mt-1 text-2xl font-black">
              {
                pendingOrders
              }
            </p>

          </div>


          <div className="rounded-2xl bg-blue-50 p-5">

            <PackageCheck
              size={19}
              className="text-blue-600"
            />


            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-blue-700">
              Processing
            </p>


            <p className="mt-1 text-2xl font-black">
              {
                processingOrders
              }
            </p>

          </div>


          <div className="rounded-2xl bg-violet-50 p-5">

            <Send
              size={19}
              className="text-violet-600"
            />


            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-violet-700">
              Shipped
            </p>


            <p className="mt-1 text-2xl font-black">
              {
                shippedOrders
              }
            </p>

          </div>


          <div className="rounded-2xl bg-green-50 p-5">

            <CheckCircle2
              size={19}
              className="text-green-600"
            />


            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-green-700">
              Delivered
            </p>


            <p className="mt-1 text-2xl font-black">
              {
                deliveredOrders
              }
            </p>

          </div>

        </div>

      </section>


      {/* ====================================================
          RECENT ORDERS
      ===================================================== */}

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-neutral-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="font-black text-neutral-950">
              Recent Orders
            </h2>


            <p className="mt-1 text-xs text-neutral-500">
              Live orders from Firestore.
            </p>

          </div>


          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 transition hover:text-[#D4AF37]"
          >

            Manage Orders

            <ArrowRight
              size={14}
            />

          </Link>

        </div>


        {recentOrders.length ===
        0 ? (

          <div className="p-12 text-center">

            <ShoppingBag
              size={30}
              className="mx-auto text-[#D4AF37]"
            />


            <h3 className="mt-4 font-black text-neutral-900">
              No orders yet
            </h3>


            <p className="mt-2 text-sm text-neutral-500">
              Orders will appear here automatically.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-neutral-100">

            {
              recentOrders.map(
                (
                  order,
                ) => (

                  <Link
                    key={
                      order.id
                    }

                    to="/admin/orders"

                    className="flex flex-col gap-4 px-6 py-5 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

                        <ShoppingBag
                          size={18}
                        />

                      </div>


                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-neutral-950">

                          #

                          {
                            order.id.slice(
                              0,
                              10,
                            )
                          }

                        </p>


                        <p className="mt-1 truncate text-xs text-neutral-400">

                          {
                            order.userEmail ||
                            order.shippingAddress.email ||
                            "No email"
                          }

                        </p>

                      </div>

                    </div>


                    <div className="flex items-center gap-6">

                      <div className="text-right">

                        <p className="font-black text-neutral-950">

                          {
                            formatPrice(
                              order.total,
                            )
                          }

                        </p>


                        <p className="mt-1 text-[10px] text-neutral-400">

                          {
                            formatDate(
                              order.createdAt,
                            )
                          }

                        </p>

                      </div>


                      <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-bold capitalize text-neutral-600">

                        {
                          order.status
                        }

                      </span>

                    </div>

                  </Link>

                ),
              )
            }

          </div>

        )}

      </section>


      {/* ====================================================
          3D PRINTING + ENQUIRIES
      ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* 3D PRINTING */}

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                3D Printing
              </p>


              <h2 className="mt-1 text-xl font-black text-neutral-950">
                Printing Requests
              </h2>

            </div>


            <Printer
              size={22}
              className="text-[#D4AF37]"
            />

          </div>


          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-2xl bg-neutral-50 p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                New
              </p>


              <p className="mt-2 text-3xl font-black">

                {
                  newPrintingRequests
                }

              </p>

            </div>


            <div className="rounded-2xl bg-neutral-50 p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Active
              </p>


              <p className="mt-2 text-3xl font-black">

                {
                  activePrintingOrders
                }

              </p>

            </div>

          </div>


          <Link
            to="/admin/printing"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#9b7e1d] hover:text-[#D4AF37]"
          >

            Open 3D Printing Dashboard

            <ArrowRight
              size={15}
            />

          </Link>

        </section>


        {/* ENQUIRIES */}

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                Communication
              </p>


              <h2 className="mt-1 text-xl font-black text-neutral-950">
                Enquiries
              </h2>

            </div>


            <FileText
              size={22}
              className="text-[#D4AF37]"
            />

          </div>


          <div className="mt-6 rounded-2xl bg-neutral-50 p-6">

            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              New Enquiries
            </p>


            <p className="mt-2 text-4xl font-black">

              {
                newEnquiries
              }

            </p>


            <p className="mt-2 text-xs text-neutral-500">

              Total enquiries:{" "}

              <span className="font-bold text-neutral-800">

                {
                  enquiries.length
                }

              </span>

            </p>

          </div>


          <Link
            to="/admin/contacts"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#9b7e1d] hover:text-[#D4AF37]"
          >

            Open Enquiries

            <ArrowRight
              size={15}
            />

          </Link>

        </section>

      </div>


      {/* ====================================================
          PRODUCT OVERVIEW
      ===================================================== */}

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-neutral-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="font-black text-neutral-950">
              Product Overview
            </h2>


            <p className="mt-1 text-xs text-neutral-500">
              Products currently synchronized with Firestore in real time.
            </p>

          </div>


          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 self-start rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-700 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >

            Manage Products

            <ArrowRight
              size={14}
            />

          </Link>

        </div>


        <div className="grid gap-4 border-b border-neutral-100 p-6 sm:grid-cols-3">

          <div>

            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Active
            </p>


            <p className="mt-2 text-2xl font-black">

              {
                activeProducts
              }

            </p>

          </div>


          <div>

            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Featured
            </p>


            <p className="mt-2 text-2xl font-black">

              {
                featuredProducts
              }

            </p>

          </div>


          <div>

            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Catalogue Value
            </p>


            <p className="mt-2 text-2xl font-black">

              {
                formatPrice(
                  catalogueValue,
                )
              }

            </p>

          </div>

        </div>


        {latestProducts.length ===
        0 ? (

          <div className="p-12 text-center">

            <Boxes
              size={30}
              className="mx-auto text-[#D4AF37]"
            />


            <h3 className="mt-4 font-black text-neutral-900">
              No products yet
            </h3>


            <p className="mt-2 text-sm text-neutral-500">
              Add your first product from the admin panel.
            </p>


            <Link
              to="/admin/products/new"
              className="mt-5 inline-flex rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#b99622]"
            >

              Add Product

            </Link>

          </div>

        ) : (

          <div className="divide-y divide-neutral-100">

            {
              latestProducts.map(
                (
                  product,
                ) => (

                  <div
                    key={
                      product.id
                    }

                    className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">

                        {product.image ? (

                          <img
                            src={
                              product.image
                            }

                            alt={
                              product.name
                            }

                            className="h-full w-full object-contain p-2"
                          />

                        ) : (

                          <Boxes
                            size={20}
                            className="text-[#D4AF37]"
                          />

                        )}

                      </div>


                      <div className="min-w-0">

                        <p className="truncate font-bold text-neutral-950">

                          {
                            product.name
                          }

                        </p>


                        <p className="mt-1 text-xs text-neutral-400">

                          {
                            product.category
                          }

                        </p>

                      </div>

                    </div>


                    <div className="flex items-center gap-6">

                      <div className="text-right">

                        <p className="font-black">

                          {
                            formatPrice(
                              product.price ??
                              0,
                            )
                          }

                        </p>


                        <p className="text-[10px] text-neutral-400">
                          Price
                        </p>

                      </div>


                      <div className="text-right">

                        <p className="font-black">

                          {
                            product.stock ??
                            0
                          }

                        </p>


                        <p className="text-[10px] text-neutral-400">
                          Stock
                        </p>

                      </div>


                      {product.featured && (

                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-bold text-[#9b7e1d]">

                          Featured

                        </span>

                      )}

                    </div>

                  </div>

                ),
              )
            }

          </div>

        )}

      </section>


      {/* ====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="rounded-3xl bg-neutral-950 p-7 text-white sm:p-8">

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          Quick Actions
        </p>


        <h2 className="mt-2 text-2xl font-black">
          Manage your website
        </h2>


        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
          Jump directly into the areas you use most.
        </p>


        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <Link
            to="/admin/products/new"
            className="rounded-2xl border border-white/10 p-5 transition hover:border-[#D4AF37] hover:bg-white/5"
          >

            <Boxes
              size={20}
              className="text-[#D4AF37]"
            />


            <p className="mt-3 font-bold">
              Add Product
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              Create a product.
            </p>

          </Link>


          <Link
            to="/admin/orders"
            className="rounded-2xl border border-white/10 p-5 transition hover:border-[#D4AF37] hover:bg-white/5"
          >

            <ShoppingBag
              size={20}
              className="text-[#D4AF37]"
            />


            <p className="mt-3 font-bold">
              Orders
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              Manage customer orders.
            </p>

          </Link>


          <Link
            to="/admin/customers"
            className="rounded-2xl border border-white/10 p-5 transition hover:border-[#D4AF37] hover:bg-white/5"
          >

            <Users
              size={20}
              className="text-[#D4AF37]"
            />


            <p className="mt-3 font-bold">
              Customers
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              View and email customers.
            </p>

          </Link>


          <Link
            to="/admin/printing"
            className="rounded-2xl border border-white/10 p-5 transition hover:border-[#D4AF37] hover:bg-white/5"
          >

            <Printer
              size={20}
              className="text-[#D4AF37]"
            />


            <p className="mt-3 font-bold">
              3D Printing
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              Manage printing requests.
            </p>

          </Link>


          <Link
            to="/admin/contacts"
            className="rounded-2xl border border-white/10 p-5 transition hover:border-[#D4AF37] hover:bg-white/5"
          >

            <FileText
              size={20}
              className="text-[#D4AF37]"
            />


            <p className="mt-3 font-bold">
              Enquiries
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              Reply to customers.
            </p>

          </Link>


          <Link
            to="/admin/website"
            className="rounded-2xl border border-white/10 p-5 transition hover:border-[#D4AF37] hover:bg-white/5"
          >

            <Globe
              size={20}
              className="text-[#D4AF37]"
            />


            <p className="mt-3 font-bold">
              Website Control
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              Edit homepage content.
            </p>

          </Link>


          <Link
            to="/admin/settings"
            className="rounded-2xl border border-white/10 p-5 transition hover:border-[#D4AF37] hover:bg-white/5"
          >

            <Settings
              size={20}
              className="text-[#D4AF37]"
            />


            <p className="mt-3 font-bold">
              Settings
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              Manage admin settings.
            </p>

          </Link>


          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 p-5 transition hover:border-[#D4AF37] hover:bg-white/5"
          >

            <Eye
              size={20}
              className="text-[#D4AF37]"
            />


            <p className="mt-3 font-bold">
              View Website
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              Open the public website.
            </p>

          </Link>

        </div>

      </section>

    </div>
  );
}