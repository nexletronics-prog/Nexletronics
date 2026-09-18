import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useCart,
} from "../../contexts/CartContext";

import {
  createSecureOrder,
} from "../../services/order.service";


interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}


const initialForm: CheckoutForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};


function formatPrice(
  value: number,
): string {
  return value.toLocaleString(
    "en-IN",
  );
}


export default function Checkout() {

  const navigate =
    useNavigate();

  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();


  /*
   * The cleaned CartContext does not expose totalItems,
   * so derive it directly from cartItems.
   */

  const totalItems =
    useMemo(
      () =>
        cartItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),
      [cartItems],
    );


  const [
    form,
    setForm,
  ] = useState<CheckoutForm>(
    initialForm,
  );


  const [
    error,
    setError,
  ] = useState("");


  const [
    saving,
    setSaving,
  ] = useState(false);


  /*
   * ========================================================
   * FORM HANDLING
   * ========================================================
   */

  function updateField(
    field: keyof CheckoutForm,
    value: string,
  ) {

    setForm(
      (
        current,
      ) => ({
        ...current,
        [field]:
          value,
      }),
    );


    if (error) {
      setError("");
    }
  }


  function validateForm(): string {

    if (
      form.name.trim().length <
      2
    ) {
      return "Please enter your full name.";
    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      return "Please enter a valid email address.";
    }


    const cleanPhone =
      form.phone.replace(
        /\D/g,
        "",
      );


    if (
      cleanPhone.length <
      10
    ) {
      return "Please enter a valid phone number.";
    }


    if (
      form.address.trim().length <
      8
    ) {
      return "Please enter your complete delivery address.";
    }


    if (
      form.city.trim().length <
      2
    ) {
      return "Please enter your city.";
    }


    if (
      form.state.trim().length <
      2
    ) {
      return "Please enter your state.";
    }


    if (
      !/^\d{6}$/.test(
        form.pincode.trim(),
      )
    ) {
      return "Please enter a valid 6-digit PIN code.";
    }


    return "";
  }


  /*
   * ========================================================
   * SUBMIT
   * ========================================================
   *
   * IMPORTANT:
   *
   * This is the only functional change from the recovered
   * checkout.
   *
   * It now actually creates the order in Firestore through
   * the existing order.service.ts.
   */

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    setError("");


    if (saving) {
      return;
    }


    if (
      cartItems.length ===
      0
    ) {
      setError(
        "Your cart is empty.",
      );

      return;
    }


    const validationError =
      validateForm();


    if (validationError) {
      setError(
        validationError,
      );

      return;
    }


    try {

      setSaving(true);


      /*
       * ====================================================
       * PREPARE ORDER ITEMS
       * ====================================================
       *
       * Only product ID and quantity are sent to the order
       * service. The service reads the current product
       * information from Firestore.
       */

      const orderItems =
        cartItems.map(
          (
            item,
          ) => ({
            productId:
              item.product.id,

            quantity:
              item.quantity,
          }),
        );


      /*
       * ====================================================
       * PREPARE SHIPPING ADDRESS
       * ====================================================
       */

      const shippingAddress = {

        name:
          form.name.trim(),

        phone:
          form.phone.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        address:
          form.address.trim(),

        city:
          form.city.trim(),

        state:
          form.state.trim(),

        pincode:
          form.pincode.trim(),

      };


      /*
       * ====================================================
       * CREATE REAL FIRESTORE ORDER
       * ====================================================
       */

      const result =
        await createSecureOrder(
          orderItems,
          shippingAddress,
        );


      /*
       * ====================================================
       * KEEP ORDER DATA FOR SUCCESS PAGE
       * ====================================================
       */

      sessionStorage.setItem(
        "nexletronics-last-order",
        JSON.stringify({
          orderId:
            result.orderId,

          subtotal:
            result.subtotal,

          shipping:
            result.shipping,

          total:
            result.total,
        }),
      );


      /*
       * ====================================================
       * CLEAR CART ONLY AFTER SUCCESS
       * ====================================================
       */

      clearCart();


      /*
       * ====================================================
       * SUCCESS PAGE
       * ====================================================
       */

      navigate(
        "/checkout/success",
        {
          replace: true,
        },
      );

    } catch (submitError) {

      console.error(
        "Order creation failed:",
        submitError,
      );


      if (
        submitError instanceof Error
      ) {

        setError(
          submitError.message ||
          "Unable to place your order. Please try again.",
        );

      } else {

        setError(
          "Unable to place your order. Please try again.",
        );

      }

    } finally {

      setSaving(false);

    }
  }


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

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#D4AF37]/10 text-[#D4AF37]">

            <ShoppingBag
              size={36}
            />

          </div>


          <h1 className="mt-7 text-3xl font-black text-neutral-950 sm:text-4xl">
            Nothing to checkout
          </h1>


          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-500">
            Your cart is currently empty. Add products before
            continuing to checkout.
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


  /*
   * ========================================================
   * CHECKOUT PAGE
   * ========================================================
   */

  return (
    <section className="bg-white py-12 sm:py-16">

      <div className="container-custom">

        {/* ==================================================
            HEADER
        =================================================== */}

        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 transition hover:text-[#9b7e1d]"
        >

          <ArrowLeft
            size={16}
          />

          Back to Cart

        </Link>


        <div className="mt-8">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9b7e1d]">
            Checkout
          </p>


          <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
            Complete your order
          </h1>


          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-500 sm:text-base">
            Enter your delivery information below. Your order will
            be saved before the payment stage.
          </p>

        </div>


        {/* ==================================================
            ERROR / STATUS
        =================================================== */}

        {error && (

          <div
            role="alert"
            className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
          >

            {error}

          </div>

        )}


        {/* ==================================================
            MAIN GRID
        =================================================== */}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* =================================================
              FORM
          ================================================== */}

          <form
            onSubmit={
              submit
            }
            className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">

                <MapPin
                  size={20}
                />

              </div>


              <div>

                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7e1d]">
                  Delivery
                </p>

                <h2 className="mt-1 text-xl font-black text-neutral-950">
                  Delivery Details
                </h2>

              </div>

            </div>


            <div className="mt-8 grid gap-5 sm:grid-cols-2">

              {/* Name */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="checkout-name"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Full Name
                </label>


                <input
                  id="checkout-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={
                    form.name
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="Your full name"
                  disabled={
                    saving
                  }
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                />

              </div>


              {/* Email */}

              <div>

                <label
                  htmlFor="checkout-email"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Email Address
                </label>


                <input
                  id="checkout-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={
                    form.email
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "email",
                      event.target.value,
                    )
                  }
                  placeholder="you@example.com"
                  disabled={
                    saving
                  }
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                />

              </div>


              {/* Phone */}

              <div>

                <label
                  htmlFor="checkout-phone"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Phone Number
                </label>


                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={
                    form.phone
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "phone",
                      event.target.value,
                    )
                  }
                  placeholder="10-digit phone number"
                  disabled={
                    saving
                  }
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                />

              </div>


              {/* Address */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="checkout-address"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  Address
                </label>


                <textarea
                  id="checkout-address"
                  required
                  rows={4}
                  autoComplete="street-address"
                  value={
                    form.address
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="House / Flat number, street, area"
                  disabled={
                    saving
                  }
                  className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                />

              </div>


              {/* City */}

              <div>

                <label
                  htmlFor="checkout-city"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  City
                </label>


                <input
                  id="checkout-city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  value={
                    form.city
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "city",
                      event.target.value,
                    )
                  }
                  placeholder="Bengaluru"
                  disabled={
                    saving
                  }
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                />

              </div>


              {/* State */}

              <div>

                <label
                  htmlFor="checkout-state"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  State
                </label>


                <input
                  id="checkout-state"
                  type="text"
                  required
                  autoComplete="address-level1"
                  value={
                    form.state
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "state",
                      event.target.value,
                    )
                  }
                  placeholder="Karnataka"
                  disabled={
                    saving
                  }
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                />

              </div>


              {/* PIN */}

              <div>

                <label
                  htmlFor="checkout-pincode"
                  className="mb-2 block text-sm font-bold text-neutral-800"
                >
                  PIN Code
                </label>


                <input
                  id="checkout-pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoComplete="postal-code"
                  value={
                    form.pincode
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "pincode",
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  placeholder="560001"
                  disabled={
                    saving
                  }
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 disabled:bg-neutral-50"
                />

              </div>

            </div>


            {/* Security */}

            <div className="mt-8 rounded-2xl border border-neutral-200 bg-[#faf9f5] p-5">

              <div className="flex items-start gap-3">

                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-[#D4AF37]"
                />

                <div>

                  <p className="text-sm font-black text-neutral-950">
                    Secure checkout
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Your order information is securely saved to
                    your Nexletronics account. Payment can be
                    handled separately.
                  </p>

                </div>

              </div>

            </div>


            <button
              type="submit"
              disabled={
                saving
              }
              className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#b99622] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
            >

              {saving
                ? "Placing Order..."
                : "Place Order"}

              {!saving && (

                <ArrowRight
                  size={18}
                />

              )}

            </button>

          </form>


          {/* =================================================
              ORDER SUMMARY
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

              {cartItems.map(
                (
                  item,
                ) => (

                  <div
                    key={
                      item.product.id
                    }
                    className="flex items-start justify-between gap-4"
                  >

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold text-neutral-900">

                        {
                          item.product.name
                        }

                      </p>


                      <p className="mt-1 text-xs text-neutral-500">

                        Qty:{" "}

                        {
                          item.quantity
                        }

                      </p>

                    </div>


                    <p className="shrink-0 text-sm font-black text-neutral-950">

                      ₹

                      {formatPrice(
                        item.product.price *
                        item.quantity,
                      )}

                    </p>

                  </div>

                ),
              )}

            </div>


            <div className="my-6 h-px bg-neutral-200" />


            <div className="space-y-4">

              <div className="flex justify-between text-sm">

                <span className="text-neutral-500">
                  Items
                </span>

                <span className="font-bold text-neutral-950">
                  {
                    totalItems
                  }
                </span>

              </div>


              <div className="flex justify-between text-sm">

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


              <div className="flex justify-between text-sm">

                <span className="text-neutral-500">
                  Shipping
                </span>

                <span className="text-right text-xs font-bold text-[#9b7e1d]">

                  {cartTotal >=
                  1000
                    ? "FREE"
                    : "₹60"}

                </span>

              </div>

            </div>


            <div className="my-6 h-px bg-neutral-200" />


            <div className="flex items-end justify-between gap-4">

              <span className="text-sm font-bold text-neutral-500">
                Estimated Total
              </span>


              <span className="text-3xl font-black text-neutral-950">

                ₹

                {formatPrice(
                  cartTotal +
                  (
                    cartTotal >=
                    1000
                      ? 0
                      : 60
                  ),
                )}

              </span>

            </div>


            <div className="mt-7 rounded-2xl border border-[#D4AF37]/20 bg-white p-4">

              <div className="flex items-start gap-3">

                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-[#D4AF37]"
                />

                <p className="text-xs leading-5 text-neutral-500">
                  Your order will be recorded before moving to
                  the payment stage.
                </p>

              </div>

            </div>

          </aside>

        </div>

      </div>

    </section>
  );
}