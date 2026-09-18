import {
  Edit3,
  Eye,
  PackagePlus,
  Search,
  Trash2,
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
  deleteProduct,
} from "../../../services/product.service";

import {
  subscribeToCollection,
  type RealtimeDocument,
} from "../../../services/realtime.service";

import type {
  Product,
} from "../../../types/product";


/*
 * ==========================================================
 * PRODUCT MANAGER
 * ==========================================================
 *
 * Realtime source:
 *
 *     Firestore → products
 *
 * Any create/update/delete is reflected in this page
 * automatically without a refresh.
 */

export default function ProductManager() {

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    category,
    setCategory,
  ] = useState("All");


  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null,
  );


  const [
    error,
    setError,
  ] = useState("");


  /*
   * ========================================================
   * REALTIME PRODUCT LISTENER
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
      subscribeToCollection<Partial<Product>>(
        "products",

        (
          items: RealtimeDocument<Partial<Product>>[],
        ) => {

          const normalizedProducts =
            items.map(
              (
                item,
              ): Product => {

                const raw =
                  item.data;


                const image =
                  typeof raw.image ===
                  "string"
                    ? raw.image
                    : undefined;


                const imageUrl =
                  typeof raw.imageUrl ===
                  "string"
                    ? raw.imageUrl
                    : image;


                const images =
                  Array.isArray(
                    raw.images,
                  )
                    ? raw.images.filter(
                        (
                          value,
                        ): value is string =>
                          typeof value ===
                          "string" &&
                          value.trim().length >
                            0,
                      )
                    : [];


                const primaryImage =
                  imageUrl ||
                  image ||
                  images[0];


                return {
                  id:
                    item.id,

                  name:
                    raw.name ??
                    "Unnamed product",

                  description:
                    raw.description ??
                    "",

                  category:
                    raw.category ??
                    "Electronics",

                  price:
                    typeof raw.price ===
                    "number"
                      ? raw.price
                      : 0,

                  currency:
                    raw.currency ??
                    "INR",

                  stock:
                    typeof raw.stock ===
                    "number"
                      ? raw.stock
                      : 0,

                  available:
                    raw.available ??
                    raw.active ??
                    true,

                  active:
                    raw.active,

                  featured:
                    raw.featured,

                  bestSeller:
                    raw.bestSeller,

                  trending:
                    raw.trending,

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
                    raw.slug,

                  sku:
                    raw.sku,

                  shortDescription:
                    raw.shortDescription,

                  compareAtPrice:
                    raw.compareAtPrice,

                  specifications:
                    raw.specifications,

                  createdAt:
                    raw.createdAt,

                  updatedAt:
                    raw.updatedAt,
                };
              },
            );


          /*
           * Newest records first when createdAt exists.
           */

          normalizedProducts.sort(
            (
              first,
              second,
            ) => {

              const firstTime =
                toTimestamp(
                  first.createdAt,
                );

              const secondTime =
                toTimestamp(
                  second.createdAt,
                );


              return (
                secondTime -
                firstTime
              );
            },
          );


          setProducts(
            normalizedProducts,
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
              "Realtime products listener failed:",
              listenerError,
            );


            setError(
              "Unable to connect to the realtime product database.",
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
   * CATEGORIES
   * ========================================================
   */

  const categories =
    useMemo(
      () => {

        const values =
          products
            .map(
              (
                product,
              ) =>
                product.category,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            );


        return [
          "All",

          ...Array.from(
            new Set(
              values,
            ),
          ),
        ];
      },
      [
        products,
      ],
    );


  /*
   * ========================================================
   * FILTER
   * ========================================================
   */

  const filteredProducts =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return products.filter(
          (
            product,
          ) => {

            const matchesSearch =
              query === "" ||
              product.name
                .toLowerCase()
                .includes(
                  query,
                ) ||
              product.category
                .toLowerCase()
                .includes(
                  query,
                ) ||
              (
                product.sku ??
                ""
              )
                .toLowerCase()
                .includes(
                  query,
                );


            const matchesCategory =
              category ===
                "All" ||
              product.category ===
                category;


            return (
              matchesSearch &&
              matchesCategory
            );
          },
        );
      },
      [
        products,
        search,
        category,
      ],
    );


  /*
   * ========================================================
   * DELETE
   * ========================================================
   */

  async function handleDelete(
    product: Product,
  ) {

    const confirmed =
      window.confirm(
        `Delete "${product.name}"?\n\nThis action cannot be undone.`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingId(
        product.id,
      );


      setError(
        "",
      );


      /*
       * Do NOT manually remove the product from local state.
       *
       * Firestore onSnapshot() will deliver the delete event
       * and update the list for us.
       */

      await deleteProduct(
        product.id,
      );

    } catch (deleteError) {

      console.error(
        "Failed to delete product:",
        deleteError,
      );


      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this product.",
      );

    } finally {

      setDeletingId(
        null,
      );
    }
  }


  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <div className="space-y-8">

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Store Management
          </p>


          <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            Products
          </h1>


          <p className="mt-2 text-sm text-neutral-500">
            Manage your electronics products, prices, stock and visibility.
          </p>

        </div>


        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622]"
        >

          <PackagePlus
            size={18}
          />

          Add Product

        </Link>

      </div>


      {/* ====================================================
          REALTIME STATUS
      ===================================================== */}

      {!error && !loading && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">

          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

          Live product synchronization active

        </div>
      )}


      {/* ====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}


      {/* ====================================================
          FILTERS
      ===================================================== */}

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">

          {/* Search */}

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
              placeholder="Search by name, SKU or category..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-5 text-sm outline-none transition focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
            />

          </div>


          {/* Category */}

          <select
            value={
              category
            }
            onChange={(
              event,
            ) =>
              setCategory(
                event.target.value,
              )
            }
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-3.5 text-sm outline-none focus:border-[#D4AF37] focus:bg-white"
          >

            {categories.map(
              (
                item,
              ) => (

                <option
                  key={
                    item
                  }
                  value={
                    item
                  }
                >
                  {item}
                </option>

              ),
            )}

          </select>

        </div>


        <div className="mt-4 text-xs font-semibold text-neutral-400">

          Showing{" "}

          {
            filteredProducts.length
          }

          {" "}of{" "}

          {
            products.length
          }

          {" "}products

        </div>

      </section>


      {/* ====================================================
          LOADING
      ===================================================== */}

      {loading ? (

        <section className="rounded-3xl border border-neutral-200 bg-white p-12 text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-[#D4AF37]" />

          <p className="mt-4 text-sm text-neutral-500">
            Connecting to live products...
          </p>

        </section>

      ) : filteredProducts.length === 0 ? (

        /* ==================================================
           EMPTY
        =================================================== */

        <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-14 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <PackagePlus
              size={28}
            />

          </div>


          <h2 className="mt-5 text-2xl font-black text-neutral-950">
            No products found
          </h2>


          <p className="mt-2 text-sm text-neutral-500">
            Try another search or category.
          </p>


          <button
            type="button"
            onClick={() => {

              setSearch(
                "",
              );

              setCategory(
                "All",
              );

            }}
            className="mt-6 rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white hover:bg-[#D4AF37]"
          >
            Clear Filters
          </button>

        </section>

      ) : (

        /* ==================================================
           PRODUCT TABLE
        =================================================== */

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="border-b border-neutral-200 bg-neutral-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Product
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Category
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Price
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Stock
                  </th>


                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Status
                  </th>


                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-neutral-100">

                {filteredProducts.map(
                  (
                    product,
                  ) => {

                    const image =
                      product.imageUrl ||
                      product.image ||
                      product.images?.[0];


                    const active =
                      product.active ??
                      product.available;


                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="transition hover:bg-neutral-50"
                      >

                        {/* PRODUCT */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-4">

                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#faf8f0]">

                              {image ? (

                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-contain p-2"
                                />

                              ) : (

                                <span className="text-xl font-black text-[#D4AF37]">
                                  N
                                </span>

                              )}

                            </div>


                            <div className="min-w-0">

                              <p className="truncate font-bold text-neutral-950">
                                {
                                  product.name
                                }
                              </p>


                              {product.sku && (
                                <p className="mt-1 text-xs text-neutral-400">
                                  SKU:{" "}
                                  {
                                    product.sku
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </td>


                        {/* CATEGORY */}

                        <td className="px-6 py-5">

                          <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#8f741d]">
                            {
                              product.category
                            }
                          </span>

                        </td>


                        {/* PRICE */}

                        <td className="px-6 py-5">

                          <span className="font-black text-neutral-950">

                            ₹
                            {product.price.toLocaleString(
                              "en-IN",
                            )}

                          </span>

                        </td>


                        {/* STOCK */}

                        <td className="px-6 py-5">

                          <span
                            className={
                              product.stock <= 5
                                ? "font-bold text-red-600"
                                : "font-semibold text-neutral-700"
                            }
                          >
                            {
                              product.stock
                            }
                          </span>

                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span
                            className={[
                              "rounded-full px-3 py-1.5 text-xs font-bold",

                              active
                                ? "bg-green-50 text-green-700"
                                : "bg-neutral-100 text-neutral-500",
                            ].join(
                              " ",
                            )}
                          >

                            {active
                              ? "Active"
                              : "Inactive"}

                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td className="px-6 py-5">

                          <div className="flex items-center justify-end gap-2">

                            {/* VIEW */}

                            <Link
                              to={`/products/${product.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                              title="View product"
                            >

                              <Eye
                                size={16}
                              />

                            </Link>


                            {/* EDIT */}

                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                              title="Edit product"
                            >

                              <Edit3
                                size={16}
                              />

                            </Link>


                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                void handleDelete(
                                  product,
                                )
                              }
                              disabled={
                                deletingId ===
                                product.id
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-red-500 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Delete product"
                            >

                              {deletingId ===
                              product.id ? (

                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />

                              ) : (

                                <Trash2
                                  size={16}
                                />

                              )}

                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  },
                )}

              </tbody>

            </table>

          </div>

        </section>

      )}

    </div>
  );
}


/*
 * ==========================================================
 * TIMESTAMP NORMALIZER
 * ==========================================================
 */

function toTimestamp(
  value: unknown,
): number {

  if (
    value &&
    typeof value ===
      "object"
  ) {

    if (
      "toMillis" in
      value &&
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
      "seconds" in
      value
    ) {

      const seconds =
        Number(
          (
            value as {
              seconds?: unknown;
            }
          ).seconds ?? 0,
        );


      return (
        seconds *
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

    const time =
      Date.parse(
        value,
      );


    return Number.isNaN(
      time,
    )
      ? 0
      : time;
  }


  if (
    typeof value ===
    "number"
  ) {

    return value;
  }


  return 0;
}