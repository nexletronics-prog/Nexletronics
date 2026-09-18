import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useCart,
} from "../../contexts/CartContext";


interface ProductImageSource {
  product: {
    image?: string;
    imageUrl?: string;
    images?: string[];
  };
}


function getProductImage(
  item: ProductImageSource,
): string {
  const imageUrl =
    typeof item.product.imageUrl ===
    "string"
      ? item.product.imageUrl.trim()
      : "";

  if (imageUrl) {
    return imageUrl;
  }


  const image =
    typeof item.product.image ===
    "string"
      ? item.product.image.trim()
      : "";

  if (image) {
    return image;
  }


  if (
    Array.isArray(
      item.product.images,
    )
  ) {
    const firstImage =
      item.product.images.find(
        (value) =>
          typeof value ===
            "string" &&
          value.trim().length >
            0,
      );

    if (firstImage) {
      return firstImage;
    }
  }


  return "";
}


function formatPrice(
  value: number,
): string {
  return value.toLocaleString(
    "en-IN",
  );
}


export default function Cart() {
  const {
    cartItems,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();


  /*
   * CartContextValue in the cleaned project does not expose
   * totalItems, so derive it directly from cartItems.
   */

  const totalItems =
    cartItems.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        item.quantity,
      0,
    );


  /*
   * ========================================================
   * EMPTY CART
   * ========================================================
   */

  if (
    cartItems.length ===
    0
  ) {
    return (
      <section className="relative overflow-hidden bg-[#faf9f5] py-24">

        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-neutral-200/50 blur-3xl" />


        <div className="container-custom relative text-center">

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#D4AF37]/10 text-[#D4AF37]">

            <ShoppingBag
              size={42}
            />

          </div>


          <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
            Shopping Cart
          </p>


          <h1 className="mt-4 text-4xl font-black text-neutral-950 sm:text-5xl">
            Your cart is empty
          </h1>


          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-500 sm:text-base">
            You haven&apos;t added anything yet. Explore our products
            and find the electronics you need.
          </p>


          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white transition hover:bg-[#b99622]"
          >
            Browse Products

            <ArrowRight
              size={17}
            />
          </Link>

        </div>

      </section>
    );
  }


  return (
    <section className="bg-white py-12 sm:py-16">

      <div className="container-custom">

        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 transition hover:text-[#9b7e1d]"
            >
              <ArrowLeft
                size={16}
              />

              Continue Shopping
            </Link>


            <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
              Shopping Cart
            </p>


            <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
              Your Cart
            </h1>


            <p className="mt-3 text-sm text-neutral-500">
              {totalItems}{" "}
              {totalItems ===
              1
                ? "item"
                : "items"}{" "}
              ready for checkout.
            </p>

          </div>


          <button
            type="button"
            onClick={
              clearCart
            }
            className="inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-50"
          >
            <Trash2
              size={15}
            />

            Clear Cart
          </button>

        </div>


        {/* ==================================================
            CART CONTENT
        =================================================== */}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* =================================================
              ITEMS
          ================================================== */}

          <div className="space-y-4">

            {cartItems.map(
              (
                item,
              ) => {
                const image =
                  getProductImage(
                    item,
                  );


                const itemPrice =
                  typeof item.product.price ===
                    "number" &&
                  Number.isFinite(
                    item.product.price,
                  )
                    ? item.product.price
                    : 0;


                const itemTotal =
                  itemPrice *
                  item.quantity;


                const stock =
                  typeof item.product.stock ===
                    "number" &&
                  Number.isFinite(
                    item.product.stock,
                  )
                    ? Math.max(
                        0,
                        Math.floor(
                          item.product.stock,
                        ),
                      )
                    : 0;


                return (
                  <article
                    key={
                      item.product.id
                    }
                    className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#D4AF37]/30 sm:p-6"
                  >

                    <div className="flex flex-col gap-6 sm:flex-row">

                      {/* IMAGE */}

                      <Link
                        to={`/products/${item.product.id}`}
                        className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#faf8f0] sm:h-36 sm:w-36"
                      >

                        {image ? (

                          <img
                            src={
                              image
                            }
                            alt={
                              item.product.name
                            }
                            className="h-full w-full object-contain p-4 transition duration-300 hover:scale-105"
                          />

                        ) : (

                          <Package
                            size={40}
                            className="text-[#D4AF37]"
                          />

                        )}

                      </Link>


                      {/* DETAILS */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                          <div>

                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9b7e1d]">
                              {
                                item.product.category
                              }
                            </p>


                            <Link
                              to={`/products/${item.product.id}`}
                            >

                              <h2 className="mt-2 text-xl font-black text-neutral-950 transition hover:text-[#9b7e1d]">
                                {
                                  item.product.name
                                }
                              </h2>

                            </Link>


                            <p className="mt-2 text-sm text-neutral-500">
                              ₹
                              {formatPrice(
                                itemPrice,
                              )}{" "}
                              each
                            </p>

                          </div>


                          <p className="text-xl font-black text-neutral-950">
                            ₹
                            {formatPrice(
                              itemTotal,
                            )}
                          </p>

                        </div>


                        {/* CONTROLS */}

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">

                          <div className="flex items-center rounded-full border border-neutral-300 bg-white">

                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(
                                  item.product.id,
                                )
                              }
                              disabled={
                                item.quantity <=
                                1
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Decrease ${item.product.name} quantity`}
                            >
                              <Minus
                                size={15}
                              />
                            </button>


                            <span className="w-10 text-center text-sm font-black">
                              {
                                item.quantity
                              }
                            </span>


                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(
                                  item.product.id,
                                )
                              }
                              disabled={
                                stock > 0 &&
                                item.quantity >=
                                  stock
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Increase ${item.product.name} quantity`}
                            >
                              <Plus
                                size={15}
                              />
                            </button>

                          </div>


                          <div className="flex items-center gap-4">

                            {stock >
                              0 && (
                              <span className="text-xs font-semibold text-neutral-400">
                                {stock} in stock
                              </span>
                            )}


                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(
                                  item.product.id,
                                )
                              }
                              className="inline-flex items-center gap-2 text-xs font-black text-red-500 transition hover:text-red-700"
                            >
                              <Trash2
                                size={15}
                              />

                              Remove
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  </article>
                );
              },
            )}


            {/* =================================================
                HELP STRIP
            ================================================== */}

            <div className="rounded-[2rem] border border-neutral-200 bg-[#faf9f5] p-6">

              <div className="flex flex-col gap-5 text-sm sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="font-black text-neutral-950">
                    Need help with your order?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Contact the Nexletronics team for product or order assistance.
                  </p>

                </div>


                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-xs font-black text-[#9b7e1d] hover:text-[#D4AF37]"
                >
                  Contact Us

                  <ArrowRight
                    size={15}
                  />
                </Link>

              </div>

            </div>

          </div>


          {/* =================================================
              SUMMARY
          ================================================== */}

          <aside className="h-fit rounded-[2rem] border border-neutral-200 bg-[#faf9f5] p-6 sm:p-7 lg:sticky lg:top-28">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

                <ShoppingBag
                  size={20}
                />

              </div>


              <div>

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                  Order Summary
                </p>

                <h2 className="mt-1 text-xl font-black text-neutral-950">
                  Your Order
                </h2>

              </div>

            </div>


            <div className="mt-7 space-y-4">

              <div className="flex items-center justify-between text-sm">

                <span className="text-neutral-500">
                  Items
                </span>

                <span className="font-bold text-neutral-950">
                  {totalItems}
                </span>

              </div>


              <div className="flex items-center justify-between text-sm">

                <span className="text-neutral-500">
                  Subtotal
                </span>

                <span className="font-bold text-neutral-950">
                  ₹
                  {formatPrice(
                    cartTotal,
                  )}
                </span>

              </div>


              <div className="flex items-center justify-between text-sm">

                <span className="text-neutral-500">
                  Shipping
                </span>

                <span className="text-right text-xs font-bold text-[#9b7e1d]">
                  Calculated at checkout
                </span>

              </div>

            </div>


            <div className="my-6 h-px bg-neutral-200" />


            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-sm font-bold text-neutral-500">
                  Total
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Before shipping/taxes
                </p>

              </div>


              <p className="text-3xl font-black text-neutral-950">
                ₹
                {formatPrice(
                  cartTotal,
                )}
              </p>

            </div>


            <Link
              to="/checkout"
              className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622]"
            >
              Proceed to Checkout

              <ArrowRight
                size={18}
              />
            </Link>


            <Link
              to="/products"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3.5 text-sm font-black text-neutral-900 transition hover:border-[#D4AF37]"
            >
              Continue Shopping
            </Link>


            <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">
              Razorpay payment integration will be added at the
              final checkout stage.
            </p>

          </aside>

        </div>

      </div>

    </section>
  );
}